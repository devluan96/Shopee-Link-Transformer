import { useState, useCallback, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import {
  DeepLinkProfiles,
  ManualPaymentRequest,
  UserProfile,
  VideoUploadProviderPreference,
} from "@/src/types";
import { toast } from "sonner";
import { DEFAULT_OUTPUT_DOMAINS } from "@/src/lib/appConfig";

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
  deepLinkProfiles: DeepLinkProfiles;
  deepLinkProfilesLoading: boolean;
  videoUploadProviderPreference: VideoUploadProviderPreference;
  videoUploadProviderPreferenceLoading: boolean;
}

export interface AdminActions {
  fetchAllUsers: () => Promise<void>;
  fetchPaymentRequests: () => Promise<void>;
  handleApproveUser: (targetUid: string, status?: boolean) => Promise<void>;
  handleUpdateSubscription: (
    targetUid: string,
    plan: "free" | "monthly" | "yearly",
  ) => Promise<void>;
  handleUpdateUserRole: (
    targetUid: string,
    role: "user" | "admin",
  ) => Promise<void>;
  handleDeleteUser: (targetUid: string) => Promise<void>;
  handleConfirmPaymentRequest: (paymentRequestId: string) => Promise<void>;
  handleRejectPaymentRequest: (paymentRequestId: string) => Promise<void>;
  fetchOutputDomains: () => Promise<void>;
  updateOutputDomains: (domains: string[]) => Promise<void>;
  fetchDeepLinkProfiles: () => Promise<void>;
  updateDeepLinkProfiles: (profiles: DeepLinkProfiles) => Promise<void>;
  fetchVideoUploadProviderPreference: () => Promise<void>;
  updateVideoUploadProviderPreference: (
    provider: VideoUploadProviderPreference,
  ) => Promise<void>;
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
    ...DEFAULT_OUTPUT_DOMAINS,
  ]);
  const [outputDomainsLoading, setOutputDomainsLoading] = useState(false);
  const [deepLinkProfiles, setDeepLinkProfiles] = useState<DeepLinkProfiles>({});
  const [deepLinkProfilesLoading, setDeepLinkProfilesLoading] = useState(false);
  const [videoUploadProviderPreference, setVideoUploadProviderPreference] =
    useState<VideoUploadProviderPreference>("cloudinary");
  const [videoUploadProviderPreferenceLoading, setVideoUploadProviderPreferenceLoading] =
    useState(false);

  const isAdminRole =
    profile?.role === "admin";

  const fetchAllUsers = useCallback(async () => {
    if (!user || !isAdminRole) return;
    setAdminLoading(true);
    try {
      const response = await fetchWithAuth("/api/v1/admin/users");
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Failed to load users");
      }
      setAllUsers(Array.isArray(data) ? data : []);
      setAdminDirty(false);
    } catch (e) {
      console.error(e);
      setAdminDirty(false);
      toast.error(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setAdminLoading(false);
    }
  }, [user, isAdminRole, fetchWithAuth]);

  const fetchPaymentRequests = useCallback(async () => {
    if (!user || !isAdminRole) return;
    setPaymentRequestsLoading(true);
    try {
      const response = await fetchWithAuth("/api/v1/admin/payment-requests");
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Failed to load payment requests");
      }
      setPaymentRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error(
        e instanceof Error ? e.message : "Failed to load payment requests",
      );
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

  const handleUpdateUserRole = useCallback(
    async (targetUid: string, role: "user" | "admin") => {
      if (!user || !isAdminRole) return;
      try {
        const response = await fetchWithAuth(
          `/api/v1/admin/users/${targetUid}/role`,
          {
            method: "POST",
            body: JSON.stringify({ role }),
          },
        );
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.error || "Failed to update user role");
        }
        await fetchAllUsers();
        toast.success(`Updated role to ${role.toUpperCase()}`);
      } catch (e) {
        console.error(e);
        toast.error(e instanceof Error ? e.message : "Failed to update user role");
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
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Failed to load output domains");
      }
      setOutputDomains(
        Array.isArray(data?.domains) && data.domains.length
          ? data.domains
          : DEFAULT_OUTPUT_DOMAINS,
      );
    } catch (e) {
      console.error(e);
      toast.error(
        e instanceof Error ? e.message : "Failed to load output domains",
      );
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
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Failed to update output domains");
      }
      setOutputDomains(data?.domains || DEFAULT_OUTPUT_DOMAINS);
      toast.success("Updated output domains");
    },
    [user, isAdminRole, fetchWithAuth],
  );

  const fetchDeepLinkProfiles = useCallback(async () => {
    if (!user) return;
    setDeepLinkProfilesLoading(true);
    try {
      const response = await fetchWithAuth("/api/v1/settings/deeplink-profiles");
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Failed to load deep link profiles");
      }
      setDeepLinkProfiles(data?.profiles || {});
    } catch (e) {
      console.error(e);
      toast.error(
        e instanceof Error ? e.message : "Failed to load deep link profiles",
      );
    } finally {
      setDeepLinkProfilesLoading(false);
    }
  }, [user, fetchWithAuth]);

  const fetchVideoUploadProviderPreference = useCallback(async () => {
    if (!user) return;
    setVideoUploadProviderPreferenceLoading(true);
    try {
      const response = await fetchWithAuth(
        "/api/v1/settings/video-upload-provider",
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Failed to load video upload provider");
      }
      setVideoUploadProviderPreference(
        data?.provider === "r2" ||
          data?.provider === "supabase" ||
          data?.provider === "cloudinary"
          ? data.provider
          : "cloudinary",
      );
    } catch (e) {
      console.error(e);
      toast.error(
        e instanceof Error ? e.message : "Failed to load video upload provider",
      );
    } finally {
      setVideoUploadProviderPreferenceLoading(false);
    }
  }, [user, fetchWithAuth]);

  const updateVideoUploadProviderPreference = useCallback(
    async (provider: VideoUploadProviderPreference) => {
      if (!user || !isAdminRole) return;
      const response = await fetchWithAuth(
        "/api/v1/admin/settings/video-upload-provider",
        {
          method: "PUT",
          body: JSON.stringify({ provider }),
        },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Failed to update video upload provider");
      }
      setVideoUploadProviderPreference(
        data?.provider === "r2" ||
          data?.provider === "supabase" ||
          data?.provider === "cloudinary"
          ? data.provider
          : provider,
      );
      toast.success("Updated video upload provider");
    },
    [user, isAdminRole, fetchWithAuth],
  );

  const updateDeepLinkProfiles = useCallback(
    async (profiles: DeepLinkProfiles) => {
      if (!user || !isAdminRole) return;
      const response = await fetchWithAuth(
        "/api/v1/admin/settings/deeplink-profiles",
        {
          method: "PUT",
          body: JSON.stringify({ profiles }),
        },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Failed to update deep link profiles");
      }
      setDeepLinkProfiles(data?.profiles || {});
      toast.success("Updated deep link profiles");
    },
    [user, isAdminRole, fetchWithAuth],
  );

  useEffect(() => {
    setAllUsers([]);
    setAdminLoading(false);
    setPaymentRequests([]);
    setPaymentRequestsLoading(false);
    setOutputDomains([...DEFAULT_OUTPUT_DOMAINS]);
    setOutputDomainsLoading(false);
    setDeepLinkProfiles({});
    setDeepLinkProfilesLoading(false);
    setAdminDirty(!!user);
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    void fetchOutputDomains();
    void fetchDeepLinkProfiles();
    void fetchVideoUploadProviderPreference();
  }, [
    user?.id,
    fetchOutputDomains,
    fetchDeepLinkProfiles,
    fetchVideoUploadProviderPreference,
  ]);

  // Auto-fetch admin data
  useEffect(() => {
    if (
      user &&
      isAdminRole &&
      activeTab === "admin" &&
      adminDirty
    ) {
      fetchAllUsers();
      fetchOutputDomains();
      fetchDeepLinkProfiles();
      fetchVideoUploadProviderPreference();
      fetchPaymentRequests();
    }
  }, [
    user,
    isAdminRole,
    activeTab,
    adminDirty,
    fetchAllUsers,
    fetchOutputDomains,
    fetchDeepLinkProfiles,
    fetchVideoUploadProviderPreference,
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
    deepLinkProfiles,
    deepLinkProfilesLoading,
    videoUploadProviderPreference,
    videoUploadProviderPreferenceLoading,
    fetchAllUsers,
    fetchPaymentRequests,
    handleApproveUser,
    handleUpdateSubscription,
    handleUpdateUserRole,
    handleDeleteUser,
    handleConfirmPaymentRequest,
    handleRejectPaymentRequest,
    fetchOutputDomains,
    updateOutputDomains,
    fetchDeepLinkProfiles,
    updateDeepLinkProfiles,
    fetchVideoUploadProviderPreference,
    updateVideoUploadProviderPreference,
    setAdminDirty,
  };
}
