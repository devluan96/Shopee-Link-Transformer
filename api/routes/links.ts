import { Router } from "express";
import { authenticate, checkAdmin } from "../middleware/auth.js";
import { getSupabase } from "../config/supabase.js";
import { AuthenticatedRequest } from "../types/index.js";
import { LINK_DAILY_LIMITS } from "../config/constants.js";
import * as linkService from "../services/linkService.js";
import * as workspaceService from "../services/workspaceService.js";
import * as featureLimitService from "../services/featureLimitService.js";
import {
  attachTrackedSourcesToLinks,
  fetchOutboundEventsForLinkIds,
  filterRealOutboundEvents,
} from "../utils/clickTracking.js";

const router = Router();

const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

function getVietnamDayRange() {
  const now = new Date();
  const vietnamNow = new Date(now.getTime() + VIETNAM_OFFSET_MS);
  const startUtcMs =
    Date.UTC(
      vietnamNow.getUTCFullYear(),
      vietnamNow.getUTCMonth(),
      vietnamNow.getUTCDate(),
      0,
      0,
      0,
      0,
    ) - VIETNAM_OFFSET_MS;

  const start = new Date(startUtcMs);
  const end = new Date(startUtcMs + 24 * 60 * 60 * 1000);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

function getDailyLinkLimit(req: AuthenticatedRequest) {
  if (req.authProfile?.role === "admin") {
    return null;
  }

  const plan = req.authProfile?.subscription_plan || "free";
  return LINK_DAILY_LIMITS[plan];
}

async function getDailyLinkQuota(
  supabase: ReturnType<typeof getSupabase>,
  req: AuthenticatedRequest,
  userId: string,
) {
  const dailyLimit = getDailyLinkLimit(req);

  if (dailyLimit === null) {
    return {
      plan: "admin" as const,
      dailyLimit: null,
      usedToday: 0,
      remainingToday: null,
      canCreate: true,
    };
  }

  const { startIso, endIso } = getVietnamDayRange();
  const { count, error } = await supabase
    .from("links")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startIso)
    .lt("created_at", endIso);

  if (error) throw error;

  const usedToday = count || 0;
  const remainingToday = Math.max(0, dailyLimit - usedToday);

  return {
    plan: (req.authProfile?.subscription_plan || "free") as
      | "free"
      | "monthly"
      | "yearly",
    dailyLimit,
    usedToday,
    remainingToday,
    canCreate: remainingToday > 0,
  };
}

// POST /api/v1/convert - Create new link
router.post("/convert", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const supabase = getSupabase();
    const userId = req.authUser?.id;
    const canUseCustomDomain =
      req.authProfile?.role === "admin" ||
      req.authProfile?.subscription_plan === "yearly";
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const quota = await getDailyLinkQuota(supabase, req, userId);
    if (!quota.canCreate) {
      return res.status(429).json({
        error:
          quota.dailyLimit === 0
            ? "Gói hiện tại chưa được phép tạo link."
            : `Bạn đã dùng hết ${quota.dailyLimit} lượt tạo link hôm nay.`,
        quota,
      });
    }

    const payload = {
      ...req.body,
      customDomain: canUseCustomDomain ? req.body?.customDomain : undefined,
    };

    const featureLimits = featureLimitService.getFeatureLimitsForProfile(
      req.authProfile || undefined,
    );
    if (payload.abTestEnabled && !featureLimits.canUseAbTesting) {
      return res.status(403).json({
        error: "A/B testing chỉ mở cho gói năm hoặc admin.",
      });
    }

    const link = await linkService.createLink(supabase, userId, payload);
    return res.json(link);
  } catch (e: any) {
    console.error("❌ Convert error:", e);
    return res.status(400).json({ error: e.message || "Convert failed" });
  }
});

router.get("/user/link-quota", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const supabase = getSupabase();
    const userId = req.authUser?.id;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const quota = await getDailyLinkQuota(supabase, req, userId);
    return res.json(quota);
  } catch (e: any) {
    return res.status(500).json({ error: e.message || "Failed to fetch quota" });
  }
});

