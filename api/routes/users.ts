import { Router } from "express";
import { authenticate, checkAdmin } from "../middleware/auth.js";
import { getSupabase } from "../config/supabase.js";
import { AuthenticatedRequest } from "../types/index.js";
import * as userService from "../services/userService.js";

const router = Router();

// GET /api/v1/user/profile - Get current user profile
router.get("/user/profile", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const supabase = getSupabase();
    const userId = req.authUser?.id;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const profile = await userService.getUserProfile(supabase, userId);
    return res.json(profile || { is_new: true });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

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
        full_name,
        avatar_url,
      });

      return res.json(profile);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
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

      await userService.updateUserSubscription(supabase, targetUid, plan, expiry);
      return res.json({ success: true });
    } catch (e: any) {
      console.error("❌ Supabase Update Error:", e);
      return res.status(400).json({
        error: e.message,
        details: "Vui lòng kiểm tra bảng profiles đã có cột subscription_plan và subscription_expiry chưa.",
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

export default router;
