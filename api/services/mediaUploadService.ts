import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { cloudinary } from "../config/cloudinary.js";
import { CLOUDINARY_UPLOAD_FOLDER } from "../config/constants.js";
import type { SupabaseClient } from "../config/supabase.js";

export type MediaUploadResourceType = "image" | "video" | "audio" | "auto";
export type MediaUploadProvider = "r2" | "cloudinary" | "supabase";
export type ManagedMediaUploadProvider = MediaUploadProvider;
type LegacyLocalMediaUploadProvider = "local";

export interface CloudinaryUploadPlan {
  provider: "cloudinary";
  resourceType: MediaUploadResourceType;
  uploadUrl: string;
  cloudName: string;
  apiKey: string;
  folder: string;
  timestamp: number;
  signature: string;
}

export interface SupabaseUploadPlan {
  provider: "supabase";
  resourceType: MediaUploadResourceType;
  uploadUrl: string;
  bucket: string;
  folder: string;
  maxFileSizeBytes: number;
}

export interface R2UploadPlan {
  provider: "r2";
  resourceType: MediaUploadResourceType;
  uploadUrl: string;
  bucket: string;
  publicBaseUrl: string;
  maxFileSizeBytes: number;
}

type LocalUploadPlan = {
  provider: LegacyLocalMediaUploadProvider;
  resourceType: MediaUploadResourceType;
  uploadUrl: string;
  publicPathPrefix: string;
  storageDir: string;
  maxFileSizeBytes: number;
};

export type MediaUploadPlan =
  | R2UploadPlan
  | CloudinaryUploadPlan
  | SupabaseUploadPlan;

type MediaUploadFileMeta = {
  fileName?: string;
  fileSize?: number;
  contentType?: string;
};

type SupabaseUploadResult = {
  provider: "supabase";
  bucket: string;
  path: string;
  url: string;
};

type R2UploadResult = {
  provider: "r2";
  bucket: string;
  path: string;
  url: string;
};

type LocalUploadResult = {
  provider: LegacyLocalMediaUploadProvider;
  path: string;
  url: string;
  storageDir: string;
};

export interface LocalMediaAsset {
  path: string;
  url: string;
  resourceType: Exclude<MediaUploadResourceType, "auto">;
  folderName: string;
  tags: string[];
  fileName: string;
  sizeBytes: number;
  modifiedAt: string;
  mimeType: string;
  metadata?: Record<string, unknown>;
}

interface LocalMediaAssetRecord {
  user_id: string;
  provider: LegacyLocalMediaUploadProvider;
  resource_type: Exclude<MediaUploadResourceType, "auto">;
  object_path: string;
  public_url: string;
  folder_name: string;
  tags: string[];
  file_name: string;
  size_bytes: number;
  modified_at: string;
  mime_type: string;
  metadata: Record<string, unknown>;
}

export interface ManagedMediaAssetRecord {
  user_id: string;
  provider: ManagedMediaUploadProvider;
  resource_type: Exclude<MediaUploadResourceType, "auto">;
  object_path: string;
  public_url: string;
  folder_name: string;
  tags: string[];
  file_name: string;
  size_bytes: number;
  modified_at: string;
  mime_type: string;
  metadata: Record<string, unknown>;
}

type LocalMediaAssetRow = {
  object_path: string;
  public_url: string;
  provider: LegacyLocalMediaUploadProvider | ManagedMediaUploadProvider;
  resource_type: Exclude<MediaUploadResourceType, "auto">;
  folder_name: string;
  tags: string[] | null;
  file_name: string;
  size_bytes: number;
  modified_at: string;
  mime_type: string;
  metadata?: Record<string, unknown> | null;
};

type ManagedMediaAssetRow = LocalMediaAssetRow & {
  provider: ManagedMediaUploadProvider;
};

const DEFAULT_PROVIDER_ORDER: MediaUploadProvider[] = [
  "r2",
  "cloudinary",
  "supabase",
];

const DEFAULT_PROVIDER_ORDER_FOR_VIDEO: MediaUploadProvider[] = [
  "r2",
  "cloudinary",
  "supabase",
];

const DEFAULT_SUPABASE_MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
const DEFAULT_R2_MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
const DEFAULT_LOCAL_MEDIA_STORAGE_DIR = path.join(
  process.cwd(),
  "uploads",
  "media",
);
const DEFAULT_LOCAL_MEDIA_PUBLIC_PATH_PREFIX = "media";
const CLOUDINARY_ACCOUNT_SUFFIXES = ["", "_2", "_3", "_4", "_5"] as const;
let _r2Client: S3Client | null = null;

const isTruthyEnvFlag = (value?: string) => /^(1|true|yes|on)$/i.test(value || "");

export const isCloudinaryUploadDisabled = () =>
  isTruthyEnvFlag(process.env.DISABLE_CLOUDINARY_UPLOAD);

export const isCloudinaryBackupEnabled = () => {
  const rawValue = process.env.ENABLE_CLOUDINARY_BACKUP;
  if (rawValue === undefined || rawValue === null || rawValue.trim() === "") {
    return true;
  }

  return isTruthyEnvFlag(rawValue);
};

const getR2AccountId = () => process.env.CLOUDFLARE_ACCOUNT_ID?.trim() || "";
const getR2AccessKeyId = () => process.env.R2_ACCESS_KEY_ID?.trim() || "";
const getR2SecretAccessKey = () =>
  process.env.R2_SECRET_ACCESS_KEY?.trim() || "";
const getR2BucketName = () => process.env.R2_BUCKET_NAME?.trim() || "";

export const getR2PublicBaseUrl = () =>
  process.env.R2_PUBLIC_BASE_URL?.trim().replace(/\/+$/, "") || "";

const isR2StorageEnabled = () =>
  Boolean(
    getR2AccountId() &&
      getR2AccessKeyId() &&
      getR2SecretAccessKey() &&
      getR2BucketName() &&
      getR2PublicBaseUrl(),
  );

const getR2Client = () => {
  if (_r2Client) {
    return _r2Client;
  }

  const accountId = getR2AccountId();
  const accessKeyId = getR2AccessKeyId();
  const secretAccessKey = getR2SecretAccessKey();

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Cloudflare R2 is not configured.");
  }

  _r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return _r2Client;
};

const getR2EndpointHost = () =>
  `${getR2AccountId()}.r2.cloudflarestorage.com`;

const encodeR2Path = (value: string) =>
  value
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

const toR2AmzDate = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
};

const createR2SigningKey = (secretAccessKey: string, dateStamp: string) => {
  const kDate = crypto
    .createHmac("sha256", `AWS4${secretAccessKey}`)
    .update(dateStamp)
    .digest();
  const kRegion = crypto
    .createHmac("sha256", kDate)
    .update("auto")
    .digest();
  const kService = crypto
    .createHmac("sha256", kRegion)
    .update("s3")
    .digest();

  return crypto.createHmac("sha256", kService).update("aws4_request").digest();
};

const buildCanonicalQueryString = (
  params: Record<string, string | number>,
) =>
  Object.entries(params)
    .map(([key, value]) => [encodeURIComponent(key), encodeURIComponent(String(value))] as const)
    .sort(([leftKey, leftValue], [rightKey, rightValue]) =>
      leftKey === rightKey
        ? leftValue.localeCompare(rightValue)
        : leftKey.localeCompare(rightKey),
    )
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

