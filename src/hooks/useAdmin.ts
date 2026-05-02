import { useState, useCallback, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { UserProfile } from "@/src/types";
import { toast } from "sonner";
import { supabase } from "@/src/lib/supabase";

interface UseAdminProps {
  user: User | null;
  profile: UserProfile | null;
  fetchWithAuth: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  activeTab: string;
}

export interface AdminState {
  allUsers: UserProfile[];
  adminLoading: boolean;
  adminDirty: boolean;
  onlineUserIds: string[];
}

export interface AdminActions {
  fetchAllUsers: () => Promise<void>;
  handleApproveUser: (targetUid: string, status?: boolean) => Promise<void>;
  handleUpdateSubscription: (targetUid: string, plan: "free" | "monthly" | "yearly") => Promise<void>;
  handleDeleteUser: (targetUid: string) => Promise<void>;
  setAdminDirty: (v: boolean) => void;
}

export function useAdmin({ user, profile, fetchWithAuth, activeTab }: UseAdminProps): AdminState & AdminActions {
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminDirty, setAdminDirty] = useState(true);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);

  const isAdminRole = profile?.role === "admin" || user?.email === "devluan1996@gmail.com";

  const fetchAllUsers = useCallback(async () => {
    if (!user || !isAdminRole) return;
    setAdminLoading(true);
    try {
      const response = await fetchWithAuth("/api/v1/admin/users");
      const data = await response.json();
      setAllUsers(data);
      setAdminDirty(false);
    } catch (e) {
      console.error(e);
    } finally {
      setAdminLoading(false);
    }
  }, [user, isAdminRole, fetchWithAuth]);

  const handleApproveUser = useCallback(async (targetUid: string, status: boolean = true) => {
    if (!user || !isAdminRole) return;
    try {
      const response = await fetchWithAuth(
        `/api/v1/admin/users/${targetUid}/approve`,
        {
          method: "POST",
          body: JSON.stringify({ isApproved: status }),
        },
      );
      if (response.ok) {
        fetchAllUsers();
        toast.success(status ? "Đã duyệt người dùng!" : "Đã hủy duyệt người dùng!");
      } else {
        toast.error("Lỗi khi cập nhật trạng thái duyệt");
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi hệ thống");
    }
  }, [user, isAdminRole, fetchWithAuth, fetchAllUsers]);

  const handleUpdateSubscription = useCallback(async (targetUid: string, plan: "free" | "monthly" | "yearly") => {
    if (!user || !isAdminRole) return;
    try {
      let expiry = null;
      if (plan === "monthly") {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        expiry = d.toISOString();
      } else if (plan === "yearly") {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 1);
        expiry = d.toISOString();
      }

      const response = await fetchWithAuth(
        `/api/v1/admin/users/${targetUid}/subscription`,
        {
          method: "POST",
          body: JSON.stringify({ plan, expiry }),
        },
      );
      if (response.ok) {
        fetchAllUsers();
        toast.success(`Đã cập nhật gói ${plan.toUpperCase()} thành công!`);
      } else {
        toast.error("Không thể cập nhật gói cước");
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi hệ thống khi cập nhật gói");
    }
  }, [user, isAdminRole, fetchWithAuth, fetchAllUsers]);

  const handleDeleteUser = useCallback(async (targetUid: string) => {
    if (!user || !isAdminRole) return;
    try {
      const response = await fetchWithAuth(`/api/v1/admin/users/${targetUid}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchAllUsers();
        toast.success("Đã xóa người dùng và dữ liệu liên quan thành công!");
      } else {
        toast.error("Lỗi khi xóa người dùng");
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi kết nối máy chủ khi xóa");
    }
  }, [user, isAdminRole, fetchWithAuth, fetchAllUsers]);

  // Presence/online users tracking
  useEffect(() => {
    if (!user?.id || !isAdminRole) {
      setOnlineUserIds([]);
      return;
    }

    const presenceChannel = supabase.channel("online-users", {
      config: { presence: { key: user.id } },
    });

    const syncOnlineUsers = () => {
      const state = presenceChannel.presenceState();
      setOnlineUserIds(Object.keys(state));
    };

    presenceChannel
      .on("presence", { event: "sync" }, syncOnlineUsers)
      .on("presence", { event: "join" }, syncOnlineUsers)
      .on("presence", { event: "leave" }, syncOnlineUsers)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      setOnlineUserIds((current) => current.filter((id) => id !== user.id));
      supabase.removeChannel(presenceChannel);
    };
  }, [user?.id, isAdminRole]);

  useEffect(() => {
    setAllUsers([]);
    setOnlineUserIds([]);
    setAdminLoading(false);
    setAdminDirty(!!user);
  }, [user?.id]);

  // Auto-fetch admin data
  useEffect(() => {
    if (user && isAdminRole && activeTab === "admin" && (adminDirty || allUsers.length === 0)) {
      fetchAllUsers();
    }
  }, [user, isAdminRole, activeTab, adminDirty, allUsers.length, fetchAllUsers]);

  return {
    allUsers,
    adminLoading,
    adminDirty,
    onlineUserIds,
    fetchAllUsers,
    handleApproveUser,
    handleUpdateSubscription,
    handleDeleteUser,
    setAdminDirty,
  };
}
