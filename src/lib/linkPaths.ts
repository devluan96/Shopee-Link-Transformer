const FALLBACK_LINK_SLUG = "link";
const LEGACY_SHORT_PATH_PREFIX = "/s";

export const normalizeLinkSlug = (value?: string | null) => {
  const normalized = (value || "")
    .trim()
    .toLocaleLowerCase("vi-VN")
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}\s-]+/gu, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

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
    return `/${normalizeLinkSlug(options.title)}`;
  }

  if (options.shortCode?.trim()) {
    return `${LEGACY_SHORT_PATH_PREFIX}/${options.shortCode.trim()}`;
  }

  if (options.title?.trim()) {
    return `/${normalizeLinkSlug(options.title)}`;
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
