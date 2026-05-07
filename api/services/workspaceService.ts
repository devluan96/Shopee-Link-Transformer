import { SupabaseClient } from "../config/supabase.js";
import {
  createWorkspaceInvitationNotification,
  createWorkspaceInvitationResponseNotification,
  createWorkspaceMembershipRemovedNotification,
  createWorkspaceMembershipUpdatedNotification,
} from "./notificationService.js";

export type WorkspaceRole = "owner" | "editor" | "viewer";
export type WorkspaceInvitationStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "cancelled";

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

export interface WorkspaceInvitationSummary {
  id: string;
  workspace_id: string;
  workspace_name: string;
  workspace_description?: string | null;
  invited_user_id: string;
  invited_email: string;
  role: Exclude<WorkspaceRole, "owner">;
  status: WorkspaceInvitationStatus;
  invited_by: string;
  invited_by_name?: string | null;
  invited_by_email?: string | null;
  created_at: string;
  responded_at?: string | null;
}

interface ProfileSummary {
  id: string;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
}

const getProfileById = async (supabase: SupabaseClient, userId: string) => {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return (profile || null) as ProfileSummary | null;
};

interface WorkspaceInvitationRow {
  id: string;
  workspace_id: string;
  invited_user_id: string;
  invited_email: string;
  role: Exclude<WorkspaceRole, "owner">;
  status: WorkspaceInvitationStatus;
  invited_by: string;
  created_at: string;
  responded_at?: string | null;
}

const PERSONAL_WORKSPACE_SLUG_PREFIX = "personal-";

const getProfileByEmail = async (supabase: SupabaseClient, email: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (error) throw error;
  if (!profile?.id) {
    throw new Error("Không tìm thấy người dùng này.");
  }

  return profile as ProfileSummary & { id: string; email?: string | null };
};

