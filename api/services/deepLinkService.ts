import { SupabaseClient } from "../config/supabase.js";
import { SHOPEE_HOST_REGEX, TIKTOK_HOST_REGEX } from "../config/constants.js";

export type DeepLinkPlatform = "shopee" | "tiktok";
export type DeepLinkDeviceTarget = {
  enabled?: boolean;
  ios?: string;
  android?: string;
  desktop?: string;
};

export type DeepLinkProfiles = Partial<Record<DeepLinkPlatform, DeepLinkDeviceTarget>>;

const APP_SETTINGS_KEY = "link_deeplink_profiles";
const MAX_TEMPLATE_LENGTH = 2048;

const normalizeTemplate = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, MAX_TEMPLATE_LENGTH);
};

const normalizeTarget = (value?: Partial<DeepLinkDeviceTarget> | null): DeepLinkDeviceTarget => {
  const ios = normalizeTemplate(value?.ios);
  const android = normalizeTemplate(value?.android);
  const desktop = normalizeTemplate(value?.desktop);
  const enabled = value?.enabled ?? Boolean(ios || android || desktop);

  return {
    enabled,
    ios: ios || undefined,
    android: android || undefined,
    desktop: desktop || undefined,
  };
};

export const normalizeDeepLinkProfiles = (
  value?: Partial<Record<DeepLinkPlatform, Partial<DeepLinkDeviceTarget>>> | null,
): DeepLinkProfiles => {
  if (!value || typeof value !== "object") return {};

  const profiles: DeepLinkProfiles = {};

  if (value.shopee) {
    profiles.shopee = normalizeTarget(value.shopee);
  }
  if (value.tiktok) {
    profiles.tiktok = normalizeTarget(value.tiktok);
  }

  return profiles;
};

export const getLinkDeepLinkProfiles = async (supabase: SupabaseClient) => {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", APP_SETTINGS_KEY)
    .maybeSingle();

  if (error) throw error;
  return normalizeDeepLinkProfiles(data?.value?.profiles || data?.value || {});
};

export const updateLinkDeepLinkProfiles = async (
  supabase: SupabaseClient,
  profiles: DeepLinkProfiles,
) => {
  const normalizedProfiles = normalizeDeepLinkProfiles(profiles);
  const { error } = await supabase.from("app_settings").upsert({
    key: APP_SETTINGS_KEY,
    value: { profiles: normalizedProfiles },
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
  return normalizedProfiles;
};

const inferDestinationPlatform = (value?: string | null): DeepLinkPlatform | null => {
  if (!value) return null;
  try {
    const hostname = new URL(value).hostname.trim().toLowerCase();
    if (SHOPEE_HOST_REGEX.test(hostname)) return "shopee";
    if (TIKTOK_HOST_REGEX.test(hostname)) return "tiktok";
    return null;
  } catch {
    return null;
  }
};

const isMobileUserAgent = (userAgent?: string | null) => {
  const normalized = (userAgent || "").toLowerCase();
  return /(iphone|ipad|ipod|android)/i.test(normalized);
};

const inferDevicePlatform = (userAgent?: string | null) => {
  const normalized = (userAgent || "").toLowerCase();
  if (/(iphone|ipad|ipod)/i.test(normalized)) return "ios" as const;
  if (/android/i.test(normalized)) return "android" as const;
  return "desktop" as const;
};

export const isMobileDeepLinkDestination = (destinationUrl: string) => {
  return inferDestinationPlatform(destinationUrl) !== null;
};

export const shouldBypassLandingForMobileDeepLink = (
  destinationUrl: string,
  userAgent?: string | null,
  profiles?: DeepLinkProfiles | null,
) => {
  const platform = inferDestinationPlatform(destinationUrl);
  if (!platform) return false;

  const profile = profiles?.[platform];
  if (!profile?.enabled) return false;

  return inferDevicePlatform(userAgent) !== "desktop";
};

export const applyDeepLinkTemplate = (
  template: string,
  destinationUrl: string,
) => {
  const encodedUrl = encodeURIComponent(destinationUrl);
  return template
    .replace(/\{\{encodedUrl\}\}/g, encodedUrl)
    .replace(/\{encodedUrl\}/g, encodedUrl)
    .replace(/\{\{url\}\}/g, destinationUrl)
    .replace(/\{url\}/g, destinationUrl);
};

export const resolveDeepLinkUrl = (
  destinationUrl: string,
  userAgent?: string | null,
  profiles?: DeepLinkProfiles | null,
) => {
  const platform = inferDestinationPlatform(destinationUrl);
  if (!platform) return destinationUrl;

  const profile = profiles?.[platform];
  if (!profile?.enabled) return destinationUrl;

  const devicePlatform = inferDevicePlatform(userAgent);
  if (devicePlatform !== "desktop") {
    return destinationUrl;
  }

  const template = profile.desktop;

  if (!template) return destinationUrl;

  try {
    return applyDeepLinkTemplate(template, destinationUrl);
  } catch {
    return destinationUrl;
  }
};

export const shouldUseDeepLinkSplash = (
  destinationUrl: string,
  userAgent?: string | null,
  profiles?: DeepLinkProfiles | null,
) => {
  const platform = inferDestinationPlatform(destinationUrl);
  if (!platform) return false;

  const profile = profiles?.[platform];
  if (!profile?.enabled) return false;

  return isMobileUserAgent(userAgent);
};
