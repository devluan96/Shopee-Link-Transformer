import { useCallback, useEffect, useMemo, useState } from "react";
import { User } from "@supabase/supabase-js";
import { Workspace, WorkspaceMember, WorkspaceRole } from "@/src/types";
import { toast } from "sonner";

interface UseWorkspacesProps {
  user: User | null;
  fetchWithAuth: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>;
}

const STORAGE_KEY = "hotsnew.currentWorkspaceId";

export function useWorkspaces({ user, fetchWithAuth }: UseWorkspacesProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>("");
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const currentWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === currentWorkspaceId) || null,
    [workspaces, currentWorkspaceId],
  );

  const fetchWorkspaces = useCallback(async () => {
    if (!user) return;

    setWorkspaceLoading(true);
    try {
      const res = await fetchWithAuth("/api/v1/user/workspaces");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không tải được workspace");
      }

      const nextWorkspaces = data as Workspace[];
      setWorkspaces(nextWorkspaces);

      const storedWorkspaceId = window.localStorage.getItem(STORAGE_KEY) || "";
      const fallbackWorkspaceId =
        nextWorkspaces.find((workspace) => workspace.id === storedWorkspaceId)?.id ||
        nextWorkspaces[0]?.id ||
        "";
      setCurrentWorkspaceId(fallbackWorkspaceId);
    } catch (e: any) {
      toast.error(e.message || "Lỗi tải workspace");
    } finally {
      setWorkspaceLoading(false);
    }
  }, [user, fetchWithAuth]);

  const fetchMembers = useCallback(
    async (workspaceId: string) => {
      if (!user || !workspaceId) {
        setMembers([]);
        return;
      }

      setMembersLoading(true);
      try {
        const res = await fetchWithAuth(
          `/api/v1/user/workspaces/${workspaceId}/members`,
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Không tải được thành viên");
        }

        setMembers(data as WorkspaceMember[]);
      } catch (e: any) {
        toast.error(e.message || "Lỗi tải thành viên");
      } finally {
        setMembersLoading(false);
      }
    },
    [user, fetchWithAuth],
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
        throw new Error(data.error || "Không tạo được workspace");
      }

      const nextWorkspace = data as Workspace;
      setWorkspaces((prev) => [...prev, nextWorkspace]);
      setCurrentWorkspaceId(nextWorkspace.id);
      toast.success("Đã tạo workspace mới");
      return nextWorkspace;
    },
    [fetchWithAuth],
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
        throw new Error(data.error || "Không mời được thành viên");
      }

      await fetchMembers(workspaceId);
      toast.success("Đã thêm thành viên vào workspace");
      return data as WorkspaceMember;
    },
    [fetchWithAuth, fetchMembers],
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
        throw new Error(data.error || "Không cập nhật được role");
      }

      await fetchMembers(workspaceId);
      toast.success("Đã cập nhật role");
    },
    [fetchWithAuth, fetchMembers],
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
        throw new Error(data.error || "Không xóa được thành viên");
      }

      await fetchMembers(workspaceId);
      toast.success("Đã xóa thành viên khỏi workspace");
    },
    [fetchWithAuth, fetchMembers],
  );

  useEffect(() => {
    if (!user) {
      setWorkspaces([]);
      setCurrentWorkspaceId("");
      setMembers([]);
      return;
    }
    fetchWorkspaces();
  }, [user?.id, fetchWorkspaces]);

  useEffect(() => {
    if (currentWorkspaceId) {
      window.localStorage.setItem(STORAGE_KEY, currentWorkspaceId);
      fetchMembers(currentWorkspaceId);
    } else {
      setMembers([]);
    }
  }, [currentWorkspaceId, fetchMembers]);

  return {
    workspaces,
    currentWorkspaceId,
    currentWorkspace,
    workspaceLoading,
    members,
    membersLoading,
    setCurrentWorkspaceId,
    fetchWorkspaces,
    fetchMembers,
    createWorkspace,
    inviteMember,
    updateMemberRole,
    removeMember,
  };
}
