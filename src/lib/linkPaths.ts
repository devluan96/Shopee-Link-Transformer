const FALLBACK_LINK_SLUG = "link";
const LEGACY_SHORT_PATH_PREFIX = "/s";
const MAX_LINK_SLUG_LENGTH = 150;
const RESERVED_PUBLIC_SLUGS = new Set([
  "discover",
  "api",
  "s",
  "s-choice",
  "sitemap.xml",
  "robots.txt",
  "manifest.webmanifest",
  "downloads",
  "assets",
  "favicon.ico",
  "og-image.png",
  "og-default.svg",
  "logo-app-192.png",
  "logo-app-512.png",
]);

export const normalizeLinkSlug = (value?: string | null) => {
  const normalized = (value || "")
    .trim()
    .toLocaleLowerCase("vi-VN")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .replace(/[^a-z0-9\s-]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, MAX_LINK_SLUG_LENGTH)
    .replace(/-+$/g, "");

  return normalized || FALLBACK_LINK_SLUG;
};

export const buildPrettyLinkPath = (options: {
  slug?: string | null;
  shortCode?: string | null;
  title?: string | null;
  fallbackToLegacy?: boolean;
}) => {
  const slug = options.slug?.trim();
  if (slug) return `/${slug}`;

  const fallbackToLegacy = options.fallbackToLegacy ?? true;
  if (!fallbackToLegacy && options.title?.trim()) {
    const normalizedTitle = normalizeLinkSlug(options.title);
    if (!RESERVED_PUBLIC_SLUGS.has(normalizedTitle)) {
      return `/${normalizedTitle}`;
    }
  }

  if (options.shortCode?.trim()) {
    return `${LEGACY_SHORT_PATH_PREFIX}/${options.shortCode.trim()}`;
  }

  if (options.title?.trim()) {
    const normalizedTitle = normalizeLinkSlug(options.title);
    if (!RESERVED_PUBLIC_SLUGS.has(normalizedTitle)) {
      return `/${normalizedTitle}`;
    }
  }

  return `${LEGACY_SHORT_PATH_PREFIX}/########`;
};

type PrettyLinkOptions = {
  slug?: string | null;
  shortCode?: string | null;
  title?: string | null;
  fallbackToLegacy?: boolean;
};

export function buildPrettyLinkUrl(
  baseUrl: string,
  options: PrettyLinkOptions,
): string;
export function buildPrettyLinkUrl(
  baseUrl: string,
  shortCode?: string | null,
  title?: string | null,
): string;
export function buildPrettyLinkUrl(
  baseUrl: string,
  optionsOrShortCode?: PrettyLinkOptions | string | null,
  title?: string | null,
) {
  let options: PrettyLinkOptions;
  if (typeof optionsOrShortCode === "string" || optionsOrShortCode == null) {
    const shortCode =
      typeof optionsOrShortCode === "string" ? optionsOrShortCode : null;
    options = {
      shortCode,
      title,
    };
  } else {
    options = optionsOrShortCode;
  }

  return `${baseUrl.replace(/\/+$/, "")}${buildPrettyLinkPath(options)}`;
}
