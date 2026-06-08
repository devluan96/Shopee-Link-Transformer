import { Router } from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth.js";
import { getSupabase } from "../config/supabase.js";
import { cloudinary } from "../config/cloudinary.js";
import { upload } from "../config/multer.js";
import { CLOUDINARY_UPLOAD_FOLDER } from "../config/constants.js";
import { AuthenticatedRequest } from "../types/index.js";
import * as featureLimitService from "../services/featureLimitService.js";
import * as appSettingsService from "../services/appSettingsService.js";
import {
  buildMediaUploadPlan,
  computeBufferSha256,
  deleteFromR2Storage,
  findReusableMediaAssetByFingerprint,
  getSupabaseMediaMaxUploadBytes,
  isCloudinaryUploadDisabled,
  normalizeFolderName,
  uploadToR2Storage,
  uploadToSupabaseStorage,
} from "../services/mediaUploadService.js";

const router = Router();
const mediaUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: getSupabaseMediaMaxUploadBytes() },
});

type UploadRouteDeps = {
  getSupabase: typeof getSupabase;
  getFeatureLimitsForProfile: typeof featureLimitService.getFeatureLimitsForProfile;
  getVideoUploadUsageToday: typeof featureLimitService.getVideoUploadUsageToday;
  recordFeatureUsage: typeof featureLimitService.recordFeatureUsage;
  signUploadSignature: (timestamp: number) => string;
  getCloudinaryConfig: () => {
    cloudName: string | undefined;
    apiKey: string | undefined;
    folder: string;
  };
};

const defaultUploadRouteDeps: UploadRouteDeps = {
  getSupabase,
  getFeatureLimitsForProfile: featureLimitService.getFeatureLimitsForProfile,
  getVideoUploadUsageToday: featureLimitService.getVideoUploadUsageToday,
  recordFeatureUsage: featureLimitService.recordFeatureUsage,
  signUploadSignature: (timestamp) =>
    cloudinary.utils.api_sign_request(
      { folder: CLOUDINARY_UPLOAD_FOLDER, timestamp },
      process.env.CLOUDINARY_API_SECRET || "",
    ),
  getCloudinaryConfig: () => ({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder: CLOUDINARY_UPLOAD_FOLDER,
  }),
};