const mapInvitationRows = async (
  supabase: SupabaseClient,
  invitationRows: WorkspaceInvitationRow[],
): Promise<WorkspaceInvitationSummary[]> => {
  if (!invitationRows.length) return [];

  const workspaceIds = Array.from(
    new Set(invitationRows.map((item) => item.workspace_id).filter(Boolean)),
  );
  const inviterIds = Array.from(
    new Set(invitationRows.map((item) => item.invited_by).filter(Boolean)),
  );

  const [
    { data: workspaces, error: workspacesError },
    { data: profiles, error: profilesError },
  ] = await Promise.all([
    supabase
      .from("workspaces")
      .select("id, name, description")
      .in("id", workspaceIds),
    inviterIds.length
      ? supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", inviterIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (workspacesError) throw workspacesError;
  if (profilesError) throw profilesError;

  const workspaceMap = new Map<
    string,
    { name: string; description?: string | null }
  >(
    (workspaces || []).map((workspace: any) => [
      workspace.id,
      {
        name: workspace.name,
        description: workspace.description ?? null,
      },
    ]),
  );
  const profileMap = new Map<
    string,
    { full_name?: string | null; email?: string | null }
  >(
    (profiles || []).map((profile: any) => [
      profile.id,
      {
        full_name: profile.full_name ?? null,
        email: profile.email ?? null,
      },
    ]),
  );

  return invitationRows
    .map((item) => {
      const workspace = workspaceMap.get(item.workspace_id);
      if (!workspace) return null;
      const inviter = profileMap.get(item.invited_by);

      return {
        id: item.id,
        workspace_id: item.workspace_id,
        workspace_name: workspace.name,
        workspace_description: workspace.description ?? null,
        invited_user_id: item.invited_user_id,
        invited_email: item.invited_email,
        role: item.role,
        status: item.status,
        invited_by: item.invited_by,
        invited_by_name: inviter?.full_name ?? null,
        invited_by_email: inviter?.email ?? null,
        created_at: item.created_at,
        responded_at: item.responded_at ?? null,
      } satisfies WorkspaceInvitationSummary;
    })
    .filter(Boolean) as WorkspaceInvitationSummary[];
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

  const slugBase = `${
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "workspace"
  }-${Date.now().toString(36)}`;

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
    throw new Error("Chỉ owner mới có thể quản lý thành viên workspace.");
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
    (profiles || []).map((profile: any) => [
      profile.id,
      profile as ProfileSummary,
    ]),
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

export const listPendingWorkspaceInvitations = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<WorkspaceInvitationSummary[]> => {
  const { data, error } = await supabase
    .from("workspace_invitations")
    .select(
      "id, workspace_id, invited_user_id, invited_email, role, status, invited_by, created_at, responded_at",
    )
    .eq("invited_user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return mapInvitationRows(supabase, (data || []) as WorkspaceInvitationRow[]);
};

export const listSentWorkspaceInvitations = async (
  supabase: SupabaseClient,
  workspaceId: string,
  userId: string,
): Promise<WorkspaceInvitationSummary[]> => {
  await assertWorkspaceOwner(supabase, workspaceId, userId);

  const { data, error } = await supabase
    .from("workspace_invitations")
    .select(
      "id, workspace_id, invited_user_id, invited_email, role, status, invited_by, created_at, responded_at",
    )
    .eq("workspace_id", workspaceId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return mapInvitationRows(supabase, (data || []) as WorkspaceInvitationRow[]);
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
  if (payload.role === "owner") {
    throw new Error("Không thể mời role owner.");
  }

  const profile = await getProfileByEmail(supabase, email);
  if (profile.id === actorUserId) {
    throw new Error("Không thể mời chính bạn vào workspace.");
  }

  const { data: existingMember, error: existingMemberError } = await supabase
    .from("workspace_members")
    .select("user_id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", profile.id)
    .maybeSingle();

  if (existingMemberError) throw existingMemberError;
  if (existingMember?.user_id) {
    throw new Error("Người dùng này đã là thành viên của workspace.");
  }

  const { data: existingInvite, error: existingInviteError } = await supabase
    .from("workspace_invitations")
    .select(
      "id, workspace_id, invited_user_id, invited_email, role, status, invited_by, created_at, responded_at",
    )
    .eq("workspace_id", workspaceId)
    .eq("invited_user_id", profile.id)
    .eq("status", "pending")
    .maybeSingle();

  if (existingInviteError) throw existingInviteError;

  const timestamp = new Date().toISOString();
  let invitationRow: WorkspaceInvitationRow;

  if (existingInvite?.id) {
    const { data, error } = await supabase
      .from("workspace_invitations")
      .update({
        invited_email: email,
        role: payload.role,
        invited_by: actorUserId,
        updated_at: timestamp,
        responded_at: null,
      })
      .eq("id", existingInvite.id)
      .select(
        "id, workspace_id, invited_user_id, invited_email, role, status, invited_by, created_at, responded_at",
      )
      .single();

    if (error) throw error;
    invitationRow = data as WorkspaceInvitationRow;
  } else {
    const { data, error } = await supabase
      .from("workspace_invitations")
      .insert({
        workspace_id: workspaceId,
        invited_user_id: profile.id,
        invited_email: email,
        role: payload.role,
        status: "pending",
        invited_by: actorUserId,
      })
      .select(
        "id, workspace_id, invited_user_id, invited_email, role, status, invited_by, created_at, responded_at",
      )
      .single();

    if (error) throw error;
    invitationRow = data as WorkspaceInvitationRow;
  }

  const [invitation] = await mapInvitationRows(supabase, [invitationRow]);
  if (invitation) {
    await createWorkspaceInvitationNotification(supabase, {
      userId: invitation.invited_user_id,
      workspaceId: invitation.workspace_id,
      workspaceName: invitation.workspace_name,
      invitedByName: invitation.invited_by_name,
      invitationId: invitation.id,
      role: invitation.role,
    });
  }
  return invitation;
};

export const acceptWorkspaceInvitation = async (
  supabase: SupabaseClient,
  invitationId: string,
  userId: string,
) => {
  const { data: invitation, error: invitationError } = await supabase
    .from("workspace_invitations")
    .select(
      "id, workspace_id, invited_user_id, invited_email, role, status, invited_by, created_at, responded_at",
    )
    .eq("id", invitationId)
    .maybeSingle();

  if (invitationError) throw invitationError;
  if (!invitation) {
    throw new Error("Lời mời không tồn tại.");
  }
  if (invitation.invited_user_id !== userId) {
    throw new Error("Bạn không có quyền xử lý lời mời này.");
  }
  if (invitation.status !== "pending") {
    throw new Error("Lời mời này đã được xử lý.");
  }

  await ensureWorkspaceMembership(
    supabase,
    invitation.workspace_id,
    userId,
    invitation.role,
  );

  const respondedAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("workspace_invitations")
    .update({
      status: "accepted",
      responded_at: respondedAt,
      updated_at: respondedAt,
    })
    .eq("id", invitationId);

  if (updateError) throw updateError;

  const [mapped] = await mapInvitationRows(supabase, [
    invitation as WorkspaceInvitationRow,
  ]);
  if (mapped?.invited_by) {
    const invitedProfile = await getProfileById(supabase, userId);
    await createWorkspaceInvitationResponseNotification(supabase, {
      userId: mapped.invited_by,
      workspaceId: mapped.workspace_id,
      workspaceName: mapped.workspace_name,
      memberName: invitedProfile?.full_name ?? null,
      memberEmail: invitedProfile?.email ?? mapped.invited_email,
      invitationId: mapped.id,
      action: "accepted",
      role: mapped.role,
    });
  }
  return {
    ...mapped,
    status: "accepted" as const,
    responded_at: respondedAt,
  } satisfies WorkspaceInvitationSummary;
};

export const declineWorkspaceInvitation = async (
  supabase: SupabaseClient,
  invitationId: string,
  userId: string,
) => {
  const { data: invitation, error: invitationError } = await supabase
    .from("workspace_invitations")
    .select(
      "id, workspace_id, invited_user_id, invited_email, role, status, invited_by, created_at, responded_at",
    )
    .eq("id", invitationId)
    .maybeSingle();

  if (invitationError) throw invitationError;
  if (!invitation) {
    throw new Error("Lời mời không tồn tại.");
  }
  if (invitation.invited_user_id !== userId) {
    throw new Error("Bạn không có quyền xử lý lời mời này.");
  }
  if (invitation.status !== "pending") {
    throw new Error("Lời mời này đã được xử lý.");
  }

  const respondedAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("workspace_invitations")
    .update({
      status: "declined",
      responded_at: respondedAt,
      updated_at: respondedAt,
    })
    .eq("id", invitationId);

  if (updateError) throw updateError;

  const [mapped] = await mapInvitationRows(supabase, [
    invitation as WorkspaceInvitationRow,
  ]);
  if (mapped?.invited_by) {
    const invitedProfile = await getProfileById(supabase, userId);
    await createWorkspaceInvitationResponseNotification(supabase, {
      userId: mapped.invited_by,
      workspaceId: mapped.workspace_id,
      workspaceName: mapped.workspace_name,
      memberName: invitedProfile?.full_name ?? null,
      memberEmail: invitedProfile?.email ?? mapped.invited_email,
      invitationId: mapped.id,
      action: "declined",
      role: mapped.role,
    });
  }
  return {
    ...mapped,
    status: "declined" as const,
    responded_at: respondedAt,
  } satisfies WorkspaceInvitationSummary;
};

export const cancelWorkspaceInvitation = async (
  supabase: SupabaseClient,
  invitationId: string,
  userId: string,
) => {
  const { data: invitation, error: invitationError } = await supabase
    .from("workspace_invitations")
    .select(
      "id, workspace_id, invited_user_id, invited_email, role, status, invited_by, created_at, responded_at",
    )
    .eq("id", invitationId)
    .maybeSingle();

  if (invitationError) throw invitationError;
  if (!invitation) {
    throw new Error("Loi moi khong ton tai.");
  }
  if (invitation.status !== "pending") {
    throw new Error("Loi moi nay da duoc xu ly.");
  }

  await assertWorkspaceOwner(supabase, invitation.workspace_id, userId);

  const respondedAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("workspace_invitations")
    .update({
      status: "cancelled",
      responded_at: respondedAt,
      updated_at: respondedAt,
    })
    .eq("id", invitationId);

  if (updateError) throw updateError;

  const [mapped] = await mapInvitationRows(supabase, [
    invitation as WorkspaceInvitationRow,
  ]);
  return {
    ...mapped,
    status: "cancelled" as const,
    responded_at: respondedAt,
  } satisfies WorkspaceInvitationSummary;
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
    .select("owner_id, name")
    .eq("id", workspaceId)
    .maybeSingle();

  if (workspaceError) throw workspaceError;
  if (!workspace) throw new Error("Workspace không tồn tại.");
  if (workspace.owner_id === memberUserId) {
    throw new Error("Không thể đổi role của owner.");
  }

  const memberProfile = await getProfileById(supabase, memberUserId);

  const { error } = await supabase
    .from("workspace_members")
    .update({
      role,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId)
    .eq("user_id", memberUserId);

  if (error) throw error;

  await createWorkspaceMembershipUpdatedNotification(supabase, {
    userId: memberUserId,
    workspaceId,
    workspaceName: workspace.name || memberProfile?.full_name || "Workspace",
    role: role === "viewer" ? "viewer" : "editor",
  });
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
    .select("owner_id, name")
    .eq("id", workspaceId)
    .maybeSingle();

  if (workspaceError) throw workspaceError;
  if (!workspace) throw new Error("Workspace không tồn tại.");
  if (workspace.owner_id === memberUserId) {
    throw new Error("Không thể xóa owner khỏi workspace.");
  }

  const memberProfile = await getProfileById(supabase, memberUserId);

  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", memberUserId);

  if (error) throw error;

  await createWorkspaceMembershipRemovedNotification(supabase, {
    userId: memberUserId,
    workspaceId,
    workspaceName: workspace.name || memberProfile?.full_name || "Workspace",
  });
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
