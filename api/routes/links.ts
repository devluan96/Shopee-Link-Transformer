import { Router } from "express";
import { authenticate, checkAdmin } from "../middleware/auth.js";
import { getSupabase } from "../config/supabase.js";
import { AuthenticatedRequest } from "../types/index.js";
import { LINK_DAILY_LIMITS } from "../config/constants.js";
import * as linkService from "../services/linkService.js";
import * as workspaceService from "../services/workspaceService.js";
import * as featureLimitService from "../services/featureLimitService.js";
import * as notificationService from "../services/notificationService.js";
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

function getDailyLinkEditLimit(req: AuthenticatedRequest) {
  if (req.authProfile?.role === "admin") {
    return null;
  }

  const plan = req.authProfile?.subscription_plan || "free";
  return plan === "free" ? 1 : null;
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

async function getDailyLinkEditQuota(
  supabase: ReturnType<typeof getSupabase>,
  req: AuthenticatedRequest,
  userId: string,
) {
  const dailyLimit = getDailyLinkEditLimit(req);

  if (dailyLimit === null) {
    return {
      plan: (req.authProfile?.subscription_plan || "free") as
        | "free"
        | "monthly"
        | "yearly",
      dailyLimit: null,
      usedToday: 0,
      remainingToday: null,
      canEdit: true,
    };
  }

  const usedToday = await featureLimitService.getFeatureUsageToday(
    supabase,
    userId,
    "link_edit",
  );
  const remainingToday = Math.max(0, dailyLimit - usedToday);

  return {
    plan: (req.authProfile?.subscription_plan || "free") as
      | "free"
      | "monthly"
      | "yearly",
    dailyLimit,
    usedToday,
    remainingToday,
    canEdit: remainingToday > 0,
  };
}

type LinkRouteDeps = {
  getSupabase: typeof getSupabase;
  getDailyLinkQuota: typeof getDailyLinkQuota;
  getFeatureLimitsForProfile: typeof featureLimitService.getFeatureLimitsForProfile;
  createLink: typeof linkService.createLink;
  deleteLink: typeof linkService.deleteLink;
};

type ConvertPayload = Record<string, any> & {
  url: string;
  customDomain?: string;
  customImageUrl?: string;
  secondaryUrl?: string;
  videoUrl?: string;
  abVariantBVideoUrl?: string;
  abVariantBSecondaryUrl?: string;
  mobileDirectMode?: boolean;
};

const prepareConvertPayload = (
  body: any,
  canUseCustomDomain: boolean,
): { payload?: ConvertPayload; error?: string } => {
  const payload: ConvertPayload = {
    ...body,
    mobileDirectMode: !!body?.mobileDirectMode,
    customDomain: canUseCustomDomain ? body?.customDomain : undefined,
  };

  if (payload.mobileDirectMode) {
    if (!payload.customImageUrl?.trim()) {
      return {
        error: "Mobile direct mode yêu cầu ảnh đại diện.",
      };
    }

    if (payload.secondaryUrl?.trim()) {
      return {
        error: "Mobile direct mode không hỗ trợ liên kết bước 2.",
      };
    }

    payload.videoUrl = "";
    payload.secondaryUrl = "";
    payload.abVariantBVideoUrl = "";
    payload.abVariantBSecondaryUrl = "";
  }

  if (payload.secondaryUrl?.trim() && !payload.videoUrl?.trim()) {
    return {
      error: "Link bước 2 chỉ được dùng khi landing page có video.",
    };
  }

  return { payload };
};

const defaultLinkRouteDeps: LinkRouteDeps = {
  getSupabase,
  getDailyLinkQuota,
  getFeatureLimitsForProfile: featureLimitService.getFeatureLimitsForProfile,
  createLink: linkService.createLink,
  deleteLink: linkService.deleteLink,
};

export const createConvertHandler = (deps: Partial<LinkRouteDeps> = {}) => {
  const resolvedDeps = { ...defaultLinkRouteDeps, ...deps };

  return async (req: AuthenticatedRequest, res: any) => {
    try {
      const supabase = resolvedDeps.getSupabase();
      const userId = req.authUser?.id;
      const canUseCustomDomain =
        req.authProfile?.role === "admin" ||
        req.authProfile?.subscription_plan === "yearly";
      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }

      const quota = await resolvedDeps.getDailyLinkQuota(supabase, req, userId);
      if (!quota.canCreate) {
        return res.status(429).json({
          error:
            quota.dailyLimit === 0
              ? "Gói hiện tại chưa được phép tạo link."
              : `Bạn đã dùng hết ${quota.dailyLimit} lượt tạo link hôm nay.`,
          quota,
        });
      }

      const incomingPayload = {
        ...req.body,
        customDomain: canUseCustomDomain ? req.body?.customDomain : undefined,
      };
      const { payload, error } = prepareConvertPayload(incomingPayload, true);

      if (error) {
        return res.status(400).json({ error });
      }

      const featureLimits = resolvedDeps.getFeatureLimitsForProfile(
        req.authProfile || undefined,
      );
      if (payload?.abTestEnabled && !featureLimits.canUseAbTesting) {
        return res.status(403).json({
          error: "A/B testing chỉ mở cho gói năm hoặc admin.",
        });
      }

      const link = await resolvedDeps.createLink(supabase, userId, payload!);
      return res.json(link);
    } catch (e: any) {
      console.error("❌ Convert error:", e);
      return res.status(400).json({ error: e.message || "Convert failed" });
    }
  };
};