export const buildR2ManagedObjectPath = (payload: {
  resourceType: Exclude<MediaUploadResourceType, "auto">;
  userId: string;
  fileName?: string;
  contentType?: string;
}) => {
  const folder =
    payload.resourceType === "video"
      ? "videos"
      : payload.resourceType === "audio"
        ? "audio"
        : "images";
  const sourceName = payload.fileName || `${payload.resourceType}.bin`;
  const safeName = sanitizeFileName(sourceName);
  const currentExt = path.extname(safeName).toLowerCase();
  const inferredExt = inferFileExtensionFromContentType(payload.contentType);
  const baseName =
    currentExt && currentExt !== ".bin"
      ? safeName.slice(0, -currentExt.length)
      : safeName.replace(/\.bin$/i, "");
  const finalName =
    inferredExt && (currentExt === "" || currentExt === ".bin")
      ? `${baseName || payload.resourceType}${inferredExt}`
      : safeName;

  return [folder, payload.userId, `${Date.now()}-${crypto.randomUUID()}-${finalName}`]
    .filter(Boolean)
    .join("/");
};

export const createR2PresignedUpload = (payload: {
  bucket: string;
  objectPath: string;
  contentType?: string;
  expiresInSeconds?: number;
  now?: Date;
}) => {
  const accountId = getR2AccountId();
  const accessKeyId = getR2AccessKeyId();
  const secretAccessKey = getR2SecretAccessKey();

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Cloudflare R2 is not configured.");
  }

  const bucket = payload.bucket.trim();
  if (!bucket) {
    throw new Error("Cloudflare R2 bucket is not configured.");
  }

  const host = getR2EndpointHost();
  const now = payload.now || new Date();
  const amzDate = toR2AmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const contentType = (payload.contentType || "application/octet-stream").trim();
  const canonicalPath = `/${encodeURIComponent(bucket)}/${encodeR2Path(payload.objectPath)}`;
  const canonicalQueryString = buildCanonicalQueryString({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${accessKeyId}/${credentialScope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": payload.expiresInSeconds || 900,
    "X-Amz-SignedHeaders": "content-type;host",
  });
  const canonicalRequest = [
    "PUT",
    canonicalPath,
    canonicalQueryString,
    `content-type:${contentType}\n` + `host:${host}\n`,
    "content-type;host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const canonicalRequestHash = crypto
    .createHash("sha256")
    .update(canonicalRequest)
    .digest("hex");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    canonicalRequestHash,
  ].join("\n");
  const signingKey = createR2SigningKey(secretAccessKey, dateStamp);
  const signature = crypto
    .createHmac("sha256", signingKey)
    .update(stringToSign)
    .digest("hex");
  const uploadUrl = `https://${host}${canonicalPath}?${canonicalQueryString}&X-Amz-Signature=${signature}`;

  return {
    uploadUrl,
    headers: {
      "Content-Type": contentType,
    },
  };
};

const getConfiguredCloudinaryAccounts = () =>
  CLOUDINARY_ACCOUNT_SUFFIXES.map((suffix) => {
    const cloudName = process.env[`CLOUDINARY_CLOUD_NAME${suffix}`]?.trim();
    const apiKey = process.env[`CLOUDINARY_API_KEY${suffix}`]?.trim();
    const apiSecret = process.env[`CLOUDINARY_API_SECRET${suffix}`]?.trim();

    if (!cloudName || !apiKey || !apiSecret) {
      return null;
    }

    return {
      cloudName,
      apiKey,
      apiSecret,
    };
  }).filter(
    (
      account,
    ): account is {
      cloudName: string;
      apiKey: string;
      apiSecret: string;
    } => !!account,
  );

const inferMediaUploadResourceType = (
  resourceType: MediaUploadResourceType,
  fileMeta?: MediaUploadFileMeta,
): Exclude<MediaUploadResourceType, "auto"> => {
  if (resourceType !== "auto") {
    return resourceType;
  }

  const haystack = `${fileMeta?.contentType || ""} ${fileMeta?.fileName || ""}`
    .toLowerCase()
    .trim();

  if (
    haystack.includes("video/") ||
    /\.(mp4|mov|m4v|webm|avi|mkv|gifv)$/i.test(fileMeta?.fileName || "")
  ) {
    return "video";
  }

  if (
    haystack.includes("audio/") ||
    /\.(mp3|wav|aac|m4a|ogg|flac|opus)$/i.test(fileMeta?.fileName || "")
  ) {
    return "audio";
  }

  return "image";
};

const normalizeProviderOrder = (
  resourceType: Exclude<MediaUploadResourceType, "auto">,
): MediaUploadProvider[] => {
  if (resourceType === "audio") {
    return ["r2", "supabase"];
  }

  if (resourceType === "video") {
    return isR2StorageEnabled() ? ["r2"] : [];
  }

  const rawOrder = process.env.MEDIA_UPLOAD_PROVIDER_ORDER;
  const baseOrder =
    DEFAULT_PROVIDER_ORDER;

  if (!rawOrder?.trim()) {
    return baseOrder.filter(
      (provider) => provider !== "cloudinary" || isCloudinaryBackupEnabled(),
    );
  }

  const seen = new Set<MediaUploadProvider>();
  const normalized = rawOrder
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(
      (value): value is MediaUploadProvider =>
        value === "r2" || value === "cloudinary" || value === "supabase",
    )
    .filter((value) => {
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });

  if (!normalized.length) {
    return baseOrder.filter(
      (provider) => provider !== "cloudinary" || isCloudinaryBackupEnabled(),
    );
  }

  return normalized.filter(
    (provider) => provider !== "cloudinary" || isCloudinaryBackupEnabled(),
  );
};

export const getLocalMediaStorageDir = () => {
  const configured = process.env.LOCAL_MEDIA_STORAGE_DIR?.trim();
  if (!configured) {
    return DEFAULT_LOCAL_MEDIA_STORAGE_DIR;
  }

  return path.isAbsolute(configured)
    ? configured
    : path.resolve(process.cwd(), configured);
};

export const getLocalMediaPublicPathPrefix = () => {
  const configured = process.env.LOCAL_MEDIA_PUBLIC_PATH?.trim();
  const normalized = configured?.replace(/^\/+|\/+$/g, "") || "";
  return normalized || DEFAULT_LOCAL_MEDIA_PUBLIC_PATH_PREFIX;
};

const getLocalMediaUploadUrl = () => "/api/v1/media/upload-local";

const getLocalMediaPublicPath = (objectPath: string) => {
  const normalizedObjectPath = objectPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `/${getLocalMediaPublicPathPrefix()}/${normalizedObjectPath}`;
};

const getR2UploadUrl = () => "/api/v1/media/upload-r2";

const getR2PublicPath = (objectPath: string) => {
  const normalizedObjectPath = objectPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `/${normalizedObjectPath}`;
};

export const buildR2PublicUrl = (
  objectPath: string,
  publicBaseUrl = getR2PublicBaseUrl(),
) => {
  const baseUrl = publicBaseUrl.trim().replace(/\/+$/, "");
  if (!baseUrl) {
    return "";
  }

  return `${baseUrl}${getR2PublicPath(objectPath)}`;
};

const getR2Plan = (
  resourceType: MediaUploadResourceType,
  fileMeta?: MediaUploadFileMeta,
): R2UploadPlan | null => {
  if (!isR2StorageEnabled()) {
    return null;
  }

  const parsedMaxFileSize = Number(process.env.R2_MAX_UPLOAD_BYTES || "");
  const maxFileSizeBytes =
    Number.isFinite(parsedMaxFileSize) && parsedMaxFileSize > 0
      ? parsedMaxFileSize
      : DEFAULT_R2_MAX_UPLOAD_BYTES;
  if (
    typeof fileMeta?.fileSize === "number" &&
    fileMeta.fileSize > maxFileSizeBytes
  ) {
    return null;
  }

  return {
    provider: "r2",
    resourceType,
    uploadUrl: getR2UploadUrl(),
    bucket: getR2BucketName(),
    publicBaseUrl: getR2PublicBaseUrl(),
    maxFileSizeBytes,
  };
};

