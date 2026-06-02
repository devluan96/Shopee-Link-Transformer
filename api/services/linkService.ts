import { SupabaseClient } from "../config/supabase.js";
import { nanoid } from "nanoid";
import {
  normalizeShortCode,
  normalizeProtectedPrimaryUrl,
  normalizeProtectedShopeeUrl,
  ensureSameShopeeHostname,
  normalizeRedirectDelayMs,
} from "../utils/normalizers.js";
import { SHOPEE_HOST_REGEX, TIKTOK_HOST_REGEX } from "../config/constants.js";
import {
  assertWorkspaceWriteAccessForLink,
  getAccessibleWorkspaceIds,
  getWorkspaceAccessMap,
  resolveWritableWorkspaceId,
} from "./workspaceService.js";
import { getLinkOutputDomains } from "./appSettingsService.js";
import {
  buildPrettyLinkUrl,
  isReservedPublicSlug,
  normalizeLinkSlug,
} from "../utils/linkPaths.js";
import {
  DEFAULT_OUTPUT_DOMAIN,
  DEFAULT_OUTPUT_DOMAINS,
} from "../config/outputDomains.js";
const DEFAULT_SHORT_DOMAIN = DEFAULT_OUTPUT_DOMAIN;
const fallbackOutputDomains = DEFAULT_OUTPUT_DOMAINS;

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

  const withoutProtocol = trimmed
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
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

type MarketingParamInput = {
  shopeeAffiliateParams?: string;
  tiktokAffiliateParams?: string;
};

export const applyMarketingParamsToDestination = (
  requestedUrl: string,
  normalizedUrl: string,
  data: MarketingParamInput,
) => {
  const trimmedRequestedUrl = requestedUrl.trim();
  return trimmedRequestedUrl || normalizedUrl;
};

