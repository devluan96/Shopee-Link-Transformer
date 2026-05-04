import { SupabaseClient } from "../config/supabase.js";
import { fetchClicksForLinkIds, filterRealClicks } from "../utils/clickTracking.js";
import { getAccessibleWorkspaceIds } from "./workspaceService.js";

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
    .select("id, short_code, custom_title, original_url, workspace_id")
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
): Promise<GeographicStats> => {
  const links = await getScopedLinks(supabase, userId, linkId, workspaceId);
  const linkIds = links.map((l: any) => l.id);

  if (linkIds.length === 0) {
    return { countries: [], cities: [], totalCountries: 0, totalCities: 0 };
  }

  const rawClicks = await fetchClicksForLinkIds(supabase, linkIds);
  const clicks = filterRealClicks(rawClicks);

  // Aggregate country data
  const countryMap = new Map<string, { name: string; code?: string; clicks: number }>();
  const cityMap = new Map<string, { name: string; country?: string; clicks: number }>();

  clicks.forEach((click: any) => {
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
): Promise<DeviceStats> => {
  const links = await getScopedLinks(supabase, userId, linkId, workspaceId);
  const linkIds = links.map((l: any) => l.id);

  if (linkIds.length === 0) {
    return {
      deviceTypes: [],
      browsers: [],
      operatingSystems: [],
    };
  }

  const rawClicks = await fetchClicksForLinkIds(supabase, linkIds);
  const clicks = filterRealClicks(rawClicks);
  const totalClicks = clicks.length;

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

  clicks.forEach((click: any) => {
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
): Promise<TimeStats> => {
  const links = await getScopedLinks(supabase, userId, linkId, workspaceId);
  const linkIds = links.map((l: any) => l.id);

  if (linkIds.length === 0) {
    return {
      hourlyDistribution: [],
      dailyDistribution: [],
      peakHour: 0,
      peakDay: "",
    };
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const rawClicks = await fetchClicksForLinkIds(supabase, linkIds);
  const clicks = filterRealClicks(rawClicks).filter((click: any) => {
    if (!click.created_at) return false;
    return new Date(click.created_at) >= cutoffDate;
  });

  // Hourly distribution (0-23)
  const hourlyMap = new Map<number, number>();
  // Daily distribution (Mon-Sun)
  const dailyMap = new Map<string, number>();
  const daysOfWeek = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

  clicks.forEach((click: any) => {
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
  endDate?: string
): Promise<string> => {
  const linksData = await getScopedLinks(supabase, userId, linkId, workspaceId);
  const linkIds = linksData.map((l: any) => l.id);

  if (linkIds.length === 0) {
    return "No data available";
  }

  const linkMetaMap = new Map<string, LinkExportMeta>(
    linksData.map((l) => [
      l.id,
      { short_code: l.short_code, title: l.custom_title || l.short_code, url: l.original_url },
    ])
  );

  const rawClicks = await fetchClicksForLinkIds(supabase, linkIds);
  const clicks = filterRealClicks(rawClicks);

  // Filter by date if specified
  let filteredClicks = clicks;
  if (startDate || endDate) {
    filteredClicks = clicks.filter((click: any) => {
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
      const linkClicks = filteredClicks.filter((c: any) => c.link_id === link.id);
      const countries = new Set(linkClicks.map((c: any) => c.country).filter(Boolean)).size;
      
      const deviceMap = new Map<string, number>();
      linkClicks.forEach((c: any) => {
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

    const rows = filteredClicks.map((click: any) => {
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
