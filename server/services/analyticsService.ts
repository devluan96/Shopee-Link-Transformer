import { SupabaseClient } from "../config/supabase.js";
import {
  fetchOutboundEventsForLinkIds,
  filterDisplayableOutboundEvents,
  isShopeeDestinationUrl,
  isTikTokDestinationUrl,
} from "../utils/clickTracking.js";
import { normalizeTrafficSource } from "../utils/normalizers.js";
import { getAccessibleWorkspaceIds } from "./workspaceService.js";

type DailyClicksPoint = { date: string; clicks: number };
export type AnalyticsFilterSource = "all" | "shopee" | "tiktok";
export type AnalyticsFilterPeriod = "today" | "7d" | "30d";

type AnalyticsFilter = {
  source?: AnalyticsFilterSource;
  period?: AnalyticsFilterPeriod;
};

type OutboundEventLike = {
  link_id?: string | null;
  destination_url?: string | null;
  source?: string | null;
  source_detail?: string | null;
  referer?: string | null;
  created_at?: string | null;
};

type OutboundEventSummary = {
  totalClicks: number;
  totalShopeeClicks: number;
  totalTiktokClicks: number;
  todayClicks: number;
  yesterdayClicks: number;
  todayShopeeClicks: number;
  todayTiktokClicks: number;
  last30DaysClicks: number;
  last30DaysShopeeClicks: number;
  last30DaysTiktokClicks: number;
  growthPercentage: number;
  recentClicks: DailyClicksPoint[];
  recentShopeeClicks: DailyClicksPoint[];
  topLinksAllTime: Map<string, number>;
  topLinksLast30Days: Map<string, number>;
  trafficSourcesLast30Days: Map<string, number>;
};

