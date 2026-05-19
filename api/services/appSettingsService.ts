import { SupabaseClient } from "../config/supabase.js";
import { DEFAULT_OUTPUT_DOMAINS, normalizeOutputDomains } from "../config/outputDomains.js";

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

  return normalizeOutputDomains(rawDomains);
};

export const updateLinkOutputDomains = async (
  supabase: SupabaseClient,
  domains: string[],
) => {
  const normalizedDomains = normalizeOutputDomains(domains);

  const { error } = await supabase.from("app_settings").upsert({
    key: "link_output_domains",
    value: { domains: normalizedDomains },
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
  return normalizedDomains;
};
