import { SupabaseClient } from "../config/supabase.js";

const DEFAULT_OUTPUT_DOMAINS = ["hotsnew.click"];

const normalizeDomains = (domains: string[]) => {
  const unique = new Set<string>();
  domains.forEach((domain) => {
    const normalized = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
    if (!normalized) return;
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(normalized)) return;
    unique.add(normalized);
  });

  if (!unique.size) {
    unique.add(DEFAULT_OUTPUT_DOMAINS[0]);
  }

  return Array.from(unique);
};

export const getLinkOutputDomains = async (supabase: SupabaseClient) => {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "link_output_domains")
    .maybeSingle();

  if (error) throw error;
  const rawDomains = Array.isArray(data?.value?.domains)
    ? data.value.domains
    : DEFAULT_OUTPUT_DOMAINS;

  return normalizeDomains(rawDomains);
};

export const updateLinkOutputDomains = async (
  supabase: SupabaseClient,
  domains: string[],
) => {
  const normalizedDomains = normalizeDomains(domains);

  const { error } = await supabase.from("app_settings").upsert({
    key: "link_output_domains",
    value: { domains: normalizedDomains },
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
  return normalizedDomains;
};
