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

const formatRelativeTime = (value: string) => {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) return `${diffMinutes} phut truoc`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} gio truoc`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngay truoc`;
};

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
  if (type === "subscription_expiring") {
    return Sparkles;
  }
  return MousePointerClick;
};

const getNotificationGroup = (type: AppNotification["type"]) => {
  if (
    type === "workspace_invitation" ||
    type === "workspace_invitation_response" ||
    type === "workspace_membership_updated" ||
    type === "workspace_membership_removed"
  ) {
    return "Team";
  }
  if (type === "subscription_expiring" || type === "quota_warning") {
    return "System";
  }
  return "Link";
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
  const [open, setOpen] = React.useState(false);
  const [busyId, setBusyId] = React.useState("");
  const [markingAll, setMarkingAll] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

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
        notification.type === "quota_warning"
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
      const group = getNotificationGroup(notification.type);
      const current = groups.get(group) || [];
      current.push(notification);
      groups.set(group, current);
    }
    return ["Team", "Link", "System"]
      .map((group) => ({
        group,
        items: groups.get(group) || [],
      }))
      .filter((entry) => entry.items.length > 0);
  }, [notifications]);

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
        aria-label="Mở thông báo"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-orange-600 px-1.5 py-0.5 text-center text-[10px] font-black text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-3 w-[min(22rem,calc(100vw-2rem))] rounded-[1.75rem] border border-gray-100 bg-white p-4 shadow-2xl shadow-gray-200/70 dark:border-slate-700 dark:bg-slate-800 dark:shadow-black/30">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-gray-900 dark:text-slate-100">
                Thông báo
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {unreadCount > 0
                  ? `${unreadCount} thông báo chưa đọc`
                  : "Không có thông báo mới"}
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
              Đọc hết
            </button>
          </div>

          <div className="max-h-104 space-y-2 overflow-y-auto pr-1">
            {loading ? (
              <div className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-4 text-sm font-bold text-gray-500 dark:bg-slate-900 dark:text-slate-400">
                <Loader2 size={16} className="animate-spin" />
                Đang tải thông báo...
              </div>
            ) : notifications.length > 0 ? (
              groupedNotifications.map(({ group, items }) => (
                <div key={group} className="space-y-2">
                  <p className="px-1 text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
                    {group}
                  </p>
                  {items.map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    const isBusy = busyId === notification.id;

                    return (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => void handleNotificationClick(notification)}
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
                                    notification.type === "subscription_expiring"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200"
                                  : "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-200",
                            )}
                          >
                            <Icon size={15} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <p className="font-black text-gray-900 dark:text-slate-100">
                                {notification.title}
                              </p>
                              {!notification.is_read && (
                                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-orange-500" />
                              )}
                            </div>
                            <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
                              {notification.message}
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
                Chưa có thông báo nào.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
