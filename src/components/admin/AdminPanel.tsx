import React from "react";
import {
  Ban,
  BarChart3,
  Check,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Eye,
  Filter,
  Globe,
  Link2,
  Search,
  Shield,
  Trash2,
  Unlock,
  User,
  UserCheck,
  Users as UsersIcon,
  X,
  XCircle,
} from "lucide-react";
import { buildPrettyLinkPath } from "@/src/lib/linkPaths";
import { cn } from "@/src/lib/utils";
import { toast } from "sonner";
import {
  AccessLogEntry,
  BlockedIpEntry,
  ManualPaymentRequest,
  UserProfile,
} from "@/src/types";
import { useLocale } from "@/src/hooks/useLocale";
import { DEFAULT_OUTPUT_DOMAIN } from "@/src/lib/appConfig";

interface UserLink {
  id: string;
  short_code: string;
  slug?: string;
  custom_title?: string;
  original_url: string;
  clicks?: number;
  created_at: string;
}

type AdminRole = "user" | "admin";
type ConfirmTone = "danger" | "warning";

interface ConfirmAction {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: ConfirmTone;
  onConfirm: () => Promise<void> | void;
}

interface AdminPanelProps {
  allUsers: UserProfile[];
  adminLoading: boolean;
  paymentRequests: ManualPaymentRequest[];
  paymentRequestsLoading: boolean;
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
  onRefreshUsers: () => Promise<void>;
  onRefreshPayments: () => Promise<void>;
  onRefreshSecurity: () => Promise<void>;
  onUpdateUserRole: (userId: string, role: AdminRole) => Promise<void>;
  handleApproveUser: (userId: string) => Promise<void>;
  handleUpdateSubscription: (
    userId: string,
    plan: "free" | "monthly" | "yearly",
  ) => Promise<void>;
  handleDeleteUser: (userId: string) => Promise<void>;
  onConfirmPaymentRequest: (paymentRequestId: string) => Promise<void>;
  onRejectPaymentRequest: (paymentRequestId: string) => Promise<void>;
  fetchWithAuth?: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>;
}

