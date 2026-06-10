import crypto from "crypto";
import { cloudinary } from "../config/cloudinary.js";
import { CLOUDINARY_UPLOAD_FOLDER } from "../config/constants.js";
import type { SupabaseClient } from "../config/supabase.js";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  getVideoUploadProviderOrder,
  type VideoUploadProviderPreference,
} from "./appSettingsService.js";

export type MediaUploadResourceType = "image" | "video" | "audio" | "auto";
export type MediaUploadProvider = "cloudinary" | "r2" | "supabase";

export const MEDIA_ASSET_FINGERPRINT_METADATA_KEY = "sha256";

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

export interface R2UploadPlan {
  provider: "r2";
  resourceType: MediaUploadResourceType;
  uploadUrl: string;
  bucket: string;
  folder: string;
  publicBaseUrl: string;
}

export interface SupabaseUploadPlan {
  provider: "supabase";
  resourceType: MediaUploadResourceType;
  uploadUrl: string;
  bucket: string;
  folder: string;
  maxFileSizeBytes: number;
}

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

export type ReusableMediaAsset = {
  path: string;
  url: string;
  provider: Exclude<MediaUploadProvider, "local">;
  resourceType: Exclude<MediaUploadResourceType, "auto">;
  folderName: string;
  tags: string[];
  fileName: string;
  sizeBytes: number;
  modifiedAt: string;
  mimeType: string;
  metadata: Record<string, unknown>;
};

const DEFAULT_PROVIDER_ORDER: MediaUploadProvider[] = [
  "cloudinary",
  "supabase",
];

const DEFAULT_PROVIDER_ORDER_FOR_VIDEO: MediaUploadProvider[] = [
  "cloudinary",
  "supabase",
];

const DEFAULT_SUPABASE_MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
const CLOUDINARY_ACCOUNT_SUFFIXES = ["", "_2", "_3", "_4", "_5"] as const;

const isTruthyEnvFlag = (value?: string) => /^(1|true|yes|on)$/i.test(value || "");

export const isCloudinaryUploadDisabled = () =>
  isTruthyEnvFlag(process.env.DISABLE_CLOUDINARY_UPLOAD);

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
  videoUploadProviderPreference?: VideoUploadProviderPreference | null,
): MediaUploadProvider[] => {
  if (resourceType === "audio") {
    return ["supabase"];
  }

  if (resourceType === "video" && videoUploadProviderPreference) {
    return getVideoUploadProviderOrder(videoUploadProviderPreference);
  }

  const rawOrder = process.env.MEDIA_UPLOAD_PROVIDER_ORDER;
  const baseOrder =
    resourceType === "video"
      ? DEFAULT_PROVIDER_ORDER_FOR_VIDEO
      : DEFAULT_PROVIDER_ORDER;

  if (!rawOrder?.trim()) {
    return baseOrder;
  }

  const seen = new Set<MediaUploadProvider>();
  const normalized = rawOrder
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(
      (value): value is MediaUploadProvider =>
        value === "cloudinary" || value === "r2" || value === "supabase",
    )
    .filter((value) => {
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });

  if (!normalized.length) {
    return baseOrder;
  }

  if (resourceType === "video") {
    const orderedVideoProviders: MediaUploadProvider[] = [];

    if (normalized.includes("cloudinary")) {
      orderedVideoProviders.push("cloudinary");
    }

    if (normalized.includes("supabase")) {
      orderedVideoProviders.push("supabase");
    }

    const fallbackVideoOrder = DEFAULT_PROVIDER_ORDER_FOR_VIDEO.filter((provider) =>
      normalized.includes(provider),
    );

    if (orderedVideoProviders.length) {
      return [...orderedVideoProviders, ...fallbackVideoOrder].filter(
        (provider, index, providers) => providers.indexOf(provider) === index,
      );
    }

    return fallbackVideoOrder.length ? fallbackVideoOrder : baseOrder;
  }

  return normalized;
};

const getSupabaseUploadFolder = (resourceType: MediaUploadResourceType) => {
  const configured = process.env.SUPABASE_UPLOAD_FOLDER?.trim();
  if (configured) {
    return configured.replace(/^\/+|\/+$/g, "");
  }

  if (resourceType === "video") return "videos";
  if (resourceType === "audio") return "audio";
  return "images";
};

const getR2UploadFolder = (resourceType: MediaUploadResourceType) => {
  const configured = process.env.R2_UPLOAD_FOLDER?.trim();
  if (configured) {
    return configured.replace(/^\/+|\/+$/g, "");
  }

  if (resourceType === "video") return "videos";
  if (resourceType === "audio") return "audio";
  return "images";
};

const getR2Config = () => {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.trim().replace(/\/+$/, "");

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicBaseUrl,
  };
};

export const computeBufferSha256 = (buffer: Buffer) =>
  crypto.createHash("sha256").update(buffer).digest("hex");

const getR2Client = () => {
  const config = getR2Config();

  if (
    !config.accountId ||
    !config.accessKeyId ||
    !config.secretAccessKey ||
    !config.bucket
  ) {
    return null;
  }

  return {
    client: new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    }),
    bucket: config.bucket,
    publicBaseUrl: config.publicBaseUrl || null,
  };
};

