const FALLBACK_OUTPUT_DOMAIN = "hotsnew.click";

const normalizeDomain = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");

const isValidDomain = (value: string) =>
  /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(value);

const parseOutputDomains = (value?: string) => {
  const unique = new Set<string>();

  value
    ?.split(",")
    .map(normalizeDomain)
    .filter(isValidDomain)
    .forEach((domain) => unique.add(domain));

  if (!unique.size) {
    unique.add(FALLBACK_OUTPUT_DOMAIN);
  }

  return Array.from(unique);
};

const getBaseUrlFromEnv = () => {
  const configuredBaseUrl =
    import.meta.env.VITE_APP_BASE_URL || import.meta.env.VITE_PUBLIC_BASE_URL;

  if (!configuredBaseUrl) {
    return null;
  }

  const normalized = configuredBaseUrl.trim().replace(/\/+$/, "");
  if (!normalized) {
    return null;
  }

  return normalized.startsWith("http") ? normalized : `https://${normalized}`;
};

export const DEFAULT_OUTPUT_DOMAINS = parseOutputDomains(
  import.meta.env.VITE_LINK_OUTPUT_DOMAINS,
);

export const DEFAULT_OUTPUT_DOMAIN = DEFAULT_OUTPUT_DOMAINS[0];

export const DEFAULT_SITE_URL =
  getBaseUrlFromEnv() || `https://${DEFAULT_OUTPUT_DOMAIN}`;
