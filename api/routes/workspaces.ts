import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getSupabase } from "../config/supabase.js";
import { AuthenticatedRequest } from "../types/index.js";
import * as workspaceService from "../services/workspaceService.js";

const router = Router();

router.get(
  "/user/workspaces",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }

      const workspaces = await workspaceService.listUserWorkspaces(
        supabase,
        userId,
      );
      return res.json(workspaces);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  },
);

router.post(
  "/user/workspaces",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }

      const workspace = await workspaceService.createWorkspace(supabase, userId, {
        name: req.body?.name || "",
        description: req.body?.description || null,
      });
      return res.json(workspace);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  },
);

router.get(
  "/user/workspaces/:workspaceId/members",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const userId = req.authUser?.id;
      const workspaceId = req.params.workspaceId;
      if (!userId || !workspaceId) {
        return res.status(400).json({ error: "Missing userId or workspaceId" });
      }

      const members = await workspaceService.listWorkspaceMembers(
        supabase,
        workspaceId,
        userId,
      );
      return res.json(members);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  },
);

router.post(
  "/user/workspaces/:workspaceId/members",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const userId = req.authUser?.id;
      const workspaceId = req.params.workspaceId;
      if (!userId || !workspaceId) {
        return res.status(400).json({ error: "Missing userId or workspaceId" });
      }

      const member = await workspaceService.inviteWorkspaceMember(
        supabase,
        workspaceId,
        userId,
        {
          email: req.body?.email || "",
          role: req.body?.role === "viewer" ? "viewer" : req.body?.role === "owner" ? "owner" : "editor",
        },
      );
      return res.json(member);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  },
);

router.patch(
  "/user/workspaces/:workspaceId/members/:memberUserId",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const userId = req.authUser?.id;
      const workspaceId = req.params.workspaceId;
      const memberUserId = req.params.memberUserId;
      if (!userId || !workspaceId || !memberUserId) {
        return res.status(400).json({ error: "Missing workspaceId or memberUserId" });
      }

      await workspaceService.updateWorkspaceMemberRole(
        supabase,
        workspaceId,
        userId,
        memberUserId,
        req.body?.role === "viewer" ? "viewer" : req.body?.role === "owner" ? "owner" : "editor",
      );
      return res.json({ success: true });
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  },
);

router.delete(
  "/user/workspaces/:workspaceId/members/:memberUserId",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const userId = req.authUser?.id;
      const workspaceId = req.params.workspaceId;
      const memberUserId = req.params.memberUserId;
      if (!userId || !workspaceId || !memberUserId) {
        return res.status(400).json({ error: "Missing workspaceId or memberUserId" });
      }

      await workspaceService.removeWorkspaceMember(
        supabase,
        workspaceId,
        userId,
        memberUserId,
      );
      return res.json({ success: true });
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  },
);

export default router;
