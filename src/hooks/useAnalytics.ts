import { useState, useCallback, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import {
  AnalyticsData,
  AnalyticsFocusContext,
  LinkStats,
  UserProfile,
} from "@/src/types";
import { toast } from "sonner";
import { supabase } from "@/src/lib/supabase";

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
  focusContext?: AnalyticsFocusContext | null;
}

export interface AnalyticsState {
  stats: LinkStats;
  analyticsData: AnalyticsData;
  statsUpdatedAt: string | null;
  analyticsUpdatedAt: string | null;
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
  todayClicks: 0,
  yesterdayClicks: 0,
  todayShopeeClicks: 0,
  todayTiktokClicks: 0,
  recentClicks: [],
  recentShopeeClicks: [],
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
  focusContext = null,
}: UseAnalyticsProps): AnalyticsState & AnalyticsActions {
  const [stats, setStats] = useState<LinkStats>(emptyStats);
  const [analyticsData, setAnalyticsData] =
    useState<AnalyticsData>(emptyAnalyticsData);
  const [statsUpdatedAt, setStatsUpdatedAt] = useState<string | null>(null);
  const [analyticsUpdatedAt, setAnalyticsUpdatedAt] = useState<string | null>(
    null,
  );
  const [statsDirty, setStatsDirty] = useState(true);
  const [analyticsDirty, setAnalyticsDirty] = useState(true);

  const buildStatsQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (currentWorkspaceId) {
      params.set("workspaceId", currentWorkspaceId);
    }
    const query = params.toString();
    return query ? `?${query}` : "";
  }, [currentWorkspaceId]);

  const buildAnalyticsQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (currentWorkspaceId) {
      params.set("workspaceId", currentWorkspaceId);
    }
    if (focusContext?.source) {
      params.set("source", focusContext.source);
    }
    if (focusContext?.period) {
      params.set("period", focusContext.period);
    }
    const query = params.toString();
    return query ? `?${query}` : "";
  }, [currentWorkspaceId, focusContext?.period, focusContext?.source]);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetchWithAuth(
        `/api/v1/user/stats${buildStatsQuery()}`,
      );
      const data = await response.json();
      setStats(data);
      setStatsUpdatedAt(new Date().toISOString());
      setStatsDirty(false);
    } catch (e) {
      console.error(e);
    }
  }, [user, fetchWithAuth, buildStatsQuery]);

  const fetchAnalytics = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetchWithAuth(
        `/api/v1/user/analytics${buildAnalyticsQuery()}`,
      );
      const data = await res.json();
      setAnalyticsData(data);
      setAnalyticsUpdatedAt(new Date().toISOString());
      setAnalyticsDirty(false);
    } catch (e: any) {
      console.error("Fetch analytics fail:", e?.message || e);
      toast.error("Không thể tải dữ liệu phân tích. Vui lòng thử lại sau.");
    }
  }, [user, fetchWithAuth, buildAnalyticsQuery]);

  const refreshStats = useCallback(() => setStatsDirty(true), []);
  const refreshAnalytics = useCallback(() => setAnalyticsDirty(true), []);

  useEffect(() => {
    setStats(emptyStats);
    setAnalyticsData(emptyAnalyticsData);
    setStatsUpdatedAt(null);
    setAnalyticsUpdatedAt(null);
    setStatsDirty(!!user);
    setAnalyticsDirty(!!user);
  }, [user?.id, currentWorkspaceId]);

  useEffect(() => {
    setAnalyticsData(emptyAnalyticsData);
    setAnalyticsUpdatedAt(null);
    setAnalyticsDirty(!!user);
  }, [focusContext?.source, focusContext?.period, user?.id]);

  useEffect(() => {
    if (!user?.id || !workspaceResolved) return;

    const channel = supabase
      .channel(`analytics-links-sync:${user.id}:${currentWorkspaceId || "all"}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "links",
          ...(currentWorkspaceId
            ? { filter: `workspace_id=eq.${currentWorkspaceId}` }
            : {}),
        },
        () => {
          setStatsDirty(true);
          setAnalyticsDirty(true);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentWorkspaceId, user?.id, workspaceResolved]);

  useEffect(() => {
    const isAdminRole = profile?.role === "admin";
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
    statsUpdatedAt,
    analyticsUpdatedAt,
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

