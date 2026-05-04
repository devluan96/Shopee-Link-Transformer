import { SupabaseClient } from "../config/supabase.js";

export type WorkspaceRole = "owner" | "editor" | "viewer";

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  is_personal: boolean;
  owner_id: string;
  role: WorkspaceRole;
}

export interface WorkspaceMemberSummary {
  user_id: string;
  workspace_id: string;
  role: WorkspaceRole;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  joined_at?: string | null;
}

interface ProfileSummary {
  id: string;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
}

const PERSONAL_WORKSPACE_SLUG_PREFIX = "personal-";

export const ensurePersonalWorkspace = async (
  supabase: SupabaseClient,
  userId: string,
) => {
  const { data: existing, error: existingError } = await supabase
    .from("workspaces")
    .select("id, owner_id, name, slug, description, is_personal")
    .eq("owner_id", userId)
    .eq("is_personal", true)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) {
    await ensureWorkspaceMembership(supabase, existing.id, userId, "owner");
    return existing;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .maybeSingle();

  const fallbackName =
    profile?.full_name?.trim() ||
    profile?.email?.split("@")[0] ||
    "Workspace cá nhân";

  const { data: created, error: createError } = await supabase
    .from("workspaces")
    .insert({
      owner_id: userId,
      name: fallbackName,
      slug: `${PERSONAL_WORKSPACE_SLUG_PREFIX}${userId.replace(/-/g, "")}`,
      is_personal: true,
    })
    .select("id, owner_id, name, slug, description, is_personal")
    .single();

  if (createError) throw createError;

  await ensureWorkspaceMembership(supabase, created.id, userId, "owner");
  return created;
};

export const ensureWorkspaceMembership = async (
  supabase: SupabaseClient,
  workspaceId: string,
  userId: string,
  role: WorkspaceRole,
) => {
  const { error } = await supabase.from("workspace_members").upsert(
    {
      workspace_id: workspaceId,
      user_id: userId,
      role,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "workspace_id,user_id" },
  );

  if (error) throw error;
};

