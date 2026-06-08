import { Router } from "express";
import { authenticate, checkAdmin } from "../middleware/auth.js";
import { getSupabase } from "../config/supabase.js";
import * as appSettingsService from "../services/appSettingsService.js";
import * as deepLinkService from "../services/deepLinkService.js";
import * as securityService from "../services/securityService.js";
import { AuthenticatedRequest } from "../types/index.js";

const router = Router();

router.get("/settings/output-domains", authenticate, async (req, res) => {
  try {
    const supabase = getSupabase();
    const domains = await appSettingsService.getLinkOutputDomains(supabase);
    return res.json({ domains });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

router.get("/settings/deeplink-profiles", authenticate, async (req, res) => {
  try {
    const supabase = getSupabase();
    const profiles = await deepLinkService.getLinkDeepLinkProfiles(supabase);
    return res.json({ profiles });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

router.get("/settings/video-upload-provider", authenticate, async (req, res) => {
  try {
    const supabase = getSupabase();
    const provider = await appSettingsService.getVideoUploadProviderPreference(
      supabase,
    );
    return res.json({ provider });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

router.put(
  "/admin/settings/output-domains",
  authenticate,
  checkAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const domains = Array.isArray(req.body?.domains) ? req.body.domains : [];
      const updated = await appSettingsService.updateLinkOutputDomains(
        supabase,
        domains,
      );
      await securityService.logAdminAction(supabase, {
        actorUserId: req.authUser?.id || null,
        actorEmail: req.authUser?.email || req.authProfile?.email || null,
        action: "update_output_domains",
        metadata: { domains: updated },
      });
      return res.json({ domains: updated });
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  },
);

router.put(
  "/admin/settings/video-upload-provider",
  authenticate,
  checkAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const provider =
        req.body?.provider === "r2" ||
        req.body?.provider === "supabase" ||
        req.body?.provider === "cloudinary"
          ? req.body.provider
          : "cloudinary";
      const updated =
        await appSettingsService.updateVideoUploadProviderPreference(
          supabase,
          provider,
        );
      await securityService.logAdminAction(supabase, {
        actorUserId: req.authUser?.id || null,
        actorEmail: req.authUser?.email || req.authProfile?.email || null,
        action: "update_video_upload_provider",
        metadata: { provider: updated },
      });
      return res.json({ provider: updated });
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  },
);

router.put(
  "/admin/settings/deeplink-profiles",
  authenticate,
  checkAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const profiles = req.body?.profiles || {};
      const updated = await deepLinkService.updateLinkDeepLinkProfiles(
        supabase,
        profiles,
      );
      await securityService.logAdminAction(supabase, {
        actorUserId: req.authUser?.id || null,
        actorEmail: req.authUser?.email || req.authProfile?.email || null,
        action: "update_deeplink_profiles",
        metadata: { profiles: updated },
      });
      return res.json({ profiles: updated });
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  },
);

export default router;
