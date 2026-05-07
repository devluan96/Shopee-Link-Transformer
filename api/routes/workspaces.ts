import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getSupabase } from "../config/supabase.js";
import { AuthenticatedRequest } from "../types/index.js";
import * as workspaceService from "../services/workspaceService.js";
import * as featureLimitService from "../services/featureLimitService.js";

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

      const limits = featureLimitService.getFeatureLimitsForProfile(
        req.authProfile || undefined,
      );
      if (limits.maxTeamWorkspaces === 0) {
        return res.status(403).json({
          error: "Gói hiện tại chưa hỗ trợ Team Workspace.",
        });
      }
      if (limits.maxTeamWorkspaces !== null) {
        const used = await featureLimitService.getOwnedTeamWorkspaceCount(
          supabase,
          userId,
        );
        if (used >= limits.maxTeamWorkspaces) {
          return res.status(429).json({
            error: `Bạn đã đạt giới hạn ${limits.maxTeamWorkspaces} Team Workspace cho gói hiện tại.`,
          });
        }
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

router.get(
  "/user/workspace-invitations",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }

      const invitations = await workspaceService.listPendingWorkspaceInvitations(
        supabase,
        userId,
      );
      return res.json(invitations);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  },
);

router.get(
  "/user/workspaces/:workspaceId/invitations",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const userId = req.authUser?.id;
      const workspaceId = req.params.workspaceId;
      if (!userId || !workspaceId) {
        return res.status(400).json({ error: "Missing userId or workspaceId" });
      }

      const invitations = await workspaceService.listSentWorkspaceInvitations(
        supabase,
        workspaceId,
        userId,
      );
      return res.json(invitations);
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

      const limits = featureLimitService.getFeatureLimitsForProfile(
        req.authProfile || undefined,
      );
      if (limits.maxTeamMembersPerWorkspace === 0) {
        return res.status(403).json({
          error: "Gói hiện tại chưa hỗ trợ mời thành viên vào workspace.",
        });
      }
      if (limits.maxTeamMembersPerWorkspace !== null) {
        const members = await featureLimitService.getWorkspaceMemberCount(
          supabase,
          workspaceId,
        );
        if (members >= limits.maxTeamMembersPerWorkspace) {
          return res.status(429).json({
            error: `Workspace này đã đạt giới hạn ${limits.maxTeamMembersPerWorkspace} thành viên cho gói hiện tại.`,
          });
        }
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

router.post(
  "/user/workspace-invitations/:invitationId/accept",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const userId = req.authUser?.id;
      const invitationId = req.params.invitationId;
      if (!userId || !invitationId) {
        return res.status(400).json({ error: "Missing userId or invitationId" });
      }

      const invitation = await workspaceService.acceptWorkspaceInvitation(
        supabase,
        invitationId,
        userId,
      );
      return res.json(invitation);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  },
);

router.post(
  "/user/workspace-invitations/:invitationId/decline",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const userId = req.authUser?.id;
      const invitationId = req.params.invitationId;
      if (!userId || !invitationId) {
        return res.status(400).json({ error: "Missing userId or invitationId" });
      }

      const invitation = await workspaceService.declineWorkspaceInvitation(
        supabase,
        invitationId,
        userId,
      );
      return res.json(invitation);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  },
);

router.delete(
  "/user/workspace-invitations/:invitationId",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const userId = req.authUser?.id;
      const invitationId = req.params.invitationId;
      if (!userId || !invitationId) {
        return res.status(400).json({ error: "Missing userId or invitationId" });
      }

      const invitation = await workspaceService.cancelWorkspaceInvitation(
        supabase,
        invitationId,
        userId,
      );
      return res.json(invitation);
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