export const createSignUploadHandler = (
  deps: Partial<UploadRouteDeps> = {},
) => {
  const resolvedDeps = { ...defaultUploadRouteDeps, ...deps };

  return async (req: AuthenticatedRequest, res: any) => {
    try {
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(400).json({ error: "Unauthorized" });
      }

      if (isCloudinaryUploadDisabled()) {
        return res.status(503).json({
          error: "Cloudinary upload is disabled by system configuration.",
        });
      }

      const resourceType =
        req.body?.resourceType === "video" ? "video" : "image";
      const limits = resolvedDeps.getFeatureLimitsForProfile(
        req.authProfile || undefined,
      );

      if (resourceType === "video") {
        if (limits.dailyVideoUploads === 0) {
          return res.status(403).json({
            error: "Gói hiện tại chưa hỗ trợ upload video.",
          });
        }

        if (limits.dailyVideoUploads !== null) {
          const usedToday = await resolvedDeps.getVideoUploadUsageToday(
            resolvedDeps.getSupabase(),
            userId,
          );
          if (usedToday >= limits.dailyVideoUploads) {
            return res.status(429).json({
              error: `Bạn đã dùng hết ${limits.dailyVideoUploads} lượt upload video hôm nay.`,
            });
          }
          await resolvedDeps.recordFeatureUsage(
            resolvedDeps.getSupabase(),
            userId,
            "video_upload",
            { resourceType },
          );
        }
      }

      const timestamp = Math.round(Date.now() / 1000);
      const config = resolvedDeps.getCloudinaryConfig();
      const signature = resolvedDeps.signUploadSignature(timestamp);

      return res.json({
        cloudName: config.cloudName,
        apiKey: config.apiKey,
        folder: config.folder,
        timestamp,
        signature,
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  };
};

type MediaUploadPlanRouteDeps = {
  getSupabase: typeof getSupabase;
  getFeatureLimitsForProfile: typeof featureLimitService.getFeatureLimitsForProfile;
  getVideoUploadUsageToday: typeof featureLimitService.getVideoUploadUsageToday;
  recordFeatureUsage: typeof featureLimitService.recordFeatureUsage;
  buildMediaUploadPlan: typeof buildMediaUploadPlan;
  getVideoUploadProviderPreference: typeof appSettingsService.getVideoUploadProviderPreference;
  findReusableMediaAssetByFingerprint: typeof findReusableMediaAssetByFingerprint;
  uploadToSupabaseStorage: typeof uploadToSupabaseStorage;
};

const defaultMediaUploadPlanRouteDeps: MediaUploadPlanRouteDeps = {
  getSupabase,
  getFeatureLimitsForProfile: featureLimitService.getFeatureLimitsForProfile,
  getVideoUploadUsageToday: featureLimitService.getVideoUploadUsageToday,
  recordFeatureUsage: featureLimitService.recordFeatureUsage,
  buildMediaUploadPlan,
  getVideoUploadProviderPreference:
    appSettingsService.getVideoUploadProviderPreference,
  findReusableMediaAssetByFingerprint,
  uploadToSupabaseStorage,
};

const resolveRequestedResourceType = (value: unknown) =>
  value === "video"
    ? "video"
    : value === "audio"
      ? "audio"
      : value === "image"
        ? "image"
        : "auto";

type MediaLibraryAssetRow = {
  object_path?: string | null;
  public_url?: string | null;
  provider?: string | null;
  resource_type?: string | null;
  folder_name?: string | null;
  tags?: string[] | null;
  file_name?: string | null;
  size_bytes?: number | string | null;
  modified_at?: string | null;
  mime_type?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type MediaAssetUpsertInput = {
  userId: string;
  provider: "cloudinary" | "supabase" | "r2" | "local";
  resourceType: "image" | "video" | "audio";
  objectPath: string;
  publicUrl: string;
  fileName?: string;
  sizeBytes?: number;
  mimeType?: string;
  folderName?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
};

const parseMediaLibraryResourceType = (value: unknown) =>
  value === "video"
    ? "video"
    : value === "audio"
      ? "audio"
      : value === "image"
        ? "image"
        : "all";

const normalizeMediaLibraryAsset = (asset: MediaLibraryAssetRow) => {
  const modifiedAt =
    asset.modified_at || asset.updated_at || asset.created_at || new Date().toISOString();
  const resourceType =
    asset.resource_type === "video" || asset.resource_type === "audio"
      ? asset.resource_type
      : "image";
  const provider =
    asset.provider === "cloudinary" ||
    asset.provider === "supabase" ||
    asset.provider === "r2" ||
    asset.provider === "local"
      ? asset.provider
      : "supabase";
  const parsedSize = Number(asset.size_bytes || 0);

  return {
    path: asset.object_path || "",
    url: asset.public_url || "",
    provider,
    resourceType,
    folderName: normalizeFolderName(asset.folder_name || "root") || "root",
    tags: Array.isArray(asset.tags)
      ? asset.tags.map((tag) => String(tag).trim()).filter(Boolean)
      : [],
    fileName:
      asset.file_name || asset.object_path?.split("/").pop() || "upload.bin",
    sizeBytes: Number.isFinite(parsedSize) && parsedSize >= 0 ? parsedSize : 0,
    modifiedAt: new Date(modifiedAt).toISOString(),
    mimeType: asset.mime_type || "",
    metadata:
      asset.metadata && typeof asset.metadata === "object" ? asset.metadata : {},
  };
};

const extractCloudinaryPublicId = (asset: MediaLibraryAssetRow) => {
  const publicId = asset.metadata?.public_id;
  if (typeof publicId === "string" && publicId.trim()) {
    return publicId.trim();
  }

  const url = asset.public_url || "";
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z0-9]+)?(?:\?.*)?$/i);
  if (match?.[1]) {
    return decodeURIComponent(match[1]);
  }

  if (asset.object_path) {
    return asset.object_path.replace(/\.[^.]+$/, "").split("/").pop() || null;
  }

  return null;
};

