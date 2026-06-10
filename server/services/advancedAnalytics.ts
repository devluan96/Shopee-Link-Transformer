import { SupabaseClient } from "../config/supabase.js";
import {
  fetchOutboundEventsForLinkIds,
  fetchClicksForLinkIds,
  filterDisplayableOutboundEvents,
  filterRealClicks,
  isShopeeDestinationUrl,
  isTikTokDestinationUrl,
} from "../utils/clickTracking.js";
import { getAccessibleWorkspaceIds } from "./workspaceService.js";
import type {
  AnalyticsFilterPeriod,
  AnalyticsFilterSource,
} from "./analyticsService.js";
import { LinkOutboundEvent } from "../types/index.js";

export interface GeographicStats {
  countries: Array<{ name: string; code?: string; clicks: number }>;
  cities: Array<{ name: string; country?: string; clicks: number }>;
  totalCountries: number;
  totalCities: number;
}

export interface DeviceStats {
  deviceTypes: Array<{ type: string; clicks: number; percentage: number }>;
  browsers: Array<{ name: string; clicks: number; percentage: number }>;
  operatingSystems: Array<{ name: string; clicks: number; percentage: number }>;
  topDeviceBrands?: Array<{ brand: string; clicks: number }>;
}

export interface TimeStats {
  hourlyDistribution: Array<{ hour: number; clicks: number }>;
  dailyDistribution: Array<{ day: string; clicks: number }>;
  peakHour: number;
  peakDay: string;
}

interface LinkExportMeta {
  short_code: string;
  title: string;
  url: string;
}

type AnalyticsEventRecord = {
  link_id: string;
  created_at?: string | null;
  source?: string | null;
  source_detail?: string | null;
  referer?: string | null;
  destination_url?: string | null;
  stage?: "primary" | "secondary" | null;
  user_agent?: string | null;
  ip_address?: string | null;
  country?: string | null;
  country_code?: string | null;
  city?: string | null;
  device_type?: string | null;
  device_brand?: string | null;
  browser?: string | null;
  os?: string | null;
};

type AnalyticsFilter = {
  source?: AnalyticsFilterSource;
  period?: AnalyticsFilterPeriod;
};

type ScopedLink = {
  id: string;
  short_code: string;
  slug?: string | null;
  custom_title?: string | null;
  original_url?: string | null;
  secondary_url?: string | null;
  ab_variant_b_original_url?: string | null;
  ab_variant_b_secondary_url?: string | null;
  workspace_id?: string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const EVENT_MATCH_WINDOW_MS = 15 * 60 * 1000;

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

const getPeriodDayCount = (period: AnalyticsFilterPeriod = "30d") => {
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
    keys.add(
      toVietnamDateKey(
        new Date(referenceDate.getTime() - (offsetDays + index) * DAY_MS),
      ),
    );
  }
  return keys;
};

export const matchesLinkAnalyticsSource = (
  link: Partial<ScopedLink>,
  source: AnalyticsFilterSource = "all",
) => {
  if (source === "all") return true;

  const urls = [
    link.original_url,
    link.secondary_url,
    link.ab_variant_b_original_url,
    link.ab_variant_b_secondary_url,
  ];

  return urls.some((value) =>
    source === "shopee"
      ? isShopeeDestinationUrl(value)
      : isTikTokDestinationUrl(value),
  );
};

export const filterClicksByAnalyticsPeriod = <
  T extends { created_at?: string | null },
>(
  clicks: T[],
  period: AnalyticsFilterPeriod = "30d",
  referenceDate = new Date(),
) => {
  const currentWindowKeys = buildDateKeyWindow(
    referenceDate,
    getPeriodDayCount(period),
  );

  return clicks.filter((click) => {
    if (!click?.created_at) return false;
    return currentWindowKeys.has(toVietnamDateKey(click.created_at));
  });
};