// GET /api/v1/user/links - Get user's links
router.get("/user/links", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const supabase = getSupabase();
    const userId = req.authUser?.id;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const workspaceId =
      typeof req.query.workspaceId === "string" ? req.query.workspaceId : undefined;
    const links = await linkService.getUserLinks(supabase, userId, workspaceId);
    const linksWithSources = await attachTrackedSourcesToLinks(supabase, links);
    return res.json(linksWithSources);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// PATCH /api/v1/user/links/:id - Update link
router.patch(
  "/user/links/:id",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const userId = req.authUser?.id;
      const linkId = req.params.id;

      if (!userId || !linkId) {
        return res.status(400).json({ error: "Missing userId or linkId" });
      }

      const allowedUpdates = [
        "custom_title",
        "custom_description",
        "custom_image_url",
        "video_url",
        "secondary_url",
        "custom_domain",
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_content",
        "utm_term",
        "shopee_affiliate_params",
        "tiktok_affiliate_params",
        "ab_test_enabled",
        "ab_variant_b_title",
        "ab_variant_b_description",
        "ab_variant_b_image_url",
        "ab_variant_b_video_url",
        "ab_variant_b_original_url",
        "ab_variant_b_secondary_url",
        "redirect_delay_ms",
        "usage_context",
        "expires_at",
        "folder_name",
        "tags",
      ];

      const updates: any = {};
      for (const key of allowedUpdates) {
        if (req.body[key] !== undefined) {
          updates[key] = req.body[key];
        }
      }

      const featureLimits = featureLimitService.getFeatureLimitsForProfile(
        req.authProfile || undefined,
      );
      if (
        (updates.ab_test_enabled ||
          updates.ab_variant_b_title !== undefined ||
          updates.ab_variant_b_description !== undefined ||
          updates.ab_variant_b_image_url !== undefined ||
          updates.ab_variant_b_video_url !== undefined ||
          updates.ab_variant_b_original_url !== undefined ||
          updates.ab_variant_b_secondary_url !== undefined) &&
        !featureLimits.canUseAbTesting
      ) {
        return res.status(403).json({
          error: "A/B testing chỉ mở cho gói năm hoặc admin.",
        });
      }

      const link = await linkService.updateLink(supabase, linkId, userId, updates);
      return res.json(link);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  },
);

// GET /api/v1/admin/users/:targetUid/clicks - Get total outbound clicks for all links of a user (admin only)
router.get(
  "/admin/users/:targetUid/clicks",
  authenticate,
  checkAdmin,
  async (req, res) => {
    try {
      const supabase = getSupabase();
      const { targetUid } = req.params;

      // Get all link IDs for this user
      const { data: links, error: linksError } = await supabase
        .from("links")
        .select("id")
        .eq("user_id", targetUid);

      if (linksError) throw linksError;

      if (!links || links.length === 0) {
        return res.json({ clicks: 0 });
      }

      const linkIds = links.map((l: any) => l.id);

      const outboundEvents = filterRealOutboundEvents(
        await fetchOutboundEventsForLinkIds(supabase, linkIds),
      );

      return res.json({ clicks: outboundEvents.length });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  },
);

// GET /api/v1/links/:id/clicks - Get outbound click count for a link
router.get(
  "/links/:id/clicks",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const linkId = req.params.id;

      console.log("[API] Fetching click count for link:", linkId);

      const outboundEvents = filterRealOutboundEvents(
        await fetchOutboundEventsForLinkIds(supabase, [linkId]),
      );

      console.log("[API] Click count result:", outboundEvents.length);

      return res.json({ clicks: outboundEvents.length });
    } catch (e: any) {
      console.error("[API] Error fetching click count:", e);
      return res.status(500).json({ error: e.message });
    }
  },
);

// DELETE /api/v1/user/links/:id - Delete link
router.delete(
  "/user/links/:id",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const userId = req.authUser?.id;
      const linkId = req.params.id;

      if (!userId || !linkId) {
        return res.status(400).json({ error: "Missing userId or linkId" });
      }

      await linkService.deleteLink(supabase, linkId, userId);
      return res.json({ success: true });
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  },
);

// POST /api/v1/user/links/bulk-delete - Delete multiple links
router.post(
  "/user/links/bulk-delete",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const userId = req.authUser?.id;
      const { ids } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "Missing or invalid ids array" });
      }

      // Delete all links that belong to this user and match the ids
      const workspaceIds = await workspaceService.getAccessibleWorkspaceIds(
        supabase,
        userId,
      );
      const writableWorkspaceMap = await workspaceService.getWorkspaceAccessMap(
        supabase,
        userId,
      );
      const writableWorkspaceIds = workspaceIds.filter((workspaceId) => {
        const role = writableWorkspaceMap.get(workspaceId);
        return role === "owner" || role === "editor";
      });

      if (writableWorkspaceIds.length === 0) {
        return res.json({ success: true, deleted: 0 });
      }

      const { error, count } = await supabase
        .from("links")
        .delete({ count: "exact" })
        .in("workspace_id", writableWorkspaceIds)
        .in("id", ids);

      if (error) throw error;

      return res.json({ success: true, deleted: count || ids.length });
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  },
);

export default router;