const isLocalMediaStorageEnabled = () => {
  const configuredOrder = process.env.MEDIA_UPLOAD_PROVIDER_ORDER
    ?.split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean) || [];

  return Boolean(
    process.env.LOCAL_MEDIA_STORAGE_DIR?.trim() ||
      process.env.LOCAL_MEDIA_PUBLIC_PATH?.trim() ||
      process.env.LOCAL_MEDIA_STORAGE_ENABLED?.trim() ||
      configuredOrder.includes("local"),
  );
};

const normalizeLocalMediaObjectPath = (value: string) =>
  value.replace(/\\/g, "/").replace(/^\/+/, "").trim();

const getLocalMediaResourceTypeFromPath = (
  objectPath: string,
): Exclude<MediaUploadResourceType, "auto"> => {
  if (objectPath.startsWith("videos/")) return "video";
  if (objectPath.startsWith("audio/")) return "audio";
  return "image";
};

const mapLocalMediaAssetRow = (asset: LocalMediaAssetRow): LocalMediaAsset => ({
  path: String(asset.object_path || ""),
  url: String(asset.public_url || ""),
  resourceType: asset.resource_type,
  folderName: String(asset.folder_name || "root"),
  tags: Array.isArray(asset.tags) ? asset.tags.map((tag) => String(tag)) : [],
  fileName: String(asset.file_name || ""),
  sizeBytes: Number(asset.size_bytes || 0),
  modifiedAt: String(asset.modified_at || new Date().toISOString()),
  mimeType: String(asset.mime_type || "application/octet-stream"),
  metadata:
    asset.metadata && typeof asset.metadata === "object"
      ? (asset.metadata as Record<string, unknown>)
      : {},
});

const mapManagedMediaAssetRow = (
  asset: ManagedMediaAssetRow,
): LocalMediaAsset & { provider: ManagedMediaUploadProvider } => ({
  ...mapLocalMediaAssetRow(asset),
  provider: asset.provider,
});

export const computeMediaUploadSha256 = (buffer: Buffer) =>
  crypto.createHash("sha256").update(buffer).digest("hex");

const extractManagedMediaFingerprint = (metadata: unknown) => {
  if (!metadata || typeof metadata !== "object") {
    return "";
  }

  const rawFingerprint = (metadata as Record<string, unknown>)[
    MEDIA_ASSET_FINGERPRINT_METADATA_KEY
  ];

  return typeof rawFingerprint === "string"
    ? rawFingerprint.trim().toLowerCase()
    : "";
};

const getManagedMediaProviderPriority = (
  provider: ManagedMediaUploadProvider,
) => {
  if (provider === "r2") return 0;
  if (provider === "cloudinary") return 1;
  if (provider === "supabase") return 2;
  return 99;
};

const applyManagedProviderFilter = (
  query: {
    in: (column: string, values: string[]) => any;
    neq: (column: string, value: string) => any;
    eq: (column: string, value: string) => any;
  },
  providerFilter?: ManagedMediaUploadProvider | ManagedMediaUploadProvider[] | "all",
) => {
  if (!providerFilter || providerFilter === "all") {
    return query.in("provider", MANAGED_MEDIA_PROVIDERS);
  }

  const providers = Array.isArray(providerFilter)
    ? providerFilter.filter((provider) => MANAGED_MEDIA_PROVIDERS.includes(provider))
    : [providerFilter].filter((provider) =>
        MANAGED_MEDIA_PROVIDERS.includes(provider),
      );

  if (!providers.length) {
    return query.in("provider", MANAGED_MEDIA_PROVIDERS);
  }

  if (providers.length === 1) {
    return query.eq("provider", providers[0]);
  }

  return query.in("provider", providers);
};

const mapLocalMediaFolderRow = (name: string) => normalizeFolderName(name);

const isAllowedLocalMediaObjectPath = (objectPath: string, userId: string) => {
  const normalized = path.posix.normalize(normalizeLocalMediaObjectPath(objectPath));
  if (!normalized || normalized === "." || normalized.startsWith("..")) {
    return false;
  }

  const parts = normalized.split("/");
  if (parts.length < 3) return false;

  const [folder, ownerId] = parts;
  if (!["images", "videos", "audio"].includes(folder || "")) return false;
  if (ownerId !== userId) return false;

  return parts.slice(2).every((part) => part && part !== "." && part !== "..");
};

const inferLocalMediaMimeType = (fileName: string) => {
  const ext = path.extname(fileName).toLowerCase();

  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".mp4":
      return "video/mp4";
    case ".mov":
      return "video/quicktime";
    case ".m4v":
      return "video/x-m4v";
    case ".webm":
      return "video/webm";
    case ".mp3":
      return "audio/mpeg";
    case ".wav":
      return "audio/wav";
    case ".aac":
      return "audio/aac";
    case ".m4a":
      return "audio/mp4";
    case ".ogg":
      return "audio/ogg";
    default:
      return "application/octet-stream";
  }
};

const MEDIA_ASSETS_TABLE = "media_assets";
const MEDIA_FOLDERS_TABLE = "media_folders";
export const MEDIA_ASSET_FINGERPRINT_METADATA_KEY = "sha256";
const LOCAL_MEDIA_ASSET_COLUMNS =
  "object_path, public_url, resource_type, folder_name, tags, file_name, size_bytes, modified_at, mime_type";
const MANAGED_MEDIA_ASSET_COLUMNS =
  "provider, object_path, public_url, resource_type, folder_name, tags, file_name, size_bytes, modified_at, mime_type";
const MANAGED_MEDIA_ASSET_WITH_METADATA_COLUMNS =
  "provider, object_path, public_url, resource_type, folder_name, tags, file_name, size_bytes, modified_at, mime_type, metadata";
const MANAGED_MEDIA_PROVIDERS: ManagedMediaUploadProvider[] = [
  "r2",
  "cloudinary",
  "supabase",
];

export interface LocalMediaFolderRecord {
  user_id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

const getSupabaseUploadFolder = (resourceType: MediaUploadResourceType) => {
  const configured = process.env.SUPABASE_UPLOAD_FOLDER?.trim();
  if (configured) {
    return configured.replace(/^\/+|\/+$/g, "");
  }

  if (resourceType === "video") return "videos";
  if (resourceType === "audio") return "audio";
  return "images";
};

export const getSupabaseMediaMaxUploadBytes = () => {
  const parsed = Number(process.env.SUPABASE_MAX_UPLOAD_BYTES || "");
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_SUPABASE_MAX_UPLOAD_BYTES;
};

const sanitizeFileName = (value?: string | null) => {
  const trimmed = value?.trim() || "";
  const normalized = trimmed.replace(/[^a-zA-Z0-9._-]+/g, "_");
  return normalized || "upload.bin";
};

const inferFileExtensionFromContentType = (contentType?: string) => {
  switch ((contentType || "").trim().toLowerCase()) {
    case "image/jpeg":
    case "image/jpg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "video/mp4":
      return ".mp4";
    case "video/quicktime":
      return ".mov";
    case "video/webm":
      return ".webm";
    case "audio/mpeg":
      return ".mp3";
    case "audio/wav":
      return ".wav";
    case "audio/aac":
      return ".aac";
    case "audio/mp4":
      return ".m4a";
    case "audio/ogg":
      return ".ogg";
    default:
      return "";
  }
};

export const normalizeFolderName = (value?: string | null) => {
  const trimmed = value?.trim() || "";
  const normalized = trimmed
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9/_-]+/g, "-")
    .replace(/\/+/g, "/")
    .toLowerCase();

  return normalized || "root";
};

export const isRootFolderName = (value?: string | null) =>
  normalizeFolderName(value) === "root";

