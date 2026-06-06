import { SupabaseClient } from "../config/supabase.js";
import { DEFAULT_OUTPUT_DOMAINS, normalizeOutputDomains } from "../config/outputDomains.js";

export type VideoUploadProviderPreference =
  | "cloudinary"
  | "r2"
  | "supabase";

export const DEFAULT_VIDEO_UPLOAD_PROVIDER_PREFERENCE: VideoUploadProviderPreference =
  "cloudinary";

const VIDEO_UPLOAD_PROVIDER_KEY = "video_upload_provider_preference";

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

export const normalizeVideoUploadProviderPreference = (
  value?: string | null,
): VideoUploadProviderPreference => {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "r2") return "r2";
  if (normalized === "supabase") return "supabase";
  return "cloudinary";
};

export const getVideoUploadProviderOrder = (
  preference?: VideoUploadProviderPreference | null,
): VideoUploadProviderPreference[] => {
  const resolvedPreference =
    preference || DEFAULT_VIDEO_UPLOAD_PROVIDER_PREFERENCE;

  switch (resolvedPreference) {
    case "r2":
      return ["r2", "cloudinary", "supabase"];
    case "supabase":
      return ["supabase", "cloudinary", "r2"];
    default:
      return ["cloudinary", "r2", "supabase"];
  }
};

export const getVideoUploadProviderPreference = async (
  supabase: SupabaseClient,
) => {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", VIDEO_UPLOAD_PROVIDER_KEY)
    .maybeSingle();

  if (error) throw error;

  return normalizeVideoUploadProviderPreference(
    typeof data?.value?.provider === "string"
      ? data.value.provider
      : typeof data?.value?.preference === "string"
        ? data.value.preference
        : null,
  );
};

export const updateVideoUploadProviderPreference = async (
  supabase: SupabaseClient,
  preference: VideoUploadProviderPreference,
) => {
  const normalizedPreference =
    normalizeVideoUploadProviderPreference(preference);

  const { error } = await supabase.from("app_settings").upsert({
    key: VIDEO_UPLOAD_PROVIDER_KEY,
    value: { provider: normalizedPreference },
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
  return normalizedPreference;
};