export const createDeleteLinkHandler = (deps: Partial<LinkRouteDeps> = {}) => {
  const resolvedDeps = { ...defaultLinkRouteDeps, ...deps };

  return async (req: AuthenticatedRequest, res: any) => {
    try {
      const supabase = resolvedDeps.getSupabase();
      const userId = req.authUser?.id;
      const linkId = req.params.id;

      if (!userId || !linkId) {
        return res.status(400).json({ error: "Missing userId or linkId" });
      }

      await resolvedDeps.deleteLink(supabase, linkId, userId);
      return res.json({ success: true });
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  };
};

// POST /api/v1/convert - Create new link
router.post(
  "/convert",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
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

      const incomingPayload = {
        ...req.body,
        customDomain: canUseCustomDomain ? req.body?.customDomain : undefined,
      };
      const { payload, error } = prepareConvertPayload(incomingPayload, true);

      if (error) {
        return res.status(400).json({ error });
      }

      const featureLimits = featureLimitService.getFeatureLimitsForProfile(
        req.authProfile || undefined,
      );
      if (payload?.abTestEnabled && !featureLimits.canUseAbTesting) {
        return res.status(403).json({
          error: "A/B testing chỉ mở cho gói năm hoặc admin.",
        });
      }

      const link = await linkService.createLink(supabase, userId, payload!);
      return res.json(link);
    } catch (e: any) {
      console.error("❌ Convert error:", e);
      return res.status(400).json({ error: e.message || "Convert failed" });
    }
  },
);

router.get(
  "/user/link-quota",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const userId = req.authUser?.id;

      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }

      const quota = await getDailyLinkQuota(supabase, req, userId);
      if (
        quota.dailyLimit !== null &&
        quota.dailyLimit > 0 &&
        quota.remainingToday <= 1
      ) {
        await notificationService.createQuotaWarningNotification(supabase, {
          userId,
          quotaKey: "link_daily",
          title: "Sắp hết quota tạo link",
          message: `Bạn còn ${quota.remainingToday} lượt tạo link hôm nay.`,
          uniqueSuffix: `${new Date().toISOString().slice(0, 10)}:${quota.remainingToday}`,
          metadata: {
            remaining: quota.remainingToday,
            total: quota.dailyLimit,
            used: quota.usedToday,
          },
        });
      }
      return res.json(quota);
    } catch (e: any) {
      return res
        .status(500)
        .json({ error: e.message || "Failed to fetch quota" });
    }
  },
);

// GET /api/v1/user/links - Get user's links
router.get(
  "/user/links",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }

      const workspaceId =
        typeof req.query.workspaceId === "string"
          ? req.query.workspaceId
          : undefined;
      const links = await linkService.getUserLinks(
        supabase,
        userId,
        workspaceId,
      );
      await notificationService.maybeCreateLinkExpiryNotifications(
        supabase,
        userId,
        links,
      );
      const linksWithSources = await attachTrackedSourcesToLinks(
        supabase,
        links,
      );
      return res.json(linksWithSources);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  },
);

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
        "short_code",
        "original_url",
        "custom_title",
        "custom_description",
        "custom_image_url",
        "video_url",
        "secondary_url",
        "secondaryTargetType",
        "custom_domain",
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

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No updates provided" });
      }

      const editQuota = await getDailyLinkEditQuota(supabase, req, userId);
      if (!editQuota.canEdit) {
        return res.status(429).json({
          error:
            "Goi mien phi chi duoc chinh sua 1 link moi ngay. Ban da dung het luot chinh sua hom nay.",
          quota: editQuota,
        });
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

      const link = await linkService.updateLink(
        supabase,
        linkId,
        userId,
        updates,
      );
      if (editQuota.dailyLimit !== null) {
        await featureLimitService.recordFeatureUsage(
          supabase,
          userId,
          "link_edit",
          {
            linkId,
            plan: req.authProfile?.subscription_plan || "free",
          },
        );
      }
      return res.json(link);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  },
);

// POST /api/v1/user/links/:id/share - Copy link into another workspace
router.post(
  "/user/links/:id/share",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const userId = req.authUser?.id;
      const linkId = req.params.id;
      const workspaceId =
        typeof req.body?.workspaceId === "string" ? req.body.workspaceId : "";

      if (!userId || !linkId) {
        return res.status(400).json({ error: "Missing userId or linkId" });
      }

      if (!workspaceId.trim()) {
        return res.status(400).json({ error: "Missing target workspaceId" });
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

      const canUseCustomDomain =
        req.authProfile?.role === "admin" ||
        req.authProfile?.subscription_plan === "yearly";
      const featureLimits = featureLimitService.getFeatureLimitsForProfile(
        req.authProfile || undefined,
      );

      const link = await linkService.copyLinkToWorkspace(
        supabase,
        userId,
        linkId,
        workspaceId,
        {
          preserveCustomDomain: canUseCustomDomain,
          preserveAbTesting: featureLimits.canUseAbTesting,
        },
      );

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

      const { data: writableLinks, error: selectError } = await supabase
        .from("links")
        .select("id")
        .in("workspace_id", writableWorkspaceIds)
        .in("id", ids);

      if (selectError) throw selectError;

      const deletableIds = (writableLinks || [])
        .map((link: any) => link.id)
        .filter(Boolean);

      if (deletableIds.length === 0) {
        return res.json({ success: true, deleted: 0 });
      }

      await Promise.all([
        supabase.from("clicks").delete().in("link_id", deletableIds),
        supabase
          .from("link_outbound_events")
          .delete()
          .in("link_id", deletableIds),
        supabase.from("notification_logs").delete().in("link_id", deletableIds),
      ]);

      const { error, count } = await supabase
        .from("links")
        .delete({ count: "exact" })
        .in("id", deletableIds);

      if (error) throw error;

      return res.json({ success: true, deleted: count || deletableIds.length });
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  },
);

export default router;
