import { useCallback, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import {
  AccessLogEntry,
  BlockedIpEntry,
  SecurityOverview,
  UserProfile,
} from "@/src/types";

interface UseSecurityProps {
  user: User | null;
  profile: UserProfile | null;
  fetchWithAuth: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>;
  activeTab: string;
}

interface TwoFactorSetupState {
  secret: string;
  otpauthUri: string;
}

const getTwoFactorSessionKey = (userId: string) =>
  `hotsnew.2fa.verified.${userId}`;

const createEmptySecurityOverview = (
  twoFactorEnabled: boolean,
  lastVerifiedAt: string | null,
): SecurityOverview => ({
  twoFactorEnabled,
  maskedSecret: null,
  lastVerifiedAt,
  recentAccessLogs: [],
});

export function useSecurity({
  user,
  profile,
  fetchWithAuth,
  activeTab,
}: UseSecurityProps) {
  const [securityOverview, setSecurityOverview] =
    useState<SecurityOverview | null>(null);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [twoFactorSetup, setTwoFactorSetup] =
    useState<TwoFactorSetupState | null>(null);
  const [twoFactorSessionVerified, setTwoFactorSessionVerified] =
    useState(false);
  const [adminAccessLogs, setAdminAccessLogs] = useState<AccessLogEntry[]>([]);
  const [blockedIps, setBlockedIps] = useState<BlockedIpEntry[]>([]);
  const [adminSecurityLoading, setAdminSecurityLoading] = useState(false);

  const isAdminRole =
    profile?.role === "admin" || user?.email === "devluan1996@gmail.com";

  const fetchSecurityOverview = useCallback(async () => {
    if (!user) return;
    setSecurityLoading(true);
    try {
      const response = await fetchWithAuth("/api/v1/user/security");
      const data = await response.json();
      setSecurityOverview(data as SecurityOverview);
    } catch (e: any) {
      toast.error(e.message || "Không thể tải dữ liệu bảo mật");
    } finally {
      setSecurityLoading(false);
    }
  }, [user, fetchWithAuth]);

  const beginTwoFactorSetup = useCallback(async () => {
    const response = await fetchWithAuth("/api/v1/user/security/2fa/setup", {
      method: "POST",
    });
    const data = await response.json();
    setTwoFactorSetup(data as TwoFactorSetupState);
    toast.success("Đã tạo secret 2FA. Hãy nhập mã để bật.");
    return data as TwoFactorSetupState;
  }, [fetchWithAuth]);

  const enableTwoFactor = useCallback(
    async (code: string) => {
      const response = await fetchWithAuth("/api/v1/user/security/2fa/enable", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      await response.json();

      const verifiedAt = new Date().toISOString();
      setSecurityOverview((current) =>
        current
          ? {
              ...current,
              twoFactorEnabled: true,
              lastVerifiedAt: verifiedAt,
            }
          : createEmptySecurityOverview(true, verifiedAt),
      );
      setTwoFactorSetup(null);
      toast.success("Đã bật xác thực 2 lớp.");
      await fetchSecurityOverview();
    },
    [fetchWithAuth, fetchSecurityOverview],
  );

  const disableTwoFactor = useCallback(
    async (code: string) => {
      const response = await fetchWithAuth(
        "/api/v1/user/security/2fa/disable",
        {
          method: "POST",
          body: JSON.stringify({ code }),
        },
      );
      await response.json();

      setSecurityOverview((current) =>
        current
          ? {
              ...current,
              twoFactorEnabled: false,
              maskedSecret: null,
            }
          : createEmptySecurityOverview(false, null),
      );
      setTwoFactorSetup(null);
      toast.success("Đã tắt xác thực 2 lớp.");
      await fetchSecurityOverview();
    },
    [fetchWithAuth, fetchSecurityOverview],
  );

  const verifyTwoFactorChallenge = useCallback(
    async (code: string) => {
      setSecurityLoading(true);
      try {
        const response = await fetchWithAuth(
          "/api/v1/user/security/2fa/challenge",
          {
            method: "POST",
            body: JSON.stringify({ code }),
          },
        );
        await response.json();
        if (user?.id) {
          window.sessionStorage.setItem(getTwoFactorSessionKey(user.id), "1");
        }
        setTwoFactorSessionVerified(true);
        toast.success("Đã xác minh 2FA cho phiên hiện tại.");
        await fetchSecurityOverview();
      } finally {
        setSecurityLoading(false);
      }
    },
    [fetchWithAuth, fetchSecurityOverview, user?.id],
  );

  const fetchAdminSecurity = useCallback(async () => {
    if (!user || !isAdminRole) return;
    setAdminSecurityLoading(true);
    try {
      const [logsResponse, blockedIpsResponse] = await Promise.all([
        fetchWithAuth("/api/v1/admin/security/access-logs?limit=100"),
        fetchWithAuth("/api/v1/admin/security/blocked-ips"),
      ]);
      const [logs, blocked] = await Promise.all([
        logsResponse.json(),
        blockedIpsResponse.json(),
      ]);
      setAdminAccessLogs(logs as AccessLogEntry[]);
      setBlockedIps(blocked as BlockedIpEntry[]);
    } catch (e: any) {
      toast.error(e.message || "Không thể tải dữ liệu admin security");
    } finally {
      setAdminSecurityLoading(false);
    }
  }, [user, isAdminRole, fetchWithAuth]);

  const blockIp = useCallback(
    async (payload: {
      ipAddress: string;
      reason?: string;
      expiresAt?: string;
    }) => {
      const response = await fetchWithAuth(
        "/api/v1/admin/security/blocked-ips",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();
      toast.success("Đã chặn IP.");
      await fetchAdminSecurity();
      return data as BlockedIpEntry;
    },
    [fetchWithAuth, fetchAdminSecurity],
  );

  const unblockIp = useCallback(
    async (blockedIpId: string) => {
      const response = await fetchWithAuth(
        `/api/v1/admin/security/blocked-ips/${blockedIpId}`,
        { method: "DELETE" },
      );
      await response.json();
      toast.success("Đã bỏ chặn IP.");
      await fetchAdminSecurity();
    },
    [fetchWithAuth, fetchAdminSecurity],
  );

  useEffect(() => {
    setSecurityOverview(null);
    setTwoFactorSetup(null);
    setTwoFactorSessionVerified(false);
    setAdminAccessLogs([]);
    setBlockedIps([]);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setTwoFactorSessionVerified(false);
      return;
    }
    setTwoFactorSessionVerified(
      window.sessionStorage.getItem(getTwoFactorSessionKey(user.id)) === "1",
    );
  }, [user?.id]);

  useEffect(() => {
    if (user && !securityOverview && !securityLoading) {
      fetchSecurityOverview();
    }
  }, [user?.id, securityOverview, securityLoading, fetchSecurityOverview]);

  useEffect(() => {
    if (activeTab === "admin" && user && isAdminRole) {
      fetchAdminSecurity();
    }
  }, [activeTab, user?.id, isAdminRole, fetchAdminSecurity]);

  return {
    securityOverview,
    securityLoading,
    twoFactorSetup,
    beginTwoFactorSetup,
    enableTwoFactor,
    disableTwoFactor,
    twoFactorSessionVerified,
    verifyTwoFactorChallenge,
    refreshSecurityOverview: fetchSecurityOverview,
    adminAccessLogs,
    blockedIps,
    adminSecurityLoading,
    refreshAdminSecurity: fetchAdminSecurity,
    blockIp,
    unblockIp,
  };
}
