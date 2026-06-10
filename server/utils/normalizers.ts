import {
  MAX_SHORT_CODE_LENGTH,
  DEFAULT_REDIRECT_DELAY_MS,
  MIN_REDIRECT_DELAY_MS,
  MAX_REDIRECT_DELAY_MS,
  SHOPEE_HOST_REGEX,
  TIKTOK_HOST_REGEX,
} from "../config/constants.js";

export const normalizeTrafficSource = (value?: string | null) => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;

  if (normalized.includes("facebook")) return "facebook";
  if (normalized.includes("tiktok")) return "tiktok";
  if (normalized.includes("zalo")) return "zalo";
  if (normalized.includes("instagram")) return "instagram";
  if (normalized.includes("youtube")) return "youtube";
  if (normalized.includes("telegram")) return "telegram";
  if (normalized.includes("google")) return "google";
  if (normalized.includes("direct")) return "direct";
  return normalized.slice(0, 64);
};

export const normalizeShortCode = (value?: string | null) => {
  if (!value) return null;

  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!normalized) return null;
  if (normalized.length < 3) {
    throw new Error("Mã rút gọn phải có ít nhất 3 ký tự.");
  }
  if (normalized.length > MAX_SHORT_CODE_LENGTH) {
    throw new Error(
      `Mã rút gọn không được vượt quá ${MAX_SHORT_CODE_LENGTH} ký tự.`,
    );
  }

  return normalized;
};

export const normalizeHttpUrl = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    throw new Error("Link đích không hợp lệ.");
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("Chỉ hỗ trợ link http hoặc https.");
  }

  return parsedUrl.toString();
};

export const normalizeRedirectDelayMs = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_REDIRECT_DELAY_MS;
  return Math.min(
    MAX_REDIRECT_DELAY_MS,
    Math.max(MIN_REDIRECT_DELAY_MS, Math.round(parsed)),
  );
};

export const normalizeProtectedShopeeUrl = (
  value?: string | null,
  label = "Link Shopee",
) => {
  const normalizedUrl = normalizeHttpUrl(value);
  if (!normalizedUrl) return null;

  const parsedUrl = new URL(normalizedUrl);
  const normalizedHostname = parsedUrl.hostname.trim().toLowerCase();
  const normalizedLabel = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const allowTikTokSecondary =
    normalizedLabel.includes("bước 2") ||
    normalizedLabel.includes("phụ") ||
    normalizedLabel.includes("tiktok");

  if (
    !SHOPEE_HOST_REGEX.test(normalizedHostname) &&
    !(allowTikTokSecondary && TIKTOK_HOST_REGEX.test(normalizedHostname))
  ) {
    throw new Error(`${label} chỉ hỗ trợ domain Shopee hợp lệ.`);
  }

  return normalizedUrl;
};

export const normalizeProtectedPrimaryUrl = (
  value?: string | null,
  label = "Link gốc",
) => {
  const normalizedUrl = normalizeHttpUrl(value);
  if (!normalizedUrl) return null;

  const parsedUrl = new URL(normalizedUrl);
  const normalizedHostname = parsedUrl.hostname.trim().toLowerCase();

  if (
    !SHOPEE_HOST_REGEX.test(normalizedHostname) &&
    !TIKTOK_HOST_REGEX.test(normalizedHostname)
  ) {
    throw new Error(`${label} chỉ hỗ trợ domain Shopee hoặc TikTok hợp lệ.`);
  }

  return normalizedUrl;
};

export const ensureSameShopeeHostname = (
  primaryUrl?: string | null,
  secondaryUrl?: string | null,
) => {
  if (!primaryUrl || !secondaryUrl) return;

  const primaryHostname = new URL(primaryUrl).hostname.trim().toLowerCase();
  const secondaryHostname = new URL(secondaryUrl).hostname.trim().toLowerCase();

  if (TIKTOK_HOST_REGEX.test(secondaryHostname)) return;
  if (!SHOPEE_HOST_REGEX.test(primaryHostname)) return;

  if (primaryHostname !== secondaryHostname) {
    throw new Error(
      "Link Shopee phụ phải cùng domain Shopee với link Shopee gốc để bật flow 2 bước.",
    );
  }
};
