import crypto from "crypto";
import { cloudinary } from "../config/cloudinary.js";
import { CLOUDINARY_UPLOAD_FOLDER } from "../config/constants.js";
import type { SupabaseClient } from "../config/supabase.js";

export type MediaUploadResourceType = "image" | "video" | "auto";
export type MediaUploadProvider = "cloudinary" | "imagekit" | "supabase";

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

export interface ImageKitUploadPlan {
  provider: "imagekit";
  resourceType: MediaUploadResourceType;
  uploadUrl: string;
  publicKey: string;
  urlEndpoint: string;
  folder: string;
  token: string;
  expire: number;
  signature: string;
  useUniqueFileName: boolean;
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
  | ImageKitUploadPlan
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
  "imagekit",
  "supabase",
];

const DEFAULT_SUPABASE_MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

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
        value === "cloudinary" ||
        value === "imagekit" ||
        value === "supabase",
    )
    .filter((value) => {
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });

  return normalized.length ? normalized : DEFAULT_PROVIDER_ORDER;
};

const getImageKitUploadFolder = () =>
  process.env.IMAGEKIT_UPLOAD_FOLDER?.trim() || "/hotsnew";

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

const getCloudinaryPlan = (
  resourceType: MediaUploadResourceType,
): CloudinaryUploadPlan | null => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = CLOUDINARY_UPLOAD_FOLDER;
  const signature = cloudinary.utils.api_sign_request(
    { folder, timestamp },
    apiSecret,
  );

  return {
    provider: "cloudinary",
    resourceType,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    cloudName,
    apiKey,
    folder,
    timestamp,
    signature,
  };
};

const getImageKitPlan = (
  resourceType: MediaUploadResourceType,
): ImageKitUploadPlan | null => {
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY?.trim();
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY?.trim();
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT?.trim();

  if (!publicKey || !privateKey || !urlEndpoint) {
    return null;
  }

  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 30 * 60;
  const signature = crypto
    .createHmac("sha1", privateKey)
    .update(`${token}${expire}`)
    .digest("hex");

  return {
    provider: "imagekit",
    resourceType,
    uploadUrl: "https://upload.imagekit.io/api/v1/files/upload",
    publicKey,
    urlEndpoint,
    folder: getImageKitUploadFolder(),
    token,
    expire,
    signature,
    useUniqueFileName: true,
  };
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
  const plansByProvider: Record<MediaUploadProvider, MediaUploadPlan | null> = {
    cloudinary: getCloudinaryPlan(resourceType),
    imagekit: getImageKitPlan(resourceType),
    supabase: getSupabasePlan(resourceType, fileMeta),
  };

  return normalizeProviderOrder()
    .map((provider) => plansByProvider[provider])
    .filter((plan): plan is MediaUploadPlan => !!plan);
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
