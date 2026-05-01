import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getSupabase } from "../config/supabase.js";
import { AuthenticatedRequest } from "../types/index.js";
import * as linkService from "../services/linkService.js";
import { attachTrackedSourcesToLinks } from "../utils/clickTracking.js";

const router = Router();

// POST /api/v1/convert - Create new link
router.post("/convert", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const supabase = getSupabase();
    const userId = req.authUser?.id;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const link = await linkService.createLink(supabase, userId, req.body);
    return res.json(link);
  } catch (e: any) {
    console.error("❌ Convert error:", e);
    return res.status(400).json({ error: e.message || "Convert failed" });
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

    const links = await linkService.getUserLinks(supabase, userId);
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
        "redirect_delay_ms",
      ];

      const updates: any = {};
      for (const key of allowedUpdates) {
        if (req.body[key] !== undefined) {
          updates[key] = req.body[key];
        }
      }

      const link = await linkService.updateLink(supabase, linkId, userId, updates);
      return res.json(link);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
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

export default router;
