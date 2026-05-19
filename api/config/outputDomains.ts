const FALLBACK_OUTPUT_DOMAIN = "hotsnew.click";

const normalizeDomain = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");

const isValidDomain = (value: string) =>
  /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(value);

export const normalizeOutputDomains = (domains: string[]) => {
  const unique = new Set<string>();

  domains
    .map(normalizeDomain)
    .filter(isValidDomain)
    .forEach((domain) => unique.add(domain));

  if (!unique.size) {
    unique.add(FALLBACK_OUTPUT_DOMAIN);
  }

  return Array.from(unique);
};

const inferEnvDomains = () => {
  const rawValue =
    process.env.LINK_OUTPUT_DOMAINS ||
    process.env.VITE_LINK_OUTPUT_DOMAINS ||
    process.env.APP_BASE_URL ||
    "";

  return normalizeOutputDomains(rawValue.split(","));
};

export const DEFAULT_OUTPUT_DOMAINS = inferEnvDomains();

export const DEFAULT_OUTPUT_DOMAIN = DEFAULT_OUTPUT_DOMAINS[0];
