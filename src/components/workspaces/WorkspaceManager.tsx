import React from "react";
import {
  Building2,
  Check,
  Crown,
  Loader2,
  Mail,
  PlusCircle,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useLocale } from "@/src/hooks/useLocale";
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

const roleBadgeClass: Record<WorkspaceRole, string> = {
  owner:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200",
  editor:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200",
  viewer:
    "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200",
};

const surfaceClass =
  "rounded-[1.75rem] border border-slate-200/70 bg-white/92 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/88";
const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-orange-300 focus:ring-4 focus:ring-orange-500/10 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder:text-slate-500";

function WorkspaceSectionTitle({
  eyebrow,
  title,
  description,
  icon: Icon,
  tone = "orange",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tone?: "orange" | "blue" | "slate";
}) {
  const toneClass =
    tone === "blue"
      ? "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200"
      : tone === "slate"
        ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
        : "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-200";

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
            {eyebrow}
          </p>
        )}
        <h3 className="text-xl font-black tracking-tight text-slate-950 dark:text-slate-50">
          {title}
        </h3>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      <div className={cn("rounded-2xl p-3", toneClass)}>
        <Icon size={20} />
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-950/40">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-black tracking-tight text-slate-950 dark:text-slate-50">
        {value}
      </p>
    </div>
  );
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
  const { messages, t } = useLocale();
  const copy = messages.workspace;
  const roleLabel: Record<WorkspaceRole, string> = {
    owner: copy.roles.owner,
    editor: copy.roles.editor,
    viewer: copy.roles.viewer,
  };

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
  const maxMembersPerWorkspace = userLimits?.maxTeamMembersPerWorkspace ?? null;
  const canCreateMoreWorkspaces =
    maxTeamWorkspaces === null ? true : ownedTeamWorkspaces < maxTeamWorkspaces;
  const canInviteMoreMembers =
    maxMembersPerWorkspace === null
      ? true
      : members.length < maxMembersPerWorkspace;
  const createWorkspaceBlocked = !canCreateMoreWorkspaces;
  const inviteMembersBlocked = !canInviteMoreMembers;
  const teamWorkspaceCount = workspaces.filter(
    (workspace) => !workspace.is_personal,
  ).length;
  const currentWorkspaceType = currentWorkspace?.is_personal
    ? copy.hero.currentWorkspace.personal
    : copy.hero.currentWorkspace.team;
  const showIncomingInvitations =
    pendingInvitationsLoading ||
    (!canManageMembers && pendingInvitations.length > 0);

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
    <div className="space-y-6">
      <header
        className={cn(
          surfaceClass,
          "relative overflow-hidden p-6 lg:p-8",
          "bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.1),transparent_30%)]",
        )}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-orange-300/70 to-transparent dark:via-orange-200/30" />
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-200">
              <ShieldCheck size={14} />
              {copy.hero.badge}
            </div>

            <div className="max-w-2xl">
              <h2 className="text-3xl font-black tracking-tight text-slate-950 dark:text-slate-50">
                {copy.hero.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {copy.hero.description}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <StatPill
                label={copy.hero.stats.teamWorkspaces}
                value={
                  maxTeamWorkspaces === null
                    ? `${teamWorkspaceCount}`
                    : `${ownedTeamWorkspaces}/${maxTeamWorkspaces}`
                }
              />
              <StatPill
                label={copy.hero.stats.members}
                value={
                  maxMembersPerWorkspace === null
                    ? `${members.length}`
                    : `${members.length}/${maxMembersPerWorkspace}`
                }
              />
              <StatPill
                label={copy.hero.stats.pendingInvites}
                value={`${pendingInvitations.length}`}
              />
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950 p-6 text-white shadow-[0_24px_60px_-40px_rgba(2,6,23,0.9)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-orange-300">
                  {copy.hero.currentWorkspace.eyebrow}
                </p>
                <h3 className="mt-5 text-2xl font-black tracking-tight">
                  {currentWorkspace?.name || copy.hero.currentWorkspace.emptyTitle}
                </h3>
                <p className="mt-2 text-sm text-slate-300">
                  {currentWorkspace?.description ||
                    copy.hero.currentWorkspace.emptyDescription}
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 text-orange-300">
                <Building2 size={20} />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {currentWorkspace && (
                <>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-slate-200">
                    {currentWorkspaceType}
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em]",
                      roleBadgeClass[currentWorkspace.role],
                    )}
                  >
                    {roleLabel[currentWorkspace.role]}
                  </span>
                </>
              )}
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-slate-200">
                {members.length} {copy.hero.currentWorkspace.membersSuffix}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-slate-200">
                {sentInvitations.length} {copy.hero.currentWorkspace.pendingInvitesSuffix}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <section className={cn(surfaceClass, "space-y-5 p-6")}>
          <WorkspaceSectionTitle
            eyebrow={copy.sections.list.eyebrow}
            title={copy.sections.list.title}
            icon={Building2}
          />

          <div className="space-y-3">
            {workspaceLoading ? (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-400">
                <Loader2 size={16} className="animate-spin" />
                {copy.sections.list.loading}
              </div>
            ) : (
              workspaces.map((workspace) => {
                const isActive = currentWorkspace?.id === workspace.id;

                return (
                  <button
                    key={workspace.id}
                    type="button"
                    onClick={() => onSelectWorkspace(workspace.id)}
                    className={cn(
                      "w-full rounded-3xl border p-4 text-left transition-all",
                      isActive
                        ? "border-orange-200 bg-orange-50/80 shadow-[0_20px_50px_-42px_rgba(234,88,12,0.8)] dark:border-orange-500/30 dark:bg-orange-500/10"
                        : "border-slate-200/70 bg-slate-50/80 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-950/35 dark:hover:bg-slate-950/55",
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-lg font-black tracking-tight text-slate-950 dark:text-slate-50">
                            {workspace.name}
                          </p>
                          {isActive && (
                            <span className="rounded-full border border-orange-200 bg-orange-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-200">
                              {copy.sections.list.active}
                            </span>
                          )}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
                            {workspace.is_personal
                              ? copy.sections.list.personal
                              : copy.sections.list.team}
                          </span>
                          <span
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em]",
                              roleBadgeClass[workspace.role],
                            )}
                          >
                            {roleLabel[workspace.role]}
                          </span>
                        </div>

                        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                          {workspace.description || copy.sections.list.noDescription}
                        </p>
                      </div>

                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border",
                          isActive
                            ? "border-orange-200 bg-white text-orange-600 dark:border-orange-500/20 dark:bg-slate-950/70 dark:text-orange-200"
                            : "border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500",
                        )}
                      >
                        <ShieldCheck size={16} />
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {userLimits && createWorkspaceBlocked && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-medium text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              {maxTeamWorkspaces === 0
                ? copy.sections.warnings.noWorkspaceSupport
                : t("workspace.sections.warnings.workspaceLimit", {
                    limit: maxTeamWorkspaces,
                  })}
            </div>
          )}

          <form
            onSubmit={handleCreateWorkspace}
            className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white dark:border-slate-700"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-orange-300">
                  {copy.sections.create.eyebrow}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  {copy.sections.create.description}
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 text-orange-300">
                <PlusCircle size={18} />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder={copy.sections.create.namePlaceholder}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-medium text-white outline-none transition-all placeholder:text-slate-400 focus:border-orange-300 focus:ring-4 focus:ring-orange-500/20"
              />
              <textarea
                value={workspaceDescription}
                onChange={(e) => setWorkspaceDescription(e.target.value)}
                rows={3}
                placeholder={copy.sections.create.descriptionPlaceholder}
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-medium text-white outline-none transition-all placeholder:text-slate-400 focus:border-orange-300 focus:ring-4 focus:ring-orange-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={creatingWorkspace || createWorkspaceBlocked}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3.5 text-xs font-black uppercase tracking-[0.24em] text-white transition-all hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creatingWorkspace ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <PlusCircle size={16} />
              )}
              {copy.sections.create.submit}
            </button>
          </form>
        </section>

        <section className="space-y-6">
          {showIncomingInvitations && (
            <div className={cn(surfaceClass, "p-6")}>
              <WorkspaceSectionTitle
                eyebrow={copy.sections.incomingInvites.eyebrow}
                title={copy.sections.incomingInvites.title}
                icon={Mail}
                tone="blue"
              />

              <div className="mt-5 space-y-3">
                {pendingInvitationsLoading ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm font-bold text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200">
                    <Loader2 size={16} className="animate-spin" />
                    {copy.sections.incomingInvites.loading}
                  </div>
                ) : (
                  pendingInvitations.map((invitation) => {
                    const isBusy = invitationBusyId === invitation.id;

                    return (
                      <div
                        key={invitation.id}
                        className="grid gap-4 rounded-3xl border border-sky-200/70 bg-sky-50/70 p-4 md:grid-cols-[1fr_auto] md:items-center dark:border-sky-500/20 dark:bg-sky-500/10"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-black text-slate-950 dark:text-slate-50">
                              {invitation.workspace_name}
                            </p>
                            <span
                              className={cn(
                                "rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em]",
                                roleBadgeClass[
                                  invitation.role as Exclude<
                                    WorkspaceRole,
                                    "owner"
                                  >
                                ],
                              )}
                            >
                              {roleLabel[invitation.role]}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            {t("workspace.sections.incomingInvites.invitedBy", {
                              name:
                                invitation.invited_by_name ||
                                invitation.invited_by_email ||
                                copy.sections.incomingInvites.ownerFallback,
                            })}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              handleAcceptInvitation(invitation.id)
                            }
                            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-black uppercase tracking-[0.22em] text-white transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isBusy ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Check size={14} />
                            )}
                            {copy.sections.incomingInvites.accept}
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              handleDeclineInvitation(invitation.id)
                            }
                            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.22em] text-slate-600 transition-all hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            <X size={14} />
                            {copy.sections.incomingInvites.decline}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {currentWorkspace && canManageMembers && (
            <div className={cn(surfaceClass, "p-6")}>
              <WorkspaceSectionTitle
                eyebrow={copy.sections.manageInvites.eyebrow}
                title={copy.sections.manageInvites.title}
                icon={UserPlus}
              />

              <form
                onSubmit={handleInviteMember}
                className="mt-5 grid gap-3 lg:grid-cols-[1.1fr_0.7fr_auto]"
              >
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder={copy.sections.manageInvites.emailPlaceholder}
                  className={inputClass}
                />
                <select
                  value={inviteRole}
                  onChange={(e) =>
                    setInviteRole(
                      e.target.value === "viewer" ? "viewer" : "editor",
                    )
                  }
                  className={inputClass}
                >
                  <option value="editor">{copy.sections.roles.editor}</option>
                  <option value="viewer">{copy.sections.roles.viewer}</option>
                </select>
                <button
                  type="submit"
                  disabled={invitingMember || inviteMembersBlocked}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-xs font-black uppercase tracking-[0.22em] text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  {invitingMember ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <UserPlus size={16} />
                  )}
                  {copy.sections.manageInvites.invite}
                </button>
              </form>

              <div className="mt-5 border-t border-slate-200 pt-5 dark:border-slate-700">
                <div className="mb-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                    {copy.sections.manageInvites.sentTitle}
                  </p>
                </div>

                <div className="space-y-3">
                  {sentInvitationsLoading ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
                      <Loader2 size={16} className="animate-spin" />
                      {copy.sections.manageInvites.loading}
                    </div>
                  ) : sentInvitations.length > 0 ? (
                    sentInvitations.map((invitation) => {
                      const isBusy = sentInvitationBusyId === invitation.id;

                      return (
                        <div
                          key={invitation.id}
                          className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-950/35"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-black text-slate-950 dark:text-slate-50">
                              {invitation.invited_email}
                            </p>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                              {t(
                                "workspace.sections.manageInvites.pendingConfirmation",
                                { role: roleLabel[invitation.role] },
                              )}
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              handleCancelInvitation(invitation.id)
                            }
                            className="flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-xs font-black uppercase tracking-[0.22em] text-red-600 transition-all hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/20"
                          >
                            {isBusy ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <X size={14} />
                            )}
                            {copy.sections.manageInvites.cancel}
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
                      {copy.sections.manageInvites.none}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentWorkspace &&
            canManageMembers &&
            userLimits &&
            inviteMembersBlocked && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                {maxMembersPerWorkspace === 0
                  ? copy.sections.warnings.noMemberSupport
                  : t("workspace.sections.warnings.memberLimit", {
                      limit: maxMembersPerWorkspace,
                    })}
              </div>
            )}

          {currentWorkspace && !canManageMembers && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              {t("workspace.sections.warnings.ownerOnly", {
                role: roleLabel[currentWorkspace.role],
              })}
            </div>
          )}

          <div className={cn(surfaceClass, "p-6")}>
            <WorkspaceSectionTitle
              eyebrow={copy.sections.members.eyebrow}
              title={copy.sections.members.title}
              icon={Crown}
              tone="slate"
            />

            <div className="mt-5 space-y-3">
              {membersLoading ? (
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
                  <Loader2 size={16} className="animate-spin" />
                  {copy.sections.members.loading}
                </div>
              ) : members.length > 0 ? (
                members.map((member) => {
                  const isOwner = member.role === "owner";
                  const isBusy = memberBusyId === member.user_id;

                  return (
                    <div
                      key={`${member.workspace_id}-${member.user_id}`}
                      className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-4 md:grid-cols-[1.2fr_0.7fr_auto] md:items-center dark:border-slate-700 dark:bg-slate-950/35"
                    >
                      <div className="flex items-center gap-4">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={
                              member.full_name ||
                              member.email ||
                              copy.sections.members.avatarAlt
                            }
                            className="h-12 w-12 rounded-2xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-500 dark:ring-slate-700">
                            <Users size={18} />
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-black text-slate-950 dark:text-slate-50">
                              {member.full_name ||
                                member.email ||
                                member.user_id}
                            </p>
                            {isOwner && (
                              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                                {copy.sections.members.ownerBadge}
                              </span>
                            )}
                          </div>
                          <p className="mt-2 truncate text-sm text-slate-500 dark:text-slate-400">
                            <Mail
                              size={13}
                              className="mr-1 inline-block align-[-2px]"
                            />
                            {member.email || copy.sections.members.noEmail}
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
                        className={cn(
                          inputClass,
                          "py-3 font-bold disabled:cursor-not-allowed disabled:opacity-60",
                        )}
                      >
                        <option value="owner">{copy.roles.owner}</option>
                        <option value="editor">{copy.roles.editor}</option>
                        <option value="viewer">{copy.roles.viewer}</option>
                      </select>

                      <button
                        type="button"
                        disabled={!canManageMembers || isOwner || isBusy}
                        onClick={() => handleRemoveMember(member.user_id)}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-xs font-black uppercase tracking-[0.22em] text-red-600 transition-all hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/20"
                      >
                        {isBusy ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                        {copy.sections.members.remove}
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
                  {copy.sections.members.none}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