const generateUniquePublicSlug = async (
  supabase: SupabaseClient,
  sourceTitle?: string | null,
) => {
  const baseSlug = normalizeLinkSlug(sourceTitle);
  let candidateSlug = baseSlug;
  let suffix = 2;

  while (true) {
    if (!isReservedPublicSlug(candidateSlug)) {
      const { data: existingLink, error } = await supabase
        .from("links")
        .select("id")
        .eq("slug", candidateSlug)
        .maybeSingle();

      if (error) throw error;
      if (!existingLink) {
        return candidateSlug;
      }
    }

    candidateSlug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
};

const inferSecondaryTargetType = (
  value?: string | null,
): "shopee" | "tiktok" | undefined => {
  if (!value) return undefined;

  try {
    const hostname = new URL(value).hostname;
    return TIKTOK_HOST_REGEX.test(hostname) ? "tiktok" : "shopee";
  } catch {
    return "shopee";
  }
};

const createMarketingUrlApplier = (data: MarketingParamInput) => {
  return (requestedUrl: string, normalizedUrl?: string) =>
    applyMarketingParamsToDestination(
      requestedUrl,
      normalizedUrl || requestedUrl,
      data,
    );
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
    shopeeAffiliateParams?: string;
    tiktokAffiliateParams?: string;
    abTestEnabled?: boolean;
    abVariantBTitle?: string;
    abVariantBDescription?: string;
    abVariantBImageUrl?: string;
    abVariantBVideoUrl?: string;
    abVariantBOriginalUrl?: string;
    abVariantBSecondaryUrl?: string;
    mobileDirectMode?: boolean;
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
  const normalizedPrimaryUrl = normalizeProtectedPrimaryUrl(
    data.url,
    "Link gốc",
  );
  if (!normalizedPrimaryUrl) {
    throw new Error("Link gốc không hợp lệ.");
  }
  const primaryUrl = applyMarketingParams(data.url, normalizedPrimaryUrl);
  const mobileDirectMode = !!data.mobileDirectMode;
  const primaryImageUrl = data.customImageUrl?.trim() || null;
  const primaryVideoUrl = mobileDirectMode
    ? null
    : data.videoUrl?.trim() || null;
  const requestedSecondaryUrl = data.secondaryUrl?.trim();
  const variantBVideoUrl = mobileDirectMode
    ? null
    : data.abVariantBVideoUrl?.trim() || null;
  const requestedVariantBSecondaryUrl = mobileDirectMode
    ? null
    : data.abVariantBSecondaryUrl?.trim() || null;

  if (mobileDirectMode && !primaryImageUrl) {
    throw new Error("Mobile direct mode yêu cầu ảnh đại diện.");
  }

  if (mobileDirectMode && requestedSecondaryUrl) {
    throw new Error(
      "Mobile direct mode không hỗ trợ liên kết bước 2.",
    );
  }

  let shortCode: string;
  if (data.customShortCode && data.customShortCode.trim()) {
    const normalized = normalizeShortCode(data.customShortCode);
    if (!normalized) {
      throw new Error("Mã rút gọn không hợp lệ sau khi chuẩn hóa.");
    }

    const { data: existing } = await supabase
      .from("links")
      .select("id")
      .eq("short_code", normalized)
      .maybeSingle();

    if (existing) {
      throw new Error(`Mã rút gọn "${normalized}" đã được sử dụng.`);
    }
    shortCode = normalized;
  } else {
    shortCode = nanoid(8);
  }
  const publicSlug = await generateUniquePublicSlug(
    supabase,
    data.customTitle || data.customShortCode || shortCode,
  );

  let secondaryUrl: string | null = null;
  if (requestedSecondaryUrl) {
    if (!primaryVideoUrl) {
      throw new Error(
        "Link bước 2 chỉ được sử dụng khi landing page có video.",
      );
    }

    const allowTikTokAsSecondary = data.secondaryTargetType === "tiktok";
    const label = allowTikTokAsSecondary
      ? "Link TikTok bước 2"
      : "Link Shopee phụ";
    const normalizedSecondaryUrl = normalizeProtectedShopeeUrl(
      requestedSecondaryUrl,
      label,
    );
    if (!normalizedSecondaryUrl) {
      throw new Error("Link bước 2 không hợp lệ.");
    }
    secondaryUrl = applyMarketingParams(
      requestedSecondaryUrl,
      normalizedSecondaryUrl,
    );

    if (
      allowTikTokAsSecondary &&
      secondaryUrl &&
      !TIKTOK_HOST_REGEX.test(new URL(secondaryUrl).hostname)
    ) {
      throw new Error("Link bước 2 phải là link TikTok hợp lệ.");
    }

    if (!allowTikTokAsSecondary && secondaryUrl && primaryUrl) {
      ensureSameShopeeHostname(primaryUrl, secondaryUrl);
    }
  }

  let abVariantBOriginalUrl: string | null = null;
  if (data.abVariantBOriginalUrl?.trim()) {
    const requestedVariantBOriginalUrl = data.abVariantBOriginalUrl.trim();
    const normalizedVariantBOriginalUrl = normalizeProtectedPrimaryUrl(
      requestedVariantBOriginalUrl,
      "Link variant B",
    );
    if (!normalizedVariantBOriginalUrl) {
      throw new Error("Link variant B không hợp lệ.");
    }
    abVariantBOriginalUrl = applyMarketingParams(
      requestedVariantBOriginalUrl,
      normalizedVariantBOriginalUrl,
    );
  }

  let abVariantBSecondaryUrl: string | null = null;
  if (requestedVariantBSecondaryUrl) {
    const allowTikTokAsSecondary = data.secondaryTargetType === "tiktok";
    const label = allowTikTokAsSecondary
      ? "Link TikTok variant B"
      : "Link Shopee variant B";
    const normalizedVariantBSecondaryUrl = normalizeProtectedShopeeUrl(
      requestedVariantBSecondaryUrl,
      label,
    );
    if (!normalizedVariantBSecondaryUrl) {
      throw new Error("Link variant B bước 2 không hợp lệ.");
    }
    abVariantBSecondaryUrl = applyMarketingParams(
      requestedVariantBSecondaryUrl,
      normalizedVariantBSecondaryUrl,
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
      throw new Error("Ngày hết hạn không hợp lệ.");
    }
    expiresAt = date.toISOString();
  }

  const { data: link, error } = await supabase
    .from("links")
    .insert({
      user_id: userId,
      original_url: primaryUrl,
      short_code: shortCode,
      slug: publicSlug,
      custom_domain: customDomain,
      workspace_id: workspaceId,
      folder_name: folderName,
      tags,
      custom_title: data.customTitle?.trim() || null,
      custom_description: data.customDescription?.trim() || null,
      custom_image_url: primaryImageUrl,
      video_url: primaryVideoUrl,
      secondary_url: secondaryUrl,
      redirect_delay_ms: delayMs,
      usage_context: data.usageContext?.trim() || null,
      expires_at: expiresAt,
      shopee_affiliate_params: data.shopeeAffiliateParams?.trim() || null,
      tiktok_affiliate_params: data.tiktokAffiliateParams?.trim() || null,
      ab_test_enabled: !!data.abTestEnabled,
      ab_variant_b_title: data.abVariantBTitle?.trim() || null,
      ab_variant_b_description: data.abVariantBDescription?.trim() || null,
      ab_variant_b_image_url: data.abVariantBImageUrl?.trim() || null,
      ab_variant_b_video_url: variantBVideoUrl,
      ab_variant_b_original_url: abVariantBOriginalUrl,
      ab_variant_b_secondary_url: abVariantBSecondaryUrl,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Mã rút gọn đã tồn tại.");
    }
    throw error;
  }

  return {
    ...link,
    converted_url: buildPrettyLinkUrl(
      `https://${customDomain || DEFAULT_SHORT_DOMAIN}`,
      {
        slug: publicSlug,
        shortCode,
        title: data.customTitle,
      },
    ),
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
  options?: {
    limit?: number;
    offset?: number;
  },
) => {
  const workspaceIds = await getAccessibleWorkspaceIds(supabase, userId);
  if (!workspaceIds.length) return [];

  const filteredWorkspaceIds = workspaceId
    ? workspaceIds.filter((id) => id === workspaceId)
    : workspaceIds;
  if (!filteredWorkspaceIds.length) return [];

  let query = supabase
    .from("links")
    .select(
      "id, short_code, slug, original_url, custom_domain, workspace_id, folder_name, tags, custom_title, custom_description, custom_image_url, video_url, created_at, expires_at, secondary_url, redirect_delay_ms, usage_context, user_id, shopee_affiliate_params, tiktok_affiliate_params, ab_test_enabled, ab_variant_b_title, ab_variant_b_description, ab_variant_b_image_url, ab_variant_b_video_url, ab_variant_b_original_url, ab_variant_b_secondary_url",
    )
    .in("workspace_id", filteredWorkspaceIds)
    .order("created_at", { ascending: false });

  const limit =
    typeof options?.limit === "number" && Number.isFinite(options?.limit)
      ? Math.max(0, Math.floor(options.limit))
      : null;
  const offset =
    typeof options?.offset === "number" && Number.isFinite(options?.offset)
      ? Math.max(0, Math.floor(options.offset))
      : 0;

  if (limit !== null) {
    query = query.range(offset, offset + Math.max(0, limit) - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
};

export const updateLink = async (
  supabase: SupabaseClient,
  linkId: string,
  userId: string,
  data: Partial<{
    short_code: string;
    original_url: string;
    custom_title: string;
    custom_description: string;
    custom_image_url: string;
    video_url: string;
    secondary_url: string;
    secondaryTargetType: "shopee" | "tiktok";
    redirect_delay_ms: number;
    usage_context: string;
    expires_at: string;
    folder_name: string | null;
    tags: string[];
    custom_domain: string | null;
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

  const { data: existingLink, error: existingLinkError } = await supabase
    .from("links")
    .select(
      "id, original_url, secondary_url, video_url, shopee_affiliate_params, tiktok_affiliate_params",
    )
    .eq("id", linkId)
    .maybeSingle();

  if (existingLinkError) throw existingLinkError;
  if (!existingLink) {
    throw new Error("KhÃ´ng tÃ¬m tháº¥y liÃªn káº¿t cáº§n cáº­p nháº­t.");
  }

  const normalizedData = { ...data } as Partial<{
    short_code: string;
    original_url: string | null;
    custom_title: string;
    custom_description: string;
    custom_image_url: string;
    video_url: string | null;
    secondary_url: string | null;
    redirect_delay_ms: number;
    usage_context: string;
    expires_at: string;
    folder_name: string | null;
    tags: string[];
    custom_domain: string | null;
    shopee_affiliate_params: string;
    tiktok_affiliate_params: string;
    ab_test_enabled: boolean;
    ab_variant_b_title: string;
    ab_variant_b_description: string;
    ab_variant_b_image_url: string;
    ab_variant_b_video_url: string;
    ab_variant_b_original_url: string;
    ab_variant_b_secondary_url: string;
    secondaryTargetType: "shopee" | "tiktok";
  }>;
  const requestedSecondaryTargetType = normalizedData.secondaryTargetType;
  delete normalizedData.secondaryTargetType;

  if ("folder_name" in normalizedData) {
    normalizedData.folder_name = normalizeFolderName(
      normalizedData.folder_name,
    );
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
  if ("short_code" in normalizedData) {
    const normalizedShortCode = normalizeShortCode(normalizedData.short_code);
    if (!normalizedShortCode) {
      throw new Error("Mã rút gọn không hợp lệ sau khi chuẩn hóa.");
    }

    const { data: existingLink, error: existingLinkError } = await supabase
      .from("links")
      .select("id")
      .eq("short_code", normalizedShortCode)
      .neq("id", linkId)
      .maybeSingle();

    if (existingLinkError) throw existingLinkError;
    if (existingLink?.id) {
      throw new Error(`Mã rút gọn "${normalizedShortCode}" đã được sử dụng.`);
    }

    normalizedData.short_code = normalizedShortCode;
  }

  if ("video_url" in normalizedData) {
    normalizedData.video_url = normalizedData.video_url?.trim() || null;
  }

  const shouldNormalizeChoiceFlow =
    requestedSecondaryTargetType !== undefined ||
    "original_url" in normalizedData ||
    "secondary_url" in normalizedData ||
    "video_url" in normalizedData;

  if (shouldNormalizeChoiceFlow) {
    const applyMarketingParams = createMarketingUrlApplier({
      shopeeAffiliateParams:
        ("shopee_affiliate_params" in normalizedData
          ? normalizedData.shopee_affiliate_params
          : existingLink.shopee_affiliate_params) || undefined,
      tiktokAffiliateParams:
        ("tiktok_affiliate_params" in normalizedData
          ? normalizedData.tiktok_affiliate_params
          : existingLink.tiktok_affiliate_params) || undefined,
    });
    const requestedPrimaryUrl =
      ("original_url" in normalizedData
        ? normalizedData.original_url
        : existingLink.original_url) || "";
    const normalizedPrimaryUrl = normalizeProtectedPrimaryUrl(
      requestedPrimaryUrl,
      "Link gá»‘c",
    );
    if (!normalizedPrimaryUrl) {
      throw new Error("Link gá»‘c khÃ´ng há»£p lá»‡.");
    }

    const primaryUrl = applyMarketingParams(
      requestedPrimaryUrl,
      normalizedPrimaryUrl,
    );
    normalizedData.original_url = primaryUrl;

    const requestedSecondaryUrl =
      ("secondary_url" in normalizedData
        ? normalizedData.secondary_url
        : existingLink.secondary_url) || "";
    const trimmedSecondaryUrl =
      typeof requestedSecondaryUrl === "string"
        ? requestedSecondaryUrl.trim()
        : "";

    if (!trimmedSecondaryUrl) {
      normalizedData.secondary_url = null;
    } else {
      const effectiveVideoUrl =
        ("video_url" in normalizedData
          ? normalizedData.video_url
          : existingLink.video_url) || "";
      if (!effectiveVideoUrl.trim()) {
        throw new Error(
          "Link bÆ°á»›c 2 chá»‰ Ä‘Æ°á»£c sá»­ dá»¥ng khi landing page cÃ³ video.",
        );
      }

      const effectiveSecondaryTargetType =
        requestedSecondaryTargetType ||
        inferSecondaryTargetType(trimmedSecondaryUrl) ||
        inferSecondaryTargetType(existingLink.secondary_url) ||
        "shopee";
      const normalizedSecondaryUrl = normalizeProtectedShopeeUrl(
        trimmedSecondaryUrl,
        effectiveSecondaryTargetType === "tiktok"
          ? "Link TikTok bÆ°á»›c 2"
          : "Link Shopee phá»¥",
      );
      if (!normalizedSecondaryUrl) {
        throw new Error("Link bÆ°á»›c 2 khÃ´ng há»£p lá»‡.");
      }

      const secondaryUrl = applyMarketingParams(
        trimmedSecondaryUrl,
        normalizedSecondaryUrl,
      );
      if (
        effectiveSecondaryTargetType === "tiktok" &&
        !TIKTOK_HOST_REGEX.test(new URL(secondaryUrl).hostname)
      ) {
        throw new Error("Link bÆ°á»›c 2 pháº£i lÃ  link TikTok há»£p lá»‡.");
      }

      if (effectiveSecondaryTargetType === "shopee") {
        ensureSameShopeeHostname(primaryUrl, secondaryUrl);
      }

      normalizedData.secondary_url = secondaryUrl;
    }
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

export const copyLinkToWorkspace = async (
  supabase: SupabaseClient,
  userId: string,
  linkId: string,
  targetWorkspaceId: string,
  options?: {
    preserveCustomDomain?: boolean;
    preserveAbTesting?: boolean;
  },
) => {
  const sourceLinkAccess = await assertWorkspaceWriteAccessForLink(
    supabase,
    userId,
    linkId,
  );

  if (sourceLinkAccess.workspace_id) {
    const accessMap = await getWorkspaceAccessMap(supabase, userId);
    const sourceRole = accessMap.get(sourceLinkAccess.workspace_id);
    if (sourceRole !== "owner") {
      throw new Error(
        "Chỉ chủ sở hữu workspace nguời mới có thể chia sẻ liên kết.",
      );
    }
  } else if (sourceLinkAccess.user_id !== userId) {
    throw new Error("Bạn không có quyền sao chép liên kết này.");
  }

  const writableTargetWorkspaceId = await resolveWritableWorkspaceId(
    supabase,
    userId,
    targetWorkspaceId,
  );

  if (sourceLinkAccess.workspace_id === writableTargetWorkspaceId) {
    throw new Error("Vui lòng chọn một không gian làm việc khác.");
  }

  const { data: sourceLink, error: sourceError } = await supabase
    .from("links")
    .select(
      "id, original_url, custom_domain, folder_name, tags, custom_title, custom_description, custom_image_url, video_url, secondary_url, redirect_delay_ms, usage_context, expires_at, shopee_affiliate_params, tiktok_affiliate_params, ab_test_enabled, ab_variant_b_title, ab_variant_b_description, ab_variant_b_image_url, ab_variant_b_video_url, ab_variant_b_original_url, ab_variant_b_secondary_url",
    )
    .eq("id", linkId)
    .maybeSingle();

  if (sourceError) throw sourceError;
  if (!sourceLink) {
    throw new Error("Không tìm thấy liên kết cần chia sẻ.");
  }

  return createLink(supabase, userId, {
    url: sourceLink.original_url,
    customTitle: sourceLink.custom_title || undefined,
    customDescription: sourceLink.custom_description || undefined,
    customImageUrl: sourceLink.custom_image_url || undefined,
    videoUrl: sourceLink.video_url || undefined,
    secondaryUrl: sourceLink.secondary_url || undefined,
    secondaryTargetType: inferSecondaryTargetType(sourceLink.secondary_url),
    redirectDelayMs: sourceLink.redirect_delay_ms || undefined,
    usageContext: sourceLink.usage_context || undefined,
    expiresAt: sourceLink.expires_at || undefined,
    folderName: sourceLink.folder_name || undefined,
    tags: sourceLink.tags || undefined,
    workspaceId: writableTargetWorkspaceId,
    customDomain: options?.preserveCustomDomain
      ? sourceLink.custom_domain || undefined
      : undefined,
    shopeeAffiliateParams: sourceLink.shopee_affiliate_params || undefined,
    tiktokAffiliateParams: sourceLink.tiktok_affiliate_params || undefined,
    abTestEnabled: options?.preserveAbTesting
      ? !!sourceLink.ab_test_enabled
      : false,
    abVariantBTitle:
      options?.preserveAbTesting && sourceLink.ab_test_enabled
        ? sourceLink.ab_variant_b_title || undefined
        : undefined,
    abVariantBDescription:
      options?.preserveAbTesting && sourceLink.ab_test_enabled
        ? sourceLink.ab_variant_b_description || undefined
        : undefined,
    abVariantBImageUrl:
      options?.preserveAbTesting && sourceLink.ab_test_enabled
        ? sourceLink.ab_variant_b_image_url || undefined
        : undefined,
    abVariantBVideoUrl:
      options?.preserveAbTesting && sourceLink.ab_test_enabled
        ? sourceLink.ab_variant_b_video_url || undefined
        : undefined,
    abVariantBOriginalUrl:
      options?.preserveAbTesting && sourceLink.ab_test_enabled
        ? sourceLink.ab_variant_b_original_url || undefined
        : undefined,
    abVariantBSecondaryUrl:
      options?.preserveAbTesting && sourceLink.ab_test_enabled
        ? sourceLink.ab_variant_b_secondary_url || undefined
        : undefined,
  });
};

export const deleteLink = async (
  supabase: SupabaseClient,
  linkId: string,
  userId: string,
) => {
  await assertWorkspaceWriteAccessForLink(supabase, userId, linkId);

  await Promise.all([
    supabase.from("notification_logs").delete().eq("link_id", linkId),
  ]);

  const { data, error } = await supabase
    .from("links")
    .delete()
    .eq("id", linkId)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error("Xóa link không thành công trong cơ sở dữ liệu.");
  }
};
