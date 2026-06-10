import "dotenv/config";
import { getSupabase } from "../server/config/supabase.js";
import { normalizeFolderName } from "../server/services/mediaUploadService.js";

type LinkRow = {
  id: string;
  user_id: string;
  short_code: string;
  slug?: string | null;
  custom_title?: string | null;
  custom_image_url?: string | null;
  video_url?: string | null;
  ab_variant_b_image_url?: string | null;
  ab_variant_b_video_url?: string | null;
  created_at?: string | null;
};

type MediaProvider = "r2" | "cloudinary" | "supabase";
type MediaResourceType = "image" | "video";

type MediaAssetUpsert = {
  user_id: string;
  provider: MediaProvider;
  resource_type: MediaResourceType;
  object_path: string;
  public_url: string;
  folder_name: string;
  tags: string[];
  file_name: string;
  size_bytes: number;
  modified_at: string;
  mime_type: string;
  metadata: Record<string, unknown>;
};

type LinkMediaField = {
  field: "custom_image_url" | "video_url" | "ab_variant_b_image_url" | "ab_variant_b_video_url";
  resourceType: MediaResourceType;
  role: "primary_image" | "primary_video" | "variant_b_image" | "variant_b_video";
};

const LINK_MEDIA_FIELDS: LinkMediaField[] = [
  {
    field: "custom_image_url",
    resourceType: "image",
    role: "primary_image",
  },
  {
    field: "video_url",
    resourceType: "video",
    role: "primary_video",
  },
  {
    field: "ab_variant_b_image_url",
    resourceType: "image",
    role: "variant_b_image",
  },
  {
    field: "ab_variant_b_video_url",
    resourceType: "video",
    role: "variant_b_video",
  },
];

const parsePositiveInteger = (value: string | undefined, fallback: number) => {
  const parsed = Number(value || "");
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const normalizeUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const parsed = new URL(trimmed);
    return parsed.toString();
  } catch {
    return trimmed;
  }
};

const inferProviderFromUrl = (value: string): MediaProvider => {
  const lower = value.toLowerCase();
  try {
    const host = new URL(value).hostname.toLowerCase();
    if (host.includes("cloudinary.com")) return "cloudinary";
    if (host.includes("supabase.co")) return "supabase";
  } catch {
    // fall through
  }

  if (
    lower.includes("/storage/v1/object/") ||
    lower.includes("supabase.co/storage/")
  ) {
    return "supabase";
  }

  return "r2";
};

const inferResourceType = (field: LinkMediaField, value: string) => {
  if (field.resourceType === "video") return "video";
  if (/\.(mp4|webm|mov|m4v|avi|mkv)(\?|#|$)/i.test(value)) {
    return "video";
  }
  return "image";
};

const inferFileName = (value: string) => {
  try {
    const pathname = new URL(value).pathname;
    const fileName = pathname.split("/").filter(Boolean).pop() || "upload.bin";
    return decodeURIComponent(fileName);
  } catch {
    const fileName = value.split("/").filter(Boolean).pop() || "upload.bin";
    return decodeURIComponent(fileName);
  }
};

const inferObjectPath = (value: string) => {
  try {
    const url = new URL(value);
    if (url.hostname.includes("cloudinary.com")) {
      const segments = url.pathname.split("/").filter(Boolean);
      const uploadIndex = segments.findIndex((segment) => segment === "upload");
      if (uploadIndex >= 0) {
        const afterUpload = segments.slice(uploadIndex + 1);
        const versionIndex = afterUpload.findIndex((segment) =>
          /^v\d+$/.test(segment),
        );
        const canonicalSegments =
          versionIndex >= 0
            ? afterUpload.slice(versionIndex + 1)
            : afterUpload;
        if (canonicalSegments.length > 0) {
          return canonicalSegments.join("/");
        }
      }
    }

    return url.pathname.replace(/^\/+/, "");
  } catch {
    return value.replace(/^https?:\/\/[^/]+/i, "").replace(/^\/+/, "");
  }
};

const fetchRemoteSizeAndMime = async (url: string) => {
  try {
    const response = await fetch(url, { method: "HEAD", redirect: "follow" });
    const sizeBytes = Number(response.headers.get("content-length") || 0);
    const mimeType =
      response.headers.get("content-type") || "application/octet-stream";
    return {
      sizeBytes: Number.isFinite(sizeBytes) && sizeBytes > 0 ? sizeBytes : 0,
      mimeType,
    };
  } catch {
    return {
      sizeBytes: 0,
      mimeType: "application/octet-stream",
    };
  }
};

const buildMediaAsset = async (
  link: LinkRow,
  field: LinkMediaField,
  rawUrl: string,
): Promise<MediaAssetUpsert | null> => {
  const url = normalizeUrl(rawUrl);
  if (!url) return null;

  const provider = inferProviderFromUrl(url);
  const resourceType = inferResourceType(field, url);
  const { sizeBytes, mimeType } = await fetchRemoteSizeAndMime(url);
  const objectPath = inferObjectPath(url);
  const fileName = inferFileName(url);

  return {
    user_id: link.user_id,
    provider,
    resource_type: resourceType,
    object_path: objectPath,
    public_url: url,
    folder_name: normalizeFolderName("root"),
    tags: [],
    file_name: fileName,
    size_bytes: sizeBytes,
    modified_at: link.created_at || new Date().toISOString(),
    mime_type: mimeType,
    metadata: {
      link_id: link.id,
      link_short_code: link.short_code,
      link_title: link.custom_title || link.short_code,
      link_field: field.field,
      source: "link-sync",
    },
  };
};

const main = async () => {
  const supabase = getSupabase();
  const dryRun = process.argv.includes("--dry-run");

  const { data: links, error } = await supabase
    .from("links")
    .select(
      "id, user_id, short_code, slug, custom_title, custom_image_url, video_url, ab_variant_b_image_url, ab_variant_b_video_url, created_at",
    );

  if (error) {
    throw error;
  }

  const linkRows = (links || []) as LinkRow[];
  console.log(`Loaded ${linkRows.length} links`);

  let scanned = 0;
  let upserted = 0;
  let skipped = 0;

  for (const link of linkRows) {
    for (const field of LINK_MEDIA_FIELDS) {
      const rawUrl = link[field.field];
      if (!rawUrl?.trim()) {
        continue;
      }

      scanned += 1;
      const asset = await buildMediaAsset(link, field, rawUrl);
      if (!asset) {
        skipped += 1;
        continue;
      }

      if (dryRun) {
        console.log(
          `[dry-run] ${link.short_code} -> ${field.field} (${asset.provider}:${asset.object_path})`,
        );
        continue;
      }

      const { error: upsertError } = await supabase
        .from("media_assets")
        .upsert(asset, { onConflict: "user_id,provider,object_path" });

      if (upsertError) {
        console.error(
          `Failed to sync ${link.short_code} ${field.field}:`,
          upsertError.message,
        );
        skipped += 1;
        continue;
      }

      upserted += 1;
    }
  }

  console.log(
    `Completed link media sync. scanned=${scanned}, upserted=${upserted}, skipped=${skipped}`,
  );
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
