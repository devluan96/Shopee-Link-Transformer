import { useState, useCallback, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { ManualPaymentRequest, UserProfile } from "@/src/types";
import { toast } from "sonner";

interface UseAdminProps {
  user: User | null;
  profile: UserProfile | null;
  fetchWithAuth: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>;
  activeTab: string;
}

export interface AdminState {
  allUsers: UserProfile[];
  adminLoading: boolean;
  adminDirty: boolean;
  paymentRequests: ManualPaymentRequest[];
  paymentRequestsLoading: boolean;
  outputDomains: string[];
  outputDomainsLoading: boolean;
}

export interface AdminActions {
  fetchAllUsers: () => Promise<void>;
  fetchPaymentRequests: () => Promise<void>;
  handleApproveUser: (targetUid: string, status?: boolean) => Promise<void>;
  handleUpdateSubscription: (
    targetUid: string,
    plan: "free" | "monthly" | "yearly",
  ) => Promise<void>;
  handleDeleteUser: (targetUid: string) => Promise<void>;
  handleConfirmPaymentRequest: (paymentRequestId: string) => Promise<void>;
  handleRejectPaymentRequest: (paymentRequestId: string) => Promise<void>;
  fetchOutputDomains: () => Promise<void>;
  updateOutputDomains: (domains: string[]) => Promise<void>;
  setAdminDirty: (v: boolean) => void;
}

export function useAdmin({
  user,
  profile,
  fetchWithAuth,
  activeTab,
}: UseAdminProps): AdminState & AdminActions {
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminDirty, setAdminDirty] = useState(true);
  const [paymentRequests, setPaymentRequests] = useState<
    ManualPaymentRequest[]
  >([]);
  const [paymentRequestsLoading, setPaymentRequestsLoading] = useState(false);
  const [outputDomains, setOutputDomains] = useState<string[]>([
    "hotsnew.click",
  ]);
  const [outputDomainsLoading, setOutputDomainsLoading] = useState(false);

  const isAdminRole =
    profile?.role === "admin" || user?.email === "devluan1996@gmail.com";

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

  const fetchPaymentRequests = useCallback(async () => {
    if (!user || !isAdminRole) return;
    setPaymentRequestsLoading(true);
    try {
      const response = await fetchWithAuth("/api/v1/admin/payment-requests");
      const data = await response.json();
      setPaymentRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setPaymentRequests([]);
    } finally {
      setPaymentRequestsLoading(false);
    }
  }, [user, isAdminRole, fetchWithAuth]);

  const handleApproveUser = useCallback(
    async (targetUid: string, status: boolean = true) => {
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
          toast.success(
            status ? "Đã duyệt người dùng!" : "Đã hủy duyệt người dùng!",
          );
        } else {
          toast.error("Lỗi khi cập nhật trạng thái duyệt");
        }
      } catch (e) {
        console.error(e);
        toast.error("Lỗi hệ thống");
      }
    },
    [user, isAdminRole, fetchWithAuth, fetchAllUsers],
  );

  const handleUpdateSubscription = useCallback(
    async (targetUid: string, plan: "free" | "monthly" | "yearly") => {
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
    },
    [user, isAdminRole, fetchWithAuth, fetchAllUsers],
  );

  const handleDeleteUser = useCallback(
    async (targetUid: string) => {
      if (!user || !isAdminRole) return;
      try {
        const response = await fetchWithAuth(
          `/api/v1/admin/users/${targetUid}`,
          {
            method: "DELETE",
          },
        );
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
    },
    [user, isAdminRole, fetchWithAuth, fetchAllUsers],
  );

  const handleConfirmPaymentRequest = useCallback(
    async (paymentRequestId: string) => {
      if (!user || !isAdminRole) return;
      try {
        const response = await fetchWithAuth(
          `/api/v1/admin/payment-requests/${paymentRequestId}/confirm`,
          {
            method: "POST",
          },
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Không thể xác nhận thanh toán");
        }
        await Promise.all([fetchPaymentRequests(), fetchAllUsers()]);
        toast.success(
          "Đã xác nhận thanh toán và kích hoạt gói cho người dùng!",
        );
      } catch (e) {
        console.error(e);
        toast.error(e instanceof Error ? e.message : "Lỗi hệ thống");
      }
    },
    [user, isAdminRole, fetchWithAuth, fetchPaymentRequests, fetchAllUsers],
  );

  const handleRejectPaymentRequest = useCallback(
    async (paymentRequestId: string) => {
      if (!user || !isAdminRole) return;
      try {
        const response = await fetchWithAuth(
          `/api/v1/admin/payment-requests/${paymentRequestId}/reject`,
          {
            method: "POST",
          },
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Không thể từ chối thanh toán");
        }
        await fetchPaymentRequests();
        toast.success("Đã cập nhật yêu cầu thanh toán là từ chối!");
      } catch (e) {
        console.error(e);
        toast.error(e instanceof Error ? e.message : "Lỗi hệ thống");
      }
    },
    [user, isAdminRole, fetchWithAuth, fetchPaymentRequests],
  );

  const fetchOutputDomains = useCallback(async () => {
    if (!user) return;
    setOutputDomainsLoading(true);
    try {
      const response = await fetchWithAuth("/api/v1/settings/output-domains");
      const data = await response.json();
      setOutputDomains(
        Array.isArray(data?.domains) && data.domains.length
          ? data.domains
          : ["hotsnew.click"],
      );
    } catch (e) {
      console.error(e);
    } finally {
      setOutputDomainsLoading(false);
    }
  }, [user, fetchWithAuth]);

  const updateOutputDomains = useCallback(
    async (domains: string[]) => {
      if (!user || !isAdminRole) return;
      const response = await fetchWithAuth(
        "/api/v1/admin/settings/output-domains",
        {
          method: "PUT",
          body: JSON.stringify({ domains }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Không thể cập nhật domains");
      }
      setOutputDomains(data.domains || ["hotsnew.click"]);
      toast.success("Đã cập nhật danh sách domain đầu ra");
    },
    [user, isAdminRole, fetchWithAuth],
  );

  useEffect(() => {
    setAllUsers([]);
    setAdminLoading(false);
    setPaymentRequests([]);
    setPaymentRequestsLoading(false);
    setOutputDomains(["hotsnew.click"]);
    setOutputDomainsLoading(false);
    setAdminDirty(!!user);
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    void fetchOutputDomains();
  }, [user?.id, fetchOutputDomains]);

  // Auto-fetch admin data
  useEffect(() => {
    if (
      user &&
      isAdminRole &&
      activeTab === "admin" &&
      (adminDirty || allUsers.length === 0)
    ) {
      fetchAllUsers();
      fetchOutputDomains();
      fetchPaymentRequests();
    }
  }, [
    user,
    isAdminRole,
    activeTab,
    adminDirty,
    allUsers.length,
    fetchAllUsers,
    fetchOutputDomains,
    fetchPaymentRequests,
  ]);

  return {
    allUsers,
    adminLoading,
    adminDirty,
    paymentRequests,
    paymentRequestsLoading,
    outputDomains,
    outputDomainsLoading,
    fetchAllUsers,
    fetchPaymentRequests,
    handleApproveUser,
    handleUpdateSubscription,
    handleDeleteUser,
    handleConfirmPaymentRequest,
    handleRejectPaymentRequest,
    fetchOutputDomains,
    updateOutputDomains,
    setAdminDirty,
  };
}