export const AdminPanel = ({
  allUsers,
  adminLoading,
  paymentRequests,
  paymentRequestsLoading,
  adminAccessLogs,
  blockedIps,
  adminSecurityLoading,
  outputDomains,
  outputDomainsLoading,
  onBlockIp,
  onUnblockIp,
  onUpdateOutputDomains,
  onlineUserIds,
  onRefreshUsers,
  onRefreshPayments,
  onRefreshSecurity,
  onUpdateUserRole,
  handleApproveUser,
  handleUpdateSubscription,
  handleDeleteUser,
  onConfirmPaymentRequest,
  onRejectPaymentRequest,
  fetchWithAuth,
}: AdminPanelProps) => {
  const { locale, messages, t } = useLocale();
  const dateLocale = locale === "vi" ? "vi-VN" : "en-US";
  const content = messages.admin;

  const viewCopy =
    locale === "vi"
      ? {
          centerTitle: "Trung tâm quản trị",
          centerDescription:
            "Theo dõi người dùng, thanh toán, cấu hình hệ thống và các tác vụ vận hành.",
          usersTab: "Quản lý user",
          paymentsTab: "Quản lý thanh toán",
          systemTab: "Quản trị hệ thống",
          searchPlaceholder: "Tìm theo tên hoặc email...",
          paymentSearchPlaceholder: "Tìm theo mã thanh toán...",
          paymentPending: "Chờ xác nhận",
          paymentConfirmed: "Đã xác nhận",
          paymentRejected: "Từ chối",
          pendingAmount: "Tiền chờ duyệt",
          confirmedAmount: "Tiền đã duyệt",
          paymentCode: "Mã thanh toán",
          submittedAt: "Thời gian gửi",
          transferContent: "Nội dung chuyển khoản",
          paymentRequests: "yêu cầu",
          noPayments: "Chưa có yêu cầu thanh toán nào.",
          loadingPayments: "Đang tải thanh toán...",
          confirmPayment: "Xác nhận đã thanh toán",
          rejectPayment: "Từ chối",
          reviewedAt: "Duyệt lúc",
          email: "Email",
          amount: "Số tiền",
          paymentsDescription:
            "Theo dõi yêu cầu thanh toán và xác nhận kích hoạt gói cho từng tài khoản.",
        }
      : {
          centerTitle: "Admin center",
          centerDescription:
            "Manage users, payments, system settings, and operational controls.",
          usersTab: "User management",
          paymentsTab: "Payment management",
          systemTab: "System management",
          searchPlaceholder: "Search by name or email...",
          paymentSearchPlaceholder: "Search by payment code...",
          paymentPending: "Pending",
          paymentConfirmed: "Confirmed",
          paymentRejected: "Rejected",
          pendingAmount: "Pending amount",
          confirmedAmount: "Confirmed amount",
          paymentCode: "Payment code",
          submittedAt: "Submitted at",
          transferContent: "Transfer content",
          paymentRequests: "requests",
          noPayments: "No payment requests yet.",
          loadingPayments: "Loading payments...",
          confirmPayment: "Confirm payment",
          rejectPayment: "Reject",
          reviewedAt: "Reviewed at",
          email: "Email",
          amount: "Amount",
          paymentsDescription:
            "Review transfer confirmations and activate plans per account.",
        };

  const [confirmAction, setConfirmAction] =
    React.useState<ConfirmAction | null>(null);
  const [confirmActionBusy, setConfirmActionBusy] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [paymentSearchTerm, setPaymentSearchTerm] = React.useState("");
  const [accessSearchTerm, setAccessSearchTerm] = React.useState("");
  const [blockedSearchTerm, setBlockedSearchTerm] = React.useState("");
  const [planFilter, setPlanFilter] = React.useState<
    "all" | "free" | "monthly" | "yearly"
  >("all");
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "approved" | "pending"
  >("all");
  const [accessFilter, setAccessFilter] = React.useState<
    "all" | "http" | "admin" | "blocked"
  >("all");
  const [userPage, setUserPage] = React.useState(1);
  const [paymentPage, setPaymentPage] = React.useState(1);
  const [accessPage, setAccessPage] = React.useState(1);
  const [blockedPage, setBlockedPage] = React.useState(1);
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
  const [selectedUserRoleDraft, setSelectedUserRoleDraft] =
    React.useState<AdminRole>("user");
  const [selectedUserPlanDraft, setSelectedUserPlanDraft] = React.useState<
    "free" | "monthly" | "yearly"
  >("free");
  const [adminView, setAdminView] = React.useState<
    "users" | "payments" | "system"
  >("users");

  React.useEffect(() => {
    setDomainList(outputDomains);
  }, [outputDomains]);

  React.useEffect(() => {
    if (!selectedUser) return;
    setSelectedUserRoleDraft(
      selectedUser.role === "admin" ? "admin" : "user",
    );
    setSelectedUserPlanDraft(selectedUser.subscription_plan || "free");
    setUserPage(1);
  }, [selectedUser?.id]);

  React.useEffect(() => {
    if (!selectedUser || !fetchWithAuth) return;

    setUserLinksLoading(true);
    setUserLinks([]);
    fetchWithAuth(`/api/v1/admin/users/${selectedUser.id}/links`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.error || "Failed to load user links");
        }
        setUserLinks(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error(error);
        setUserLinks([]);
        toast.error(
          error instanceof Error ? error.message : "Failed to load user links",
        );
      })
      .finally(() => setUserLinksLoading(false));
  }, [selectedUser, fetchWithAuth]);

  React.useEffect(() => {
    setUserPage(1);
  }, [searchTerm, planFilter, statusFilter, allUsers.length]);

  React.useEffect(() => {
    setPaymentPage(1);
  }, [paymentSearchTerm, paymentRequests.length]);

  React.useEffect(() => {
    setAccessPage(1);
  }, [accessSearchTerm, accessFilter, adminAccessLogs.length]);

  React.useEffect(() => {
    setBlockedPage(1);
  }, [blockedSearchTerm, blockedIps.length]);

  const filteredUsers = React.useMemo(
    () =>
      allUsers.filter((user) => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        const matchesSearch =
          !normalizedSearch ||
          user.full_name?.toLowerCase().includes(normalizedSearch) ||
          user.email?.toLowerCase().includes(normalizedSearch) ||
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
      if (u.subscription_plan === "monthly") return sum + 149000;
      if (u.subscription_plan === "yearly") return sum + 1609200;
      return sum;
    }, 0);

    return { totalUsers, premiumUsers, pendingUsers, revenue };
  }, [allUsers]);

  const paymentStats = React.useMemo(() => {
    const pendingCount = paymentRequests.filter(
      (item) => item.status === "pending",
    ).length;
    const confirmedCount = paymentRequests.filter(
      (item) => item.status === "confirmed",
    ).length;
    const pendingAmount = paymentRequests
      .filter((item) => item.status === "pending")
      .reduce((sum, item) => sum + item.amount, 0);
    const confirmedAmount = paymentRequests
      .filter((item) => item.status === "confirmed")
      .reduce((sum, item) => sum + item.amount, 0);

    return {
      pendingCount,
      confirmedCount,
      pendingAmount,
      confirmedAmount,
    };
  }, [paymentRequests]);

  const filteredPaymentRequests = React.useMemo(() => {
    const normalizedSearch = paymentSearchTerm.trim().toLowerCase();
    if (!normalizedSearch) return paymentRequests;

    return paymentRequests.filter((request) =>
      request.account_code.toLowerCase().includes(normalizedSearch),
    );
  }, [paymentRequests, paymentSearchTerm]);

  const filteredAccessLogs = React.useMemo(() => {
    const normalizedSearch = accessSearchTerm.trim().toLowerCase();

    return adminAccessLogs.filter((log) => {
      const isAdminAction = log.method === "ADMIN" || log.path.startsWith("admin:");
      const matchesFilter =
        accessFilter === "all" ||
        (accessFilter === "http" && !isAdminAction) ||
        (accessFilter === "admin" && isAdminAction) ||
        (accessFilter === "blocked" && log.blocked);
      const haystack = [
        log.method,
        log.path,
        log.email,
        log.user_id,
        log.ip_address,
        JSON.stringify(log.metadata || {}),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesFilter && (!normalizedSearch || haystack.includes(normalizedSearch));
    });
  }, [adminAccessLogs, accessFilter, accessSearchTerm]);

  const filteredBlockedIps = React.useMemo(() => {
    const normalizedSearch = blockedSearchTerm.trim().toLowerCase();
    if (!normalizedSearch) return blockedIps;

    return blockedIps.filter((item) =>
      [item.ip_address, item.reason, item.blocked_by]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [blockedIps, blockedSearchTerm]);

  const pageSize = 10;
  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const totalPaymentPages = Math.max(
    1,
    Math.ceil(filteredPaymentRequests.length / pageSize),
  );
  const totalAccessPages = Math.max(
    1,
    Math.ceil(filteredAccessLogs.length / pageSize),
  );
  const totalBlockedPages = Math.max(
    1,
    Math.ceil(filteredBlockedIps.length / pageSize),
  );

  const pagedUsers = filteredUsers.slice(
    (userPage - 1) * pageSize,
    userPage * pageSize,
  );
  const pagedPayments = filteredPaymentRequests.slice(
    (paymentPage - 1) * pageSize,
    paymentPage * pageSize,
  );
  const pagedAccessLogs = filteredAccessLogs.slice(
    (accessPage - 1) * pageSize,
    accessPage * pageSize,
  );
  const pagedBlockedIps = filteredBlockedIps.slice(
    (blockedPage - 1) * pageSize,
    blockedPage * pageSize,
  );

  const isAdminLog = (log: AccessLogEntry) =>
    log.method === "ADMIN" || log.path.startsWith("admin:");

  const downloadCsv = (filename: string, headers: string[], rows: string[][]) => {
    const escapeValue = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((row) => row.map(escapeValue).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const runConfirmAction = async () => {
    if (!confirmAction) return;
    setConfirmActionBusy(true);
    try {
      await confirmAction.onConfirm();
      setConfirmAction(null);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setConfirmActionBusy(false);
    }
  };

  const exportUsersCsv = () => {
    downloadCsv(
      "admin-users.csv",
      ["id", "name", "email", "status", "plan", "role", "created_at"],
      filteredUsers.map((user) => [
        user.id,
        user.full_name || "",
        user.email || "",
        user.status || "",
        user.subscription_plan || "free",
        user.role || "user",
        user.created_at || "",
      ]),
    );
  };

  const exportPaymentsCsv = () => {
    downloadCsv(
      "admin-payment-requests.csv",
      [
        "id",
        "user",
        "email",
        "account_code",
        "plan",
        "amount",
        "status",
        "submitted_at",
      ],
      filteredPaymentRequests.map((request) => [
        request.id,
        request.user_full_name || request.user_id,
        request.user_email || "",
        request.account_code,
        request.plan,
        String(request.amount),
        request.status,
        request.user_confirmed_at || request.created_at,
      ]),
    );
  };

  const exportAccessLogsCsv = () => {
    downloadCsv(
      "admin-access-logs.csv",
      ["id", "method", "path", "email", "ip_address", "status_code", "created_at"],
      filteredAccessLogs.map((log) => [
        log.id,
        log.method,
        log.path,
        log.email || log.user_id || "",
        log.ip_address || "",
        String(log.status_code),
        log.created_at,
      ]),
    );
  };

  const exportBlockedIpsCsv = () => {
    downloadCsv(
      "admin-blocked-ips.csv",
      ["id", "ip_address", "reason", "active", "blocked_by", "expires_at", "created_at"],
      filteredBlockedIps.map((item) => [
        item.id,
        item.ip_address,
        item.reason || "",
        String(item.active),
        item.blocked_by || "",
        item.expires_at || "",
        item.created_at,
      ]),
    );
  };

  const handleBlockIpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockedIpAddress.trim()) return;
    const payload = {
      ipAddress: blockedIpAddress.trim(),
      reason: blockedIpReason.trim() || undefined,
    };
    setConfirmAction({
      title: "Block IP?",
      description: `Block ${payload.ipAddress}${payload.reason ? ` (${payload.reason})` : ""}?`,
      confirmLabel: "Block",
      tone: "danger",
      onConfirm: async () => {
        setBlockingIp(true);
        try {
          await onBlockIp(payload);
          setBlockedIpAddress("");
          setBlockedIpReason("");
        } finally {
          setBlockingIp(false);
        }
      },
    });
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
    setConfirmAction({
      title: "Save domains?",
      description: `Update the output domain list to ${domainList.join(", ")}?`,
      confirmLabel: "Save",
      tone: "warning",
      onConfirm: async () => {
        setSavingDomains(true);
        try {
          await onUpdateOutputDomains(domainList);
        } finally {
          setSavingDomains(false);
        }
      },
    });
  };

  const getStatusLabel = (status?: string) =>
    status === "approved" ? content.statuses.approved : content.statuses.pending;

  const getPlanLabel = (plan?: string | null) => {
    if (plan === "monthly") return content.plans.monthly;
    if (plan === "yearly") return content.plans.yearly;
    return content.plans.free;
  };

  const getPaymentStatusLabel = (status: ManualPaymentRequest["status"]) => {
    if (status === "confirmed") return viewCopy.paymentConfirmed;
    if (status === "rejected") return viewCopy.paymentRejected;
    return viewCopy.paymentPending;
  };

  const getPaymentStatusClass = (status: ManualPaymentRequest["status"]) => {
    if (status === "confirmed") return "bg-green-100 text-green-700";
    if (status === "rejected") return "bg-red-100 text-red-700";
    return "bg-amber-100 text-amber-700";
  };

  const formatMoney = (amount: number) =>
    `${amount.toLocaleString(dateLocale)}đ`;

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

  const renderStatCard = (
    icon: React.ReactNode,
    label: string,
    value: string | number,
  ) => (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-2 flex items-center gap-3">
        {icon}
        <span className="text-sm font-medium text-gray-500 dark:text-slate-400">
          {label}
        </span>
      </div>
      <div className="text-2xl font-black text-gray-900 dark:text-slate-100">
        {value}
      </div>
    </div>
  );

  return (
    <div key="admin">
      {confirmAction && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div
            onClick={() => !confirmActionBusy && setConfirmAction(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-sm rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-2 text-xl font-black text-gray-900 dark:text-slate-100">
              {confirmAction.title}
            </h3>
            <p className="mb-8 text-sm font-medium leading-relaxed text-gray-500 dark:text-slate-400">
              {confirmAction.description}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 rounded-2xl bg-gray-100 py-4 text-xs font-black uppercase tracking-widest text-gray-500 transition-all hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={runConfirmAction}
                disabled={confirmActionBusy}
                className="flex-1 rounded-2xl bg-red-600 py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-red-700"
              >
                {confirmActionBusy ? "Working..." : confirmAction.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className={cn(
          "mb-8 grid grid-cols-1 gap-6 md:grid-cols-4",
          adminView !== "users" && "hidden",
        )}
      >
        {renderStatCard(
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
            <UsersIcon size={20} className="text-blue-600" />
          </div>,
          content.stats.totalUsers,
          stats.totalUsers,
        )}
        {renderStatCard(
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
            <Check size={20} className="text-green-600" />
          </div>,
          content.stats.premiumUsers,
          stats.premiumUsers,
        )}
        {renderStatCard(
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
            <UserCheck size={20} className="text-orange-600" />
          </div>,
          content.stats.pendingUsers,
          stats.pendingUsers,
        )}
        {renderStatCard(
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
            <BarChart3 size={20} className="text-purple-600" />
          </div>,
          content.stats.revenue,
          formatMoney(stats.revenue),
        )}
      </div>

      <div
        className={cn(
          "mb-8 grid grid-cols-1 gap-6 md:grid-cols-4",
          adminView !== "payments" && "hidden",
        )}
      >
        {renderStatCard(
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
            <CreditCard size={20} className="text-amber-600" />
          </div>,
          viewCopy.paymentPending,
          paymentStats.pendingCount,
        )}
        {renderStatCard(
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
            <CheckCircle2 size={20} className="text-green-600" />
          </div>,
          viewCopy.paymentConfirmed,
          paymentStats.confirmedCount,
        )}
        {renderStatCard(
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
            <BarChart3 size={20} className="text-orange-600" />
          </div>,
          viewCopy.pendingAmount,
          formatMoney(paymentStats.pendingAmount),
        )}
        {renderStatCard(
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
            <BarChart3 size={20} className="text-emerald-600" />
          </div>,
          viewCopy.confirmedAmount,
          formatMoney(paymentStats.confirmedAmount),
        )}
      </div>

      <header className="mb-8">
        <h2 className="mb-2 text-3xl font-black text-gray-900 dark:text-slate-100">
          {viewCopy.centerTitle}
        </h2>
        <p className="font-medium text-gray-500 dark:text-slate-400">
          {viewCopy.centerDescription}
        </p>
      </header>

      <div className="mb-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setAdminView("users")}
          className={cn(
            "inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition-all",
            adminView === "users"
              ? "bg-orange-600 text-white shadow-lg shadow-orange-200"
              : "bg-white text-gray-600 shadow-sm ring-1 ring-gray-100 hover:bg-gray-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700",
          )}
        >
          <UsersIcon size={18} />
          {viewCopy.usersTab}
        </button>
        <button
          type="button"
          onClick={() => setAdminView("payments")}
          className={cn(
            "inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition-all",
            adminView === "payments"
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
              : "bg-white text-gray-600 shadow-sm ring-1 ring-gray-100 hover:bg-gray-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700",
          )}
        >
          <CreditCard size={18} />
          {viewCopy.paymentsTab}
        </button>
        <button
          type="button"
          onClick={() => setAdminView("system")}
          className={cn(
            "inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition-all",
            adminView === "system"
              ? "bg-sky-600 text-white shadow-lg shadow-sky-200"
              : "bg-white text-gray-600 shadow-sm ring-1 ring-gray-100 hover:bg-gray-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700",
          )}
        >
          <Shield size={18} />
          {viewCopy.systemTab}
        </button>
      </div>

      <div
        className={cn(
          "mb-8 grid grid-cols-1 gap-8 xl:grid-cols-[1.05fr_0.95fr]",
          adminView !== "system" && "hidden",
        )}
      >
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
                {domain !== DEFAULT_OUTPUT_DOMAIN && (
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
              placeholder={`go.${DEFAULT_OUTPUT_DOMAIN}`}
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
          <div className="mb-4 flex flex-col gap-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={accessSearchTerm}
                  onChange={(e) => setAccessSearchTerm(e.target.value)}
                  placeholder="Search path, email, IP, or action..."
                  className="w-full rounded-2xl border border-gray-200 py-3 pl-10 pr-4 text-sm focus:border-gray-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  ["all", "All"],
                  ["http", "HTTP"],
                  ["admin", "Admin"],
                  ["blocked", "Blocked"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setAccessFilter(
                        value as "all" | "http" | "admin" | "blocked",
                      )
                    }
                    className={cn(
                      "rounded-full px-3 py-2 text-[11px] font-black uppercase tracking-widest transition-all",
                      accessFilter === value
                        ? "bg-orange-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-200",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onRefreshSecurity}
                className="rounded-2xl bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-widest text-white"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={exportAccessLogsCsv}
                className="rounded-2xl bg-gray-100 px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-700 dark:bg-slate-700 dark:text-slate-100"
              >
                Export
              </button>
            </div>
          </div>
          <div className="max-h-105 space-y-3 overflow-auto">
            {adminSecurityLoading ? (
              <div className="rounded-2xl bg-gray-50 px-4 py-10 text-center text-sm font-medium text-gray-400 dark:bg-slate-900 dark:text-slate-500">
                {content.accessLogs.loading}
              </div>
            ) : pagedAccessLogs.length === 0 ? (
              <div className="rounded-2xl bg-gray-50 px-4 py-10 text-center text-sm font-medium text-gray-400 dark:bg-slate-900 dark:text-slate-500">
                {accessSearchTerm ? "No matching access logs." : content.accessLogs.empty}
              </div>
            ) : (
              pagedAccessLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl bg-gray-50 px-4 py-4 dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-gray-900 dark:text-slate-100">
                      {isAdminLog(log)
                        ? log.path.replace(/^admin:/, "").replace(/_/g, " ")
                        : `${log.method} ${log.path}`}
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
          <div className="mt-4 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-widest text-gray-500">
            <span>
              Page {accessPage} of {totalAccessPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAccessPage((p) => Math.max(1, p - 1))}
                disabled={accessPage <= 1}
                className="rounded-xl bg-gray-100 px-3 py-2 disabled:opacity-40 dark:bg-slate-700"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() =>
                  setAccessPage((p) => Math.min(totalAccessPages, p + 1))
                }
                disabled={accessPage >= totalAccessPages}
                className="rounded-xl bg-gray-100 px-3 py-2 disabled:opacity-40 dark:bg-slate-700"
              >
                Next
              </button>
            </div>
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

          <div className="mt-5 flex items-center gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={blockedSearchTerm}
                onChange={(e) => setBlockedSearchTerm(e.target.value)}
                placeholder="Search blocked IPs..."
                className="w-full rounded-2xl border border-gray-200 py-3 pl-10 pr-4 text-sm focus:border-gray-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <button
              type="button"
              onClick={onRefreshSecurity}
              className="rounded-2xl bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-widest text-white"
            >
              Refresh
            </button>
          </div>

          <div className="mt-5 max-h-60 space-y-3 overflow-auto">
            {pagedBlockedIps.length === 0 ? (
              <div className="rounded-2xl bg-gray-50 px-4 py-8 text-center text-sm font-medium text-gray-400 dark:bg-slate-900 dark:text-slate-500">
                {blockedSearchTerm ? "No matching blocked IPs." : content.ipBlock.empty}
              </div>
            ) : (
              pagedBlockedIps.map((item) => (
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
                        onClick={() =>
                          setConfirmAction({
                            title: "Unblock IP?",
                            description: `Allow ${item.ip_address} again?`,
                            confirmLabel: "Unblock",
                            tone: "warning",
                            onConfirm: () => onUnblockIp(item.id),
                          })
                        }
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
          <div className="mt-4 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-widest text-gray-500">
            <span>
              Page {blockedPage} of {totalBlockedPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBlockedPage((p) => Math.max(1, p - 1))}
                disabled={blockedPage <= 1}
                className="rounded-xl bg-gray-100 px-3 py-2 disabled:opacity-40 dark:bg-slate-700"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() =>
                  setBlockedPage((p) => Math.min(totalBlockedPages, p + 1))
                }
                disabled={blockedPage >= totalBlockedPages}
                className="rounded-xl bg-gray-100 px-3 py-2 disabled:opacity-40 dark:bg-slate-700"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-[3rem] border border-gray-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800",
          adminView !== "payments" && "hidden",
        )}
      >
        <div className="flex flex-col gap-4 border-b border-gray-100 bg-gray-50/50 p-6 dark:border-slate-700 dark:bg-slate-900/70 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                <CreditCard size={18} /> {viewCopy.paymentsTab}
              </h3>
              <p className="mt-2 text-sm font-medium text-gray-500 dark:text-slate-400">
                {viewCopy.paymentsDescription}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onRefreshPayments}
                className="rounded-2xl bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-widest text-white"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={exportPaymentsCsv}
                className="rounded-2xl bg-gray-100 px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-700 dark:bg-slate-700 dark:text-slate-100"
              >
                Export
              </button>
              <span className="w-fit rounded-full bg-gray-900 px-3 py-1 text-[10px] font-bold text-white">
                {filteredPaymentRequests.length} {viewCopy.paymentRequests}
              </span>
            </div>
          </div>
          <div className="relative sm:max-w-[320px]">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder={viewCopy.paymentSearchPlaceholder}
              value={paymentSearchTerm}
              onChange={(e) => setPaymentSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm focus:border-gray-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-orange-500"
            />
          </div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-slate-700">
          {paymentRequestsLoading ? (
            <div className="p-20 text-center font-bold text-gray-300">
              {viewCopy.loadingPayments}
            </div>
          ) : pagedPayments.length === 0 ? (
            <div className="p-20 text-center font-medium italic text-gray-400">
              {paymentSearchTerm ? "No matching payment requests." : viewCopy.noPayments}
            </div>
          ) : (
            pagedPayments.map((request) => (
              <div
                key={request.id}
                className="flex flex-col gap-5 p-5 transition-all hover:bg-gray-50 dark:hover:bg-slate-900/40"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-lg font-black text-gray-900 dark:text-slate-100">
                    {request.user_full_name ||
                      request.user_email ||
                      request.user_id}
                  </h4>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                      getPaymentStatusClass(request.status),
                    )}
                  >
                    {getPaymentStatusLabel(request.status)}
                  </span>
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-sky-700">
                    {getPlanLabel(request.plan)}
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl bg-gray-50 px-4 py-3 dark:bg-slate-900">
                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">
                      {viewCopy.email}
                    </p>
                    <p className="mt-1 break-all font-bold text-gray-900 dark:text-slate-100">
                      {request.user_email || "-"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 px-4 py-3 dark:bg-slate-900">
                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">
                      {viewCopy.paymentCode}
                    </p>
                    <p className="mt-1 font-bold text-gray-900 dark:text-slate-100">
                      {request.account_code}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 px-4 py-3 dark:bg-slate-900">
                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">
                      {viewCopy.amount}
                    </p>
                    <p className="mt-1 font-bold text-gray-900 dark:text-slate-100">
                      {formatMoney(request.amount)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 px-4 py-3 dark:bg-slate-900">
                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">
                      {viewCopy.submittedAt}
                    </p>
                    <p className="mt-1 font-bold text-gray-900 dark:text-slate-100">
                      {new Date(
                        request.user_confirmed_at || request.created_at,
                      ).toLocaleString(dateLocale)}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-gray-50 px-4 py-3 dark:bg-slate-900">
                  <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">
                    {viewCopy.transferContent}
                  </p>
                  <p className="mt-1 break-all font-bold text-gray-900 dark:text-slate-100">
                    {request.transfer_content}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {request.status === "pending" ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmAction({
                            title: "Confirm payment?",
                            description: `Confirm the payment request for ${request.user_email || request.user_full_name || request.user_id}?`,
                            confirmLabel: "Confirm",
                            tone: "warning",
                            onConfirm: () => onConfirmPaymentRequest(request.id),
                          })
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-green-700"
                      >
                        <CheckCircle2 size={16} />
                        {viewCopy.confirmPayment}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmAction({
                            title: "Reject payment?",
                            description: `Reject the payment request for ${request.user_email || request.user_full_name || request.user_id}?`,
                            confirmLabel: "Reject",
                            tone: "danger",
                            onConfirm: () => onRejectPaymentRequest(request.id),
                          })
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-red-700"
                      >
                        <XCircle size={16} />
                        {viewCopy.rejectPayment}
                      </button>
                    </>
                  ) : (
                    <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm font-bold text-gray-500 dark:bg-slate-900 dark:text-slate-300">
                      {request.admin_confirmed_at
                        ? `${viewCopy.reviewedAt} ${new Date(request.admin_confirmed_at).toLocaleString(dateLocale)}`
                        : getPaymentStatusLabel(request.status)}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500 dark:border-slate-700 sm:px-8">
          <span>
            Page {paymentPage} of {totalPaymentPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPaymentPage((p) => Math.max(1, p - 1))}
              disabled={paymentPage <= 1}
              className="rounded-xl bg-gray-100 px-3 py-2 disabled:opacity-40 dark:bg-slate-700"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPaymentPage((p) => Math.min(totalPaymentPages, p + 1))}
              disabled={paymentPage >= totalPaymentPages}
              className="rounded-xl bg-gray-100 px-3 py-2 disabled:opacity-40 dark:bg-slate-700"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800",
          adminView !== "users" && "hidden",
        )}
      >
        <div className="flex flex-wrap gap-4">
          <div className="relative min-w-50 flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder={viewCopy.searchPlaceholder}
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

      <div
        className={cn(
          "overflow-hidden rounded-[3rem] border border-gray-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800",
          adminView !== "users" && "hidden",
        )}
      >
        <div className="flex flex-col gap-4 border-b border-gray-100 bg-gray-50/50 p-6 dark:border-slate-700 dark:bg-slate-900/70 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
              <UsersIcon size={18} /> {content.table.title}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onRefreshUsers}
                className="rounded-2xl bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-widest text-white"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={exportUsersCsv}
                className="rounded-2xl bg-gray-100 px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-700 dark:bg-slate-700 dark:text-slate-100"
              >
                Export
              </button>
              <span className="w-fit rounded-full bg-gray-900 px-3 py-1 text-[10px] font-bold text-white">
                {t("admin.table.count", { count: filteredUsers.length })}
              </span>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-slate-700">
          {adminLoading ? (
            <div className="p-20 text-center font-bold text-gray-300">
              {content.table.loading}
            </div>
          ) : pagedUsers.length === 0 ? (
            <div className="p-20 text-center font-medium italic text-gray-400">
              {searchTerm ? "No matching users." : content.table.empty}
            </div>
          ) : (
            pagedUsers.map((user) => (
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
                    onChange={(e) => {
                      const nextPlan = e.target.value as
                        | "free"
                        | "monthly"
                        | "yearly";
                      setConfirmAction({
                        title: "Update subscription plan?",
                        description: `Change ${user.email || user.full_name || user.id} to ${nextPlan.toUpperCase()}?`,
                        confirmLabel: "Update plan",
                        tone: "warning",
                        onConfirm: () =>
                          handleUpdateSubscription(user.id, nextPlan),
                      });
                    }}
                  >
                    <option value="free">{content.plans.free}</option>
                    <option value="monthly">{content.plans.monthly}</option>
                    <option value="yearly">{content.plans.yearly}</option>
                  </select>

                  {user.status !== "approved" && (
                    <button
                      onClick={() =>
                        setConfirmAction({
                          title: "Approve user?",
                          description: `Approve ${user.email || user.full_name || user.id}?`,
                          confirmLabel: "Approve",
                          tone: "warning",
                          onConfirm: () => handleApproveUser(user.id),
                        })
                      }
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-orange-600 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:bg-orange-700 active:scale-95 sm:flex-none sm:px-6"
                    >
                      <UserCheck size={16} /> {content.actions.approveNow}
                    </button>
                  )}

                  <button
                    onClick={() =>
                      setConfirmAction({
                        title: "Delete user?",
                        description: `This will permanently remove ${user.email || user.full_name || user.id}.`,
                        confirmLabel: "Delete",
                        tone: "danger",
                        onConfirm: () => handleDeleteUser(user.id),
                      })
                    }
                    className="rounded-xl bg-gray-100 p-3 text-gray-400 transition-all hover:bg-red-50 hover:text-red-500 active:scale-90 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-red-500/10"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500 dark:border-slate-700 sm:px-8">
          <span>
            Page {userPage} of {totalUserPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setUserPage((p) => Math.max(1, p - 1))}
              disabled={userPage <= 1}
              className="rounded-xl bg-gray-100 px-3 py-2 disabled:opacity-40 dark:bg-slate-700"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))}
              disabled={userPage >= totalUserPages}
              className="rounded-xl bg-gray-100 px-3 py-2 disabled:opacity-40 dark:bg-slate-700"
            >
              Next
            </button>
          </div>
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
                    onClick={() =>
                      setConfirmAction({
                        title: "Approve user?",
                        description: `Approve ${selectedUser.email || selectedUser.full_name || selectedUser.id}?`,
                        confirmLabel: "Approve",
                        tone: "warning",
                        onConfirm: async () => {
                          await handleApproveUser(selectedUser.id);
                          setSelectedUser(null);
                        },
                      })
                    }
                    className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-green-700"
                  >
                    <Check size={18} /> {content.actions.approveUser}
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <select
                    value={selectedUserPlanDraft}
                    onChange={(e) =>
                      setSelectedUserPlanDraft(
                        e.target.value as "free" | "monthly" | "yearly",
                      )
                    }
                    className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold focus:border-gray-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="free">{content.plans.free}</option>
                    <option value="monthly">{content.plans.monthly}</option>
                    <option value="yearly">{content.plans.yearly}</option>
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmAction({
                        title: "Update subscription plan?",
                        description: `Change ${selectedUser.email || selectedUser.full_name || selectedUser.id} to ${selectedUserPlanDraft.toUpperCase()}?`,
                        confirmLabel: "Update plan",
                        tone: "warning",
                        onConfirm: async () => {
                          await handleUpdateSubscription(
                            selectedUser.id,
                            selectedUserPlanDraft,
                          );
                          setSelectedUser(null);
                        },
                      })
                    }
                    className="rounded-xl bg-sky-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-sky-700"
                  >
                    Update plan
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedUserRoleDraft}
                    onChange={(e) =>
                      setSelectedUserRoleDraft(
                        e.target.value === "admin" ? "admin" : "user",
                      )
                    }
                    className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold focus:border-gray-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmAction({
                        title: "Update role?",
                        description: `Change ${selectedUser.email || selectedUser.full_name || selectedUser.id} to ${selectedUserRoleDraft.toUpperCase()}?`,
                        confirmLabel: "Update role",
                        tone: "warning",
                        onConfirm: async () => {
                          await onUpdateUserRole(
                            selectedUser.id,
                            selectedUserRoleDraft,
                          );
                          setSelectedUser(null);
                        },
                      })
                    }
                    className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-indigo-700"
                  >
                    Update role
                  </button>
                </div>

                  <button
                    onClick={() =>
                      setConfirmAction({
                        title: "Delete user?",
                        description: `This will permanently remove ${selectedUser.email || selectedUser.full_name || selectedUser.id}.`,
                        confirmLabel: "Delete",
                        tone: "danger",
                        onConfirm: async () => {
                          await handleDeleteUser(selectedUser.id);
                          setSelectedUser(null);
                        },
                      })
                    }
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
                            href={buildPrettyLinkPath(
                              {
                                slug: link.slug,
                                shortCode: link.short_code,
                                title: link.custom_title,
                              },
                            )}
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
