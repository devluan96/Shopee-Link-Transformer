import { useState, useCallback, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { UserProfile, LinkStats, AnalyticsData } from "@/src/types";
import { toast } from "sonner";

interface UseAnalyticsProps {
  user: User | null;
  profile: UserProfile | null;
  currentWorkspaceId?: string;
  workspaceResolved?: boolean;
  fetchWithAuth: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>;
  activeTab: string;
  linksLength: number;
}

export interface AnalyticsState {
  stats: LinkStats;
  analyticsData: AnalyticsData;
  statsDirty: boolean;
  analyticsDirty: boolean;
}

export interface AnalyticsActions {
  fetchStats: () => Promise<void>;
  fetchAnalytics: () => Promise<void>;
  setStatsDirty: (v: boolean) => void;
  setAnalyticsDirty: (v: boolean) => void;
  refreshStats: () => void;
  refreshAnalytics: () => void;
}

const emptyStats: LinkStats = {
  totalLinks: 0,
  totalClicks: 0,
  recentClicks: [],
  topLinks: [],
  growthPercentage: 0,
};

const emptyAnalyticsData: AnalyticsData = {
  history: [],
  topLinks: [],
  trafficSources: [],
  growthPercentage: 0,
};

export function useAnalytics({
  user,
  profile,
  currentWorkspaceId,
  workspaceResolved = false,
  fetchWithAuth,
  activeTab,
}: UseAnalyticsProps): AnalyticsState & AnalyticsActions {
  const [stats, setStats] = useState<LinkStats>(emptyStats);
  const [analyticsData, setAnalyticsData] =
    useState<AnalyticsData>(emptyAnalyticsData);
  const [statsDirty, setStatsDirty] = useState(true);
  const [analyticsDirty, setAnalyticsDirty] = useState(true);

  const buildWorkspaceQuery = useCallback(() => {
    if (!currentWorkspaceId) return "";
    return `?workspaceId=${encodeURIComponent(currentWorkspaceId)}`;
  }, [currentWorkspaceId]);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetchWithAuth(
        `/api/v1/user/stats${buildWorkspaceQuery()}`,
      );
      const data = await response.json();
      setStats(data);
      setStatsDirty(false);
    } catch (e) {
      console.error(e);
    }
  }, [user, fetchWithAuth, buildWorkspaceQuery]);

  const fetchAnalytics = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetchWithAuth(
        `/api/v1/user/analytics${buildWorkspaceQuery()}`,
      );
      const data = await res.json();
      setAnalyticsData(data);
      setAnalyticsDirty(false);
    } catch (e: any) {
      console.error("Fetch analytics fail:", e?.message || e);
      toast.error("Không thể tải dữ liệu phân tích. Vui lòng thử lại sau.");
    }
  }, [user, fetchWithAuth, buildWorkspaceQuery]);

  const refreshStats = useCallback(() => setStatsDirty(true), []);
  const refreshAnalytics = useCallback(() => setAnalyticsDirty(true), []);

  useEffect(() => {
    setStats(emptyStats);
    setAnalyticsData(emptyAnalyticsData);
    setStatsDirty(!!user);
    setAnalyticsDirty(!!user);
  }, [user?.id, currentWorkspaceId]);

  useEffect(() => {
    const isAdminRole =
      profile?.role === "admin" || user?.email === "devluan1996@gmail.com";
    const isApproved = profile?.status === "approved" || isAdminRole;

    if (
      user &&
      workspaceResolved &&
      isApproved &&
      (activeTab === "dashboard" || activeTab === "analytics") &&
      statsDirty
    ) {
      fetchStats();
    }
  }, [user, profile, workspaceResolved, activeTab, statsDirty, fetchStats]);

  useEffect(() => {
    if (activeTab === "analytics" && analyticsDirty && user && workspaceResolved) {
      fetchAnalytics();
    }
  }, [activeTab, analyticsDirty, user?.id, workspaceResolved, fetchAnalytics]);

  return {
    stats,
    analyticsData,
    statsDirty,
    analyticsDirty,
    fetchStats,
    fetchAnalytics,
    setStatsDirty,
    setAnalyticsDirty,
    refreshStats,
    refreshAnalytics,
  };
}

