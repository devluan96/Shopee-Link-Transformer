import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { User } from "@supabase/supabase-js";
import { AppNotification } from "@/src/types";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";

interface UseNotificationsProps {
  user: User | null;
  fetchWithAuth: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>;
}

interface InboxPayload {
  notifications: AppNotification[];
  unreadCount: number;
}

export function useNotifications({
  user,
  fetchWithAuth,
}: UseNotificationsProps) {
  const userId = user?.id || "";
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const loadedRef = useRef(false);

  const fetchNotifications = useCallback(
    async (force = false) => {
      if (!userId) {
        setNotifications([]);
        setUnreadCount(0);
        loadedRef.current = false;
        return;
      }
      if (!force && loadedRef.current) {
        return;
      }

      setLoading(true);
      try {
        const res = await fetchWithAuth("/api/v1/user/notifications/inbox");
        const data = (await res.json()) as InboxPayload;
        if (!res.ok) {
          throw new Error("Không thể tải thông báo");
        }

        setNotifications(
          Array.isArray(data.notifications) ? data.notifications : [],
        );
        setUnreadCount(Number(data.unreadCount || 0));
        loadedRef.current = true;
      } catch (error: any) {
        toast.error(error.message || "Lỗi khi tải thông báo");
      } finally {
        setLoading(false);
      }
    },
    [fetchWithAuth, userId],
  );

  const markNotificationRead = useCallback(
    async (notificationId: string) => {
      const target = notifications.find(
        (notification) => notification.id === notificationId,
      );
      if (!target || target.is_read) {
        return;
      }

      try {
        await fetchWithAuth(
          `/api/v1/user/notifications/inbox/${notificationId}/read`,
          {
            method: "POST",
          },
        );

        setNotifications((current) =>
          current.map((notification) =>
            notification.id === notificationId
              ? {
                  ...notification,
                  is_read: true,
                  read_at: new Date().toISOString(),
                }
              : notification,
          ),
        );
        setUnreadCount((current) => Math.max(0, current - 1));
      } catch (error: any) {
        toast.error(error.message || "Không thể cập nhật thông báo");
      }
    },
    [fetchWithAuth, notifications],
  );

  const markAllNotificationsRead = useCallback(async () => {
    if (!notifications.some((notification) => !notification.is_read)) {
      return;
    }

    try {
      await fetchWithAuth("/api/v1/user/notifications/inbox/read-all", {
        method: "POST",
      });

      const timestamp = new Date().toISOString();
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
          read_at: notification.read_at || timestamp,
        })),
      );
      setUnreadCount(0);
    } catch (error: any) {
      toast.error(error.message || "Không thể cập nhật thông báo");
    }
  }, [fetchWithAuth, notifications]);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      loadedRef.current = false;
      return;
    }

    setNotifications([]);
    setUnreadCount(0);
    loadedRef.current = false;
    void fetchNotifications(true);
  }, [fetchNotifications, userId]);

  useEffect(() => {
    if (!userId) return;

    const interval = window.setInterval(() => {
      void fetchNotifications(true);
    }, 30000);

    return () => window.clearInterval(interval);
  }, [fetchNotifications, userId]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`user-notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const nextNotification = payload.new as AppNotification;
          setNotifications((current) => {
            const exists = current.some(
              (notification) => notification.id === nextNotification.id,
            );
            if (exists) {
              return current.map((notification) =>
                notification.id === nextNotification.id
                  ? nextNotification
                  : notification,
              );
            }
            return [nextNotification, ...current].slice(0, 20);
          });
          setUnreadCount((current) => current + 1);
          loadedRef.current = true;
          toast.info(nextNotification.title, {
            description: nextNotification.message,
          });
          void fetchNotifications(true);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void fetchNotifications(true);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchNotifications, userId]);

  const hasUnread = useMemo(() => unreadCount > 0, [unreadCount]);

  return {
    notifications,
    unreadCount,
    hasUnread,
    notificationsLoading: loading,
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
  };
}
