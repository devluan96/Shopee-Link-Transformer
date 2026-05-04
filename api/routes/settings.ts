import { Router } from "express";
import { authenticate, checkAdmin } from "../middleware/auth.js";
import { getSupabase } from "../config/supabase.js";
import * as appSettingsService from "../services/appSettingsService.js";

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

router.put(
  "/admin/settings/output-domains",
  authenticate,
  checkAdmin,
  async (req, res) => {
    try {
      const supabase = getSupabase();
      const domains = Array.isArray(req.body?.domains) ? req.body.domains : [];
      const updated = await appSettingsService.updateLinkOutputDomains(
        supabase,
        domains,
      );
      return res.json({ domains: updated });
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  },
);

export default router;