export const buildAnalyticsEvents = (
  outboundEvents: LinkOutboundEvent[],
  clicks: any[],
): AnalyticsEventRecord[] => {
  const clicksByLinkId = new Map<string, any[]>();

  clicks.forEach((click) => {
    const linkId = typeof click?.link_id === "string" ? click.link_id : "";
    if (!linkId) return;
    if (!clicksByLinkId.has(linkId)) {
      clicksByLinkId.set(linkId, []);
    }
    clicksByLinkId.get(linkId)!.push(click);
  });

  clicksByLinkId.forEach((items) => {
    items.sort((a, b) => {
      const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0;
      return aTime - bTime;
    });
  });

  const matchClick = (event: LinkOutboundEvent) => {
    const linkId = event.link_id;
    const candidates = clicksByLinkId.get(linkId) || [];
    const eventTime = event.created_at ? new Date(event.created_at).getTime() : NaN;
    const eventIp = event.ip_address || null;
    const eventUa = event.user_agent || null;

    const scoreCandidate = (click: any) => {
      const clickTime = click?.created_at ? new Date(click.created_at).getTime() : NaN;
      if (Number.isNaN(eventTime) || Number.isNaN(clickTime)) return Number.POSITIVE_INFINITY;
      return Math.abs(clickTime - eventTime);
    };

    const strictMatch = candidates
      .filter((click) => {
        const clickTime = click?.created_at ? new Date(click.created_at).getTime() : NaN;
        const clickIp = click?.ip_address || click?.ip || null;
        const clickUa = click?.user_agent || null;
        if (Number.isNaN(eventTime) || Number.isNaN(clickTime)) return false;
        if (Math.abs(clickTime - eventTime) > EVENT_MATCH_WINDOW_MS) return false;
        if (eventIp && clickIp && eventIp !== clickIp) return false;
        if (eventUa && clickUa && eventUa !== clickUa) return false;
        return true;
      })
      .sort((a, b) => scoreCandidate(a) - scoreCandidate(b))[0];

    if (strictMatch) return strictMatch;

    return candidates
      .filter((click) => {
        const clickTime = click?.created_at ? new Date(click.created_at).getTime() : NaN;
        if (Number.isNaN(eventTime) || Number.isNaN(clickTime)) return false;
        return Math.abs(clickTime - eventTime) <= EVENT_MATCH_WINDOW_MS;
      })
      .sort((a, b) => scoreCandidate(a) - scoreCandidate(b))[0];
  };

  return outboundEvents.map((event) => {
    const matchedClick = matchClick(event);
    return {
      ...event,
      country: matchedClick?.country || null,
      country_code: matchedClick?.country_code || null,
      city: matchedClick?.city || null,
      device_type: matchedClick?.device_type || null,
      device_brand: matchedClick?.device_brand || null,
      browser: matchedClick?.browser || null,
      os: matchedClick?.os || null,
    };
  });
};

const getFilteredAnalyticsEvents = async (
  supabase: SupabaseClient,
  userId: string,
  linkId?: string,
  workspaceId?: string,
  filter: AnalyticsFilter = {},
) => {
  const links = (await getScopedLinks(
    supabase,
    userId,
    linkId,
    workspaceId,
  )) as ScopedLink[];
  const source = filter.source || "all";
  const scopedLinks = links.filter((link) =>
    matchesLinkAnalyticsSource(link, source),
  );
  const linkIds = scopedLinks.map((l) => l.id);

  if (linkIds.length === 0) {
    return { links: scopedLinks, events: [] as AnalyticsEventRecord[] };
  }

  const rawOutboundEvents = await fetchOutboundEventsForLinkIds(supabase, linkIds);
  const filteredOutboundEvents = filterDisplayableOutboundEvents(rawOutboundEvents).filter(
    (event) => {
      if (source === "shopee") return isShopeeDestinationUrl(event.destination_url);
      if (source === "tiktok") return isTikTokDestinationUrl(event.destination_url);
      return true;
    },
  );
  const rawClicks = await fetchClicksForLinkIds(supabase, linkIds);
  const realClicks = filterRealClicks(rawClicks);
  const period = filter.period || "30d";
  const currentEvents = filterClicksByAnalyticsPeriod(filteredOutboundEvents, period);

  return {
    links: scopedLinks,
    events: buildAnalyticsEvents(currentEvents, realClicks),
  };
};