const extractSupabaseBucketAndPath = (asset: MediaLibraryAssetRow) => {
  const url = asset.public_url || "";
  const match = url.match(
    /\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/i,
  );
  if (!match?.[1] || !match[2]) {
    return null;
  }

  return {
    bucket: decodeURIComponent(match[1]),
    path: decodeURIComponent(match[2]),
  };
};

const deleteMediaAssetFromProvider = async (
  supabaseClient: ReturnType<typeof getSupabase>,
  asset: MediaLibraryAssetRow,
) => {
  if (asset.provider === "cloudinary") {
    const publicId = extractCloudinaryPublicId(asset);
    if (!publicId) return;

    await cloudinary.uploader.destroy(publicId, {
      resource_type: asset.resource_type === "video" ? "video" : "image",
    });
    return;
  }

  if (asset.provider === "r2") {
    if (!asset.object_path) return;

    await deleteFromR2Storage(asset.object_path);
    return;
  }

  if (asset.provider === "supabase") {
    const bucketAndPath = extractSupabaseBucketAndPath(asset);
    if (!bucketAndPath) return;

    await supabaseClient.storage
      .from(bucketAndPath.bucket)
      .remove([bucketAndPath.path]);
  }
};

const persistMediaAssetRecord = async (
  supabaseClient: ReturnType<typeof getSupabase>,
  input: MediaAssetUpsertInput,
) => {
  await supabaseClient.from("media_assets").upsert(
    [
      {
        user_id: input.userId,
        provider: input.provider,
        resource_type: input.resourceType,
        object_path: input.objectPath,
        public_url: input.publicUrl,
        file_name: input.fileName || input.objectPath.split("/").pop() || "upload.bin",
        size_bytes: Number.isFinite(input.sizeBytes || 0) ? Number(input.sizeBytes || 0) : 0,
        modified_at: new Date().toISOString(),
        mime_type: input.mimeType || "",
        folder_name: normalizeFolderName(input.folderName || "root") || "root",
        tags: input.tags || [],
        metadata: input.metadata || {},
      },
    ],
    { onConflict: "user_id,provider,object_path" },
  );
};

export const createMediaUploadPlanHandler = (
  deps: Partial<MediaUploadPlanRouteDeps> = {},
) => {
  const resolvedDeps = { ...defaultMediaUploadPlanRouteDeps, ...deps };

  return async (req: AuthenticatedRequest, res: any) => {
    try {
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(400).json({ error: "Unauthorized" });
      }

      const resourceType = resolveRequestedResourceType(req.body?.resourceType);
      const limits = resolvedDeps.getFeatureLimitsForProfile(
        req.authProfile || undefined,
      );

      if (resourceType === "video") {
        if (limits.dailyVideoUploads === 0) {
          return res.status(403).json({
            error: "GÃ³i hiá»‡n táº¡i chÆ°a há»— trá»£ upload video.",
          });
        }

        if (limits.dailyVideoUploads !== null) {
          const usedToday = await resolvedDeps.getVideoUploadUsageToday(
            resolvedDeps.getSupabase(),
            userId,
          );
          if (usedToday >= limits.dailyVideoUploads) {
            return res.status(429).json({
              error: `Báº¡n Ä‘Ã£ dÃ¹ng háº¿t ${limits.dailyVideoUploads} lÆ°á»£t upload video hÃ´m nay.`,
            });
          }
        }
      }

      const fileSize =
        typeof req.body?.fileSize === "number"
          ? req.body.fileSize
          : Number(req.body?.fileSize || "");
      const videoUploadProviderPreference =
        resourceType === "video"
          ? await resolvedDeps.getVideoUploadProviderPreference(
              resolvedDeps.getSupabase(),
            )
          : null;
      const providers = resolvedDeps.buildMediaUploadPlan(resourceType, {
        fileName:
          typeof req.body?.fileName === "string" ? req.body.fileName : undefined,
        fileSize: Number.isFinite(fileSize) && fileSize > 0 ? fileSize : undefined,
        contentType:
          typeof req.body?.contentType === "string"
            ? req.body.contentType
            : undefined,
      }, {
        videoUploadProviderPreference,
      });

      if (!providers.length) {
        return res.status(503).json({
          error:
            "KhÃ´ng cÃ³ media provider nÃ o Ä‘Æ°á»£c cáº¥u hÃ¬nh cho upload.",
        });
      }

      return res.json({ resourceType, providers });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  };
};

