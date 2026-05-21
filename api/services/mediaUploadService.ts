import crypto from "crypto";
import { cloudinary } from "../config/cloudinary.js";
import { CLOUDINARY_UPLOAD_FOLDER } from "../config/constants.js";
import type { SupabaseClient } from "../config/supabase.js";

export type MediaUploadResourceType = "image" | "video" | "auto";
export type MediaUploadProvider = "cloudinary" | "supabase";

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

export type MediaUploadPlan =
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

const DEFAULT_PROVIDER_ORDER: MediaUploadProvider[] = [
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

const normalizeProviderOrder = (): MediaUploadProvider[] => {
  const rawOrder = process.env.MEDIA_UPLOAD_PROVIDER_ORDER;
  if (!rawOrder?.trim()) {
    return DEFAULT_PROVIDER_ORDER;
  }

  const seen = new Set<MediaUploadProvider>();
  const normalized = rawOrder
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(
      (value): value is MediaUploadProvider =>
        value === "cloudinary" || value === "supabase",
    )
    .filter((value) => {
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });

  return normalized.length ? normalized : DEFAULT_PROVIDER_ORDER;
};

const getSupabaseUploadFolder = (resourceType: MediaUploadResourceType) => {
  const configured = process.env.SUPABASE_UPLOAD_FOLDER?.trim();
  if (configured) {
    return configured.replace(/^\/+|\/+$/g, "");
  }

  return resourceType === "video" ? "videos" : "images";
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

const getCloudinaryPlans = (
  resourceType: MediaUploadResourceType,
): CloudinaryUploadPlan[] => {
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

export const buildMediaUploadPlan = (
  resourceType: MediaUploadResourceType,
  fileMeta?: MediaUploadFileMeta,
): MediaUploadPlan[] => {
  const supabasePlan = getSupabasePlan(resourceType, fileMeta);
  const plansByProvider: Record<MediaUploadProvider, MediaUploadPlan[]> = {
    cloudinary: getCloudinaryPlans(resourceType),
    supabase: supabasePlan ? [supabasePlan] : [],
  };

  return normalizeProviderOrder()
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