const getScopedLinks = async (
  supabase: SupabaseClient,
  userId: string,
  linkId?: string,
  workspaceId?: string,
) => {
  const accessibleWorkspaceIds = await getAccessibleWorkspaceIds(supabase, userId);
  const workspaceIds = workspaceId
    ? accessibleWorkspaceIds.includes(workspaceId)
      ? [workspaceId]
      : []
    : accessibleWorkspaceIds;
  if (!workspaceIds.length) {
    return [];
  }

  let query = supabase
    .from("links")
    .select(
      "id, short_code, slug, custom_title, original_url, secondary_url, ab_variant_b_original_url, ab_variant_b_secondary_url, workspace_id",
    )
    .in("workspace_id", workspaceIds);

  if (linkId) {
    query = query.eq("id", linkId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

// Get geographic statistics
export const getGeographicStats = async (
  supabase: SupabaseClient,
  userId: string,
  linkId?: string,
  workspaceId?: string,
  filter: AnalyticsFilter = {},
): Promise<GeographicStats> => {
  const { events } = await getFilteredAnalyticsEvents(
    supabase,
    userId,
    linkId,
    workspaceId,
    filter,
  );

  if (events.length === 0) {
    return { countries: [], cities: [], totalCountries: 0, totalCities: 0 };
  }

  // Aggregate country data
  const countryMap = new Map<string, { name: string; code?: string; clicks: number }>();
  const cityMap = new Map<string, { name: string; country?: string; clicks: number }>();

  events.forEach((click) => {
    if (click.country) {
      const key = click.country.toLowerCase();
      const existing = countryMap.get(key);
      if (existing) {
        existing.clicks += 1;
      } else {
        countryMap.set(key, {
          name: click.country,
          code: click.country_code,
          clicks: 1,
        });
      }
    }

    if (click.city) {
      const key = `${click.city.toLowerCase()}_${(click.country || "").toLowerCase()}`;
      const existing = cityMap.get(key);
      if (existing) {
        existing.clicks += 1;
      } else {
        cityMap.set(key, {
          name: click.city,
          country: click.country,
          clicks: 1,
        });
      }
    }
  });

  const countries = Array.from(countryMap.values())
    .sort((a, b) => b.clicks - a.clicks);

  const cities = Array.from(cityMap.values())
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 50); // Limit to top 50 cities

  return {
    countries,
    cities,
    totalCountries: countries.length,
    totalCities: cities.length,
  };
};

// Get device and browser statistics
export const getDeviceStats = async (
  supabase: SupabaseClient,
  userId: string,
  linkId?: string,
  workspaceId?: string,
  filter: AnalyticsFilter = {},
): Promise<DeviceStats> => {
  const { events } = await getFilteredAnalyticsEvents(
    supabase,
    userId,
    linkId,
    workspaceId,
    filter,
  );

  if (events.length === 0) {
    return {
      deviceTypes: [],
      browsers: [],
      operatingSystems: [],
    };
  }
  const totalClicks = events.length;

  if (totalClicks === 0) {
    return {
      deviceTypes: [],
      browsers: [],
      operatingSystems: [],
    };
  }

  // Aggregate device data
  const deviceTypeMap = new Map<string, number>();
  const browserMap = new Map<string, number>();
  const osMap = new Map<string, number>();
  const brandMap = new Map<string, number>();

  events.forEach((click) => {
    // Device type
    const deviceType = click.device_type || "unknown";
    deviceTypeMap.set(deviceType, (deviceTypeMap.get(deviceType) || 0) + 1);

    // Browser
    const browser = click.browser || "unknown";
    browserMap.set(browser, (browserMap.get(browser) || 0) + 1);

    // OS
    const os = click.os || "unknown";
    osMap.set(os, (osMap.get(os) || 0) + 1);

    // Device brand
    if (click.device_brand) {
      brandMap.set(click.device_brand, (brandMap.get(click.device_brand) || 0) + 1);
    }
  });

  const calculatePercentage = (count: number) =>
    Math.round((count / totalClicks) * 100);

  const deviceTypes = Array.from(deviceTypeMap.entries())
    .map(([type, clicks]) => ({
      type,
      clicks,
      percentage: calculatePercentage(clicks),
    }))
    .sort((a, b) => b.clicks - a.clicks);

  const browsers = Array.from(browserMap.entries())
    .map(([name, clicks]) => ({
      name,
      clicks,
      percentage: calculatePercentage(clicks),
    }))
    .sort((a, b) => b.clicks - a.clicks);

  const operatingSystems = Array.from(osMap.entries())
    .map(([name, clicks]) => ({
      name,
      clicks,
      percentage: calculatePercentage(clicks),
    }))
    .sort((a, b) => b.clicks - a.clicks);

  const topDeviceBrands = Array.from(brandMap.entries())
    .map(([brand, clicks]) => ({ brand, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  return {
    deviceTypes,
    browsers,
    operatingSystems,
    topDeviceBrands: topDeviceBrands.length > 0 ? topDeviceBrands : undefined,
  };
};

// Get time-based statistics
export const getTimeStats = async (
  supabase: SupabaseClient,
  userId: string,
  days: number = 30,
  linkId?: string,
  workspaceId?: string,
  filter: AnalyticsFilter = {},
): Promise<TimeStats> => {
  const period = filter.period || (days <= 1 ? "today" : days <= 7 ? "7d" : "30d");
  const { events } = await getFilteredAnalyticsEvents(
    supabase,
    userId,
    linkId,
    workspaceId,
    { ...filter, period },
  );

  if (events.length === 0) {
    return {
      hourlyDistribution: [],
      dailyDistribution: [],
      peakHour: 0,
      peakDay: "",
    };
  }

  // Hourly distribution (0-23)
  const hourlyMap = new Map<number, number>();
  // Daily distribution (Mon-Sun)
  const dailyMap = new Map<string, number>();
  const daysOfWeek = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

  events.forEach((click) => {
    if (!click.created_at) return;
    const date = new Date(click.created_at);
    
    // Hour
    const hour = date.getHours();
    hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);

    // Day of week
    const day = daysOfWeek[date.getDay()];
    dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
  });

  const hourlyDistribution = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    clicks: hourlyMap.get(i) || 0,
  }));

  const dailyDistribution = daysOfWeek.map((day) => ({
    day,
    clicks: dailyMap.get(day) || 0,
  }));

  // Find peak hour and day
  let peakHour = 0;
  let maxHourlyClicks = 0;
  hourlyDistribution.forEach(({ hour, clicks }) => {
    if (clicks > maxHourlyClicks) {
      maxHourlyClicks = clicks;
      peakHour = hour;
    }
  });

  let peakDay = "";
  let maxDailyClicks = 0;
  dailyDistribution.forEach(({ day, clicks }) => {
    if (clicks > maxDailyClicks) {
      maxDailyClicks = clicks;
      peakDay = day;
    }
  });

  return {
    hourlyDistribution,
    dailyDistribution,
    peakHour,
    peakDay,
  };
};

// Export analytics data as CSV
export const exportAnalyticsToCSV = async (
  supabase: SupabaseClient,
  userId: string,
  format: "clicks" | "summary" = "clicks",
  linkId?: string,
  workspaceId?: string,
  startDate?: string,
  endDate?: string,
  filter: AnalyticsFilter = {},
): Promise<string> => {
  const { links: linksData, events } = await getFilteredAnalyticsEvents(
    supabase,
    userId,
    linkId,
    workspaceId,
    filter,
  );

  if (linksData.length === 0) {
    return "No data available";
  }

  const linkMetaMap = new Map<string, LinkExportMeta>(
    linksData.map((l) => [
      l.id,
      { short_code: l.short_code, title: l.custom_title || l.short_code, url: l.original_url },
    ])
  );

  // Filter by date if specified
  let filteredClicks = events;
  if (startDate || endDate) {
    filteredClicks = events.filter((click) => {
      if (!click.created_at) return false;
      const date = new Date(click.created_at);
      if (startDate && date < new Date(startDate)) return false;
      if (endDate && date > new Date(endDate)) return false;
      return true;
    });
  }

  if (format === "summary") {
    // Summary export
    const headers = ["Short Code", "Title", "URL", "Total Clicks", "Countries", "Top Device"];
    const rows = linksData.map((link) => {
      const linkClicks = filteredClicks.filter((c) => c.link_id === link.id);
      const countries = new Set(linkClicks.map((c: any) => c.country).filter(Boolean)).size;
      
      const deviceMap = new Map<string, number>();
      linkClicks.forEach((c) => {
        const device = c.device_type || "unknown";
        deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
      });
      const topDevice = Array.from(deviceMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

      return [
        link.short_code,
        link.custom_title || "",
        link.original_url,
        linkClicks.length,
        countries,
        topDevice,
      ];
    });

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  } else {
    // Detailed clicks export
    const headers = [
      "Date",
      "Time",
      "Link Code",
      "Link Title",
      "Country",
      "City",
      "Device Type",
      "Browser",
      "OS",
      "Source",
      "Referer",
    ];

    const rows = filteredClicks.map((click) => {
      const meta = linkMetaMap.get(click.link_id);
      const date = click.created_at ? new Date(click.created_at) : null;
      
      return [
        date ? date.toISOString().split("T")[0] : "",
        date ? date.toTimeString().split(" ")[0] : "",
        meta?.short_code || click.link_id,
        meta?.title || "",
        click.country || "",
        click.city || "",
        click.device_type || "unknown",
        click.browser || "unknown",
        click.os || "unknown",
        click.source || "direct",
        click.referer || "",
      ];
    });

    return [headers.join(","), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
  }
};