export const normalizeMediaTags = (
  value?: string[] | string | null,
): string[] => {
  const rawTags = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];

  const seen = new Set<string>();
  const tags = rawTags
    .map((tag) =>
      tag
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9._-]/g, ""),
    )
    .filter((tag) => tag.length > 0)
    .filter((tag) => {
      if (seen.has(tag)) return false;
      seen.add(tag);
      return true;
    });

  return tags.slice(0, 20);
};

const getCloudinaryPlans = (
  resourceType: MediaUploadResourceType,
): CloudinaryUploadPlan[] => {
  if (resourceType === "audio") {
    return [];
  }

  if (isCloudinaryUploadDisabled()) {
    return [];
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = CLOUDINARY_UPLOAD_FOLDER;
  return getConfiguredCloudinaryAccounts().map(
    ({ cloudName, apiKey, apiSecret }) => ({
      provider: "cloudinary" as const,
      resourceType,
      uploadUrl: "/api/v1/media/upload-cloudinary",
      cloudName,
      apiKey,
      folder,
      timestamp,
      signature: cloudinary.utils.api_sign_request(
        { folder, timestamp },
        apiSecret,
      ),
    }),
  );
};

const getSupabaseBucket = (resourceType: MediaUploadResourceType) => {
  if (resourceType === "video") {
    return (
      process.env.SUPABASE_VIDEO_BUCKET?.trim() ||
      process.env.SUPABASE_UPLOAD_BUCKET?.trim() ||
      ""
    );
  }

  if (resourceType === "audio") {
    return (
      process.env.SUPABASE_AUDIO_BUCKET?.trim() ||
      process.env.SUPABASE_UPLOAD_BUCKET?.trim() ||
      ""
    );
  }

  return (
    process.env.SUPABASE_IMAGE_BUCKET?.trim() ||
    process.env.SUPABASE_UPLOAD_BUCKET?.trim() ||
    ""
  );
};

const getSupabasePlan = (
  resourceType: MediaUploadResourceType,
  fileMeta?: MediaUploadFileMeta,
): SupabaseUploadPlan | null => {
  const bucket = getSupabaseBucket(resourceType);
  if (!bucket) {
    return null;
  }

  const maxFileSizeBytes = getSupabaseMediaMaxUploadBytes();
  if (
    typeof fileMeta?.fileSize === "number" &&
    fileMeta.fileSize > maxFileSizeBytes
  ) {
    return null;
  }

  return {
    provider: "supabase",
    resourceType,
    uploadUrl: "/api/v1/media/upload-supabase",
    bucket,
    folder: getSupabaseUploadFolder(resourceType),
    maxFileSizeBytes,
  };
};

const getLocalPlan = (
  resourceType: MediaUploadResourceType,
  fileMeta?: MediaUploadFileMeta,
): LocalUploadPlan | null => {
  if (!isLocalMediaStorageEnabled()) {
    return null;
  }

  const storageDir = getLocalMediaStorageDir();
  const maxFileSizeBytes = getSupabaseMediaMaxUploadBytes();
  if (
    typeof fileMeta?.fileSize === "number" &&
    fileMeta.fileSize > maxFileSizeBytes
  ) {
    return null;
  }

  return {
    provider: "local",
    resourceType,
    uploadUrl: getLocalMediaUploadUrl(),
    publicPathPrefix: getLocalMediaPublicPathPrefix(),
    storageDir,
    maxFileSizeBytes,
  };
};

export const buildMediaUploadPlan = (
  resourceType: MediaUploadResourceType,
  fileMeta?: MediaUploadFileMeta,
): MediaUploadPlan[] => {
  const effectiveResourceType = inferMediaUploadResourceType(
    resourceType,
    fileMeta,
  );
  const r2Plan = getR2Plan(effectiveResourceType, fileMeta);
  const supabasePlan = getSupabasePlan(effectiveResourceType, fileMeta);
  const plansByProvider: Record<MediaUploadProvider, MediaUploadPlan[]> = {
    r2: r2Plan ? [r2Plan] : [],
    cloudinary: getCloudinaryPlans(effectiveResourceType),
    supabase: supabasePlan ? [supabasePlan] : [],
  };

  return normalizeProviderOrder(effectiveResourceType)
    .flatMap((provider) => plansByProvider[provider]);
};

export const uploadToSupabaseStorage = async (
  supabase: SupabaseClient,
  payload: {
    resourceType: MediaUploadResourceType;
    userId: string;
    file: {
      buffer: Buffer;
      mimetype?: string;
      originalname?: string;
    };
    fileName?: string;
  },
): Promise<SupabaseUploadResult> => {
  const bucket = getSupabaseBucket(payload.resourceType);
  if (!bucket) {
    throw new Error("Supabase upload bucket is not configured.");
  }

  const folder = getSupabaseUploadFolder(payload.resourceType);
  const sourceName =
    payload.fileName || payload.file.originalname || `${payload.resourceType}.bin`;
  const safeName = sanitizeFileName(sourceName);
  const objectPath = [
    folder,
    payload.userId,
    `${Date.now()}-${crypto.randomUUID()}-${safeName}`,
  ]
    .filter(Boolean)
    .join("/");

  const { error } = await supabase.storage.from(bucket).upload(
    objectPath,
    payload.file.buffer,
    {
      contentType: payload.file.mimetype || undefined,
      upsert: false,
      cacheControl: "31536000",
    },
  );

  if (error) {
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(objectPath);

  return {
    provider: "supabase",
    bucket,
    path: objectPath,
    url: publicUrl,
  };
};

export const uploadToR2Storage = async (
  payload: {
    resourceType: MediaUploadResourceType;
    userId: string;
    file: {
      buffer: Buffer;
      mimetype?: string;
      originalname?: string;
    };
    fileName?: string;
  },
  deps: {
    client?: S3Client;
    publicBaseUrl?: string;
  } = {},
): Promise<R2UploadResult> => {
  const bucket = getR2BucketName();
  if (!bucket) {
    throw new Error("Cloudflare R2 bucket is not configured.");
  }

  const publicBaseUrl = (deps.publicBaseUrl || getR2PublicBaseUrl()).trim();
  if (!publicBaseUrl) {
    throw new Error("Cloudflare R2 public base URL is not configured.");
  }

  const folder =
    payload.resourceType === "video"
      ? "videos"
      : payload.resourceType === "audio"
        ? "audio"
        : "images";
  const sourceName =
    payload.fileName || payload.file.originalname || `${payload.resourceType}.bin`;
  const effectiveResourceType =
    payload.resourceType === "video"
      ? "video"
      : payload.resourceType === "audio"
        ? "audio"
        : "image";
  const objectPath = buildR2ManagedObjectPath({
    resourceType: effectiveResourceType,
    userId: payload.userId,
    fileName: sourceName,
    contentType: payload.file.mimetype,
  });

  const client = deps.client || getR2Client();
  const result = await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectPath,
      Body: payload.file.buffer,
      ContentType: payload.file.mimetype || undefined,
      CacheControl: "public, max-age=31536000",
    }),
  );

  if (result.$metadata?.httpStatusCode && result.$metadata.httpStatusCode >= 400) {
    throw new Error(`Cloudflare R2 upload failed (${result.$metadata.httpStatusCode})`);
  }

  return {
    provider: "r2",
    bucket,
    path: objectPath,
    url: buildR2PublicUrl(objectPath, publicBaseUrl),
  };
};

