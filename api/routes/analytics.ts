import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getSupabase } from "../config/supabase.js";
import { AuthenticatedRequest } from "../types/index.js";
import * as analyticsService from "../services/analyticsService.js";
import * as advancedAnalytics from "../services/advancedAnalytics.js";
import * as notificationService from "../services/notificationService.js";

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

// GET /api/v1/user/analytics/geographic - Get geographic statistics
router.get("/user/analytics/geographic", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const supabase = getSupabase();
    const userId = req.authUser?.id;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const linkId = req.query.link_id as string | undefined;
    const geoStats = await advancedAnalytics.getGeographicStats(supabase, userId, linkId);
    return res.json(geoStats);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// GET /api/v1/user/analytics/devices - Get device/browser statistics
router.get("/user/analytics/devices", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const supabase = getSupabase();
    const userId = req.authUser?.id;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const linkId = req.query.link_id as string | undefined;
    const deviceStats = await advancedAnalytics.getDeviceStats(supabase, userId, linkId);
    return res.json(deviceStats);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// GET /api/v1/user/analytics/time - Get time-based statistics
router.get("/user/analytics/time", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const supabase = getSupabase();
    const userId = req.authUser?.id;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const linkId = req.query.link_id as string | undefined;
    const days = parseInt(req.query.days as string) || 30;
    const timeStats = await advancedAnalytics.getTimeStats(supabase, userId, days, linkId);
    return res.json(timeStats);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// GET /api/v1/user/analytics/export - Export analytics data as CSV
router.get("/user/analytics/export", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const supabase = getSupabase();
    const userId = req.authUser?.id;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const format = (req.query.format as "clicks" | "summary") || "clicks";
    const linkId = req.query.link_id as string | undefined;
    const startDate = req.query.start_date as string | undefined;
    const endDate = req.query.end_date as string | undefined;

    const csv = await advancedAnalytics.exportAnalyticsToCSV(
      supabase,
      userId,
      format,
      linkId,
      startDate,
      endDate
    );

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="analytics-${Date.now()}.csv"`);
    return res.send(csv);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// GET /api/v1/user/notifications/settings - Get notification settings
router.get("/user/notifications/settings", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const supabase = getSupabase();
    const userId = req.authUser?.id;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const settings = await notificationService.getNotificationSettings(supabase, userId);
    return res.json(settings || {
      webhook_url: null,
      telegram_bot_token: null,
      telegram_chat_id: null,
      notify_on_click: true,
      notify_threshold: 0,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// POST /api/v1/user/notifications/settings - Save notification settings
router.post("/user/notifications/settings", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const supabase = getSupabase();
    const userId = req.authUser?.id;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    await notificationService.saveNotificationSettings(supabase, userId, req.body);
    return res.json({ success: true });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// GET /api/v1/user/notifications/logs - Get notification logs
router.get("/user/notifications/logs", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const supabase = getSupabase();
    const userId = req.authUser?.id;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    
    const { data, error } = await supabase
      .from("notification_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return res.json(data || []);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
