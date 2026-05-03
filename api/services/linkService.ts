import { SupabaseClient } from "../config/supabase.js";
import { nanoid } from "nanoid";
import {
  normalizeShortCode,
  normalizeProtectedPrimaryUrl,
  normalizeProtectedShopeeUrl,
  ensureSameShopeeHostname,
  normalizeRedirectDelayMs,
} from "../utils/normalizers.js";
import { TIKTOK_HOST_REGEX, MAX_SHORT_CODE_LENGTH } from "../config/constants.js";

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
  },
) => {
  const primaryUrl = normalizeProtectedPrimaryUrl(data.url, "Link gốc");

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

  let secondaryUrl: string | null = null;
  if (data.secondaryUrl && data.secondaryUrl.trim()) {
    const allowTikTokAsSecondary = data.secondaryTargetType === "tiktok";
    const label = allowTikTokAsSecondary
      ? "Link TikTok (bước 2)"
      : "Link Shopee phụ";
    secondaryUrl = normalizeProtectedShopeeUrl(data.secondaryUrl, label);

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

  const delayMs = normalizeRedirectDelayMs(data.redirectDelayMs);

  // Validate and normalize expires_at
  let expiresAt: string | null = null;
  if (data.expiresAt && data.expiresAt.trim()) {
    const date = new Date(data.expiresAt);
    if (isNaN(date.getTime())) {
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
      custom_title: data.customTitle?.trim() || null,
      custom_description: data.customDescription?.trim() || null,
      custom_image_url: data.customImageUrl?.trim() || null,
      video_url: data.videoUrl?.trim() || null,
      secondary_url: secondaryUrl,
      redirect_delay_ms: delayMs,
      usage_context: data.usageContext?.trim() || null,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Mã rút gọn đã tồn tại.");
    }
    throw error;
  }

  return link;
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

export const getUserLinks = async (supabase: SupabaseClient, userId: string) => {
  const { data, error } = await supabase
    .from("links")
    .select(
      "id, short_code, original_url, custom_title, custom_description, custom_image_url, video_url, created_at, expires_at, secondary_url, redirect_delay_ms, usage_context",
    )
    .eq("user_id", userId)
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
  }>,
) => {
  const { data: link, error } = await supabase
    .from("links")
    .update(data)
    .eq("id", linkId)
    .eq("user_id", userId)
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
  const { error } = await supabase
    .from("links")
    .delete()
    .eq("id", linkId)
    .eq("user_id", userId);

  if (error) throw error;
};