export const createMediaUploadCompleteHandler = (
  deps: Partial<MediaUploadPlanRouteDeps> = {},
) => {
  const resolvedDeps = { ...defaultMediaUploadPlanRouteDeps, ...deps };

  return async (req: AuthenticatedRequest, res: any) => {
    try {
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(400).json({ error: "Unauthorized" });
      }

      const resourceType = resolveRequestedResourceType(req.body?.resourceType);
      const provider =
        req.body?.provider === "cloudinary" ||
        req.body?.provider === "supabase" ||
        req.body?.provider === "r2"
          ? req.body.provider
          : "";

      if (
        provider &&
        typeof req.body?.publicUrl === "string" &&
        typeof req.body?.objectPath === "string"
      ) {
        await persistMediaAssetRecord(resolvedDeps.getSupabase(), {
          userId,
          provider,
          resourceType:
            resourceType === "video"
              ? "video"
              : resourceType === "audio"
                ? "audio"
                : "image",
          objectPath: req.body.objectPath,
          publicUrl: req.body.publicUrl,
          fileName:
            typeof req.body?.fileName === "string"
              ? req.body.fileName
              : undefined,
          sizeBytes:
            typeof req.body?.sizeBytes === "number"
              ? req.body.sizeBytes
              : Number(req.body?.sizeBytes || 0),
          mimeType:
            typeof req.body?.mimeType === "string"
              ? req.body.mimeType
              : undefined,
          folderName:
            typeof req.body?.folderName === "string"
              ? req.body.folderName
              : undefined,
          tags: Array.isArray(req.body?.tags)
            ? req.body.tags.filter((tag: unknown) => typeof tag === "string")
            : undefined,
          metadata:
            req.body?.metadata && typeof req.body.metadata === "object"
              ? req.body.metadata
              : undefined,
        });
      }

      if (resourceType === "video") {
        await resolvedDeps.recordFeatureUsage(
          resolvedDeps.getSupabase(),
          userId,
          "video_upload",
          {
            provider:
              typeof req.body?.provider === "string" ? req.body.provider : null,
          },
        );
      }

      return res.json({ success: true });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  };
};

type MediaReuseCheckRouteDeps = {
  getSupabase: typeof getSupabase;
  findReusableMediaAssetByFingerprint: typeof findReusableMediaAssetByFingerprint;
};

const defaultMediaReuseCheckRouteDeps: MediaReuseCheckRouteDeps = {
  getSupabase,
  findReusableMediaAssetByFingerprint,
};

