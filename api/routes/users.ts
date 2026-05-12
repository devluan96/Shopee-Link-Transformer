import { Router } from "express";
import { authenticate, checkAdmin } from "../middleware/auth.js";
import { getSupabase } from "../config/supabase.js";
import { AuthenticatedRequest } from "../types/index.js";
import * as userService from "../services/userService.js";
import * as featureLimitService from "../services/featureLimitService.js";
import * as notificationService from "../services/notificationService.js";

const router = Router();

// GET /api/v1/user/profile - Get current user profile
router.get(
  "/user/profile",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
    }

    const profile = await userService.getUserProfile(supabase, userId);
    if (profile) {
      await notificationService.maybeCreateSubscriptionExpiryNotification(
        supabase,
        {
          userId,
          subscriptionPlan: profile.subscription_plan,
          subscriptionExpiry: profile.subscription_expiry,
        },
      );
    }
    return res.json(profile || { is_new: true });
  } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  },
);

// POST /api/v1/user/profile/update - Update profile
router.post(
  "/user/profile/update",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }

      const { full_name, avatar_url } = req.body;
      const profile = await userService.updateUserProfile(supabase, userId, {
        email: req.authUser?.email ?? req.authProfile?.email ?? null,
        full_name,
        avatar_url,
      });

      return res.json(profile);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  },
);

router.get(
  "/user/limits",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }

      const limits = await featureLimitService.getUserFeatureSnapshot(
        supabase,
        userId,
        req.authProfile || undefined,
      );

      if (
        limits.dailyVideoUploads !== null &&
        limits.dailyVideoUploads > 0 &&
        limits.videoUploadsRemainingToday !== null &&
        limits.videoUploadsRemainingToday <= 1
      ) {
        await notificationService.createQuotaWarningNotification(supabase, {
          userId,
          quotaKey: "video_daily",
          title: "Sắp hết quota upload video",
          message: `Bạn còn ${limits.videoUploadsRemainingToday} lượt upload video hôm nay.`,
          uniqueSuffix: `${new Date().toISOString().slice(0, 10)}:${limits.videoUploadsRemainingToday}`,
          metadata: {
            remaining: limits.videoUploadsRemainingToday,
            total: limits.dailyVideoUploads,
          },
        });
      }

      if (
        limits.maxTeamWorkspaces !== null &&
        limits.maxTeamWorkspaces > 0 &&
        limits.teamWorkspacesRemaining !== null &&
        limits.teamWorkspacesRemaining <= 1
      ) {
        await notificationService.createQuotaWarningNotification(supabase, {
          userId,
          quotaKey: "team_workspace",
          title: "Sắp hết slot Team Workspace",
          message: `Bạn còn ${limits.teamWorkspacesRemaining} slot Team Workspace trong gói hiện tại.`,
          uniqueSuffix: `${limits.ownedTeamWorkspaces}:${limits.teamWorkspacesRemaining}`,
          metadata: {
            remaining: limits.teamWorkspacesRemaining,
            total: limits.maxTeamWorkspaces,
          },
        });
      }

      return res.json(limits);
    } catch (e: any) {
      return res
        .status(500)
        .json({ error: e.message || "Failed to fetch limits" });
    }
  },
);

// GET /api/v1/admin/users - Get all users (admin only)
router.get("/admin/users", authenticate, checkAdmin, async (req, res) => {
  try {
    const supabase = getSupabase();
    const users = await userService.getAllUsers(supabase);
    return res.json(users);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// POST /api/v1/admin/users/:targetUid/approve - Approve user (admin only)
router.post(
  "/admin/users/:targetUid/approve",
  authenticate,
  checkAdmin,
  async (req, res) => {
    try {
      const supabase = getSupabase();
      const { targetUid } = req.params;
      const { isApproved } = req.body;

      await userService.approveUser(supabase, targetUid, isApproved);
      return res.json({ success: true });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  },
);

// POST /api/v1/admin/users/:targetUid/subscription - Update subscription (admin only)
router.post(
  "/admin/users/:targetUid/subscription",
  authenticate,
  checkAdmin,
  async (req, res) => {
    try {
      const supabase = getSupabase();
      const { targetUid } = req.params;
      const { plan, expiry } = req.body;

      await userService.updateUserSubscription(
        supabase,
        targetUid,
        plan,
        expiry,
      );
      return res.json({ success: true });
    } catch (e: any) {
      console.error("❌ Supabase Update Error:", e);
      return res.status(400).json({
        error: e.message,
        details:
          "Vui lòng kiểm tra bảng profiles đã có cột subscription_plan và subscription_expiry chưa.",
      });
    }
  },
);

// DELETE /api/v1/admin/users/:targetUid - Delete user (admin only)
router.delete(
  "/admin/users/:targetUid",
  authenticate,
  checkAdmin,
  async (req, res) => {
    try {
      const supabase = getSupabase();
      const { targetUid } = req.params;

      await userService.deleteUser(supabase, targetUid);
      return res.json({ success: true });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  },
);

// GET /api/v1/admin/users/:targetUid/links - Get user links with click counts (admin only)
router.get(
  "/admin/users/:targetUid/links",
  authenticate,
  checkAdmin,
  async (req, res) => {
    try {
      const supabase = getSupabase();
      const { targetUid } = req.params;

      // 1. Get all links for this user
      const { data: links, error: linksError } = await supabase
        .from("links")
        .select("id, short_code, slug, custom_title, original_url, created_at")
        .eq("user_id", targetUid)
        .order("created_at", { ascending: false });

      if (linksError) throw linksError;
      if (!links || links.length === 0) return res.json([]);

      // 2. Get click counts for all links in one query
      const linkIds = links.map((l: any) => l.id);
      const { data: clicks, error: clicksError } = await supabase
        .from("clicks")
        .select("link_id")
        .in("link_id", linkIds);

      if (clicksError) throw clicksError;

      // 3. Count clicks per link
      const clickCounts = new Map<string, number>();
      clicks?.forEach((c: any) => {
        clickCounts.set(c.link_id, (clickCounts.get(c.link_id) || 0) + 1);
      });

      // 4. Attach click counts to links
      const linksWithClicks = links.map((link: any) => ({
        ...link,
        clicks: clickCounts.get(link.id) || 0,
      }));

      return res.json(linksWithClicks);
    } catch (e: any) {
      console.error("Error fetching user links:", e);
      return res.status(500).json({ error: e.message });
    }
  },
);

export default router;
