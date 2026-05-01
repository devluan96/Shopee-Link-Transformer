import { getSupabase, SupabaseClient } from "../config/supabase.js";
import { CLICK_SELECT_ATTEMPTS } from "../config/constants.js";
import { normalizeTrafficSource } from "./normalizers.js";
import { chunkArray } from "./helpers.js";

export const fetchClicksForLinkIds = async (
  supabase: SupabaseClient,
  linkIds: string[],
) => {
  if (!linkIds.length) return [];
  const chunks = chunkArray(linkIds, 100);
  const allClicks: any[] = [];
  for (const chunk of chunks) {
    let chunkClicks: any[] = [];
    for (const columns of CLICK_SELECT_ATTEMPTS) {
      const { data, error } = await supabase
        .from("clicks")
        .select(columns)
        .in("link_id", chunk)
        .order("created_at", { ascending: false })
        .limit(10000);
      if (!error) {
        chunkClicks = data || [];
        break;
      }
    }
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

export const insertOutboundEvent = async (
  supabase: SupabaseClient,
  payload: {
    link_id: string;
    user_agent?: string | null;
    ip_address?: string | null;
    source?: string | null;
    source_detail?: string | null;
    referer?: string | null;
  },
) => {
  const { error } = await supabase.from("link_outbound_events").insert({
    ...payload,
    user_agent:
      typeof payload.user_agent === "string" ? payload.user_agent : null,
  });
  if (error) throw error;
};

export const insertClickWithTracking = async (
  supabase: SupabaseClient,
  payload: Record<string, unknown>,
) => {
  const attempts = [
    {
      link_id: payload.link_id,
      user_agent: payload.user_agent,
      ip_address: payload.ip_address ?? payload.ip,
      source: payload.source,
      source_detail: payload.source_detail,
      referer: payload.referer,
    },
    {
      link_id: payload.link_id,
      user_agent: payload.user_agent,
      ip_address: payload.ip_address ?? payload.ip,
      source: payload.source,
      referer: payload.referer,
    },
    {
      link_id: payload.link_id,
      user_agent: payload.user_agent,
      ip: payload.ip ?? payload.ip_address,
      source: payload.source,
      referer: payload.referer,
    },
    {
      link_id: payload.link_id,
      user_agent: payload.user_agent,
      ip_address: payload.ip_address ?? payload.ip,
    },
    {
      link_id: payload.link_id,
      user_agent: payload.user_agent,
      ip: payload.ip ?? payload.ip_address,
    },
  ];

  let lastError: any = null;

  for (const attempt of attempts) {
    const sanitizedPayload = Object.fromEntries(
      Object.entries(attempt).filter(([, value]) => value !== undefined),
    );
    const { error } = await supabase.from("clicks").insert(sanitizedPayload);
    if (!error) return;
    lastError = error;
  }

  throw lastError;
};

export const attachTrackedSourcesToLinks = async (
  supabase: SupabaseClient,
  links: any[],
) => {
  if (!links.length) return links;

  try {
    const linkIds = links.map((link) => link.id).filter(Boolean);
    const rawClicks = await fetchClicksForLinkIds(supabase, linkIds);
    const clicks = filterRealClicks(rawClicks);

    const sourceMap = new Map<string, Map<string, number>>();
    const clickCountMap = new Map<string, number>();

    (clicks || []).forEach((click: any) => {
      const sourceLabel =
        normalizeTrafficSource(click.source_detail) ||
        normalizeTrafficSource(click.source) ||
        normalizeTrafficSource(click.referer) ||
        "direct";
      const linkId = click.link_id;
      if (!linkId) return;

      clickCountMap.set(linkId, (clickCountMap.get(linkId) || 0) + 1);

      if (!sourceMap.has(linkId)) {
        sourceMap.set(linkId, new Map<string, number>());
      }

      const linkSources = sourceMap.get(linkId)!;
      linkSources.set(sourceLabel, (linkSources.get(sourceLabel) || 0) + 1);
    });

    return links.map((link) => {
      const linkId = link.id;
      const clicks = clickCountMap.get(linkId) || 0;
      const sources = sourceMap.get(linkId);
      const tracked_sources = sources
        ? Array.from(sources.entries())
            .map(([label, count]) => ({ label, count }))
            .sort((a, b) => b.count - a.count)
        : [];
      return { ...link, clicks, tracked_sources };
    });
  } catch (e) {
    console.error("Failed to attach tracked sources:", e);
    return links;
  }
};
