import { SupabaseClient } from "../config/supabase.js";
import { nanoid } from "nanoid";
import {
  normalizeShortCode,
  normalizeProtectedPrimaryUrl,
  normalizeProtectedShopeeUrl,
  ensureSameShopeeHostname,
  normalizeRedirectDelayMs,
} from "../utils/normalizers.js";
import { TIKTOK_HOST_REGEX } from "../config/constants.js";
import {
  assertWorkspaceWriteAccessForLink,
  getAccessibleWorkspaceIds,
  resolveWritableWorkspaceId,
} from "./workspaceService.js";
import { getLinkOutputDomains } from "./appSettingsService.js";

const DEFAULT_SHORT_DOMAIN = "hotsnew.click";
const fallbackOutputDomains = (
  process.env.LINK_OUTPUT_DOMAINS ||
  process.env.VITE_LINK_OUTPUT_DOMAINS ||
  DEFAULT_SHORT_DOMAIN
)
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

const normalizeFolderName = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 120) : null;
};

const normalizeTags = (value?: string[] | null) => {
  if (!Array.isArray(value)) return [];

  const uniqueTags = new Set<string>();
  for (const rawTag of value) {
    const nextTag = rawTag?.trim().toLowerCase();
    if (!nextTag) continue;
    uniqueTags.add(nextTag.slice(0, 40));
    if (uniqueTags.size >= 12) break;
  }

  return Array.from(uniqueTags);
};

const normalizeCustomDomain = (
  value?: string | null,
  allowedDomains: string[] = fallbackOutputDomains,
) => {
  const trimmed = value?.trim().toLowerCase();
  if (!trimmed) return null;

  const withoutProtocol = trimmed.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(withoutProtocol)) {
    throw new Error("Custom domain không hợp lệ.");
  }

  if (!allowedDomains.includes(withoutProtocol)) {
    throw new Error("Domain đầu ra không nằm trong danh sách cho phép.");
  }

  return withoutProtocol;
};

const parseAffiliateParams = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const params = new URLSearchParams(
    trimmed.startsWith("?") ? trimmed.slice(1) : trimmed,
  );
  return [...params.keys()].length ? params : null;
};

const appendUrlParams = (
  targetUrl: string,
  params: Array<[string, string | undefined]>,
) => {
  const url = new URL(targetUrl);
  params.forEach(([key, value]) => {
    const nextValue = value?.trim();
    if (!nextValue) return;
    url.searchParams.set(key, nextValue);
  });
  return url.toString();
};

