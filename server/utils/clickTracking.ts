import { SupabaseClient } from "../config/supabase.js";
import {
  CLICK_SELECT_ATTEMPTS,
  SHOPEE_HOST_REGEX,
  TIKTOK_HOST_REGEX,
} from "../config/constants.js";
import { normalizeTrafficSource } from "./normalizers.js";
import { chunkArray } from "./helpers.js";
import { parseDeviceInfo, getGeoInfo } from "./deviceDetection.js";
import { LinkOutboundEvent } from "../types/index.js";

const TRACKING_DEDUPE_WINDOW_MS = 60 * 1000;
const PAGE_SIZE = 1000;

const getRecentIsoTime = () =>
  new Date(Date.now() - TRACKING_DEDUPE_WINDOW_MS).toISOString();

const fetchAllPagedRows = async <T>(
  buildPage: (offset: number, limit: number) => Promise<{
    data: T[] | null;
    error: any;
  }>,
) => {
  const rows: T[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await buildPage(offset, PAGE_SIZE);
    if (error) throw error;

    const pageRows = (data || []) as T[];
    rows.push(...pageRows);

    if (pageRows.length < PAGE_SIZE) {
      break;
    }

    offset += PAGE_SIZE;
  }

  return rows;
};

export const fetchClicksForLinkIds = async (
  supabase: SupabaseClient,
  linkIds: string[],
) => {
  if (!linkIds.length) return [];
  const chunks = chunkArray(linkIds, 100);
  const allClicks: any[] = [];
  for (const chunk of chunks) {
    let chunkClicks: any[] = [];
    let lastError: unknown = null;
    for (const columns of CLICK_SELECT_ATTEMPTS) {
      try {
        chunkClicks = await fetchAllPagedRows((offset, limit) =>
          supabase
            .from("clicks")
            .select(columns)
            .in("link_id", chunk)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1),
        );
        break;
      } catch (error) {
        lastError = error;
      }
    }
    if (!chunkClicks.length && lastError) throw lastError;
    allClicks.push(...chunkClicks);
  }
  return allClicks;
};

export const fetchClicksForWorkspaceIds = async (
  supabase: SupabaseClient,
  workspaceIds: string[],
) => {
  if (!workspaceIds.length) return [];
  const chunks = chunkArray(workspaceIds, 100);
  const allClicks: any[] = [];
  for (const chunk of chunks) {
    let chunkClicks: any[] = [];
    let lastError: unknown = null;
    for (const columns of CLICK_SELECT_ATTEMPTS) {
      try {
        chunkClicks = await fetchAllPagedRows((offset, limit) =>
          supabase
            .from("clicks")
            .select(columns)
            .in("workspace_id", chunk)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1),
        );
        break;
      } catch (error) {
        lastError = error;
      }
    }
    if (!chunkClicks.length && lastError) throw lastError;
    allClicks.push(...chunkClicks);
  }
  return allClicks;
};

export const filterRealClicks = (clicks: any[]) => {
  if (!clicks?.length) return [];
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scrape/i,
    /googlebot/i,
    /bingbot/i,
  ];
  return clicks.filter((click) => {
    const userAgent = (click.user_agent || "").toLowerCase();
    return !botPatterns.some((pattern) => pattern.test(userAgent));
  });
};

export const isShopeeDestinationUrl = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    return SHOPEE_HOST_REGEX.test(new URL(value).hostname);
  } catch {
    return false;
  }
};

export const isTikTokDestinationUrl = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    return TIKTOK_HOST_REGEX.test(new URL(value).hostname);
  } catch {
    return false;
  }
};

export const fetchOutboundEventsForLinkIds = async (
  supabase: SupabaseClient,
  linkIds: string[],
) => {
  if (!linkIds.length) return [];
  const chunks = chunkArray(linkIds, 100);
  const allEvents: LinkOutboundEvent[] = [];

  for (const chunk of chunks) {
    const chunkEvents = await fetchAllPagedRows<LinkOutboundEvent>((offset, limit) =>
      supabase
        .from("link_outbound_events")
        .select(
          "id, link_id, short_code, stage, destination_url, source, source_detail, referer, user_agent, ip_address, created_at",
        )
        .in("link_id", chunk)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1),
    );

    allEvents.push(...chunkEvents);
  }

  return allEvents;
};

export const fetchOutboundEventsForWorkspaceIds = async (
  supabase: SupabaseClient,
  workspaceIds: string[],
) => {
  if (!workspaceIds.length) return [];
  const chunks = chunkArray(workspaceIds, 100);
  const allEvents: LinkOutboundEvent[] = [];

  for (const chunk of chunks) {
    const chunkEvents = await fetchAllPagedRows<LinkOutboundEvent>((offset, limit) =>
      supabase
        .from("link_outbound_events")
        .select(
          "id, link_id, short_code, workspace_id, stage, destination_url, source, source_detail, referer, user_agent, ip_address, created_at",
        )
        .in("workspace_id", chunk)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1),
    );

    allEvents.push(...chunkEvents);
  }

  return allEvents;
};

export const filterRealOutboundEvents = (events: LinkOutboundEvent[]) =>
  filterRealClicks(events as any[]) as LinkOutboundEvent[];

export const filterShopeeOutboundEvents = (events: LinkOutboundEvent[]) =>
  events.filter((event) => isShopeeDestinationUrl(event.destination_url));

export const filterDisplayableOutboundEvents = (events: LinkOutboundEvent[]) =>
  filterRealOutboundEvents(events).filter(
    (event) =>
      isShopeeDestinationUrl(event.destination_url) ||
      isTikTokDestinationUrl(event.destination_url),
  );