export const findReusableMediaAssetByFingerprint = async (
  supabase: SupabaseClient,
  input: {
    userId: string;
    resourceType: Exclude<MediaUploadResourceType, "auto">;
    fingerprint: string;
  },
): Promise<ReusableMediaAsset | null> => {
  const trimmedFingerprint = input.fingerprint.trim();
  if (!trimmedFingerprint) {
    return null;
  }

  const { data, error } = await supabase
    .from("media_assets")
    .select(
      "object_path, public_url, provider, resource_type, folder_name, tags, file_name, size_bytes, modified_at, mime_type, metadata, created_at, updated_at",
    )
    .eq("user_id", input.userId)
    .eq("resource_type", input.resourceType)
    .in("provider", ["cloudinary", "r2", "supabase"])
    .filter(
      `metadata->>${MEDIA_ASSET_FINGERPRINT_METADATA_KEY}`,
      "eq",
      trimmedFingerprint,
    )
    .order("modified_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const normalizedResourceType =
    data.resource_type === "video" || data.resource_type === "audio"
      ? data.resource_type
      : "image";
  const provider =
    data.provider === "cloudinary" ||
    data.provider === "r2" ||
    data.provider === "supabase"
      ? data.provider
      : null;

  if (!provider) {
    return null;
  }

  return {
    path: data.object_path || "",
    url: data.public_url || "",
    provider,
    resourceType: normalizedResourceType,
    folderName: normalizeFolderName(data.folder_name || "root") || "root",
    tags: Array.isArray(data.tags)
      ? data.tags.map((tag) => String(tag).trim()).filter(Boolean)
      : [],
    fileName: data.file_name || data.object_path?.split("/").pop() || "upload.bin",
    sizeBytes:
      Number.isFinite(Number(data.size_bytes)) && Number(data.size_bytes) >= 0
        ? Number(data.size_bytes)
        : 0,
    modifiedAt:
      new Date(data.modified_at || data.updated_at || data.created_at || Date.now()).toISOString(),
    mimeType: data.mime_type || "",
    metadata:
      data.metadata && typeof data.metadata === "object" ? data.metadata : {},
  };
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

export const normalizeFolderName = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 120) : null;
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
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
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

const getR2Plan = (
  resourceType: MediaUploadResourceType,
): R2UploadPlan | null => {
  if (resourceType === "audio") {
    return null;
  }

  const config = getR2Client();
  if (!config) {
    return null;
  }

  return {
    provider: "r2",
    resourceType,
    uploadUrl: "/api/v1/media/upload-r2",
    bucket: config.bucket,
    folder: getR2UploadFolder(resourceType),
    publicBaseUrl: config.publicBaseUrl,
  };
};

export const buildMediaUploadPlan = (
  resourceType: MediaUploadResourceType,
  fileMeta?: MediaUploadFileMeta,
  options?: {
    videoUploadProviderPreference?: VideoUploadProviderPreference | null;
  },
): MediaUploadPlan[] => {
  const effectiveResourceType = inferMediaUploadResourceType(
    resourceType,
    fileMeta,
  );
  const r2Plan = getR2Plan(effectiveResourceType);
  const r2Plans = r2Plan ? [r2Plan] : [];
  const supabasePlan = getSupabasePlan(effectiveResourceType, fileMeta);
  const plansByProvider: Record<MediaUploadProvider, MediaUploadPlan[]> = {
    cloudinary: getCloudinaryPlans(effectiveResourceType),
    r2: r2Plans,
    supabase: supabasePlan ? [supabasePlan] : [],
  };

  return normalizeProviderOrder(
    effectiveResourceType,
    options?.videoUploadProviderPreference || null,
  )
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
    resourceType: Exclude<MediaUploadResourceType, "auto">;
    userId: string;
    file: {
      buffer: Buffer;
      mimetype?: string;
      originalname?: string;
    };
    fileName?: string;
  },
): Promise<R2UploadResult> => {
  const config = getR2Client();
  if (!config) {
    throw new Error("R2 upload is not configured.");
  }
  if (!config.publicBaseUrl) {
    throw new Error("R2 public base URL is not configured.");
  }

  const sourceName =
    payload.fileName || payload.file.originalname || `${payload.resourceType}.bin`;
  const safeName = sanitizeFileName(sourceName);
  const objectPath = [
    getR2UploadFolder(payload.resourceType),
    payload.userId,
    `${Date.now()}-${crypto.randomUUID()}-${safeName}`,
  ]
    .filter(Boolean)
    .join("/");

  await config.client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: objectPath,
      Body: payload.file.buffer,
      ContentType: payload.file.mimetype || undefined,
      CacheControl: "31536000",
    }),
  );

  return {
    provider: "r2",
    bucket: config.bucket,
    path: objectPath,
    url: `${config.publicBaseUrl}/${objectPath}`,
  };
};

export const deleteFromR2Storage = async (objectPath: string) => {
  const config = getR2Client();
  if (!config) {
    return;
  }

  await config.client.send(
    new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: objectPath,
    }),
  );
};
