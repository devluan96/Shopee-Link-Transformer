import { Router } from "express";
import { authenticate, checkAdmin } from "../middleware/auth.js";
import { getSupabase } from "../config/supabase.js";
import { AuthenticatedRequest } from "../types/index.js";
import * as securityService from "../services/securityService.js";
import { normalizeClientIp } from "../utils/helpers.js";

const router = Router();

router.get(
  "/user/security",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }

      const supabase = getSupabase();
      const overview = await securityService.getSecurityOverview(supabase, userId);
      return res.json(overview);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  },
);

router.post(
  "/user/security/2fa/setup",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.authUser?.id;
      const email = req.authUser?.email;
      if (!userId || !email) {
        return res.status(400).json({ error: "Missing userId or email" });
      }

      const supabase = getSupabase();
      const setup = await securityService.beginTwoFactorSetup(
        supabase,
        userId,
        email,
      );
      return res.json(setup);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  },
);

router.post(
  "/user/security/2fa/enable",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }

      const code = String(req.body?.code || "");
      const supabase = getSupabase();
      const result = await securityService.enableTwoFactor(supabase, userId, code);
      return res.json(result);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  },
);

router.post(
  "/user/security/2fa/disable",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }

      const code = String(req.body?.code || "");
      const supabase = getSupabase();
      const result = await securityService.disableTwoFactor(
        supabase,
        userId,
        code,
      );
      return res.json(result);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  },
);

router.post(
  "/user/security/2fa/challenge",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }

      const code = String(req.body?.code || "");
      const supabase = getSupabase();
      const result = await securityService.verifyTwoFactorChallenge(
        supabase,
        userId,
        code,
      );
      return res.json(result);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  },
);

router.get(
  "/user/security/access-logs",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }

      const supabase = getSupabase();
      const limit = Math.min(Number(req.query.limit) || 20, 100);
      const logs = await securityService.listUserAccessLogs(supabase, userId, limit);
      return res.json(logs);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  },
);

router.get(
  "/admin/security/access-logs",
  authenticate,
  checkAdmin,
  async (req, res) => {
    try {
      const supabase = getSupabase();
      const limit = Math.min(Number(req.query.limit) || 100, 300);
      const userId =
        typeof req.query.userId === "string" ? req.query.userId : undefined;
      const ipAddress =
        typeof req.query.ipAddress === "string"
          ? normalizeClientIp(req.query.ipAddress)
          : undefined;

      const logs = await securityService.listAdminAccessLogs(supabase, {
        limit,
        userId,
        ipAddress,
      });
      return res.json(logs);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  },
);

router.get(
  "/admin/security/blocked-ips",
  authenticate,
  checkAdmin,
  async (_req, res) => {
    try {
      const supabase = getSupabase();
      const items = await securityService.listBlockedIps(supabase);
      return res.json(items);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  },
);

router.post(
  "/admin/security/blocked-ips",
  authenticate,
  checkAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const actorUserId = req.authUser?.id;
      if (!actorUserId) {
        return res.status(400).json({ error: "Missing actorUserId" });
      }

      const ipAddress = normalizeClientIp(req.body?.ipAddress);
      if (!ipAddress) {
        return res.status(400).json({ error: "IP address không hợp lệ" });
      }

      const supabase = getSupabase();
      const item = await securityService.blockIp(supabase, actorUserId, {
        ipAddress,
        reason: req.body?.reason,
        expiresAt:
          typeof req.body?.expiresAt === "string" ? req.body.expiresAt : null,
      });
      return res.json(item);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  },
);

router.delete(
  "/admin/security/blocked-ips/:blockedIpId",
  authenticate,
  checkAdmin,
  async (req, res) => {
    try {
      const blockedIpId = req.params.blockedIpId;
      if (!blockedIpId) {
        return res.status(400).json({ error: "Missing blockedIpId" });
      }

      const supabase = getSupabase();
      const result = await securityService.unblockIp(supabase, blockedIpId);
      return res.json(result);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  },
);

export default router;