const applyAffiliateParams = (
  targetUrl: string,
  affiliateParams: URLSearchParams | null,
) => {
  if (!affiliateParams) return targetUrl;
  const url = new URL(targetUrl);
  affiliateParams.forEach((value, key) => {
    if (key && value) {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
};

const buildConvertedUrl = (customDomain: string | null, shortCode: string) =>
  `https://${customDomain || DEFAULT_SHORT_DOMAIN}/s/${shortCode}`;

const createMarketingUrlApplier = (data: {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  shopeeAffiliateParams?: string;
  tiktokAffiliateParams?: string;
}) => {
  const affiliateShopeeParams = parseAffiliateParams(data.shopeeAffiliateParams);
  const affiliateTikTokParams = parseAffiliateParams(data.tiktokAffiliateParams);

  return (targetUrl: string) => {
    const urlWithUtm = appendUrlParams(targetUrl, [
      ["utm_source", data.utmSource],
      ["utm_medium", data.utmMedium],
      ["utm_campaign", data.utmCampaign],
      ["utm_content", data.utmContent],
      ["utm_term", data.utmTerm],
    ]);

    const hostname = new URL(urlWithUtm).hostname;
    if (TIKTOK_HOST_REGEX.test(hostname)) {
      return applyAffiliateParams(urlWithUtm, affiliateTikTokParams);
    }
    return applyAffiliateParams(urlWithUtm, affiliateShopeeParams);
  };
};

export const createLink = async (
  supabase: SupabaseClient,
  userId: string,
  data: {
    url: string;
    customShortCode?: string;
    customTitle?: string;
    customDescription?: string;
    customImageUrl?: string;
    videoUrl?: string;
    secondaryUrl?: string;
    secondaryTargetType?: "shopee" | "tiktok";
    redirectDelayMs?: number;
    usageContext?: string;
    expiresAt?: string;
    folderName?: string;
    tags?: string[];
    workspaceId?: string;
    customDomain?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
    shopeeAffiliateParams?: string;
    tiktokAffiliateParams?: string;
    abTestEnabled?: boolean;
    abVariantBTitle?: string;
    abVariantBDescription?: string;
    abVariantBImageUrl?: string;
    abVariantBVideoUrl?: string;
    abVariantBOriginalUrl?: string;
    abVariantBSecondaryUrl?: string;
  },
) => {
  const allowedOutputDomains = await getLinkOutputDomains(supabase).catch(
    () => fallbackOutputDomains,
  );
  const customDomain = normalizeCustomDomain(
    data.customDomain,
    allowedOutputDomains,
  );
  const applyMarketingParams = createMarketingUrlApplier(data);
  const primaryUrl = applyMarketingParams(
    normalizeProtectedPrimaryUrl(data.url, "Link goc"),
  );

  let shortCode: string;
  if (data.customShortCode && data.customShortCode.trim()) {
    const normalized = normalizeShortCode(data.customShortCode);
    if (!normalized) {
      throw new Error("Ma rut gon khong hop le sau khi chuan hoa.");
    }

    const { data: existing } = await supabase
      .from("links")
      .select("id")
      .eq("short_code", normalized)
      .maybeSingle();

    if (existing) {
      throw new Error(`Ma rut gon "${normalized}" da duoc su dung.`);
    }
    shortCode = normalized;
  } else {
    shortCode = nanoid(8);
  }

  let secondaryUrl: string | null = null;
  if (data.secondaryUrl && data.secondaryUrl.trim()) {
    const allowTikTokAsSecondary = data.secondaryTargetType === "tiktok";
    const label = allowTikTokAsSecondary
      ? "Link TikTok buoc 2"
      : "Link Shopee phu";
    secondaryUrl = applyMarketingParams(
      normalizeProtectedShopeeUrl(data.secondaryUrl, label),
    );

    if (
      allowTikTokAsSecondary &&
      secondaryUrl &&
      !TIKTOK_HOST_REGEX.test(new URL(secondaryUrl).hostname)
    ) {
      throw new Error("Link buoc 2 phai la link TikTok hop le.");
    }

    if (!allowTikTokAsSecondary && secondaryUrl && primaryUrl) {
      ensureSameShopeeHostname(primaryUrl, secondaryUrl);
    }
  }

  let abVariantBOriginalUrl: string | null = null;
  if (data.abVariantBOriginalUrl?.trim()) {
    abVariantBOriginalUrl = applyMarketingParams(
      normalizeProtectedPrimaryUrl(data.abVariantBOriginalUrl, "Link variant B"),
    );
  }

  let abVariantBSecondaryUrl: string | null = null;
  if (data.abVariantBSecondaryUrl?.trim()) {
    const allowTikTokAsSecondary = data.secondaryTargetType === "tiktok";
    const label = allowTikTokAsSecondary
      ? "Link TikTok variant B"
      : "Link Shopee variant B";
    abVariantBSecondaryUrl = applyMarketingParams(
      normalizeProtectedShopeeUrl(data.abVariantBSecondaryUrl, label),
    );
  }

  const delayMs = normalizeRedirectDelayMs(data.redirectDelayMs);
  const workspaceId = await resolveWritableWorkspaceId(
    supabase,
    userId,
    data.workspaceId,
  );
  const folderName = normalizeFolderName(data.folderName);
  const tags = normalizeTags(data.tags);

  let expiresAt: string | null = null;
  if (data.expiresAt && data.expiresAt.trim()) {
    const date = new Date(data.expiresAt);
    if (Number.isNaN(date.getTime())) {
      throw new Error("Ngay het han khong hop le.");
    }
    expiresAt = date.toISOString();
  }

  const { data: link, error } = await supabase
    .from("links")
    .insert({
      user_id: userId,
      original_url: primaryUrl,
      short_code: shortCode,
      custom_domain: customDomain,
      workspace_id: workspaceId,
      folder_name: folderName,
      tags,
      custom_title: data.customTitle?.trim() || null,
      custom_description: data.customDescription?.trim() || null,
      custom_image_url: data.customImageUrl?.trim() || null,
      video_url: data.videoUrl?.trim() || null,
      secondary_url: secondaryUrl,
      redirect_delay_ms: delayMs,
      usage_context: data.usageContext?.trim() || null,
      expires_at: expiresAt,
      utm_source: data.utmSource?.trim() || null,
      utm_medium: data.utmMedium?.trim() || null,
      utm_campaign: data.utmCampaign?.trim() || null,
      utm_content: data.utmContent?.trim() || null,
      utm_term: data.utmTerm?.trim() || null,
      shopee_affiliate_params: data.shopeeAffiliateParams?.trim() || null,
      tiktok_affiliate_params: data.tiktokAffiliateParams?.trim() || null,
      ab_test_enabled: !!data.abTestEnabled,
      ab_variant_b_title: data.abVariantBTitle?.trim() || null,
      ab_variant_b_description: data.abVariantBDescription?.trim() || null,
      ab_variant_b_image_url: data.abVariantBImageUrl?.trim() || null,
      ab_variant_b_video_url: data.abVariantBVideoUrl?.trim() || null,
      ab_variant_b_original_url: abVariantBOriginalUrl,
      ab_variant_b_secondary_url: abVariantBSecondaryUrl,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Ma rut gon da ton tai.");
    }
    throw error;
  }

  return {
    ...link,
    converted_url: buildConvertedUrl(customDomain, shortCode),
  };
};

export const getLinkByShortCode = async (
  supabase: SupabaseClient,
  shortCode: string,
) => {
  const { data, error } = await supabase
    .from("links")
    .select("*")
    .eq("short_code", shortCode)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getUserLinks = async (
  supabase: SupabaseClient,
  userId: string,
  workspaceId?: string,
) => {
  const workspaceIds = await getAccessibleWorkspaceIds(supabase, userId);
  if (!workspaceIds.length) return [];

  const filteredWorkspaceIds = workspaceId
    ? workspaceIds.filter((id) => id === workspaceId)
    : workspaceIds;
  if (!filteredWorkspaceIds.length) return [];

  const { data, error } = await supabase
    .from("links")
    .select(
      "id, short_code, original_url, custom_domain, workspace_id, folder_name, tags, custom_title, custom_description, custom_image_url, video_url, created_at, expires_at, secondary_url, redirect_delay_ms, usage_context, user_id, utm_source, utm_medium, utm_campaign, utm_content, utm_term, shopee_affiliate_params, tiktok_affiliate_params, ab_test_enabled, ab_variant_b_title, ab_variant_b_description, ab_variant_b_image_url, ab_variant_b_video_url, ab_variant_b_original_url, ab_variant_b_secondary_url",
    )
    .in("workspace_id", filteredWorkspaceIds)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

export const updateLink = async (
  supabase: SupabaseClient,
  linkId: string,
  userId: string,
  data: Partial<{
    custom_title: string;
    custom_description: string;
    custom_image_url: string;
    video_url: string;
    secondary_url: string;
    redirect_delay_ms: number;
    usage_context: string;
    expires_at: string;
    folder_name: string | null;
    tags: string[];
    custom_domain: string | null;
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
    utm_content: string;
    utm_term: string;
    shopee_affiliate_params: string;
    tiktok_affiliate_params: string;
    ab_test_enabled: boolean;
    ab_variant_b_title: string;
    ab_variant_b_description: string;
    ab_variant_b_image_url: string;
    ab_variant_b_video_url: string;
    ab_variant_b_original_url: string;
    ab_variant_b_secondary_url: string;
  }>,
) => {
  await assertWorkspaceWriteAccessForLink(supabase, userId, linkId);

  const normalizedData = { ...data };
  if ("folder_name" in normalizedData) {
    normalizedData.folder_name = normalizeFolderName(normalizedData.folder_name);
  }
  if ("tags" in normalizedData) {
    normalizedData.tags = normalizeTags(normalizedData.tags);
  }
  if ("custom_domain" in normalizedData) {
    normalizedData.custom_domain = normalizeCustomDomain(
      normalizedData.custom_domain,
      await getLinkOutputDomains(supabase).catch(() => fallbackOutputDomains),
    );
  }

  const { data: link, error } = await supabase
    .from("links")
    .update(normalizedData)
    .eq("id", linkId)
    .select()
    .single();

  if (error) throw error;
  return link;
};

export const deleteLink = async (
  supabase: SupabaseClient,
  linkId: string,
  userId: string,
) => {
  await assertWorkspaceWriteAccessForLink(supabase, userId, linkId);

  const { error } = await supabase.from("links").delete().eq("id", linkId);
  if (error) throw error;
};