type FocusedAnalyticsSummary = {
  totalClicks: number;
  totalShopeeClicks: number;
  totalTiktokClicks: number;
  growthPercentage: number;
  history: DailyClicksPoint[];
  topLinkCounts: Map<string, number>;
  trafficSources: Map<string, number>;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const toVietnamDateKey = (value: Date | string) => {
  const date = typeof value === "string" ? new Date(value) : value;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
};

const toSortedDailyPoints = (historyMap: Record<string, number>) =>
  Object.entries(historyMap)
    .map(([date, total]) => ({ date, clicks: total }))
    .sort((a, b) => a.date.localeCompare(b.date));

const isSourceMatch = (
  event: OutboundEventLike,
  source: AnalyticsFilterSource,
) => {
  if (source === "all") return true;
  if (source === "shopee") return isShopeeDestinationUrl(event.destination_url);
  if (source === "tiktok") return isTikTokDestinationUrl(event.destination_url);
  return true;
};

const getPeriodDayCount = (period: AnalyticsFilterPeriod) => {
  if (period === "today") return 1;
  if (period === "7d") return 7;
  return 30;
};

const buildDateKeyWindow = (
  referenceDate: Date,
  dayCount: number,
  offsetDays = 0,
) => {
  const keys = new Set<string>();
  for (let index = 0; index < dayCount; index += 1) {
    const nextDate = new Date(
      referenceDate.getTime() - (offsetDays + index) * DAY_MS,
    );
    keys.add(toVietnamDateKey(nextDate));
  }
  return keys;
};

export const summarizeFocusedAnalytics = (
  events: OutboundEventLike[],
  filter: AnalyticsFilter = {},
  referenceDate = new Date(),
): FocusedAnalyticsSummary => {
  const displayableEvents = filterDisplayableOutboundEvents(events as any[]);
  const source = filter.source || "all";
  const period = filter.period || "30d";
  const dayCount = getPeriodDayCount(period);
  const currentWindowKeys = buildDateKeyWindow(referenceDate, dayCount, 0);
  const previousWindowKeys = buildDateKeyWindow(referenceDate, dayCount, dayCount);
  const historyMap: Record<string, number> = {};
  const topLinkCounts = new Map<string, number>();
  const trafficSources = new Map<string, number>();

  let totalClicks = 0;
  let totalShopeeClicks = 0;
  let totalTiktokClicks = 0;
  let previousWindowClicks = 0;

  displayableEvents.forEach((event) => {
    if (!isSourceMatch(event, source) || !event.created_at) {
      return;
    }

    const createdAt = new Date(event.created_at);
    if (Number.isNaN(createdAt.getTime())) {
      return;
    }

    const dateKey = toVietnamDateKey(event.created_at);
    if (previousWindowKeys.has(dateKey)) {
      previousWindowClicks += 1;
    }

    if (!currentWindowKeys.has(dateKey)) {
      return;
    }

    const isShopee = isShopeeDestinationUrl(event.destination_url);
    const isTikTok = isTikTokDestinationUrl(event.destination_url);
    const linkId = event.link_id || undefined;

    totalClicks += 1;
    if (isShopee) totalShopeeClicks += 1;
    if (isTikTok) totalTiktokClicks += 1;

    historyMap[dateKey] = (historyMap[dateKey] || 0) + 1;

    if (linkId) {
      topLinkCounts.set(linkId, (topLinkCounts.get(linkId) || 0) + 1);
    }

    const trafficSource =
      normalizeTrafficSource(event.source_detail) ||
      normalizeTrafficSource(event.source) ||
      normalizeTrafficSource(event.referer) ||
      "direct";
    trafficSources.set(
      trafficSource,
      (trafficSources.get(trafficSource) || 0) + 1,
    );
  });

  const growthPercentage =
    previousWindowClicks === 0
      ? totalClicks > 0
        ? 100
        : 0
      : Math.round(
          ((totalClicks - previousWindowClicks) / previousWindowClicks) * 100,
        );

  return {
    totalClicks,
    totalShopeeClicks,
    totalTiktokClicks,
    growthPercentage,
    history: toSortedDailyPoints(historyMap),
    topLinkCounts,
    trafficSources,
  };
};

export const summarizeOutboundEvents = (
  events: OutboundEventLike[],
  referenceDate = new Date(),
): OutboundEventSummary => {
  const displayableEvents = filterDisplayableOutboundEvents(events as any[]);
  const today = new Date(referenceDate);
  const yesterday = new Date(referenceDate.getTime() - 24 * 60 * 60 * 1000);
  const todayKey = toVietnamDateKey(today);
  const yesterdayKey = toVietnamDateKey(yesterday);
  const thirtyDaysAgo = new Date(referenceDate);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date(referenceDate);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const recentClicksMap: Record<string, number> = {};
  const recentShopeeClicksMap: Record<string, number> = {};
  const topLinksAllTime = new Map<string, number>();
  const topLinksLast30Days = new Map<string, number>();
  const trafficSourcesLast30Days = new Map<string, number>();

  let totalClicks = 0;
  let totalShopeeClicks = 0;
  let totalTiktokClicks = 0;
  let todayClicks = 0;
  let yesterdayClicks = 0;
  let todayShopeeClicks = 0;
  let todayTiktokClicks = 0;
  let last30DaysClicks = 0;
  let last30DaysShopeeClicks = 0;
  let last30DaysTiktokClicks = 0;
  let previousWindowClicks = 0;

  displayableEvents.forEach((event) => {
    const isShopee = isShopeeDestinationUrl(event.destination_url);
    const isTikTok = isTikTokDestinationUrl(event.destination_url);
    const linkId = event.link_id || undefined;

    totalClicks += 1;
    if (isShopee) totalShopeeClicks += 1;
    if (isTikTok) totalTiktokClicks += 1;

    if (linkId) {
      topLinksAllTime.set(linkId, (topLinksAllTime.get(linkId) || 0) + 1);
    }

    if (!event.created_at) return;
    const createdAt = new Date(event.created_at);
    if (Number.isNaN(createdAt.getTime()) || createdAt < sixtyDaysAgo) return;
    const date = toVietnamDateKey(event.created_at);

    if (date === todayKey) {
      todayClicks += 1;
      if (isShopee) todayShopeeClicks += 1;
      if (isTikTok) todayTiktokClicks += 1;
    } else if (date === yesterdayKey) {
      yesterdayClicks += 1;
    }

    if (createdAt >= thirtyDaysAgo) {
      recentClicksMap[date] = (recentClicksMap[date] || 0) + 1;
      last30DaysClicks += 1;

      if (isShopee) {
        recentShopeeClicksMap[date] = (recentShopeeClicksMap[date] || 0) + 1;
        last30DaysShopeeClicks += 1;
      }

      if (isTikTok) {
        last30DaysTiktokClicks += 1;
      }

      if (linkId) {
        topLinksLast30Days.set(linkId, (topLinksLast30Days.get(linkId) || 0) + 1);
      }

      const source =
        normalizeTrafficSource(event.source_detail) ||
        normalizeTrafficSource(event.source) ||
        normalizeTrafficSource(event.referer) ||
        "direct";
      trafficSourcesLast30Days.set(
        source,
        (trafficSourcesLast30Days.get(source) || 0) + 1,
      );
      return;
    }

    previousWindowClicks += 1;
  });

  const growthPercentage =
    previousWindowClicks === 0
      ? 100
      : Math.round(
          ((last30DaysClicks - previousWindowClicks) / previousWindowClicks) *
            100,
        );

  return {
    totalClicks,
    totalShopeeClicks,
    totalTiktokClicks,
    todayClicks,
    yesterdayClicks,
    todayShopeeClicks,
    todayTiktokClicks,
    last30DaysClicks,
    last30DaysShopeeClicks,
    last30DaysTiktokClicks,
    growthPercentage,
    recentClicks: toSortedDailyPoints(recentClicksMap),
    recentShopeeClicks: toSortedDailyPoints(recentShopeeClicksMap),
    topLinksAllTime,
    topLinksLast30Days,
    trafficSourcesLast30Days,
  };
};

const getFilteredLinks = async (
  supabase: SupabaseClient,
  userId: string,
  workspaceId?: string,
) => {
  const accessibleWorkspaceIds = await getAccessibleWorkspaceIds(supabase, userId);
  const workspaceIds = workspaceId
    ? accessibleWorkspaceIds.includes(workspaceId)
      ? [workspaceId]
      : []
    : accessibleWorkspaceIds;
  if (!workspaceIds.length) return [];

  let query = supabase
    .from("links")
    .select("id, short_code, slug, custom_title, workspace_id")
    .in("workspace_id", workspaceIds);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const getUserStats = async (
  supabase: SupabaseClient,
  userId: string,
  workspaceId?: string,
) => {
  const links = await getFilteredLinks(supabase, userId, workspaceId);
  const count = links.length;
  if (!count) {
    return {
      totalLinks: 0,
      totalClicks: 0,
      averageClicks: 0,
      choiceModeCount: 0,
      expiringSoonCount: 0,
      todayClicks: 0,
      yesterdayClicks: 0,
      todayShopeeClicks: 0,
      todayTiktokClicks: 0,
      recentClicks: [],
      recentShopeeClicks: [],
      topLinks: [],
      growthPercentage: 0,
    };
  }

  const linkIds = links.map((link: any) => link.id).filter(Boolean);
  const linkMetaMap = new Map<string, { short_code: string; slug?: string; title: string }>(
    links.map((link: any) => [
      link.id,
      {
        short_code: link.short_code,
        slug: link.slug || undefined,
        title: link.custom_title || link.short_code,
      },
    ]),
  );

  const rawEvents = filterDisplayableOutboundEvents(
    await fetchOutboundEventsForLinkIds(supabase, linkIds),
  );
  const eventShortCodeMap = new Map<string, string>();
  rawEvents.forEach((event: any) => {
    if (event.link_id && event.short_code && !eventShortCodeMap.has(event.link_id)) {
      eventShortCodeMap.set(event.link_id, event.short_code);
    }
  });

  const clicks = rawEvents;
  const summary = summarizeOutboundEvents(clicks);
  const now = new Date();
  const choiceModeCount = links.filter((link: any) => !!link.secondary_url).length;
  const expiringSoonCount = links.filter((link: any) => {
    if (!link.expires_at) return false;
    const expiresAt = new Date(link.expires_at);
    if (Number.isNaN(expiresAt.getTime())) return false;
    if (expiresAt < now) return false;
    const diffHours = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours <= 24;
  }).length;

  const topLinks = Array.from(summary.topLinksAllTime.entries())
    .map(([id, total]) => ({
      short_code: linkMetaMap.get(id)?.short_code || eventShortCodeMap.get(id) || "",
      slug: linkMetaMap.get(id)?.slug,
      title: linkMetaMap.get(id)?.title || eventShortCodeMap.get(id) || "",
      clicks: total,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);

  return {
    totalLinks: count,
    totalClicks: summary.totalClicks,
    averageClicks: count ? Math.round(summary.totalClicks / count) : 0,
    totalShopeeClicks: summary.totalShopeeClicks,
    totalTiktokClicks: summary.totalTiktokClicks,
    choiceModeCount,
    expiringSoonCount,
    todayClicks: summary.todayClicks,
    yesterdayClicks: summary.yesterdayClicks,
    todayShopeeClicks: summary.todayShopeeClicks,
    todayTiktokClicks: summary.todayTiktokClicks,
    recentClicks: summary.recentClicks,
    recentShopeeClicks: summary.recentShopeeClicks,
    topLinks,
    growthPercentage: summary.growthPercentage,
  };
};

export const getUserAnalytics = async (
  supabase: SupabaseClient,
  userId: string,
  workspaceId?: string,
  filter: AnalyticsFilter = {},
) => {
  const links = await getFilteredLinks(supabase, userId, workspaceId);
  if (!links.length) {
    return {
      history: [],
      topLinks: [],
      trafficSources: [],
      growthPercentage: 0,
    };
  }

  const linkIds = links.map((link: any) => link.id).filter(Boolean);
  const clicks = filterDisplayableOutboundEvents(
    await fetchOutboundEventsForLinkIds(supabase, linkIds),
  );
  const summary = summarizeFocusedAnalytics(clicks, filter);

  const trafficSources = Array.from(summary.trafficSources.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const linkMetaMap = new Map<string, { short_code: string; slug?: string; title: string }>(
    links.map((link: any) => [
      link.id,
      {
        short_code: link.short_code,
        slug: link.slug || undefined,
        title: link.custom_title || link.short_code,
      },
    ]),
  );

  const eventShortCodeMap = new Map<string, string>();
  clicks.forEach((event: any) => {
    if (event.link_id && event.short_code && !eventShortCodeMap.has(event.link_id)) {
      eventShortCodeMap.set(event.link_id, event.short_code);
    }
  });

  const topLinks = Array.from(summary.topLinkCounts.entries())
    .map(([id, clicks]) => ({
      id,
      short_code: linkMetaMap.get(id)?.short_code || eventShortCodeMap.get(id) || "",
      slug: linkMetaMap.get(id)?.slug,
      title: linkMetaMap.get(id)?.title || eventShortCodeMap.get(id) || "Unknown",
      clicks,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);

  return {
    history: summary.history,
    topLinks,
    trafficSources,
    growthPercentage: summary.growthPercentage,
    totalShopeeClicks: summary.totalShopeeClicks,
    totalTiktokClicks: summary.totalTiktokClicks,
  };
};
