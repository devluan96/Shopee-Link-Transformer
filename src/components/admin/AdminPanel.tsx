import React from "react";
import {
  Users as UsersIcon,
  Check,
  UserCheck,
  Trash2,
  User,
  Search,
  Filter,
  BarChart3,
  Link2,
  ExternalLink,
  X,
  Eye,
  Shield,
  Ban,
  Unlock,
  Globe,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { AccessLogEntry, BlockedIpEntry, UserProfile } from "@/src/types";
import { useLocale } from "@/src/hooks/useLocale";

interface UserLink {
  id: string;
  short_code: string;
  custom_title?: string;
  original_url: string;
  clicks?: number;
  created_at: string;
}

interface AdminPanelProps {
  allUsers: UserProfile[];
  adminLoading: boolean;
  adminAccessLogs: AccessLogEntry[];
  blockedIps: BlockedIpEntry[];
  adminSecurityLoading: boolean;
  outputDomains: string[];
  outputDomainsLoading: boolean;
  onBlockIp: (payload: {
    ipAddress: string;
    reason?: string;
    expiresAt?: string;
  }) => Promise<BlockedIpEntry>;
  onUnblockIp: (blockedIpId: string) => Promise<void>;
  onUpdateOutputDomains: (domains: string[]) => Promise<void>;
  onlineUserIds: string[];
  handleApproveUser: (userId: string) => void;
  handleUpdateSubscription: (
    userId: string,
    plan: "free" | "monthly" | "yearly",
  ) => void;
  handleDeleteUser: (userId: string) => void;
  fetchWithAuth?: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>;
}

export const AdminPanel = ({
  allUsers,
  adminLoading,
  adminAccessLogs,
  blockedIps,
  adminSecurityLoading,
  outputDomains,
  outputDomainsLoading,
  onBlockIp,
  onUnblockIp,
  onUpdateOutputDomains,
  onlineUserIds,
  handleApproveUser,
  handleUpdateSubscription,
  handleDeleteUser,
  fetchWithAuth,
}: AdminPanelProps) => {
  const { locale, messages, t } = useLocale();
  const dateLocale = locale === "vi" ? "vi-VN" : "en-US";
  const content = messages.admin;

  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [planFilter, setPlanFilter] = React.useState<
    "all" | "free" | "monthly" | "yearly"
  >("all");
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "approved" | "pending"
  >("all");
  const [selectedUser, setSelectedUser] = React.useState<UserProfile | null>(
    null,
  );
  const [userLinks, setUserLinks] = React.useState<UserLink[]>([]);
  const [userLinksLoading, setUserLinksLoading] = React.useState(false);
  const [blockedIpAddress, setBlockedIpAddress] = React.useState("");
  const [blockedIpReason, setBlockedIpReason] = React.useState("");
  const [blockingIp, setBlockingIp] = React.useState(false);
  const [domainDraft, setDomainDraft] = React.useState("");
  const [domainList, setDomainList] = React.useState<string[]>(outputDomains);
  const [savingDomains, setSavingDomains] = React.useState(false);

  React.useEffect(() => {
    setDomainList(outputDomains);
  }, [outputDomains]);

  React.useEffect(() => {
    if (!selectedUser || !fetchWithAuth) return;

    setUserLinksLoading(true);
    fetchWithAuth(`/api/v1/admin/users/${selectedUser.id}/links`)
      .then((res) => res.json())
      .then((data) => setUserLinks(data || []))
      .catch(() => setUserLinks([]))
      .finally(() => setUserLinksLoading(false));
  }, [selectedUser, fetchWithAuth]);

  const filteredUsers = React.useMemo(
    () =>
      allUsers.filter((user) => {
        const matchesSearch =
          user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          false;
        const matchesPlan =
          planFilter === "all" || user.subscription_plan === planFilter;
        const matchesStatus =
          statusFilter === "all" || user.status === statusFilter;
        return matchesSearch && matchesPlan && matchesStatus;
      }),
    [allUsers, searchTerm, planFilter, statusFilter],
  );

  const stats = React.useMemo(() => {
    const totalUsers = allUsers.length;
    const premiumUsers = allUsers.filter(
      (u) => u.subscription_plan && u.subscription_plan !== "free",
    ).length;
    const pendingUsers = allUsers.filter((u) => u.status !== "approved").length;
    const revenue = allUsers.reduce((sum, u) => {
      if (u.subscription_plan === "monthly") return sum + 299000;
      if (u.subscription_plan === "yearly") return sum + 2490000;
      return sum;
    }, 0);
    return { totalUsers, premiumUsers, pendingUsers, revenue };
  }, [allUsers]);

  const confirmDelete = () => {
    if (!deleteId) return;
    handleDeleteUser(deleteId);
    setDeleteId(null);
  };

  const handleBlockIpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockedIpAddress.trim()) return;

    setBlockingIp(true);
    try {
      await onBlockIp({
        ipAddress: blockedIpAddress.trim(),
        reason: blockedIpReason.trim() || undefined,
      });
      setBlockedIpAddress("");
      setBlockedIpReason("");
    } finally {
      setBlockingIp(false);
    }
  };

  const handleAddDomain = () => {
    const normalized = domainDraft
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/+$/, "");

    if (!normalized || domainList.includes(normalized)) return;
    setDomainList((current) => [...current, normalized]);
    setDomainDraft("");
  };

  const handleSaveDomains = async () => {
    setSavingDomains(true);
    try {
      await onUpdateOutputDomains(domainList);
    } finally {
      setSavingDomains(false);
    }
  };

  const getStatusLabel = (status?: string) =>
    status === "approved" ? content.statuses.approved : content.statuses.pending;

  const getPlanLabel = (plan?: string | null) => {
    if (plan === "monthly") return content.plans.monthly;
    if (plan === "yearly") return content.plans.yearly;
    return content.plans.free;
  };

  const planOptions = [
    { value: "all", label: content.filters.allPlans },
    { value: "free", label: content.plans.free },
    { value: "monthly", label: content.plans.monthly },
    { value: "yearly", label: content.plans.yearly },
  ] as const;

  const statusOptions = [
    { value: "all", label: content.filters.allStatuses },
    { value: "approved", label: content.statuses.approved },
    { value: "pending", label: content.statuses.pending },
  ] as const;

  return (
    <div key="admin">
      {deleteId && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div
            onClick={() => setDeleteId(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-sm rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-2 text-xl font-black text-gray-900 dark:text-slate-100">
              {content.deleteModal.title}
            </h3>
            <p className="mb-8 text-sm font-medium leading-relaxed text-gray-500 dark:text-slate-400">
              {content.deleteModal.description}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 rounded-2xl bg-gray-100 py-4 text-xs font-black uppercase tracking-widest text-gray-500 transition-all hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              >
                {content.deleteModal.cancel}
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 rounded-2xl bg-red-600 py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-red-700"
              >
                {content.deleteModal.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <UsersIcon size={20} className="text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-slate-400">
              {content.stats.totalUsers}
            </span>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-slate-100">
            {stats.totalUsers}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
              <Check size={20} className="text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-slate-400">
              {content.stats.premiumUsers}
            </span>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-slate-100">
            {stats.premiumUsers}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
              <UserCheck size={20} className="text-orange-600" />
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-slate-400">
              {content.stats.pendingUsers}
            </span>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-slate-100">
            {stats.pendingUsers}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
              <BarChart3 size={20} className="text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-slate-400">
              {content.stats.revenue}
            </span>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-slate-100">
            {stats.revenue.toLocaleString()}đ
          </div>
        </div>
      </div>

      <header className="mb-8">
        <h2 className="mb-2 text-3xl font-black text-gray-900 dark:text-slate-100">
          {content.header.title}
        </h2>
        <p className="font-medium text-gray-500 dark:text-slate-400">
          {content.header.description}
        </p>
      </header>

      <div className="mb-8 grid grid-cols-1 gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800 xl:col-span-2">
          <div className="mb-6 flex items-center gap-3">
            <Globe className="text-sky-500" size={20} />
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">
                {content.domains.title}
              </h3>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
                {content.domains.description}
              </p>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-3">
            {domainList.map((domain) => (
              <div
                key={domain}
                className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-sky-700"
              >
                <span>{domain}</span>
                {domain !== "hotsnew.click" && (
                  <button
                    type="button"
                    onClick={() =>
                      setDomainList((current) =>
                        current.filter((item) => item !== domain),
                      )
                    }
                    className="rounded-full p-1 text-sky-600 hover:bg-sky-100"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <input
              type="text"
              value={domainDraft}
              onChange={(e) => setDomainDraft(e.target.value)}
              placeholder="go.hotsnew.click"
              className="flex-1 rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 font-medium text-gray-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={handleAddDomain}
              className="rounded-2xl bg-sky-600 px-6 py-4 text-xs font-black uppercase tracking-widest text-white"
            >
              {content.domains.add}
            </button>
            <button
              type="button"
              onClick={handleSaveDomains}
              disabled={savingDomains || outputDomainsLoading}
              className="rounded-2xl bg-gray-900 px-6 py-4 text-xs font-black uppercase tracking-widest text-white disabled:opacity-60"
            >
              {savingDomains ? content.domains.saving : content.domains.save}
            </button>
          </div>
        </section>

        <section className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-6 flex items-center gap-3">
            <Shield size={20} className="text-orange-500" />
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">
                {content.accessLogs.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {content.accessLogs.description}
              </p>
            </div>
          </div>
          <div className="max-h-105 space-y-3 overflow-auto">
            {adminSecurityLoading ? (
              <div className="rounded-2xl bg-gray-50 px-4 py-10 text-center text-sm font-medium text-gray-400 dark:bg-slate-900 dark:text-slate-500">
                {content.accessLogs.loading}
              </div>
            ) : adminAccessLogs.length === 0 ? (
              <div className="rounded-2xl bg-gray-50 px-4 py-10 text-center text-sm font-medium text-gray-400 dark:bg-slate-900 dark:text-slate-500">
                {content.accessLogs.empty}
              </div>
            ) : (
              adminAccessLogs.slice(0, 25).map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl bg-gray-50 px-4 py-4 dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-gray-900 dark:text-slate-100">
                      {log.method} {log.path}
                    </p>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
                        log.blocked || log.status_code >= 400
                          ? "bg-red-100 text-red-600"
                          : "bg-green-100 text-green-600",
                      )}
                    >
                      {log.blocked ? content.accessLogs.blocked : log.status_code}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                    {log.email || log.user_id || content.accessLogs.guest} ·{" "}
                    {log.ip_address || content.accessLogs.unknownIp} ·{" "}
                    {new Date(log.created_at).toLocaleString(dateLocale)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-6 flex items-center gap-3">
            <Ban size={20} className="text-red-500" />
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">
                {content.ipBlock.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {content.ipBlock.description}
              </p>
            </div>
          </div>

          <form
            onSubmit={handleBlockIpSubmit}
            className="space-y-3 rounded-3xl bg-gray-50 p-4 dark:bg-slate-900"
          >
            <input
              type="text"
              value={blockedIpAddress}
              onChange={(e) => setBlockedIpAddress(e.target.value)}
              placeholder={content.ipBlock.ipPlaceholder}
              className="w-full rounded-2xl border border-transparent bg-white px-4 py-3 font-medium text-gray-900 outline-none transition-all focus:ring-4 focus:ring-red-500/10 dark:bg-slate-800 dark:text-slate-100"
            />
            <input
              type="text"
              value={blockedIpReason}
              onChange={(e) => setBlockedIpReason(e.target.value)}
              placeholder={content.ipBlock.reasonPlaceholder}
              className="w-full rounded-2xl border border-transparent bg-white px-4 py-3 font-medium text-gray-900 outline-none transition-all focus:ring-4 focus:ring-red-500/10 dark:bg-slate-800 dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={blockingIp}
              className="w-full rounded-2xl bg-red-600 px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-red-700 disabled:opacity-60"
            >
              {blockingIp ? content.ipBlock.submitting : content.ipBlock.submit}
            </button>
          </form>

          <div className="mt-5 max-h-60 space-y-3 overflow-auto">
            {blockedIps.length === 0 ? (
              <div className="rounded-2xl bg-gray-50 px-4 py-8 text-center text-sm font-medium text-gray-400 dark:bg-slate-900 dark:text-slate-500">
                {content.ipBlock.empty}
              </div>
            ) : (
              blockedIps.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl bg-gray-50 px-4 py-4 dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-black text-gray-900 dark:text-slate-100">
                        {item.ip_address}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                        {item.reason || content.ipBlock.noReason} ·{" "}
                        {item.active
                          ? content.ipBlock.active
                          : content.ipBlock.inactive}
                      </p>
                    </div>
                    {item.active && (
                      <button
                        type="button"
                        onClick={() => onUnblockIp(item.id)}
                        className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[11px] font-black uppercase tracking-widest text-gray-700 transition-all hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        <Unlock size={14} />
                        {content.ipBlock.unblock}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-wrap gap-4">
          <div className="relative min-w-50 flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder={content.filters.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm focus:border-gray-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-orange-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={planFilter}
              onChange={(e) =>
                setPlanFilter(
                  e.target.value as "all" | "free" | "monthly" | "yearly",
                )
              }
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-gray-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-orange-500"
            >
              {planOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as "all" | "approved" | "pending",
                )
              }
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-gray-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-orange-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 text-sm text-gray-500 dark:text-slate-400">
          {t("admin.filters.showing", {
            shown: filteredUsers.length,
            total: allUsers.length,
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-[3rem] border border-gray-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-3 border-b border-gray-100 bg-gray-50/50 p-6 dark:border-slate-700 dark:bg-slate-900/70 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
            <UsersIcon size={18} /> {content.table.title}
          </h3>
          <span className="w-fit rounded-full bg-gray-900 px-3 py-1 text-[10px] font-bold text-white">
            {t("admin.table.count", { count: filteredUsers.length })}
          </span>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-slate-700">
          {adminLoading ? (
            <div className="p-20 text-center font-bold text-gray-300">
              {content.table.loading}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-20 text-center font-medium italic text-gray-400">
              {content.table.empty}
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex cursor-pointer flex-col gap-4 p-4 transition-all hover:bg-gray-50 dark:hover:bg-slate-900/70 sm:gap-6 sm:p-6 xl:flex-row xl:items-center xl:justify-between"
                onClick={() => setSelectedUser(user)}
              >
                <div className="flex w-full flex-1 items-start gap-4 sm:items-center">
                  <div className="relative h-12 w-12">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        className="h-12 w-12 rounded-full bg-gray-100 object-cover shadow-md ring-2 ring-white"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.parentElement
                            ?.querySelector(".avatar-placeholder")
                            ?.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <div
                      className={cn(
                        "avatar-placeholder flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 shadow-md ring-2 ring-white",
                        user.avatar_url ? "hidden" : "",
                      )}
                    >
                      <User size={24} />
                    </div>
                    <span
                      className={cn(
                        "absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm",
                        onlineUserIds.includes(user.id)
                          ? "bg-green-500"
                          : "bg-gray-300",
                      )}
                    />
                  </div>

                  <div className="flex-1">
                    <h4 className="font-black text-gray-900 dark:text-slate-100">
                      {user.full_name || content.table.unnamed}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {user.email}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest",
                          user.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700",
                        )}
                      >
                        {getStatusLabel(user.status)}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest",
                          user.subscription_plan === "monthly"
                            ? "bg-blue-100 text-blue-700"
                            : user.subscription_plan === "yearly"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-gray-100 text-gray-700",
                        )}
                      >
                        {getPlanLabel(user.subscription_plan)}
                      </span>
                      {onlineUserIds.includes(user.id) && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-green-700">
                          {content.table.online}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedUser(user);
                    }}
                    className="rounded-xl bg-gray-100 p-2 transition-all hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600"
                    title={content.table.viewDetails}
                  >
                    <Eye size={18} className="text-gray-600" />
                  </button>
                </div>

                <div
                  className="flex w-full flex-wrap items-center gap-2 sm:gap-3 xl:w-auto xl:justify-end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <select
                    className="min-w-0 flex-1 cursor-pointer rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:flex-none"
                    value={user.subscription_plan || "free"}
                    onChange={(e) =>
                      handleUpdateSubscription(
                        user.id,
                        e.target.value as "free" | "monthly" | "yearly",
                      )
                    }
                  >
                    <option value="free">{content.plans.free}</option>
                    <option value="monthly">{content.plans.monthly}</option>
                    <option value="yearly">{content.plans.yearly}</option>
                  </select>

                  {user.status !== "approved" && (
                    <button
                      onClick={() => handleApproveUser(user.id)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-orange-600 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:bg-orange-700 active:scale-95 sm:flex-none sm:px-6"
                    >
                      <UserCheck size={16} /> {content.actions.approveNow}
                    </button>
                  )}

                  <button
                    onClick={() => setDeleteId(user.id)}
                    className="rounded-xl bg-gray-100 p-3 text-gray-400 transition-all hover:bg-red-50 hover:text-red-500 active:scale-90 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-red-500/10"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div
            onClick={() => setSelectedUser(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-auto rounded-4xl border border-gray-100 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">
                {content.detail.title}
              </h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="rounded-xl p-2 transition-all hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6 flex items-center gap-4">
                <div className="relative h-16 w-16">
                  {selectedUser.avatar_url ? (
                    <img
                      src={selectedUser.avatar_url}
                      className="h-16 w-16 rounded-2xl bg-gray-100 object-cover shadow-md ring-2 ring-white"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 shadow-md ring-2 ring-white">
                      <User size={32} />
                    </div>
                  )}
                  {onlineUserIds.includes(selectedUser.id) && (
                    <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white bg-green-500" />
                  )}
                </div>
                <div>
                  <h4 className="text-xl font-black text-gray-900 dark:text-slate-100">
                    {selectedUser.full_name || content.table.unnamed}
                  </h4>
                  <p className="text-gray-500 dark:text-slate-400">
                    {selectedUser.email}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest",
                        selectedUser.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700",
                      )}
                    >
                      {getStatusLabel(selectedUser.status)}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest",
                        selectedUser.subscription_plan === "monthly"
                          ? "bg-blue-100 text-blue-700"
                          : selectedUser.subscription_plan === "yearly"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-700",
                      )}
                    >
                      {getPlanLabel(selectedUser.subscription_plan)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6 flex flex-wrap gap-3">
                {selectedUser.status !== "approved" && (
                  <button
                    onClick={() => {
                      handleApproveUser(selectedUser.id);
                      setSelectedUser({ ...selectedUser, status: "approved" });
                    }}
                    className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-green-700"
                  >
                    <Check size={18} /> {content.actions.approveUser}
                  </button>
                )}

                <select
                  value={selectedUser.subscription_plan || "free"}
                  onChange={(e) => {
                    const newPlan = e.target.value as
                      | "free"
                      | "monthly"
                      | "yearly";
                    handleUpdateSubscription(selectedUser.id, newPlan);
                    setSelectedUser({
                      ...selectedUser,
                      subscription_plan: newPlan,
                    });
                  }}
                  className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold focus:border-gray-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="free">{content.plans.free}</option>
                  <option value="monthly">{content.plans.monthly}</option>
                  <option value="yearly">{content.plans.yearly}</option>
                </select>

                <button
                  onClick={() => {
                    setDeleteId(selectedUser.id);
                    setSelectedUser(null);
                  }}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-red-700"
                >
                  <Trash2 size={18} /> {content.actions.deleteUser}
                </button>
              </div>

              <div className="border-t border-gray-100 pt-6 dark:border-slate-700">
                <h4 className="mb-4 flex items-center gap-2 text-lg font-black text-gray-900 dark:text-slate-100">
                  <Link2 size={20} />{" "}
                  {t("admin.detail.linksTitle", { count: userLinks.length })}
                </h4>
                {userLinksLoading ? (
                  <div className="py-8 text-center text-gray-400">
                    {content.detail.linksLoading}
                  </div>
                ) : userLinks.length === 0 ? (
                  <div className="py-8 text-center text-gray-400">
                    {content.detail.linksEmpty}
                  </div>
                ) : (
                  <div className="max-h-75 space-y-3 overflow-auto">
                    {userLinks.map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center justify-between rounded-xl bg-gray-50 p-4 dark:bg-slate-900"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold text-gray-900 dark:text-slate-100">
                            {link.custom_title || link.short_code}
                          </p>
                          <p className="truncate text-xs text-gray-500 dark:text-slate-400">
                            {link.original_url}
                          </p>
                          <div className="mt-1 flex items-center gap-4">
                            <span className="text-xs font-black text-orange-600">
                              {t("admin.detail.clicks", {
                                count: link.clicks || 0,
                              })}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(link.created_at).toLocaleDateString(
                                dateLocale,
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={`/s/${link.short_code}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg border border-gray-200 bg-white p-2 transition-all hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                          >
                            <ExternalLink size={16} className="text-gray-600" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