export const listUserWorkspaces = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<WorkspaceSummary[]> => {
  await ensurePersonalWorkspace(supabase, userId);

  const { data, error } = await supabase
    .from("workspace_members")
    .select(
      "role, workspace:workspaces(id, owner_id, name, slug, description, is_personal)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data || [])
    .map((item: any) => {
      const workspace = item.workspace;
      if (!workspace) return null;
      return {
        ...workspace,
        role: item.role as WorkspaceRole,
      } satisfies WorkspaceSummary;
    })
    .filter(Boolean) as WorkspaceSummary[];
};

export const createWorkspace = async (
  supabase: SupabaseClient,
  userId: string,
  payload: {
    name: string;
    description?: string | null;
  },
): Promise<WorkspaceSummary> => {
  const name = payload.name.trim();
  if (!name) {
    throw new Error("Tên workspace không được để trống.");
  }

  const slugBase = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "workspace"}-${Date.now().toString(36)}`;
  const { data, error } = await supabase
    .from("workspaces")
    .insert({
      owner_id: userId,
      name: name.slice(0, 80),
      description: payload.description?.trim() || null,
      slug: slugBase.slice(0, 120),
      is_personal: false,
    })
    .select("id, owner_id, name, slug, description, is_personal")
    .single();

  if (error) throw error;
  await ensureWorkspaceMembership(supabase, data.id, userId, "owner");

  return {
    ...data,
    role: "owner",
  };
};

const assertWorkspaceOwner = async (
  supabase: SupabaseClient,
  workspaceId: string,
  userId: string,
) => {
  const accessMap = await getWorkspaceAccessMap(supabase, userId);
  const role = accessMap.get(workspaceId);
  if (role !== "owner") {
    throw new Error("Chỉ owner mới quản lý thành viên workspace.");
  }
};

export const listWorkspaceMembers = async (
  supabase: SupabaseClient,
  workspaceId: string,
  userId: string,
): Promise<WorkspaceMemberSummary[]> => {
  const accessMap = await getWorkspaceAccessMap(supabase, userId);
  if (!accessMap.has(workspaceId)) {
    throw new Error("Bạn không có quyền xem workspace này.");
  }

  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id, user_id, role, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  const memberRows = data || [];
  const memberIds = memberRows.map((item: any) => item.user_id).filter(Boolean);

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .in("id", memberIds);

  if (profilesError) throw profilesError;

  const profileMap = new Map<string, ProfileSummary>(
    (profiles || []).map((profile: any) => [profile.id, profile as ProfileSummary]),
  );

  return memberRows.map((item: any) => {
    const profile = profileMap.get(item.user_id);
    return {
      workspace_id: item.workspace_id,
      user_id: item.user_id,
      role: item.role,
      full_name: profile?.full_name ?? null,
      email: profile?.email ?? null,
      avatar_url: profile?.avatar_url ?? null,
      joined_at: item.created_at ?? null,
    };
  });
};

export const inviteWorkspaceMember = async (
  supabase: SupabaseClient,
  workspaceId: string,
  actorUserId: string,
  payload: {
    email: string;
    role: WorkspaceRole;
  },
) => {
  await assertWorkspaceOwner(supabase, workspaceId, actorUserId);

  const email = payload.email.trim().toLowerCase();
  if (!email) {
    throw new Error("Email thành viên không được để trống.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .ilike("email", email)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile?.id) {
    throw new Error("Không tìm thấy user với email này.");
  }

  await ensureWorkspaceMembership(supabase, workspaceId, profile.id, payload.role);

  const { error } = await supabase
    .from("workspace_members")
    .update({
      invited_by: actorUserId,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId)
    .eq("user_id", profile.id);

  if (error) throw error;

  return {
    workspace_id: workspaceId,
    user_id: profile.id,
    role: payload.role,
    full_name: profile.full_name ?? null,
    email: profile.email ?? null,
    avatar_url: profile.avatar_url ?? null,
  } satisfies WorkspaceMemberSummary;
};

export const updateWorkspaceMemberRole = async (
  supabase: SupabaseClient,
  workspaceId: string,
  actorUserId: string,
  memberUserId: string,
  role: WorkspaceRole,
) => {
  await assertWorkspaceOwner(supabase, workspaceId, actorUserId);

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("owner_id")
    .eq("id", workspaceId)
    .maybeSingle();

  if (workspaceError) throw workspaceError;
  if (!workspace) throw new Error("Workspace không tồn tại.");
  if (workspace.owner_id === memberUserId) {
    throw new Error("Không thể đổi role của owner.");
  }

  const { error } = await supabase
    .from("workspace_members")
    .update({
      role,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId)
    .eq("user_id", memberUserId);

  if (error) throw error;
};

export const removeWorkspaceMember = async (
  supabase: SupabaseClient,
  workspaceId: string,
  actorUserId: string,
  memberUserId: string,
) => {
  await assertWorkspaceOwner(supabase, workspaceId, actorUserId);

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("owner_id")
    .eq("id", workspaceId)
    .maybeSingle();

  if (workspaceError) throw workspaceError;
  if (!workspace) throw new Error("Workspace không tồn tại.");
  if (workspace.owner_id === memberUserId) {
    throw new Error("Không thể xóa owner khỏi workspace.");
  }

  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", memberUserId);

  if (error) throw error;
};

export const getWorkspaceAccessMap = async (
  supabase: SupabaseClient,
  userId: string,
) => {
  const workspaces = await listUserWorkspaces(supabase, userId);
  return new Map(workspaces.map((workspace) => [workspace.id, workspace.role]));
};

export const resolveWritableWorkspaceId = async (
  supabase: SupabaseClient,
  userId: string,
  workspaceId?: string | null,
) => {
  const accessMap = await getWorkspaceAccessMap(supabase, userId);

  if (workspaceId) {
    const role = accessMap.get(workspaceId);
    if (role === "owner" || role === "editor") {
      return workspaceId;
    }
    throw new Error("Bạn không có quyền chỉnh sửa workspace này.");
  }

  const personalWorkspace = await ensurePersonalWorkspace(supabase, userId);
  return personalWorkspace.id;
};

export const getAccessibleWorkspaceIds = async (
  supabase: SupabaseClient,
  userId: string,
) => {
  const accessMap = await getWorkspaceAccessMap(supabase, userId);
  return Array.from(accessMap.keys());
};

export const assertWorkspaceWriteAccessForLink = async (
  supabase: SupabaseClient,
  userId: string,
  linkId: string,
) => {
  const { data: link, error } = await supabase
    .from("links")
    .select("id, user_id, workspace_id")
    .eq("id", linkId)
    .maybeSingle();

  if (error) throw error;
  if (!link) throw new Error("Không tìm thấy link.");

  if (!link.workspace_id) {
    if (link.user_id !== userId) {
      throw new Error("Bạn không có quyền chỉnh sửa link này.");
    }
    return link;
  }

  const accessMap = await getWorkspaceAccessMap(supabase, userId);
  const role = accessMap.get(link.workspace_id);
  if (role !== "owner" && role !== "editor") {
    throw new Error("Bạn không có quyền chỉnh sửa link này.");
  }

  return link;
};
