import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { User } from "@supabase/supabase-js";
import {
  Workspace,
  WorkspaceInvitation,
  WorkspaceMember,
  WorkspaceRole,
} from "@/src/types";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";

interface UseWorkspacesProps {
  user: User | null;
  fetchWithAuth: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>;
}

const getWorkspaceStorageKey = (userId?: string) =>
  userId
    ? `hotsnew.currentWorkspaceId.${userId}`
    : "hotsnew.currentWorkspaceId";

export function useWorkspaces({ user, fetchWithAuth }: UseWorkspacesProps) {
  const userId = user?.id || "";
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>("");
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceResolved, setWorkspaceResolved] = useState(false);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<
    WorkspaceInvitation[]
  >([]);
  const [pendingInvitationsLoading, setPendingInvitationsLoading] =
    useState(false);
  const [sentInvitations, setSentInvitations] = useState<WorkspaceInvitation[]>(
    [],
  );
  const [sentInvitationsLoading, setSentInvitationsLoading] = useState(false);
  const workspacesLoadedRef = useRef(false);
  const pendingInvitationsLoadedRef = useRef(false);
  const membersCacheRef = useRef<Record<string, WorkspaceMember[]>>({});
  const sentInvitationsCacheRef = useRef<Record<string, WorkspaceInvitation[]>>(
    {},
  );
  const currentWorkspaceIdRef = useRef("");

  const currentWorkspace = useMemo(
    () =>
      workspaces.find((workspace) => workspace.id === currentWorkspaceId) ||
      null,
    [workspaces, currentWorkspaceId],
  );

  const fetchWorkspaces = useCallback(
    async (force = false) => {
      if (!userId) return;
      if (!force && workspacesLoadedRef.current) return;

      setWorkspaceLoading(true);
      setWorkspaceResolved(false);

      try {
        const res = await fetchWithAuth("/api/v1/user/workspaces");
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Khong the tai workspace");
        }

        const nextWorkspaces = data as Workspace[];
        setWorkspaces(nextWorkspaces);
        workspacesLoadedRef.current = true;

        const storedWorkspaceId =
          window.localStorage.getItem(getWorkspaceStorageKey(userId)) || "";
        const fallbackWorkspaceId =
          nextWorkspaces.find((workspace) => workspace.id === storedWorkspaceId)
            ?.id ||
          nextWorkspaces[0]?.id ||
          "";

        setCurrentWorkspaceId((prev) =>
          prev && nextWorkspaces.some((workspace) => workspace.id === prev)
            ? prev
            : fallbackWorkspaceId,
        );
      } catch (error: any) {
        toast.error(error.message || "Loi khi tai workspace");
      } finally {
        setWorkspaceLoading(false);
        setWorkspaceResolved(true);
      }
    },
    [fetchWithAuth, userId],
  );

  const fetchMembers = useCallback(
    async (workspaceId: string, force = false) => {
      if (!userId || !workspaceId) {
        setMembers([]);
        return;
      }

      const cachedMembers = membersCacheRef.current[workspaceId];
      if (!force && cachedMembers) {
        setMembers(cachedMembers);
        setMembersLoading(false);
        return;
      }

      setMembersLoading(true);
      try {
        const res = await fetchWithAuth(
          `/api/v1/user/workspaces/${workspaceId}/members`,
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Khong the tai thanh vien");
        }

        const nextMembers = data as WorkspaceMember[];
        membersCacheRef.current[workspaceId] = nextMembers;
        setMembers(nextMembers);
      } catch (error: any) {
        toast.error(error.message || "Loi khi tai thanh vien");
      } finally {
        setMembersLoading(false);
      }
    },
    [fetchWithAuth, userId],
  );

  const fetchPendingInvitations = useCallback(
    async (force = false) => {
      if (!userId) {
        setPendingInvitations([]);
        return;
      }
      if (!force && pendingInvitationsLoadedRef.current) return;

      setPendingInvitationsLoading(true);
      try {
        const res = await fetchWithAuth("/api/v1/user/workspace-invitations");
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Không thể tải lời mời workspace");
        }

        setPendingInvitations(data as WorkspaceInvitation[]);
        pendingInvitationsLoadedRef.current = true;
      } catch (error: any) {
        toast.error(error.message || "Lỗi khi tải lời mời workspace");
      } finally {
        setPendingInvitationsLoading(false);
      }
    },
    [fetchWithAuth, userId],
  );

  const fetchSentInvitations = useCallback(
    async (workspaceId: string, force = false) => {
      if (!userId || !workspaceId) {
        setSentInvitations([]);
        return;
      }

      const cachedInvitations = sentInvitationsCacheRef.current[workspaceId];
      if (!force && cachedInvitations) {
        setSentInvitations(cachedInvitations);
        setSentInvitationsLoading(false);
        return;
      }

      setSentInvitationsLoading(true);
      try {
        const res = await fetchWithAuth(
          `/api/v1/user/workspaces/${workspaceId}/invitations`,
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Không thể tải lời mời đã gửi");
        }

        const nextInvitations = data as WorkspaceInvitation[];
        sentInvitationsCacheRef.current[workspaceId] = nextInvitations;
        setSentInvitations(nextInvitations);
      } catch (error: any) {
        toast.error(error.message || "Lỗi khi tải lời mời đã gửi");
      } finally {
        setSentInvitationsLoading(false);
      }
    },
    [fetchWithAuth, userId],
  );

  const createWorkspace = useCallback(
    async (payload: { name: string; description?: string }) => {
      const res = await fetchWithAuth("/api/v1/user/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Khong the tao workspace");
      }

      const nextWorkspace = data as Workspace;
      await fetchWorkspaces(true);
      setCurrentWorkspaceId(nextWorkspace.id);
      await fetchMembers(nextWorkspace.id, true);
      await fetchSentInvitations(nextWorkspace.id, true);
      toast.success("Da tao workspace moi");
      return nextWorkspace;
    },
    [fetchMembers, fetchSentInvitations, fetchWithAuth, fetchWorkspaces],
  );

  const inviteMember = useCallback(
    async (workspaceId: string, email: string, role: WorkspaceRole) => {
      const res = await fetchWithAuth(
        `/api/v1/user/workspaces/${workspaceId}/members`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, role }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể gửi lời mời");
      }

      toast.success("Đã gửi lời mời. Đợi người dùng chấp nhận.");
      await fetchSentInvitations(workspaceId, true);
      return data as WorkspaceInvitation;
    },
    [fetchSentInvitations, fetchWithAuth],
  );

  const updateMemberRole = useCallback(
    async (workspaceId: string, memberUserId: string, role: WorkspaceRole) => {
      const res = await fetchWithAuth(
        `/api/v1/user/workspaces/${workspaceId}/members/${memberUserId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể cập nhật role");
      }

      await fetchMembers(workspaceId, true);
      toast.success("Đã cập nhật role");
    },
    [fetchMembers, fetchWithAuth],
  );

  const removeMember = useCallback(
    async (workspaceId: string, memberUserId: string) => {
      const res = await fetchWithAuth(
        `/api/v1/user/workspaces/${workspaceId}/members/${memberUserId}`,
        {
          method: "DELETE",
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể xóa thành viên");
      }

      await fetchMembers(workspaceId, true);
      toast.success("Đã xóa thành viên khỏi workspace");
    },
    [fetchMembers, fetchWithAuth],
  );

  const acceptInvitation = useCallback(
    async (invitationId: string) => {
      const res = await fetchWithAuth(
        `/api/v1/user/workspace-invitations/${invitationId}/accept`,
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể chấp nhận lời mời");
      }

      const invitation = data as WorkspaceInvitation;
      await fetchPendingInvitations(true);
      await fetchWorkspaces(true);
      setCurrentWorkspaceId(invitation.workspace_id);
      await fetchMembers(invitation.workspace_id, true);
      toast.success(`Đã tham gia workspace ${invitation.workspace_name}`);
      return invitation;
    },
    [fetchMembers, fetchPendingInvitations, fetchWithAuth, fetchWorkspaces],
  );

  const declineInvitation = useCallback(
    async (invitationId: string) => {
      const res = await fetchWithAuth(
        `/api/v1/user/workspace-invitations/${invitationId}/decline`,
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể từ chối lời mời");
      }

      await fetchPendingInvitations(true);
      toast.success("Đã từ chối lời mời workspace");
      return data as WorkspaceInvitation;
    },
    [fetchPendingInvitations, fetchWithAuth],
  );

  const cancelInvitation = useCallback(
    async (workspaceId: string, invitationId: string) => {
      const res = await fetchWithAuth(
        `/api/v1/user/workspace-invitations/${invitationId}`,
        {
          method: "DELETE",
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể hủy lời mời");
      }

      await fetchSentInvitations(workspaceId, true);
      toast.success("Đã hủy lời mời workspace");
      return data as WorkspaceInvitation;
    },
    [fetchSentInvitations, fetchWithAuth],
  );

  useEffect(() => {
    currentWorkspaceIdRef.current = currentWorkspaceId;
  }, [currentWorkspaceId]);

  useEffect(() => {
    if (!userId) {
      setWorkspaces([]);
      setCurrentWorkspaceId("");
      setWorkspaceResolved(false);
      setMembers([]);
      setPendingInvitations([]);
      setSentInvitations([]);
      workspacesLoadedRef.current = false;
      pendingInvitationsLoadedRef.current = false;
      membersCacheRef.current = {};
      sentInvitationsCacheRef.current = {};
      window.localStorage.removeItem(getWorkspaceStorageKey());
      return;
    }

    workspacesLoadedRef.current = false;
    pendingInvitationsLoadedRef.current = false;
    membersCacheRef.current = {};
    sentInvitationsCacheRef.current = {};
    void fetchWorkspaces(true);
    void fetchPendingInvitations(true);
  }, [fetchPendingInvitations, fetchWorkspaces, userId]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`workspace-sync:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "workspace_members",
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          workspacesLoadedRef.current = false;
          membersCacheRef.current = {};
          sentInvitationsCacheRef.current = {};
          await fetchWorkspaces(true);

          const nextWorkspaceId = currentWorkspaceIdRef.current;
          if (nextWorkspaceId) {
            await fetchMembers(nextWorkspaceId, true);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "workspace_invitations",
          filter: `invited_user_id=eq.${userId}`,
        },
        async () => {
          pendingInvitationsLoadedRef.current = false;
          await fetchPendingInvitations(true);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [
    fetchMembers,
    fetchPendingInvitations,
    fetchWorkspaces,
    userId,
  ]);

  useEffect(() => {
    if (currentWorkspaceId) {
      window.localStorage.setItem(
        getWorkspaceStorageKey(userId),
        currentWorkspaceId,
      );

      const cachedMembers = membersCacheRef.current[currentWorkspaceId];
      if (cachedMembers) {
        setMembers(cachedMembers);
        setMembersLoading(false);
      } else {
        void fetchMembers(currentWorkspaceId);
      }

      const currentWorkspaceRole = workspaces.find(
        (workspace) => workspace.id === currentWorkspaceId,
      )?.role;
      if (currentWorkspaceRole === "owner") {
        const cachedSentInvitations =
          sentInvitationsCacheRef.current[currentWorkspaceId];
        if (cachedSentInvitations) {
          setSentInvitations(cachedSentInvitations);
          setSentInvitationsLoading(false);
        } else {
          void fetchSentInvitations(currentWorkspaceId);
        }
      } else {
        setSentInvitations([]);
        setSentInvitationsLoading(false);
      }
    } else {
      setMembers([]);
      setSentInvitations([]);
    }
  }, [
    currentWorkspaceId,
    fetchMembers,
    fetchSentInvitations,
    userId,
    workspaces,
  ]);

  return {
    workspaces,
    currentWorkspaceId,
    currentWorkspace,
    workspaceLoading,
    workspaceResolved,
    members,
    membersLoading,
    pendingInvitations,
    pendingInvitationsLoading,
    sentInvitations,
    sentInvitationsLoading,
    setCurrentWorkspaceId,
    fetchWorkspaces,
    fetchMembers,
    fetchPendingInvitations,
    fetchSentInvitations,
    createWorkspace,
    inviteMember,
    updateMemberRole,
    removeMember,
    acceptInvitation,
    declineInvitation,
    cancelInvitation,
  };
}
