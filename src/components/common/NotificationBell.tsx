import React from "react";
import {
  Bell,
  CheckCheck,
  Clock3,
  Loader2,
  MousePointerClick,
  Sparkles,
  TriangleAlert,
  Users,
} from "lucide-react";
import { AppNotification } from "@/src/types";
import { cn } from "@/src/lib/utils";
import { useLocale } from "@/src/hooks/useLocale";

interface NotificationBellProps {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  onRefresh: () => Promise<void> | void;
  onMarkRead: (notificationId: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
  onOpenTeamWorkspace: () => void;
  onOpenLinks: () => void;
  onOpenPricing: () => void;
  className?: string;
}

const getNotificationIcon = (type: AppNotification["type"]) => {
  if (
    type === "workspace_invitation" ||
    type === "workspace_invitation_response" ||
    type === "workspace_membership_updated" ||
    type === "workspace_membership_removed"
  ) {
    return Users;
  }
  if (type === "link_expiring_soon") {
    return Clock3;
  }
  if (type === "quota_warning") {
    return TriangleAlert;
  }
  if (type === "subscription_expiring" || type === "payment_confirmed") {
    return Sparkles;
  }
  return MousePointerClick;
};

const getNotificationGroupKey = (type: AppNotification["type"]) => {
  if (
    type === "workspace_invitation" ||
    type === "workspace_invitation_response" ||
    type === "workspace_membership_updated" ||
    type === "workspace_membership_removed"
  ) {
    return "team";
  }
  if (
    type === "subscription_expiring" ||
    type === "quota_warning" ||
    type === "payment_confirmed"
  ) {
    return "system";
  }
  return "links";
};

const getRoleLabel = (role: unknown, t: (path: string) => string) => {
  if (role === "owner" || role === "editor" || role === "viewer") {
    return t(`notificationBell.role.${role}`);
  }
  return typeof role === "string" ? role : "-";
};

const getQuotaLabel = (quotaKey: unknown, t: (path: string) => string) => {
  if (quotaKey === "link_daily") {
    return t("notificationBell.quotas.linkDaily");
  }
  if (quotaKey === "video_daily") {
    return t("notificationBell.quotas.videoDaily");
  }
  if (quotaKey === "team_workspace") {
    return t("notificationBell.quotas.teamWorkspace");
  }
  return "";
};

const getNotificationContent = (
  notification: AppNotification,
  t: (path: string, params?: Record<string, string | number>) => string,
) => {
  const metadata = notification.metadata || {};
  const workspace =
    typeof metadata.workspace_name === "string" &&
    metadata.workspace_name.trim()
      ? metadata.workspace_name
      : "Workspace";
  const role = getRoleLabel(metadata.role, t);
  const member =
    (typeof metadata.member_name === "string" && metadata.member_name.trim()) ||
    (typeof metadata.member_email === "string" &&
      metadata.member_email.trim()) ||
    "Member";
  const inviter =
    (typeof metadata.invited_by_name === "string" &&
      metadata.invited_by_name.trim()) ||
    (typeof metadata.inviter_name === "string" &&
      metadata.inviter_name.trim()) ||
    "Owner";
  const label =
    (typeof metadata.link_title === "string" && metadata.link_title.trim()) ||
    (typeof metadata.short_code === "string" && metadata.short_code.trim()) ||
    notification.title;

  switch (notification.type) {
    case "workspace_invitation":
      return {
        title: t("notificationBell.items.workspaceInvitation.title"),
        message: t("notificationBell.items.workspaceInvitation.message", {
          inviter,
          workspace,
          role,
        }),
      };
    case "workspace_invitation_response":
      return {
        title:
          metadata.action === "declined"
            ? t("notificationBell.items.workspaceInvitationDeclined.title")
            : t("notificationBell.items.workspaceInvitationAccepted.title"),
        message:
          metadata.action === "declined"
            ? t("notificationBell.items.workspaceInvitationDeclined.message", {
                member,
                workspace,
                role,
              })
            : t("notificationBell.items.workspaceInvitationAccepted.message", {
                member,
                workspace,
                role,
              }),
      };
    case "workspace_membership_updated":
      return {
        title: t("notificationBell.items.workspaceMembershipUpdated.title"),
        message: t(
          "notificationBell.items.workspaceMembershipUpdated.message",
          {
            workspace,
            role,
          },
        ),
      };
    case "workspace_membership_removed":
      return {
        title: t("notificationBell.items.workspaceMembershipRemoved.title"),
        message: t(
          "notificationBell.items.workspaceMembershipRemoved.message",
          {
            workspace,
          },
        ),
      };
    case "link_click_threshold":
      return {
        title: t("notificationBell.items.linkClickThreshold.title", {
          count:
            typeof metadata.total_clicks === "number"
              ? metadata.total_clicks
              : 0,
        }),
        message: t("notificationBell.items.linkClickThreshold.message", {
          label,
          count:
            typeof metadata.total_clicks === "number"
              ? metadata.total_clicks
              : 0,
        }),
      };
    case "link_expiring_soon":
      return {
        title: t("notificationBell.items.linkExpiringSoon.title"),
        message: t("notificationBell.items.linkExpiringSoon.message", {
          label,
          hours:
            typeof metadata.hours_left === "number" ? metadata.hours_left : 24,
        }),
      };
    case "quota_warning":
      return {
        title: t("notificationBell.items.quotaWarning.title"),
        message: t("notificationBell.items.quotaWarning.message", {
          remaining:
            typeof metadata.remaining === "number" ? metadata.remaining : 0,
          quotaLabel: getQuotaLabel(metadata.quota_key, t),
        }),
      };
    case "subscription_expiring":
      return {
        title: t("notificationBell.items.subscriptionExpiring.title"),
        message: t("notificationBell.items.subscriptionExpiring.message", {
          plan:
            typeof metadata.subscription_plan === "string"
              ? metadata.subscription_plan
              : "Premium",
          days: typeof metadata.days_left === "number" ? metadata.days_left : 7,
        }),
      };
    default:
      return {
        title: notification.title,
        message: notification.message,
      };
  }
};

export function NotificationBell({
  notifications,
  unreadCount,
  loading,
  onRefresh,
  onMarkRead,
  onMarkAllRead,
  onOpenTeamWorkspace,
  onOpenLinks,
  onOpenPricing,
  className,
}: NotificationBellProps) {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [busyId, setBusyId] = React.useState("");
  const [markingAll, setMarkingAll] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const formatRelativeTime = React.useCallback(
    (value: string) => {
      const date = new Date(value);
      const diffMs = Date.now() - date.getTime();
      const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

      if (diffMinutes < 60) {
        return t("notificationBell.relative.minutes", { count: diffMinutes });
      }
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) {
        return t("notificationBell.relative.hours", { count: diffHours });
      }
      const diffDays = Math.floor(diffHours / 24);
      return t("notificationBell.relative.days", { count: diffDays });
    },
    [t],
  );

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: AppNotification) => {
    setBusyId(notification.id);
    try {
      if (!notification.is_read) {
        await onMarkRead(notification.id);
      }

      if (
        notification.type === "workspace_invitation" ||
        notification.type === "workspace_invitation_response" ||
        notification.type === "workspace_membership_updated" ||
        notification.type === "workspace_membership_removed"
      ) {
        onOpenTeamWorkspace();
      } else if (
        notification.type === "link_click_threshold" ||
        notification.type === "link_expiring_soon"
      ) {
        onOpenLinks();
      } else if (
        notification.type === "subscription_expiring" ||
        notification.type === "quota_warning" ||
        notification.type === "payment_confirmed"
      ) {
        onOpenPricing();
      }

      setOpen(false);
    } finally {
      setBusyId("");
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await onMarkAllRead();
    } finally {
      setMarkingAll(false);
    }
  };

  const groupedNotifications = React.useMemo(() => {
    const groups = new Map<string, AppNotification[]>();
    for (const notification of notifications) {
      const group = getNotificationGroupKey(notification.type);
      const current = groups.get(group) || [];
      current.push(notification);
      groups.set(group, current);
    }
    return ["team", "links", "system"]
      .map((group) => ({
        group,
        label: t(`notificationBell.groups.${group}`),
        items: groups.get(group) || [],
      }))
      .filter((entry) => entry.items.length > 0);
  }, [notifications, t]);

  return (
    <div
      ref={containerRef}
      className={cn("relative z-40 inline-flex shrink-0", className)}
    >
      <button
        type="button"
        onClick={() => {
          setOpen((current) => {
            const next = !current;
            if (next) {
              void onRefresh();
            }
            return next;
          });
        }}
        className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700 shadow-lg shadow-gray-200/60 transition-all hover:-translate-y-0.5 hover:text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:shadow-black/20"
        aria-label={t("notificationBell.ariaOpen")}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-orange-600 px-1.5 py-0.5 text-center text-[10px] font-black text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-3 right-3 top-20 z-50 rounded-3xl border border-gray-100 bg-white p-4 shadow-2xl shadow-gray-200/70 dark:border-slate-700 dark:bg-slate-800 dark:shadow-black/30 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[min(22rem,calc(100vw-2rem))] sm:rounded-[1.75rem]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-gray-900 dark:text-slate-100">
                {t("notificationBell.title")}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {unreadCount > 0
                  ? t("notificationBell.unreadCount", { count: unreadCount })
                  : t("notificationBell.emptyNew")}
              </p>
            </div>
            <button
              type="button"
              disabled={markingAll || unreadCount === 0}
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-gray-700 transition-all hover:bg-gray-200 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
            >
              {markingAll ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCheck size={14} />
              )}
              {t("notificationBell.markAll")}
            </button>
          </div>

          <div className="max-h-[min(68dvh,32rem)] space-y-2 overflow-y-auto pr-1 sm:max-h-104">
            {loading ? (
              <div className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-4 text-sm font-bold text-gray-500 dark:bg-slate-900 dark:text-slate-400">
                <Loader2 size={16} className="animate-spin" />
                {t("notificationBell.loading")}
              </div>
            ) : notifications.length > 0 ? (
              groupedNotifications.map(({ group, label, items }) => (
                <div key={group} className="space-y-2">
                  <p className="px-1 text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
                    {label}
                  </p>
                  {items.map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    const isBusy = busyId === notification.id;
                    const content = getNotificationContent(notification, t);

                    return (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() =>
                          void handleNotificationClick(notification)
                        }
                        className={cn(
                          "w-full rounded-2xl border px-4 py-3 text-left transition-all",
                          notification.is_read
                            ? "border-gray-100 bg-gray-50 dark:border-slate-700 dark:bg-slate-900"
                            : "border-orange-100 bg-orange-50/70 dark:border-orange-500/20 dark:bg-orange-500/10",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "mt-0.5 rounded-xl p-2",
                              notification.type === "workspace_invitation" ||
                                notification.type ===
                                  "workspace_invitation_response" ||
                                notification.type ===
                                  "workspace_membership_updated" ||
                                notification.type ===
                                  "workspace_membership_removed"
                                ? "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200"
                                : notification.type === "quota_warning" ||
                                    notification.type ===
                                      "subscription_expiring" ||
                                    notification.type === "payment_confirmed"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200"
                                  : "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-200",
                            )}
                          >
                            <Icon size={15} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <p className="font-black text-gray-900 dark:text-slate-100">
                                {content.title}
                              </p>
                              {!notification.is_read && (
                                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-orange-500" />
                              )}
                            </div>
                            <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
                              {content.message}
                            </p>
                            <div className="mt-2 flex items-center justify-between gap-3">
                              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">
                                {formatRelativeTime(notification.created_at)}
                              </span>
                              {isBusy && (
                                <Loader2
                                  size={14}
                                  className="animate-spin text-gray-400"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-gray-50 px-4 py-5 text-sm font-medium text-gray-500 dark:bg-slate-900 dark:text-slate-400">
                {t("notificationBell.empty")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
