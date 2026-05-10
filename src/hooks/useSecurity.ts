import { useCallback, useEffect, useRef, useState } from "react";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import {
  AccessLogEntry,
  BlockedIpEntry,
  SecurityOverview,
  UserProfile,
} from "@/src/types";
import { supabase } from "@/src/lib/supabase";

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
  const accessLogsRefreshTimeoutRef = useRef<number | null>(null);

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
      toast.error(e.message || "Khong the tai du lieu bao mat");
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
    toast.success("Da tao secret 2FA. Hay nhap ma de bat.");
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
      toast.success("Da bat xac thuc 2 lop.");
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
      toast.success("Da tat xac thuc 2 lop.");
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
        toast.success("Da xac minh 2FA cho phien hien tai.");
        await fetchSecurityOverview();
      } finally {
        setSecurityLoading(false);
      }
    },
    [fetchWithAuth, fetchSecurityOverview, user?.id],
  );

  const fetchAdminAccessLogs = useCallback(
    async (options?: { reportError?: boolean }) => {
      if (!user || !isAdminRole) return;
      try {
        const response = await fetchWithAuth(
          "/api/v1/admin/security/access-logs?limit=100",
        );
        const logs = await response.json();
        setAdminAccessLogs(logs as AccessLogEntry[]);
      } catch (e: any) {
        if (options?.reportError !== false) {
          toast.error(e.message || "Khong the tai nhat ky truy cap");
        }
      }
    },
    [user, isAdminRole, fetchWithAuth],
  );

  const fetchBlockedIpList = useCallback(
    async (options?: { reportError?: boolean }) => {
      if (!user || !isAdminRole) return;
      try {
        const response = await fetchWithAuth(
          "/api/v1/admin/security/blocked-ips",
        );
        const blocked = await response.json();
        setBlockedIps(blocked as BlockedIpEntry[]);
      } catch (e: any) {
        if (options?.reportError !== false) {
          toast.error(e.message || "Khong the tai danh sach IP bi chan");
        }
      }
    },
    [user, isAdminRole, fetchWithAuth],
  );

  const fetchAdminSecurity = useCallback(async () => {
    if (!user || !isAdminRole) return;
    setAdminSecurityLoading(true);
    try {
      await Promise.all([fetchAdminAccessLogs(), fetchBlockedIpList()]);
    } finally {
      setAdminSecurityLoading(false);
    }
  }, [user, isAdminRole, fetchAdminAccessLogs, fetchBlockedIpList]);

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
      toast.success("Da chan IP.");
      await fetchBlockedIpList({ reportError: false });
      return data as BlockedIpEntry;
    },
    [fetchWithAuth, fetchBlockedIpList],
  );

  const unblockIp = useCallback(
    async (blockedIpId: string) => {
      const response = await fetchWithAuth(
        `/api/v1/admin/security/blocked-ips/${blockedIpId}`,
        { method: "DELETE" },
      );
      await response.json();
      toast.success("Da bo chan IP.");
      await fetchBlockedIpList({ reportError: false });
    },
    [fetchWithAuth, fetchBlockedIpList],
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
      void fetchSecurityOverview();
    }
  }, [user?.id, securityOverview, securityLoading, fetchSecurityOverview]);

  useEffect(() => {
    if (activeTab === "admin" && user && isAdminRole) {
      void fetchAdminSecurity();
    }
  }, [activeTab, user?.id, isAdminRole, fetchAdminSecurity]);

  useEffect(() => {
    if (activeTab !== "admin" || !user?.id || !isAdminRole) {
      return;
    }

    const scheduleAccessLogsRefresh = () => {
      if (accessLogsRefreshTimeoutRef.current) {
        window.clearTimeout(accessLogsRefreshTimeoutRef.current);
      }

      accessLogsRefreshTimeoutRef.current = window.setTimeout(() => {
        accessLogsRefreshTimeoutRef.current = null;
        void fetchAdminAccessLogs({ reportError: false });
      }, 1500);
    };

    const adminSecurityChannel = supabase
      .channel(`admin-security-sync:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "blocked_ips",
        },
        () => {
          void fetchBlockedIpList({ reportError: false });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "access_logs",
        },
        () => {
          scheduleAccessLogsRefresh();
        },
      )
      .subscribe();

    return () => {
      if (accessLogsRefreshTimeoutRef.current) {
        window.clearTimeout(accessLogsRefreshTimeoutRef.current);
        accessLogsRefreshTimeoutRef.current = null;
      }
      void supabase.removeChannel(adminSecurityChannel);
    };
  }, [activeTab, user?.id, isAdminRole, fetchAdminAccessLogs, fetchBlockedIpList]);

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
