import { SupabaseClient } from "../config/supabase.js";
import {
  fetchClicksForLinkIds,
  filterRealClicks,
} from "../utils/clickTracking.js";
import { normalizeTrafficSource } from "../utils/normalizers.js";

export const getUserStats = async (supabase: SupabaseClient, userId: string) => {
  const { count, error } = await supabase
    .from("links")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw error;

  const { data: links, error: linksError } = await supabase
    .from("links")
    .select("id, short_code, custom_title")
    .eq("user_id", userId);

  if (linksError) throw linksError;

  if (!links || links.length === 0) {
    return {
      totalLinks: count || 0,
      totalClicks: 0,
      recentClicks: [],
      topLinks: [],
      growthPercentage: 0,
    };
  }

  const linkIds = links.map((link: any) => link.id).filter(Boolean);
  const linkMetaMap = new Map<string, { short_code: string; title: string }>(
    links.map((link: any) => [
      link.id,
      {
        short_code: link.short_code,
        title: link.custom_title || link.short_code,
      },
    ]),
  );

  const clicks = filterRealClicks(await fetchClicksForLinkIds(supabase, linkIds));

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const historyMap: Record<string, number> = {};
  const linkClickMap = new Map<string, number>();
  let previousWindowClicks = 0;
  let currentWindowClicks = 0;

  clicks.forEach((click: any) => {
    if (!click?.link_id) return;

    linkClickMap.set(
      click.link_id,
      (linkClickMap.get(click.link_id) || 0) + 1,
    );

    if (!click.created_at) return;
    const createdAt = new Date(click.created_at);
    if (Number.isNaN(createdAt.getTime()) || createdAt < sixtyDaysAgo) {
      return;
    }

    if (createdAt >= thirtyDaysAgo) {
      const date = click.created_at.split("T")[0];
      historyMap[date] = (historyMap[date] || 0) + 1;
      currentWindowClicks += 1;
    } else {
      previousWindowClicks += 1;
    }
  });

  const totalClicks = Array.from(linkClickMap.values()).reduce((sum, value) => sum + value, 0);
  const recentClicks = Object.entries(historyMap)
    .map(([date, total]) => ({ date, clicks: total }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const topLinks = Array.from(linkClickMap.entries())
    .map(([id, total]) => ({
      short_code: linkMetaMap.get(id)?.short_code || "",
      title: linkMetaMap.get(id)?.title || "",
      clicks: total,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);

  const growthPercentage =
    previousWindowClicks === 0
      ? 100
      : Math.round(
          ((currentWindowClicks - previousWindowClicks) / previousWindowClicks) * 100,
        );

  return {
    totalLinks: count || 0,
    totalClicks,
    recentClicks,
    topLinks,
    growthPercentage,
  };
};

export const getUserAnalytics = async (supabase: SupabaseClient, userId: string) => {
  const { data: links, error } = await supabase
    .from("links")
    .select("id")
    .eq("user_id", userId);

  if (error) throw error;

  if (!links?.length) {
    return {
      history: [],
      topLinks: [],
      trafficSources: [],
      growthPercentage: 0,
    };
  }

  const linkIds = links.map((l: any) => l.id);
  const rawClicks = await fetchClicksForLinkIds(supabase, linkIds);
  const clicks = filterRealClicks(rawClicks);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const historyMap: Record<string, number> = {};
  const sourceMap = new Map<string, number>();
  const linkClickMap = new Map<string, number>();
  let previousWindowClicks = 0;
  let currentWindowClicks = 0;

  // Calculate traffic sources from ALL clicks (not filtered)
  rawClicks.forEach((click: any) => {
    const source =
      normalizeTrafficSource(click.source_detail) ||
      normalizeTrafficSource(click.source) ||
      normalizeTrafficSource(click.referer) ||
      "direct";
    sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
  });

  // Calculate other metrics from filtered clicks only
  clicks.forEach((click: any) => {
    // Track clicks per link for top links
    if (click.link_id) {
      linkClickMap.set(click.link_id, (linkClickMap.get(click.link_id) || 0) + 1);
    }

    // Track history and growth (only last 60 days)
    if (!click.created_at) return;
    const createdAt = new Date(click.created_at);
    if (Number.isNaN(createdAt.getTime()) || createdAt < sixtyDaysAgo) return;

    if (createdAt >= thirtyDaysAgo) {
      const date = click.created_at.split("T")[0];
      historyMap[date] = (historyMap[date] || 0) + 1;
      currentWindowClicks += 1;
    } else {
      previousWindowClicks += 1;
    }
  });

  const history = Object.entries(historyMap)
    .map(([date, total]) => ({ date, clicks: total }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const trafficSources = Array.from(sourceMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Fetch link metadata for top links
  const topLinkIds = Array.from(linkClickMap.keys());
  let linkMetaMap = new Map<string, { short_code: string; title: string }>();
  
  if (topLinkIds.length > 0) {
    const { data: linksData } = await supabase
      .from("links")
      .select("id, short_code, custom_title")
      .in("id", topLinkIds);
    
    if (linksData) {
      linkMetaMap = new Map(
        linksData.map((l: any) => [
          l.id,
          { 
            short_code: l.short_code, 
            title: l.custom_title || l.short_code 
          }
        ])
      );
    }
  }

  const topLinks = Array.from(linkClickMap.entries())
    .map(([id, clicks]) => ({
      id,
      short_code: linkMetaMap.get(id)?.short_code || "",
      title: linkMetaMap.get(id)?.title || "Unknown",
      clicks,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);

  const growthPercentage =
    previousWindowClicks === 0
      ? 100
      : Math.round(
          ((currentWindowClicks - previousWindowClicks) / previousWindowClicks) * 100,
        );

  return {
    history,
    topLinks,
    trafficSources,
    growthPercentage,
  };
};