export const uploadToLocalStorage = async (payload: {
  resourceType: MediaUploadResourceType;
  userId: string;
  file: {
    buffer: Buffer;
    mimetype?: string;
    originalname?: string;
  };
  fileName?: string;
}): Promise<LocalUploadResult> => {
  const storageDir = getLocalMediaStorageDir();
  const folder =
    payload.resourceType === "video"
      ? "videos"
      : payload.resourceType === "audio"
        ? "audio"
        : "images";
  const sourceName =
    payload.fileName || payload.file.originalname || `${payload.resourceType}.bin`;
  const safeName = sanitizeFileName(sourceName);
  const objectPath = [
    folder,
    payload.userId,
    `${Date.now()}-${crypto.randomUUID()}-${safeName}`,
  ]
    .filter(Boolean)
    .join("/");

  const absolutePath = path.join(storageDir, ...objectPath.split("/"));
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, payload.file.buffer);

  return {
    provider: "local",
    path: objectPath,
    url: getLocalMediaPublicPath(objectPath),
    storageDir,
  };
};

export const buildLocalMediaUrl = (
  objectPath: string,
  publicBaseUrl: string,
) => {
  return `${publicBaseUrl.replace(/\/+$/, "")}${getLocalMediaPublicPath(objectPath)}`;
};

const scanLocalMediaAssetsFromDisk = async (payload: {
  userId: string;
  resourceType?: Exclude<MediaUploadResourceType, "auto"> | "all";
}): Promise<LocalMediaAsset[]> => {
  if (!isLocalMediaStorageEnabled()) {
    return [];
  }

  const storageDir = getLocalMediaStorageDir();
  const selectedFolders =
    payload.resourceType === "all" || !payload.resourceType
      ? ["images", "videos", "audio"]
      : [
          payload.resourceType === "image"
            ? "images"
            : payload.resourceType === "video"
              ? "videos"
              : "audio",
        ];

  const assets: LocalMediaAsset[] = [];

  for (const folder of selectedFolders) {
    const userDir = path.join(storageDir, folder, payload.userId);

    try {
      const entries = await fs.readdir(userDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile()) continue;

        const objectPath = path.posix.join(folder, payload.userId, entry.name);
        const absolutePath = path.join(userDir, entry.name);
        const stats = await fs.stat(absolutePath);

        assets.push({
          path: objectPath,
          url: getLocalMediaPublicPath(objectPath),
          resourceType: getLocalMediaResourceTypeFromPath(objectPath),
          folderName: "root",
          tags: [],
          fileName: entry.name,
          sizeBytes: stats.size,
          modifiedAt: stats.mtime.toISOString(),
          mimeType: inferLocalMediaMimeType(entry.name),
        });
      }
    } catch (error: any) {
      if (error?.code === "ENOENT") {
        continue;
      }
      throw error;
    }
  }

  return assets.sort(
    (a, b) =>
      new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime(),
  );
};

export const toLocalMediaAssetRecord = (
  asset: LocalMediaAsset,
  userId: string,
): LocalMediaAssetRecord => ({
  user_id: userId,
  provider: "local",
  resource_type: asset.resourceType,
  object_path: asset.path,
  public_url: asset.url,
  folder_name: asset.folderName,
  tags: asset.tags,
  file_name: asset.fileName,
  size_bytes: asset.sizeBytes,
  modified_at: asset.modifiedAt,
  mime_type: asset.mimeType,
  metadata: {},
});

export const listLocalMediaAssets = scanLocalMediaAssetsFromDisk;

export const syncLocalMediaAssetsToDatabase = async (
  supabase: SupabaseClient,
  payload: {
    userId: string;
    resourceType?: Exclude<MediaUploadResourceType, "auto"> | "all";
  },
) => {
  if (!isLocalMediaStorageEnabled()) {
    return [];
  }

  const assets = await scanLocalMediaAssetsFromDisk(payload);
  if (!assets.length) {
    return [];
  }

  const existingQuery = supabase
    .from(MEDIA_ASSETS_TABLE)
    .select("object_path")
    .eq("user_id", payload.userId)
    .eq("provider", "local");

  if (payload.resourceType && payload.resourceType !== "all") {
    existingQuery.eq("resource_type", payload.resourceType);
  }

  const { data: existingRows, error: existingError } = await existingQuery;
  if (existingError) {
    throw existingError;
  }

  const existingPaths = new Set(
    (existingRows || []).map((row) => String((row as any).object_path || "")),
  );
  const records = assets
    .filter((asset) => !existingPaths.has(asset.path))
    .map((asset) => toLocalMediaAssetRecord(asset, payload.userId));

  if (!records.length) {
    return [];
  }

  const { error } = await supabase.from(MEDIA_ASSETS_TABLE).upsert(records, {
    onConflict: "user_id,provider,object_path",
  });

  if (error) {
    throw error;
  }

  return records;
};

export const listLocalMediaAssetsFromDatabase = async (
  supabase: SupabaseClient,
  payload: {
    userId: string;
    resourceType?: Exclude<MediaUploadResourceType, "auto"> | "all";
    folderName?: string;
  },
): Promise<LocalMediaAsset[]> => {
  const query = supabase
    .from(MEDIA_ASSETS_TABLE)
    .select(
      "object_path, public_url, resource_type, folder_name, tags, file_name, size_bytes, modified_at, mime_type",
    )
    .eq("user_id", payload.userId)
    .eq("provider", "local");

  if (payload.resourceType && payload.resourceType !== "all") {
    query.eq("resource_type", payload.resourceType);
  }

  if (payload.folderName && payload.folderName !== "all") {
    query.eq("folder_name", normalizeFolderName(payload.folderName));
  }

  const { data, error } = await query.order("modified_at", {
    ascending: false,
  });

  if (error) {
    throw error;
  }

  const assets: LocalMediaAsset[] = [];
  for (const asset of data || []) {
    const mapped = mapLocalMediaAssetRow(asset as LocalMediaAssetRow);
    const absolutePath = path.join(
      getLocalMediaStorageDir(),
      ...mapped.path.split("/"),
    );

    try {
      await fs.access(absolutePath);
    } catch (accessError: any) {
      if (accessError?.code === "ENOENT") {
        continue;
      }
      throw accessError;
    }

    assets.push(mapped);
  }

  return assets;
};

export const listMediaAssetsFromDatabase = async (
  supabase: SupabaseClient,
  payload: {
    userId: string;
    resourceType?: Exclude<MediaUploadResourceType, "auto"> | "all";
    folderName?: string;
    provider?: ManagedMediaUploadProvider | ManagedMediaUploadProvider[] | "all";
  },
): Promise<Array<LocalMediaAsset & { provider: ManagedMediaUploadProvider }>> => {
  const query = applyManagedProviderFilter(
    supabase
      .from(MEDIA_ASSETS_TABLE)
      .select(
        "provider, object_path, public_url, resource_type, folder_name, tags, file_name, size_bytes, modified_at, mime_type, metadata",
      )
      .eq("user_id", payload.userId),
    payload.provider,
  );

  if (payload.resourceType && payload.resourceType !== "all") {
    query.eq("resource_type", payload.resourceType);
  }

  if (payload.folderName && payload.folderName !== "all") {
    query.eq("folder_name", normalizeFolderName(payload.folderName));
  }

  const { data, error } = await query.order("modified_at", {
    ascending: false,
  });

  if (error) {
    throw error;
  }

  return (data || []).map((asset) =>
    mapManagedMediaAssetRow(asset as ManagedMediaAssetRow),
  );
};

export const findManagedMediaAssetBySha256 = async (
  supabase: SupabaseClient,
  payload: {
    userId: string;
    resourceType: Exclude<MediaUploadResourceType, "auto">;
    sha256: string;
  },
): Promise<(LocalMediaAsset & { provider: ManagedMediaUploadProvider }) | null> => {
  const fingerprint = payload.sha256.trim().toLowerCase();
  if (!fingerprint) {
    return null;
  }

  const { data, error } = await supabase
    .from(MEDIA_ASSETS_TABLE)
    .select(MANAGED_MEDIA_ASSET_WITH_METADATA_COLUMNS)
    .eq("user_id", payload.userId)
    .eq("resource_type", payload.resourceType)
    .eq("metadata->>sha256", fingerprint)
    .in("provider", MANAGED_MEDIA_PROVIDERS)
    .order("modified_at", { ascending: false });

  if (error) {
    throw error;
  }

  const assets = (data || [])
    .filter((asset) =>
      Boolean(
        extractManagedMediaFingerprint((asset as { metadata?: unknown }).metadata),
      ),
    )
    .map((asset) => mapManagedMediaAssetRow(asset as ManagedMediaAssetRow))
    .sort((a, b) => {
      const providerDelta =
        getManagedMediaProviderPriority(a.provider) -
        getManagedMediaProviderPriority(b.provider);
      if (providerDelta !== 0) {
        return providerDelta;
      }

      return new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime();
    });

  return assets[0] || null;
};

