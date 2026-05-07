import React from "react";
import {
  Building2,
  Check,
  Loader2,
  Mail,
  PlusCircle,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import {
  UserLimits,
  Workspace,
  WorkspaceInvitation,
  WorkspaceMember,
  WorkspaceRole,
} from "@/src/types";

interface WorkspaceManagerProps {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  workspaceLoading: boolean;
  members: WorkspaceMember[];
  membersLoading: boolean;
  pendingInvitations: WorkspaceInvitation[];
  pendingInvitationsLoading: boolean;
  sentInvitations: WorkspaceInvitation[];
  sentInvitationsLoading: boolean;
  userLimits?: UserLimits | null;
  onSelectWorkspace: (workspaceId: string) => void;
  onCreateWorkspace: (payload: {
    name: string;
    description?: string;
  }) => Promise<Workspace>;
  onInviteMember: (
    workspaceId: string,
    email: string,
    role: WorkspaceRole,
  ) => Promise<WorkspaceInvitation>;
  onUpdateMemberRole: (
    workspaceId: string,
    memberUserId: string,
    role: WorkspaceRole,
  ) => Promise<void>;
  onRemoveMember: (workspaceId: string, memberUserId: string) => Promise<void>;
  onAcceptInvitation: (invitationId: string) => Promise<WorkspaceInvitation>;
  onDeclineInvitation: (invitationId: string) => Promise<WorkspaceInvitation>;
  onCancelInvitation: (
    workspaceId: string,
    invitationId: string,
  ) => Promise<WorkspaceInvitation>;
}

export function WorkspaceManager({
  workspaces,
  currentWorkspace,
  workspaceLoading,
  members,
  membersLoading,
  pendingInvitations,
  pendingInvitationsLoading,
  sentInvitations,
  sentInvitationsLoading,
  userLimits,
  onSelectWorkspace,
  onCreateWorkspace,
  onInviteMember,
  onUpdateMemberRole,
  onRemoveMember,
  onAcceptInvitation,
  onDeclineInvitation,
  onCancelInvitation,
}: WorkspaceManagerProps) {
  const [workspaceName, setWorkspaceName] = React.useState("");
  const [workspaceDescription, setWorkspaceDescription] = React.useState("");
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState<WorkspaceRole>("editor");
  const [creatingWorkspace, setCreatingWorkspace] = React.useState(false);
  const [invitingMember, setInvitingMember] = React.useState(false);
  const [memberBusyId, setMemberBusyId] = React.useState<string>("");
  const [invitationBusyId, setInvitationBusyId] = React.useState<string>("");
  const [sentInvitationBusyId, setSentInvitationBusyId] =
    React.useState<string>("");

  const canManageMembers = currentWorkspace?.role === "owner";
  const ownedTeamWorkspaces = userLimits?.ownedTeamWorkspaces ?? 0;
  const maxTeamWorkspaces = userLimits?.maxTeamWorkspaces ?? null;
  const canCreateMoreWorkspaces =
    maxTeamWorkspaces === null ? true : ownedTeamWorkspaces < maxTeamWorkspaces;
  const maxMembersPerWorkspace = userLimits?.maxTeamMembersPerWorkspace ?? null;
  const canInviteMoreMembers =
    maxMembersPerWorkspace === null
      ? true
      : members.length < maxMembersPerWorkspace;
  const createWorkspaceBlocked = !canCreateMoreWorkspaces;
  const inviteMembersBlocked = !canInviteMoreMembers;

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim() || createWorkspaceBlocked) return;

    setCreatingWorkspace(true);
    try {
      await onCreateWorkspace({
        name: workspaceName,
        description: workspaceDescription,
      });
      setWorkspaceName("");
      setWorkspaceDescription("");
    } finally {
      setCreatingWorkspace(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace?.id || !inviteEmail.trim() || inviteMembersBlocked) {
      return;
    }

    setInvitingMember(true);
    try {
      await onInviteMember(currentWorkspace.id, inviteEmail, inviteRole);
      setInviteEmail("");
      setInviteRole("editor");
    } finally {
      setInvitingMember(false);
    }
  };

  const handleRoleChange = async (
    memberUserId: string,
    role: WorkspaceRole,
  ) => {
    if (!currentWorkspace?.id) return;
    setMemberBusyId(memberUserId);
    try {
      await onUpdateMemberRole(currentWorkspace.id, memberUserId, role);
    } finally {
      setMemberBusyId("");
    }
  };

  const handleRemoveMember = async (memberUserId: string) => {
    if (!currentWorkspace?.id) return;
    setMemberBusyId(memberUserId);
    try {
      await onRemoveMember(currentWorkspace.id, memberUserId);
    } finally {
      setMemberBusyId("");
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    setInvitationBusyId(invitationId);
    try {
      await onAcceptInvitation(invitationId);
    } finally {
      setInvitationBusyId("");
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    setInvitationBusyId(invitationId);
    try {
      await onDeclineInvitation(invitationId);
    } finally {
      setInvitationBusyId("");
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!currentWorkspace?.id) return;
    setSentInvitationBusyId(invitationId);
    try {
      await onCancelInvitation(currentWorkspace.id, invitationId);
    } finally {
      setSentInvitationBusyId("");
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-slate-100">
          Team Workspace
        </h2>
        <p className="mt-2 font-medium italic text-gray-500 dark:text-slate-400">
          Chọn workspace đang làm việc, tạo team mới và phân quyền
          editor/viewer.
        </p>
        {userLimits && (
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="rounded-full border border-sky-100 bg-sky-50 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200">
              Workspace team:{" "}
              {maxTeamWorkspaces === null
                ? "Không giới hạn"
                : `${ownedTeamWorkspaces}/${maxTeamWorkspaces}`}
            </div>
            <div className="rounded-full border border-violet-100 bg-violet-50 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-200">
              Member / workspace:{" "}
              {maxMembersPerWorkspace === null
                ? "Không giới hạn"
                : `${members.length}/${maxMembersPerWorkspace}`}
            </div>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[0.95fr_1.25fr]">
        <section className="space-y-6 rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-orange-50 p-3 text-orange-600">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">
                Workspace
              </h3>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
                Mỗi workspace là một nhóm link và thành viên riêng.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {workspaceLoading ? (
              <div className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-4 text-sm font-bold text-gray-500 dark:bg-slate-900 dark:text-slate-400">
                <Loader2 size={16} className="animate-spin" />
                Đang tải workspace...
              </div>
            ) : (
              workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  type="button"
                  onClick={() => onSelectWorkspace(workspace.id)}
                  className={cn(
                    "w-full rounded-2xl border px-4 py-4 text-left transition-all",
                    currentWorkspace?.id === workspace.id
                      ? "border-orange-200 bg-orange-50 shadow-sm"
                      : "border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-black text-gray-900 dark:text-slate-100">
                        {workspace.name}
                      </p>
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">
                        {workspace.is_personal ? "Personal" : "Team"} ·{" "}
                        {workspace.role}
                      </p>
                    </div>
                    <ShieldCheck
                      size={18}
                      className={cn(
                        currentWorkspace?.id === workspace.id
                          ? "text-orange-600"
                          : "text-gray-300 dark:text-slate-600",
                      )}
                    />
                  </div>
                  {workspace.description && (
                    <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
                      {workspace.description}
                    </p>
                  )}
                </button>
              ))
            )}
          </div>

          {userLimits && createWorkspaceBlocked && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4 text-sm font-medium text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              {maxTeamWorkspaces === 0
                ? "Gói hiện tại chưa hỗ trợ Team Workspace."
                : `Bạn đã dùng hết ${maxTeamWorkspaces} Team Workspace cho gói hiện tại.`}
            </div>
          )}

          <form
            onSubmit={handleCreateWorkspace}
            className="space-y-4 border-t border-gray-100 pt-6 dark:border-slate-700"
          >
            <div>
              <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-gray-400">
                Tạo workspace mới
              </label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="Tên workspace..."
                className="w-full rounded-2xl bg-gray-50 px-5 py-4 font-medium text-gray-900 outline-none transition-all focus:ring-4 focus:ring-orange-500/10 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <textarea
              value={workspaceDescription}
              onChange={(e) => setWorkspaceDescription(e.target.value)}
              rows={3}
              placeholder="Mô tả ngắn về team/campaign..."
              className="w-full resize-none rounded-2xl bg-gray-50 px-5 py-4 font-medium text-gray-900 outline-none transition-all focus:ring-4 focus:ring-orange-500/10 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={creatingWorkspace || createWorkspaceBlocked}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-orange-700 disabled:opacity-60"
            >
              {creatingWorkspace ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <PlusCircle size={16} />
              )}
              Tạo workspace
            </button>
          </form>
        </section>

        <section className="space-y-6 rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">
                {currentWorkspace?.name || "Chọn một workspace"}
              </h3>
              <p className="mt-1 text-sm font-medium text-gray-500 dark:text-slate-400">
                {currentWorkspace
                  ? `Role của bạn: ${currentWorkspace.role}`
                  : "Chọn workspace ở cột trái để xem thành viên."}
              </p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
              <Users size={20} />
            </div>
          </div>

          <div className="space-y-3 rounded-3xl border border-sky-100 bg-sky-50/70 p-5 dark:border-sky-500/20 dark:bg-sky-500/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-black uppercase tracking-widest text-sky-700 dark:text-sky-200">
                  Lời mời đang chờ
                </h4>
                <p className="mt-1 text-sm text-sky-700/80 dark:text-sky-100/70">
                  Khi được mời vào team, user cần chấp nhận thì workspace mới sẽ
                  hiện ở danh sách của họ.
                </p>
              </div>
            </div>

            {pendingInvitationsLoading ? (
              <div className="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-4 text-sm font-bold text-sky-700 dark:bg-slate-900/60 dark:text-sky-200">
                <Loader2 size={16} className="animate-spin" />
                Đang tải lời mời...
              </div>
            ) : pendingInvitations.length > 0 ? (
              pendingInvitations.map((invitation) => {
                const isBusy = invitationBusyId === invitation.id;
                return (
                  <div
                    key={invitation.id}
                    className="grid grid-cols-1 gap-4 rounded-3xl border border-sky-100 bg-white/90 p-4 md:grid-cols-[1fr_auto] md:items-center dark:border-sky-500/20 dark:bg-slate-900/70"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-black text-gray-900 dark:text-slate-100">
                        {invitation.workspace_name}
                      </p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                        Mời bởi{" "}
                        {invitation.invited_by_name ||
                          invitation.invited_by_email ||
                          "Owner"}
                        {" · "}
                        role {invitation.role}
                      </p>
                      {invitation.workspace_description && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                          {invitation.workspace_description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleAcceptInvitation(invitation.id)}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {isBusy ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Check size={14} />
                        )}
                        Chấp nhận
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleDeclineInvitation(invitation.id)}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-600 transition-all hover:bg-gray-100 disabled:opacity-60 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        <X size={14} />
                        Từ chối
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl bg-white/80 px-4 py-4 text-sm font-medium text-sky-700 dark:bg-slate-900/60 dark:text-sky-200">
                Bạn không có lời mời workspace nào đang chờ.
              </div>
            )}
          </div>

          {currentWorkspace && canManageMembers && (
            <form
              onSubmit={handleInviteMember}
              className="grid grid-cols-1 gap-4 rounded-3xl border border-gray-100 bg-gray-50 p-5 md:grid-cols-[1.4fr_0.75fr_auto] dark:border-slate-700 dark:bg-slate-900"
            >
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Email user có thể thêm vào workspace"
                className="rounded-2xl bg-white px-5 py-4 font-medium text-gray-900 outline-none transition-all focus:ring-4 focus:ring-orange-500/10 dark:bg-slate-800 dark:text-slate-100"
              />
              <select
                value={inviteRole}
                onChange={(e) =>
                  setInviteRole(
                    e.target.value === "viewer" ? "viewer" : "editor",
                  )
                }
                className="rounded-2xl bg-white px-5 py-4 font-bold text-gray-900 outline-none transition-all focus:ring-4 focus:ring-orange-500/10 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              <button
                type="submit"
                disabled={invitingMember || inviteMembersBlocked}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gray-900 px-6 py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-black disabled:opacity-60"
              >
                {invitingMember ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <UserPlus size={16} />
                )}
                Mời
              </button>
            </form>
          )}

          {currentWorkspace && canManageMembers && (
            <div className="space-y-3 rounded-3xl border border-gray-100 bg-gray-50 p-5 dark:border-slate-700 dark:bg-slate-900">
              <div>
                <h4 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-slate-400">
                  Lời mời đã gửi
                </h4>
                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                  Owner có thể theo dõi và hủy lời mời đang chờ.
                </p>
              </div>

              {sentInvitationsLoading ? (
                <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-4 text-sm font-bold text-gray-500 dark:bg-slate-800 dark:text-slate-300">
                  <Loader2 size={16} className="animate-spin" />
                  Đang tải lời mời đã gửi...
                </div>
              ) : sentInvitations.length > 0 ? (
                sentInvitations.map((invitation) => {
                  const isBusy = sentInvitationBusyId === invitation.id;
                  return (
                    <div
                      key={invitation.id}
                      className="grid grid-cols-1 gap-4 rounded-3xl border border-gray-100 bg-white p-4 md:grid-cols-[1fr_auto] md:items-center dark:border-slate-700 dark:bg-slate-800"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-black text-gray-900 dark:text-slate-100">
                          {invitation.invited_email}
                        </p>
                        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                          Role {invitation.role} · {invitation.workspace_name}
                        </p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">
                          Chờ chấp nhận
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleCancelInvitation(invitation.id)}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-xs font-black uppercase tracking-widest text-red-600 transition-all hover:bg-red-100 disabled:opacity-60 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/20"
                      >
                        {isBusy ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <X size={14} />
                        )}
                        Hủy lời mời
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl bg-white px-4 py-4 text-sm font-medium text-gray-500 dark:bg-slate-800 dark:text-slate-400">
                  Chưa có lời mời nào đang chờ trong workspace này.
                </div>
              )}
            </div>
          )}

          {currentWorkspace &&
            canManageMembers &&
            userLimits &&
            inviteMembersBlocked && (
              <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4 text-sm font-medium text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                {maxMembersPerWorkspace === 0
                  ? "Gói hiện tại chưa hỗ trợ mời thành viên vào workspace."
                  : `Workspace này đã dùng hết ${maxMembersPerWorkspace} slot thành viên.`}
              </div>
            )}

          {currentWorkspace && !canManageMembers && (
            <div className="rounded-3xl border border-amber-100 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              Chỉ owner mới có thể thêm hoặc đổi role thành viên. Bạn hiện là{" "}
              {currentWorkspace.role}.
            </div>
          )}

          <div className="space-y-3">
            {membersLoading ? (
              <div className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-4 text-sm font-bold text-gray-500 dark:bg-slate-900 dark:text-slate-400">
                <Loader2 size={16} className="animate-spin" />
                Đang tải thành viên...
              </div>
            ) : members.length > 0 ? (
              members.map((member) => {
                const isOwner = member.role === "owner";
                const isBusy = memberBusyId === member.user_id;

                return (
                  <div
                    key={`${member.workspace_id}-${member.user_id}`}
                    className="grid grid-cols-1 gap-4 rounded-3xl border border-gray-100 bg-gray-50 p-5 md:grid-cols-[1.2fr_0.7fr_auto] md:items-center dark:border-slate-700 dark:bg-slate-900"
                  >
                    <div className="flex items-center gap-4">
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={
                            member.full_name || member.email || "Member avatar"
                          }
                          className="h-12 w-12 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-gray-400 dark:bg-slate-800">
                          <Users size={18} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-black text-gray-900 dark:text-slate-100">
                          {member.full_name || member.email || member.user_id}
                        </p>
                        <p className="truncate text-sm text-gray-500 dark:text-slate-400">
                          <Mail
                            size={13}
                            className="mr-1 inline-block align-[-2px]"
                          />
                          {member.email || "Không có email"}
                        </p>
                      </div>
                    </div>

                    <select
                      value={member.role}
                      disabled={!canManageMembers || isOwner || isBusy}
                      onChange={(e) =>
                        handleRoleChange(
                          member.user_id,
                          e.target.value === "viewer" ? "viewer" : "editor",
                        )
                      }
                      className="rounded-2xl bg-white px-4 py-3 font-bold text-gray-900 outline-none transition-all focus:ring-4 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:text-slate-100"
                    >
                      <option value="owner">Owner</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>

                    <button
                      type="button"
                      disabled={!canManageMembers || isOwner || isBusy}
                      onClick={() => handleRemoveMember(member.user_id)}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-xs font-black uppercase tracking-widest text-red-600 transition-all hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isBusy ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                      Xóa
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl bg-gray-50 px-4 py-4 text-sm font-medium text-gray-500 dark:bg-slate-900 dark:text-slate-400">
                Chưa có thành viên nào trong workspace này.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