export const createMediaReuseCheckHandler = (
  deps: Partial<MediaReuseCheckRouteDeps> = {},
) => {
  const resolvedDeps = { ...defaultMediaReuseCheckRouteDeps, ...deps };

  return async (req: AuthenticatedRequest, res: any) => {
    try {
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(400).json({ error: "Unauthorized" });
      }

      const resourceType =
        req.body?.resourceType === "video"
          ? "video"
          : req.body?.resourceType === "audio"
            ? "audio"
            : "image";
      const fingerprint =
        typeof req.body?.fingerprint === "string"
          ? req.body.fingerprint.trim()
          : "";

      if (!fingerprint) {
        return res.status(400).json({ error: "Missing file fingerprint." });
      }

      const asset = await resolvedDeps.findReusableMediaAssetByFingerprint(
        resolvedDeps.getSupabase(),
        {
          userId,
          resourceType,
          fingerprint,
        },
      );

      if (!asset) {
        return res.json({ reused: false });
      }

      return res.json({
        reused: true,
        asset,
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  };
};

type MediaLibraryRouteDeps = {
  getSupabase: typeof getSupabase;
};

const defaultMediaLibraryRouteDeps: MediaLibraryRouteDeps = {
  getSupabase,
};

export const createMediaLibraryHandler = (
  deps: Partial<MediaLibraryRouteDeps> = {},
) => {
  const resolvedDeps = { ...defaultMediaLibraryRouteDeps, ...deps };

  return async (req: AuthenticatedRequest, res: any) => {
    try {
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(400).json({ error: "Unauthorized" });
      }

      const resourceType = parseMediaLibraryResourceType(req.query?.resourceType);
      const supabase = resolvedDeps.getSupabase();

      let query = supabase
        .from("media_assets")
        .select(
          "object_path, public_url, provider, resource_type, folder_name, tags, file_name, size_bytes, modified_at, mime_type, metadata, created_at, updated_at",
        )
        .eq("user_id", userId)
        .order("modified_at", { ascending: false });

      if (resourceType !== "all") {
        query = query.eq("resource_type", resourceType);
      }

      const { data, error } = await query;
      if (error) {
        return res.status(500).json({ error: error.message });
      }

      const assets = (Array.isArray(data) ? data : []).map((asset) =>
        normalizeMediaLibraryAsset(asset as MediaLibraryAssetRow),
      );

      return res.json({ resourceType, assets });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  };
};

export const createDeleteMediaLibraryHandler = (
  deps: Partial<MediaLibraryRouteDeps> = {},
) => {
  const resolvedDeps = { ...defaultMediaLibraryRouteDeps, ...deps };

  return async (req: AuthenticatedRequest, res: any) => {
    try {
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(400).json({ error: "Unauthorized" });
      }

      const path =
        typeof req.body?.path === "string" ? req.body.path.trim() : "";
      const url =
        typeof req.body?.url === "string" ? req.body.url.trim() : "";
      const provider =
        req.body?.provider === "cloudinary" ||
        req.body?.provider === "supabase" ||
        req.body?.provider === "r2" ||
        req.body?.provider === "local"
          ? req.body.provider
          : "";

      if (!path || !provider) {
        return res.status(400).json({ error: "Invalid media asset reference." });
      }

      const supabase = resolvedDeps.getSupabase();
      const { data: asset, error } = await supabase
        .from("media_assets")
        .select(
          "object_path, public_url, provider, resource_type, folder_name, tags, file_name, size_bytes, modified_at, mime_type, metadata, created_at, updated_at",
        )
        .eq("user_id", userId)
        .eq("provider", provider)
        .eq("object_path", path)
        .maybeSingle();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      if (!asset) {
        if (url) {
          try {
            await deleteMediaAssetFromProvider(supabase, {
              object_path: path,
              public_url: url,
              provider,
              resource_type:
                /\.mp4|\.mov|\.m4v|\.webm|\.avi|\.mkv/i.test(url) ||
                /\/video\//i.test(url)
                  ? "video"
                  : "image",
            });
          } catch (providerError) {
            console.error("Media provider delete fallback failed:", providerError);
          }
        }
        return res.json({ success: true, alreadyDeleted: true });
      }

      try {
        await deleteMediaAssetFromProvider(supabase, asset as MediaLibraryAssetRow);
      } catch (providerError) {
        console.error("Media provider delete failed:", providerError);
      }

      const { error: deleteError } = await supabase
        .from("media_assets")
        .delete()
        .eq("user_id", userId)
        .eq("provider", provider)
        .eq("object_path", path);

      if (deleteError) {
        return res.status(500).json({ error: deleteError.message });
      }

      return res.json({ success: true });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  };
};

// POST /api/v1/cloudinary/sign-upload - Get signed upload URL
router.post(
  "/cloudinary/sign-upload",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(400).json({ error: "Unauthorized" });
      }

      const resourceType =
        req.body?.resourceType === "video" ? "video" : "image";
      const limits = featureLimitService.getFeatureLimitsForProfile(
        req.authProfile || undefined,
      );

      if (resourceType === "video") {
        if (limits.dailyVideoUploads === 0) {
          return res.status(403).json({
            error: "Gói hiện tại chưa hỗ trợ upload video.",
          });
        }

        if (limits.dailyVideoUploads !== null) {
          const usedToday = await featureLimitService.getVideoUploadUsageToday(
            getSupabase(),
            userId,
          );
          if (usedToday >= limits.dailyVideoUploads) {
            return res.status(429).json({
              error: `Bạn đã dùng hết ${limits.dailyVideoUploads} lượt upload video hôm nay.`,
            });
          }
          await featureLimitService.recordFeatureUsage(
            getSupabase(),
            userId,
            "video_upload",
            { resourceType },
          );
        }
      }

      const timestamp = Math.round(Date.now() / 1000);
      const signature = cloudinary.utils.api_sign_request(
        { folder: CLOUDINARY_UPLOAD_FOLDER, timestamp },
        process.env.CLOUDINARY_API_SECRET || "",
      );

      return res.json({
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        folder: CLOUDINARY_UPLOAD_FOLDER,
        timestamp,
        signature,
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  },
);

router.post(
  "/media/upload-plan",
  authenticate,
  createMediaUploadPlanHandler(),
);

router.post(
  "/media/upload-complete",
  authenticate,
  createMediaUploadCompleteHandler(),
);

router.post(
  "/media/reuse-check",
  authenticate,
  createMediaReuseCheckHandler(),
);

router.get(
  "/media/library",
  authenticate,
  createMediaLibraryHandler(),
);

router.delete(
  "/media/library",
  authenticate,
  createDeleteMediaLibraryHandler(),
);

router.post(
  "/media/upload-supabase",
  authenticate,
  mediaUpload.single("file"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(400).json({ error: "Unauthorized" });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const resourceType = resolveRequestedResourceType(req.body?.resourceType);
      const limits = featureLimitService.getFeatureLimitsForProfile(
        req.authProfile || undefined,
      );

      if (resourceType === "video") {
        if (limits.dailyVideoUploads === 0) {
          return res.status(403).json({
            error: "GÃ³i hiá»‡n táº¡i chÆ°a há»— trá»£ upload video.",
          });
        }

        if (limits.dailyVideoUploads !== null) {
          const usedToday = await featureLimitService.getVideoUploadUsageToday(
            getSupabase(),
            userId,
          );
          if (usedToday >= limits.dailyVideoUploads) {
            return res.status(429).json({
              error: `Báº¡n Ä‘Ã£ dÃ¹ng háº¿t ${limits.dailyVideoUploads} lÆ°á»£t upload video hÃ´m nay.`,
            });
          }
        }
      }

      const result = await uploadToSupabaseStorage(getSupabase(), {
        resourceType,
        userId,
        file,
        fileName:
          typeof req.body?.fileName === "string" ? req.body.fileName : undefined,
      });
      const fileFingerprint = computeBufferSha256(file.buffer);

      await persistMediaAssetRecord(getSupabase(), {
        userId,
        provider: "supabase",
        resourceType:
          resourceType === "video"
            ? "video"
            : resourceType === "audio"
              ? "audio"
              : "image",
        objectPath: result.path,
        publicUrl: result.url,
        fileName:
          typeof req.body?.fileName === "string"
            ? req.body.fileName
            : file.originalname,
        sizeBytes: file.size,
        mimeType: file.mimetype,
        folderName:
          resourceType === "video"
            ? "videos"
            : resourceType === "audio"
              ? "audio"
              : "images",
        metadata: {
          bucket: result.bucket,
          provider: result.provider,
          source: "supabase-upload",
          sha256: fileFingerprint,
        },
      });

      return res.json(result);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  },
);

router.post(
  "/media/upload-r2",
  authenticate,
  mediaUpload.single("file"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(400).json({ error: "Unauthorized" });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const resourceType = resolveRequestedResourceType(req.body?.resourceType);
      const normalizedResourceType =
        resourceType === "video"
          ? "video"
          : resourceType === "audio"
            ? "audio"
            : "image";
      const limits = featureLimitService.getFeatureLimitsForProfile(
        req.authProfile || undefined,
      );

      if (resourceType === "video") {
        if (limits.dailyVideoUploads === 0) {
          return res.status(403).json({
            error: "GÃ³i hiá»‡n táº¡i chÆ°a há»— trá»£ upload video.",
          });
        }

        if (limits.dailyVideoUploads !== null) {
          const usedToday = await featureLimitService.getVideoUploadUsageToday(
            getSupabase(),
            userId,
          );
          if (usedToday >= limits.dailyVideoUploads) {
            return res.status(429).json({
              error: `Báº¡n Ä‘Ã£ dÃ¹ng háº¿t ${limits.dailyVideoUploads} lÆ°á»£t upload video hÃ´m nay.`,
            });
          }
        }
      }

      const result = await uploadToR2Storage({
        resourceType: normalizedResourceType,
        userId,
        file,
        fileName:
          typeof req.body?.fileName === "string" ? req.body.fileName : undefined,
      });
      const fileFingerprint = computeBufferSha256(file.buffer);

      await persistMediaAssetRecord(getSupabase(), {
        userId,
        provider: "r2",
        resourceType: normalizedResourceType,
        objectPath: result.path,
        publicUrl: result.url,
        fileName:
          typeof req.body?.fileName === "string"
            ? req.body.fileName
            : file.originalname,
        sizeBytes: file.size,
        mimeType: file.mimetype,
        folderName:
          resourceType === "video"
            ? "videos"
            : resourceType === "audio"
              ? "audio"
              : "images",
        metadata: {
          bucket: result.bucket,
          provider: result.provider,
          source: "r2-upload",
          sha256: fileFingerprint,
        },
      });

      return res.json(result);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  },
);

// POST /api/v1/upload-avatar - Upload avatar
router.post(
  "/upload-avatar",
  authenticate,
  upload.single("file"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(400).json({ error: "Unauthorized" });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Check file type
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ error: "Invalid file type. Only JPEG, PNG, WebP allowed." });
      }

      // Check file size (2MB after client-side resize)
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        return res.status(400).json({ error: "File too large. Max 2MB." });
      }

      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `${CLOUDINARY_UPLOAD_FOLDER}/avatars`,
            public_id: `avatar_${userId}_${Date.now()}`,
            format: "webp",
            transformation: [
              {
                width: 256,
                height: 256,
                crop: "fill",
                gravity: "face",
                fetch_format: "auto",
                quality: "auto:good",
              },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );
        stream.end(file.buffer);
      });

      return res.json({ secure_url: (result as any).secure_url });
    } catch (e: any) {
      console.error("❌ Avatar upload error:", e);
      return res.status(500).json({ error: e.message });
    }
  },
);

export default router;