export const upsertLocalMediaAssetRecord = async (
  supabase: SupabaseClient,
  asset: LocalMediaAssetRecord,
) => {
  const { error } = await supabase.from(MEDIA_ASSETS_TABLE).upsert(asset, {
    onConflict: "user_id,provider,object_path",
  });

  if (error) {
    throw error;
  }
};

export const upsertMediaAssetRecord = async (
  supabase: SupabaseClient,
  asset: ManagedMediaAssetRecord,
) => {
  const { error } = await supabase.from(MEDIA_ASSETS_TABLE).upsert(asset, {
    onConflict: "user_id,provider,object_path",
  });

  if (error) {
    throw error;
  }
};

export const updateLocalMediaAssetRecord = async (
  supabase: SupabaseClient,
  payload: {
    userId: string;
    objectPath: string;
    folderName?: string;
    tags?: string[] | string | null;
    fileName?: string;
  },
) => {
  const nextFolderName =
    typeof payload.folderName === "string"
      ? normalizeFolderName(payload.folderName)
      : undefined;
  const nextTags =
    payload.tags !== undefined ? normalizeMediaTags(payload.tags) : undefined;
  const nextFileName =
    typeof payload.fileName === "string" && payload.fileName.trim()
      ? sanitizeFileName(payload.fileName)
      : undefined;

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (nextFolderName !== undefined) {
    updates.folder_name = nextFolderName;
  }

  if (nextTags !== undefined) {
    updates.tags = nextTags;
  }

  if (nextFileName !== undefined) {
    updates.file_name = nextFileName;
  }

  const { data, error } = await supabase
    .from(MEDIA_ASSETS_TABLE)
    .update(updates)
    .eq("user_id", payload.userId)
    .eq("provider", "local")
    .eq("object_path", payload.objectPath)
    .select(
      "object_path, public_url, resource_type, folder_name, tags, file_name, size_bytes, modified_at, mime_type, metadata",
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

export const updateLocalMediaAssetsByFolder = async (
  supabase: SupabaseClient,
  payload: {
    userId: string;
    folderName: string;
    nextFolderName: string;
  },
) => {
  const { data, error } = await supabase
    .from(MEDIA_ASSETS_TABLE)
    .update({
      folder_name: normalizeFolderName(payload.nextFolderName),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", payload.userId)
    .eq("provider", "local")
    .eq("folder_name", normalizeFolderName(payload.folderName))
    .select(LOCAL_MEDIA_ASSET_COLUMNS);

  if (error) {
    throw error;
  }

  return (data || []).map((asset) =>
    mapLocalMediaAssetRow(asset as LocalMediaAssetRow),
  );
};

export const moveLocalMediaAssetsFolderToRoot = async (
  supabase: SupabaseClient,
  payload: {
    userId: string;
    folderName: string;
  },
) => {
  const { data, error } = await supabase
    .from(MEDIA_ASSETS_TABLE)
    .update({
      folder_name: "root",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", payload.userId)
    .eq("provider", "local")
    .eq("folder_name", normalizeFolderName(payload.folderName))
    .select(LOCAL_MEDIA_ASSET_COLUMNS);

  if (error) {
    throw error;
  }

  return (data || []).map((asset) =>
    mapLocalMediaAssetRow(asset as LocalMediaAssetRow),
  );
};

export const listLocalMediaFoldersFromDatabase = async (
  supabase: SupabaseClient,
  payload: {
    userId: string;
  },
) => {
  const [folderRowsResult, assetRowsResult] = await Promise.all([
    supabase
      .from(MEDIA_FOLDERS_TABLE)
      .select("name")
      .eq("user_id", payload.userId)
      .order("name", { ascending: true }),
    supabase
      .from(MEDIA_ASSETS_TABLE)
      .select("folder_name")
      .eq("user_id", payload.userId)
      .eq("provider", "local"),
  ]);

  if (folderRowsResult.error) {
    throw folderRowsResult.error;
  }

  if (assetRowsResult.error) {
    throw assetRowsResult.error;
  }

  const names = new Set<string>(["root"]);
  for (const row of folderRowsResult.data || []) {
    const folderName = normalizeFolderName((row as any).name);
    if (folderName !== "root") {
      names.add(folderName);
    }
  }

  for (const row of assetRowsResult.data || []) {
    const folderName = normalizeFolderName((row as any).folder_name);
    if (folderName !== "root") {
      names.add(folderName);
    }
  }

  return Array.from(names).sort((a, b) => a.localeCompare(b));
};

export const createLocalMediaFolderRecord = async (
  supabase: SupabaseClient,
  payload: {
    userId: string;
    folderName: string;
  },
) => {
  const folderName = normalizeFolderName(payload.folderName);
  if (folderName === "root") {
    throw new Error("Folder name cannot be root.");
  }

  const { error } = await supabase.from(MEDIA_FOLDERS_TABLE).upsert(
    {
      user_id: payload.userId,
      name: folderName,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,name" },
  );

  if (error) {
    throw error;
  }

  return folderName;
};

export const renameLocalMediaFolderRecord = async (
  supabase: SupabaseClient,
  payload: {
    userId: string;
    folderName: string;
    nextFolderName: string;
  },
) => {
  const folderName = normalizeFolderName(payload.folderName);
  const nextFolderName = normalizeFolderName(payload.nextFolderName);

  if (folderName === "root" || nextFolderName === "root") {
    throw new Error("Folder name cannot be root.");
  }

  const updatedAssets = await updateLocalMediaAssetsByFolder(supabase, {
    userId: payload.userId,
    folderName,
    nextFolderName,
  });

  const { error: insertError } = await supabase.from(MEDIA_FOLDERS_TABLE).upsert(
    {
      user_id: payload.userId,
      name: nextFolderName,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,name" },
  );

  if (insertError) {
    throw insertError;
  }

  const { error: deleteError } = await supabase
    .from(MEDIA_FOLDERS_TABLE)
    .delete()
    .eq("user_id", payload.userId)
    .eq("name", folderName);

  if (deleteError) {
    throw deleteError;
  }

  return updatedAssets;
};

export const listMediaFoldersFromDatabase = async (
  supabase: SupabaseClient,
  payload: {
    userId: string;
    provider?: ManagedMediaUploadProvider | ManagedMediaUploadProvider[] | "all";
  },
) => {
  const [folderRowsResult, assetRowsResult] = await Promise.all([
    supabase
      .from(MEDIA_FOLDERS_TABLE)
      .select("name")
      .eq("user_id", payload.userId)
      .order("name", { ascending: true }),
    applyManagedProviderFilter(
      supabase
        .from(MEDIA_ASSETS_TABLE)
        .select("folder_name")
        .eq("user_id", payload.userId),
      payload.provider,
    ),
  ]);

  if (folderRowsResult.error) {
    throw folderRowsResult.error;
  }

  if (assetRowsResult.error) {
    throw assetRowsResult.error;
  }

  const names = new Set<string>(["root"]);
  for (const row of folderRowsResult.data || []) {
    const folderName = normalizeFolderName((row as any).name);
    if (folderName !== "root") {
      names.add(folderName);
    }
  }

  for (const row of assetRowsResult.data || []) {
    const folderName = normalizeFolderName((row as any).folder_name);
    if (folderName !== "root") {
      names.add(folderName);
    }
  }

  return Array.from(names).sort((a, b) => a.localeCompare(b));
};

export const updateMediaAssetRecord = async (
  supabase: SupabaseClient,
  payload: {
    userId: string;
    provider: ManagedMediaUploadProvider;
    objectPath: string;
    folderName?: string;
    tags?: string[] | string | null;
    fileName?: string;
  },
) => {
  const nextFolderName =
    typeof payload.folderName === "string"
      ? normalizeFolderName(payload.folderName)
      : undefined;
  const nextTags =
    payload.tags !== undefined ? normalizeMediaTags(payload.tags) : undefined;
  const nextFileName =
    typeof payload.fileName === "string" && payload.fileName.trim()
      ? sanitizeFileName(payload.fileName)
      : undefined;

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (nextFolderName !== undefined) {
    updates.folder_name = nextFolderName;
  }

  if (nextTags !== undefined) {
    updates.tags = nextTags;
  }

  if (nextFileName !== undefined) {
    updates.file_name = nextFileName;
  }

  const { data, error } = await supabase
    .from(MEDIA_ASSETS_TABLE)
    .update(updates)
    .eq("user_id", payload.userId)
    .eq("provider", payload.provider)
    .eq("object_path", payload.objectPath)
    .select(
      "provider, object_path, public_url, resource_type, folder_name, tags, file_name, size_bytes, modified_at, mime_type",
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? (mapManagedMediaAssetRow(data as ManagedMediaAssetRow) as any) : null;
};

export const updateMediaAssetsByFolder = async (
  supabase: SupabaseClient,
  payload: {
    userId: string;
    folderName: string;
    nextFolderName: string;
    provider?: ManagedMediaUploadProvider | ManagedMediaUploadProvider[] | "all";
  },
) => {
  const { data, error } = await applyManagedProviderFilter(
    supabase
      .from(MEDIA_ASSETS_TABLE)
      .update({
        folder_name: normalizeFolderName(payload.nextFolderName),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", payload.userId)
      .eq("folder_name", normalizeFolderName(payload.folderName)),
    payload.provider,
  ).select(MANAGED_MEDIA_ASSET_COLUMNS);

  if (error) {
    throw error;
  }

  return (data || []).map((asset) =>
    mapManagedMediaAssetRow(asset as ManagedMediaAssetRow),
  );
};

export const moveMediaAssetsFolderToRoot = async (
  supabase: SupabaseClient,
  payload: {
    userId: string;
    folderName: string;
    provider?: ManagedMediaUploadProvider | ManagedMediaUploadProvider[] | "all";
  },
) => {
  const { data, error } = await applyManagedProviderFilter(
    supabase
      .from(MEDIA_ASSETS_TABLE)
      .update({
        folder_name: "root",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", payload.userId)
      .eq("folder_name", normalizeFolderName(payload.folderName)),
    payload.provider,
  ).select(MANAGED_MEDIA_ASSET_COLUMNS);

  if (error) {
    throw error;
  }

  return (data || []).map((asset) =>
    mapManagedMediaAssetRow(asset as ManagedMediaAssetRow),
  );
};

export const createManagedMediaFolderRecord = async (
  supabase: SupabaseClient,
  payload: {
    userId: string;
    folderName: string;
  },
) => {
  const folderName = normalizeFolderName(payload.folderName);
  if (folderName === "root") {
    throw new Error("Folder name cannot be root.");
  }

  const { error } = await supabase.from(MEDIA_FOLDERS_TABLE).upsert(
    {
      user_id: payload.userId,
      name: folderName,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,name" },
  );

  if (error) {
    throw error;
  }

  return folderName;
};

export const renameManagedMediaFolderRecord = async (
  supabase: SupabaseClient,
  payload: {
    userId: string;
    folderName: string;
    nextFolderName: string;
    provider?: ManagedMediaUploadProvider | ManagedMediaUploadProvider[] | "all";
  },
) => {
  const folderName = normalizeFolderName(payload.folderName);
  const nextFolderName = normalizeFolderName(payload.nextFolderName);

  if (folderName === "root" || nextFolderName === "root") {
    throw new Error("Folder name cannot be root.");
  }

  const updatedAssets = await updateMediaAssetsByFolder(supabase, {
    userId: payload.userId,
    folderName,
    nextFolderName,
    provider: payload.provider,
  });

  await createManagedMediaFolderRecord(supabase, {
    userId: payload.userId,
    folderName: nextFolderName,
  });

  await supabase
    .from(MEDIA_FOLDERS_TABLE)
    .delete()
    .eq("user_id", payload.userId)
    .eq("name", folderName);

  return updatedAssets;
};

export const deleteManagedMediaAssetsInFolder = async (
  supabase: SupabaseClient,
  payload: {
    userId: string;
    folderName: string;
    provider?: ManagedMediaUploadProvider | ManagedMediaUploadProvider[] | "all";
  },
) => {
  const folderName = normalizeFolderName(payload.folderName);
  if (folderName === "root") {
    throw new Error("Cannot delete root folder.");
  }

  const assets = await listMediaAssetsFromDatabase(supabase, {
    userId: payload.userId,
    resourceType: "all",
    folderName,
    provider: payload.provider,
  });

  for (const asset of assets) {
    await deleteManagedMediaAsset({
      supabase,
      asset: {
        user_id: payload.userId,
        provider: asset.provider,
        resource_type: asset.resourceType,
        object_path: asset.path,
        public_url: asset.url,
        folder_name: asset.folderName,
        tags: asset.tags,
        file_name: asset.fileName,
        size_bytes: asset.sizeBytes,
        modified_at: asset.modifiedAt,
        mime_type: asset.mimeType,
        metadata: {},
      },
    }).catch(() => undefined);
  }

  const { error } = await supabase
    .from(MEDIA_FOLDERS_TABLE)
    .delete()
    .eq("user_id", payload.userId)
    .eq("name", folderName);

  if (error) {
    throw error;
  }

  return assets.length;
};

export const moveManagedMediaAssetToFolder = async (
  supabase: SupabaseClient,
  payload: {
    userId: string;
    provider: ManagedMediaUploadProvider;
    objectPath: string;
    folderName: string;
  },
) => {
  const folderName = normalizeFolderName(payload.folderName);
  if (folderName !== "root") {
    await createManagedMediaFolderRecord(supabase, {
      userId: payload.userId,
      folderName,
    }).catch(() => undefined);
  }

  return updateMediaAssetRecord(supabase, {
    userId: payload.userId,
    provider: payload.provider,
    objectPath: payload.objectPath,
    folderName,
  });
};

export const updateManagedMediaAssetsTags = async (
  supabase: SupabaseClient,
  payload: {
    userId: string;
    objectPaths: string[];
    addTags?: string[] | string | null;
    removeTags?: string[] | string | null;
    provider?: ManagedMediaUploadProvider | ManagedMediaUploadProvider[] | "all";
  },
) => {
  const normalizedObjectPaths = Array.from(
    new Set(
      payload.objectPaths
        .map((objectPath) => normalizeLocalMediaObjectPath(objectPath))
        .filter(Boolean),
    ),
  );

  if (!normalizedObjectPaths.length) {
    return [];
  }

  const { data, error } = await applyManagedProviderFilter(
    supabase
      .from(MEDIA_ASSETS_TABLE)
      .select(MANAGED_MEDIA_ASSET_COLUMNS)
      .eq("user_id", payload.userId)
      .in("object_path", normalizedObjectPaths),
    payload.provider,
  );

  if (error) {
    throw error;
  }

  const addTags = normalizeMediaTags(payload.addTags ?? null);
  const removeTags = normalizeMediaTags(payload.removeTags ?? null);
  const removals = new Set(removeTags);
  const assets = (data || []).map((asset) =>
    mapManagedMediaAssetRow(asset as ManagedMediaAssetRow),
  );
  const updatedAssets: Array<LocalMediaAsset & { provider: ManagedMediaUploadProvider }> = [];

  for (const asset of assets) {
    const nextTags = normalizeMediaTags(
      [...asset.tags, ...addTags].filter((tag) => !removals.has(tag)),
    );

    const { data: updated, error: updateError } = await supabase
      .from(MEDIA_ASSETS_TABLE)
      .update({
        tags: nextTags,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", payload.userId)
      .eq("provider", asset.provider)
      .eq("object_path", asset.path)
      .select(MANAGED_MEDIA_ASSET_COLUMNS)
      .maybeSingle();

    if (updateError) {
      throw updateError;
    }

    if (updated) {
      updatedAssets.push(mapManagedMediaAssetRow(updated as ManagedMediaAssetRow));
    }
  }

  return updatedAssets;
};

export const deleteMediaAssetRecord = async (
  supabase: SupabaseClient,
  payload: {
    userId: string;
    provider: ManagedMediaUploadProvider;
    objectPath: string;
  },
) => {
  const { error } = await supabase
    .from(MEDIA_ASSETS_TABLE)
    .delete()
    .eq("user_id", payload.userId)
    .eq("provider", payload.provider)
    .eq("object_path", payload.objectPath);

  if (error) {
    throw error;
  }
};

export const deleteManagedMediaAsset = async (payload: {
  supabase: SupabaseClient;
  asset: ManagedMediaAssetRecord;
}) => {
  const { supabase, asset } = payload;
  let providerDeleteError: unknown = null;

  try {
    if (asset.provider === "r2") {
      const bucket = getR2BucketName();
      if (!bucket) {
        throw new Error("Cloudflare R2 bucket is not configured.");
      }

      await getR2Client().send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: asset.object_path,
        }),
      );
    } else if (asset.provider === "cloudinary") {
      await cloudinary.uploader.destroy(asset.object_path, {
        resource_type:
          asset.resource_type === "video"
            ? "video"
            : asset.resource_type === "audio"
              ? "raw"
              : "image",
        invalidate: true,
      });
    } else if (asset.provider === "supabase") {
      const bucket = getSupabaseBucket(asset.resource_type);
      if (!bucket) {
        throw new Error("Supabase upload bucket is not configured.");
      }

      const { error } = await supabase.storage
        .from(bucket)
        .remove([asset.object_path]);
      if (error) {
        throw error;
      }
    }
  } catch (error) {
    providerDeleteError = error;
  }

  await deleteMediaAssetRecord(supabase, {
    userId: asset.user_id,
    provider: asset.provider,
    objectPath: asset.object_path,
  });

  if (providerDeleteError) {
    return {
      providerDeleteError:
        providerDeleteError instanceof Error
          ? providerDeleteError.message
          : "Unable to delete provider object",
    };
  }

  return { providerDeleteError: null };
};

export const deleteLocalMediaAssetsInFolder = async (
  supabase: SupabaseClient,
  payload: {
    userId: string;
    folderName: string;
  },
) => {
  const folderName = normalizeFolderName(payload.folderName);
  if (folderName === "root") {
    throw new Error("Cannot delete root folder.");
  }

  const assets = await listLocalMediaAssetsFromDatabase(supabase, {
    userId: payload.userId,
    resourceType: "all",
    folderName,
  });

  for (const asset of assets) {
    await Promise.allSettled([
      deleteLocalMediaAsset({
        userId: payload.userId,
        objectPath: asset.path,
      }),
      deleteLocalMediaAssetRecord(supabase, {
        userId: payload.userId,
        objectPath: asset.path,
      }),
    ]);
  }

  const { error } = await supabase
    .from(MEDIA_FOLDERS_TABLE)
    .delete()
    .eq("user_id", payload.userId)
    .eq("name", folderName);

  if (error) {
    throw error;
  }

  return assets.length;
};

export const moveLocalMediaAssetToFolder = async (
  supabase: SupabaseClient,
  payload: {
    userId: string;
    objectPath: string;
    folderName: string;
  },
) => {
  const folderName = normalizeFolderName(payload.folderName);
  if (folderName !== "root") {
    await createLocalMediaFolderRecord(supabase, {
      userId: payload.userId,
      folderName,
    }).catch(() => undefined);
  }

  return updateLocalMediaAssetRecord(supabase, {
    userId: payload.userId,
    objectPath: payload.objectPath,
    folderName,
  });
};

export const updateLocalMediaAssetsTags = async (
  supabase: SupabaseClient,
  payload: {
    userId: string;
    objectPaths: string[];
    addTags?: string[] | string | null;
    removeTags?: string[] | string | null;
  },
) => {
  const normalizedObjectPaths = Array.from(
    new Set(
      payload.objectPaths
        .map((objectPath) => normalizeLocalMediaObjectPath(objectPath))
        .filter(Boolean),
    ),
  );

  if (!normalizedObjectPaths.length) {
    return [];
  }

  const { data, error } = await supabase
    .from(MEDIA_ASSETS_TABLE)
    .select(LOCAL_MEDIA_ASSET_COLUMNS)
    .eq("user_id", payload.userId)
    .eq("provider", "local")
    .in("object_path", normalizedObjectPaths);

  if (error) {
    throw error;
  }

  const addTags = normalizeMediaTags(payload.addTags ?? null);
  const removeTags = normalizeMediaTags(payload.removeTags ?? null);
  const removals = new Set(removeTags);
  const assets = (data || []).map((asset) =>
    mapLocalMediaAssetRow(asset as LocalMediaAssetRow),
  );
  const updatedAssets: LocalMediaAsset[] = [];

  for (const asset of assets) {
    const nextTags = normalizeMediaTags(
      [...asset.tags, ...addTags].filter((tag) => !removals.has(tag)),
    );

    const { data: updated, error: updateError } = await supabase
      .from(MEDIA_ASSETS_TABLE)
      .update({
        tags: nextTags,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", payload.userId)
      .eq("provider", "local")
      .eq("object_path", asset.path)
      .select(LOCAL_MEDIA_ASSET_COLUMNS)
      .maybeSingle();

    if (updateError) {
      throw updateError;
    }

    if (updated) {
      updatedAssets.push(mapLocalMediaAssetRow(updated as LocalMediaAssetRow));
    }
  }

  return updatedAssets;
};

export const deleteLocalMediaAssetRecord = async (
  supabase: SupabaseClient,
  payload: {
    userId: string;
    objectPath: string;
  },
) => {
  const { error } = await supabase
    .from(MEDIA_ASSETS_TABLE)
    .delete()
    .eq("user_id", payload.userId)
    .eq("provider", "local")
    .eq("object_path", payload.objectPath);

  if (error) {
    throw error;
  }
};

export const deleteLocalMediaAsset = async (payload: {
  userId: string;
  objectPath: string;
}) => {
  if (!isLocalMediaStorageEnabled()) {
    throw new Error("Local media storage is not enabled.");
  }

  const normalizedPath = path.posix.normalize(
    normalizeLocalMediaObjectPath(payload.objectPath),
  );
  if (!isAllowedLocalMediaObjectPath(normalizedPath, payload.userId)) {
    throw new Error("Invalid media path.");
  }

  const absolutePath = path.join(
    getLocalMediaStorageDir(),
    ...normalizedPath.split("/"),
  );

  await fs.unlink(absolutePath);
  return {
    path: normalizedPath,
    url: getLocalMediaPublicPath(normalizedPath),
  };
};