export const countDisplayableOutboundClicks = (events: LinkOutboundEvent[]) =>
  filterDisplayableOutboundEvents(events).length;

export const insertOutboundEvent = async (
  supabase: SupabaseClient,
  payload: {
    link_id: string;
    short_code: string;
    workspace_id?: string | null;
    stage: "primary" | "secondary";
    destination_url: string;
    user_agent?: string | null;
    ip_address?: string | null;
    source?: string | null;
    source_detail?: string | null;
    referer?: string | null;
  },
) => {
  const userAgent =
    typeof payload.user_agent === "string" ? payload.user_agent : null;
  const ipAddress =
    typeof payload.ip_address === "string" ? payload.ip_address : null;
  const recentSince = getRecentIsoTime();

  if (ipAddress || userAgent) {
    let duplicateQuery = supabase
      .from("link_outbound_events")
      .select("id")
      .eq("link_id", payload.link_id)
      .eq("stage", payload.stage)
      .eq("destination_url", payload.destination_url)
      .gte("created_at", recentSince)
      .limit(1);

    if (ipAddress) {
      duplicateQuery = duplicateQuery.eq("ip_address", ipAddress);
    }
    if (userAgent) {
      duplicateQuery = duplicateQuery.eq("user_agent", userAgent);
    }

    const { data: duplicateEvents, error: duplicateError } = await duplicateQuery;
    if (duplicateError) throw duplicateError;
    if (duplicateEvents?.length) {
      return false;
    }
  }

  const { error } = await supabase.from("link_outbound_events").insert({
    ...payload,
    workspace_id: payload.workspace_id ?? null,
    user_agent: userAgent,
  });
  if (error) throw error;
  return true;
};

export const insertClickWithTracking = async (
  supabase: SupabaseClient,
  payload: Record<string, unknown>,
) => {
  // Parse device info from user agent
  const userAgent = (payload.user_agent as string) || "";
  const deviceInfo = parseDeviceInfo(userAgent);

  // Get geo info from IP
  const ipAddress = ((payload.ip_address ?? payload.ip) as string) || "";
  const geoInfo = await getGeoInfo(ipAddress);

  const fullPayload = {
    link_id: payload.link_id,
    workspace_id: payload.workspace_id,
    user_agent: userAgent || null,
    ip_address: ipAddress || null,
    source: payload.source,
    source_detail: payload.source_detail,
    referer: payload.referer,
    // Device info
    device_type: deviceInfo.deviceType,
    browser: deviceInfo.browser,
    os: deviceInfo.os,
    device_brand: deviceInfo.deviceBrand,
    // Geo info
    country: geoInfo?.country,
    city: geoInfo?.city,
  };

  // Remove undefined values
  const sanitizedPayload = Object.fromEntries(
    Object.entries(fullPayload).filter(([, value]) => value !== undefined && value !== null),
  );

  if (payload.link_id && (ipAddress || userAgent)) {
    let duplicateQuery = supabase
      .from("clicks")
      .select("id")
      .eq("link_id", String(payload.link_id))
      .gte("created_at", getRecentIsoTime())
      .limit(1);

    if (ipAddress) {
      duplicateQuery = duplicateQuery.eq("ip_address", ipAddress);
    }
    if (userAgent) {
      duplicateQuery = duplicateQuery.eq("user_agent", userAgent);
    }

    const { data: duplicateClicks, error: duplicateError } = await duplicateQuery;
    if (duplicateError) throw duplicateError;
    if (duplicateClicks?.length) {
      return false;
    }
  }

  const { error } = await supabase.from("clicks").insert(sanitizedPayload);
  if (error) throw error;
  return true;
};

export const attachTrackedSourcesToLinks = async (
  supabase: SupabaseClient,
  links: any[],
) => {
  if (!links.length) return links;

  try {
    const linkIds = links.map((link) => link.id).filter(Boolean);
    const rawEvents = await fetchOutboundEventsForLinkIds(supabase, linkIds);
    const realOutboundEvents = filterRealOutboundEvents(rawEvents);
    const shopeeOutboundEvents = filterShopeeOutboundEvents(realOutboundEvents);

    const sourceMap = new Map<string, Map<string, number>>();
    shopeeOutboundEvents.forEach((click: any) => {
      const sourceLabel =
        normalizeTrafficSource(click.source_detail) ||
        normalizeTrafficSource(click.source) ||
        normalizeTrafficSource(click.referer) ||
        "direct";
      const linkId = click.link_id;
      if (!linkId) return;

      if (!sourceMap.has(linkId)) {
        sourceMap.set(linkId, new Map<string, number>());
      }

      const linkSources = sourceMap.get(linkId)!;
      linkSources.set(sourceLabel, (linkSources.get(sourceLabel) || 0) + 1);
    });

    return links.map((link) => {
      const linkId = link.id;
      const linkEvents = realOutboundEvents.filter(
        (event) => event.link_id === linkId,
      );
      const clicks = linkEvents.filter((event) =>
        isShopeeDestinationUrl(event.destination_url),
      ).length;
      const tiktok_clicks = linkEvents.filter((event) =>
        isTikTokDestinationUrl(event.destination_url),
      ).length;
      const sources = sourceMap.get(linkId);
      const tracked_sources = sources
        ? Array.from(sources.entries())
            .map(([label, count]) => ({ label, count }))
            .sort((a, b) => b.count - a.count)
        : [];
      return { ...link, clicks, tiktok_clicks, tracked_sources };
    });
  } catch (e) {
    console.error("Failed to attach tracked sources:", e);
    return links;
  }
};
