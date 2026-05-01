import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getSupabase } from "../config/supabase.js";
import { AuthenticatedRequest } from "../types/index.js";
import * as analyticsService from "../services/analyticsService.js";

const router = Router();

// GET /api/v1/user/stats - Get user stats
router.get("/user/stats", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const supabase = getSupabase();
    const userId = req.authUser?.id;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const stats = await analyticsService.getUserStats(supabase, userId);
    return res.json(stats);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// GET /api/v1/user/analytics - Get detailed analytics
router.get("/user/analytics", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const supabase = getSupabase();
    const userId = req.authUser?.id;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const analytics = await analyticsService.getUserAnalytics(supabase, userId);
    return res.json(analytics);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
