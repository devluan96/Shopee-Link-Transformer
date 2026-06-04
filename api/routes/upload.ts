import { Router } from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth.js";
import { getSupabase } from "../config/supabase.js";
import { cloudinary } from "../config/cloudinary.js";
import { upload } from "../config/multer.js";
import { CLOUDINARY_UPLOAD_FOLDER } from "../config/constants.js";
import { AuthenticatedRequest } from "../types/index.js";
import * as featureLimitService from "../services/featureLimitService.js";
import { getPublicBaseUrl } from "../utils/helpers.js";
import {
  buildMediaUploadPlan,
  buildLocalMediaUrl,
  computeMediaUploadSha256,
  deleteLocalMediaAsset,
  deleteLocalMediaAssetRecord,
  deleteLocalMediaAssetsInFolder,
  createLocalMediaFolderRecord,
  createManagedMediaFolderRecord,
  deleteManagedMediaAsset,
  deleteManagedMediaAssetsInFolder,
  getSupabaseMediaMaxUploadBytes,
  isCloudinaryUploadDisabled,
  listLocalMediaAssetsFromDatabase,
  listLocalMediaFoldersFromDatabase,
  listMediaAssetsFromDatabase,
  listMediaFoldersFromDatabase,
  normalizeFolderName,
  normalizeMediaTags,
  findManagedMediaAssetBySha256,
  renameLocalMediaFolderRecord,
  renameManagedMediaFolderRecord,
  type ManagedMediaUploadProvider,
  updateLocalMediaAssetsTags,
  updateManagedMediaAssetsTags,
  syncLocalMediaAssetsToDatabase,
  toLocalMediaAssetRecord,
  uploadToR2Storage,
  uploadToSupabaseStorage,
  uploadToLocalStorage,
  upsertMediaAssetRecord,
  updateLocalMediaAssetRecord,
  updateMediaAssetRecord,
  upsertLocalMediaAssetRecord,
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

type AvatarUploadPlan =
  | {
      provider: "r2";
      resourceType: "image";
      uploadUrl: string;
      bucket: string;
      publicBaseUrl: string;
      maxFileSizeBytes: number;
    }
  | {
      provider: "cloudinary";
      resourceType: "image";
      uploadUrl: string;
      cloudName: string;
      apiKey: string;
      folder: string;
      timestamp: number;
      signature: string;
    };
type SupabaseAvatarUploadPlan = {
  provider: "supabase";
  resourceType: "image";
  uploadUrl: string;
  bucket: string;
  folder: string;
  maxFileSizeBytes: number;
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
  uploadToSupabaseStorage: typeof uploadToSupabaseStorage;
};

const defaultMediaUploadPlanRouteDeps: MediaUploadPlanRouteDeps = {
  getSupabase,
  getFeatureLimitsForProfile: featureLimitService.getFeatureLimitsForProfile,
  getVideoUploadUsageToday: featureLimitService.getVideoUploadUsageToday,
  recordFeatureUsage: featureLimitService.recordFeatureUsage,
  buildMediaUploadPlan,
  uploadToSupabaseStorage,
};

type LocalMediaUploadRouteDeps = {
  getSupabase: typeof getSupabase;
  getFeatureLimitsForProfile: typeof featureLimitService.getFeatureLimitsForProfile;
  getVideoUploadUsageToday: typeof featureLimitService.getVideoUploadUsageToday;
  uploadToLocalStorage: typeof uploadToLocalStorage;
  getPublicBaseUrl: typeof getPublicBaseUrl;
  buildLocalMediaUrl: typeof buildLocalMediaUrl;
  toLocalMediaAssetRecord: typeof toLocalMediaAssetRecord;
  upsertLocalMediaAssetRecord: typeof upsertLocalMediaAssetRecord;
};

const defaultLocalMediaUploadRouteDeps: LocalMediaUploadRouteDeps = {
  getSupabase,
  getFeatureLimitsForProfile: featureLimitService.getFeatureLimitsForProfile,
  getVideoUploadUsageToday: featureLimitService.getVideoUploadUsageToday,
  uploadToLocalStorage,
  getPublicBaseUrl,
  buildLocalMediaUrl,
  toLocalMediaAssetRecord,
  upsertLocalMediaAssetRecord,
};

type R2MediaUploadRouteDeps = {
  getSupabase: typeof getSupabase;
  getFeatureLimitsForProfile: typeof featureLimitService.getFeatureLimitsForProfile;
  getVideoUploadUsageToday: typeof featureLimitService.getVideoUploadUsageToday;
  uploadToR2Storage: typeof uploadToR2Storage;
};

const defaultR2MediaUploadRouteDeps: R2MediaUploadRouteDeps = {
  getSupabase,
  getFeatureLimitsForProfile: featureLimitService.getFeatureLimitsForProfile,
  getVideoUploadUsageToday: featureLimitService.getVideoUploadUsageToday,
  uploadToR2Storage,
};

type CloudinaryMediaUploadRouteDeps = {
  getSupabase: typeof getSupabase;
  getFeatureLimitsForProfile: typeof featureLimitService.getFeatureLimitsForProfile;
  getVideoUploadUsageToday: typeof featureLimitService.getVideoUploadUsageToday;
  recordFeatureUsage: typeof featureLimitService.recordFeatureUsage;
  upsertMediaAssetRecord: typeof upsertMediaAssetRecord;
};

const defaultCloudinaryMediaUploadRouteDeps: CloudinaryMediaUploadRouteDeps = {
  getSupabase,
  getFeatureLimitsForProfile: featureLimitService.getFeatureLimitsForProfile,
  getVideoUploadUsageToday: featureLimitService.getVideoUploadUsageToday,
  recordFeatureUsage: featureLimitService.recordFeatureUsage,
  upsertMediaAssetRecord,
};

type AvatarUploadRouteDeps = {
  getSupabase: typeof getSupabase;
  uploadToLocalStorage: typeof uploadToLocalStorage;
  getPublicBaseUrl: typeof getPublicBaseUrl;
  buildLocalMediaUrl: typeof buildLocalMediaUrl;
  upsertLocalMediaAssetRecord: typeof upsertLocalMediaAssetRecord;
  deleteLocalMediaAsset: typeof deleteLocalMediaAsset;
  buildMediaUploadPlan: typeof buildMediaUploadPlan;
  uploadToR2Storage: typeof uploadToR2Storage;
  uploadToSupabaseStorage: typeof uploadToSupabaseStorage;
  upsertMediaAssetRecord: typeof upsertMediaAssetRecord;
  deleteManagedMediaAsset: typeof deleteManagedMediaAsset;
};

const defaultAvatarUploadRouteDeps: AvatarUploadRouteDeps = {
  getSupabase,
  uploadToLocalStorage,
  getPublicBaseUrl,
  buildLocalMediaUrl,
  upsertLocalMediaAssetRecord,
  deleteLocalMediaAsset,
  buildMediaUploadPlan,
  uploadToR2Storage,
  uploadToSupabaseStorage,
  upsertMediaAssetRecord,
  deleteManagedMediaAsset,
};

type MediaLibraryRouteDeps = {
  getSupabase: typeof getSupabase;
  listLocalMediaAssetsFromDatabase: typeof listLocalMediaAssetsFromDatabase;
  listLocalMediaFoldersFromDatabase: typeof listLocalMediaFoldersFromDatabase;
  syncLocalMediaAssetsToDatabase: typeof syncLocalMediaAssetsToDatabase;
  deleteLocalMediaAsset: typeof deleteLocalMediaAsset;
  deleteLocalMediaAssetRecord: typeof deleteLocalMediaAssetRecord;
  updateLocalMediaAssetRecord: typeof updateLocalMediaAssetRecord;
  createLocalMediaFolderRecord: typeof createLocalMediaFolderRecord;
  renameLocalMediaFolderRecord: typeof renameLocalMediaFolderRecord;
  deleteLocalMediaAssetsInFolder: typeof deleteLocalMediaAssetsInFolder;
  updateLocalMediaAssetsTags: typeof updateLocalMediaAssetsTags;
  getPublicBaseUrl: typeof getPublicBaseUrl;
  toLocalMediaAssetRecord: typeof toLocalMediaAssetRecord;
  upsertLocalMediaAssetRecord: typeof upsertLocalMediaAssetRecord;
};

const defaultMediaLibraryRouteDeps: MediaLibraryRouteDeps = {
  getSupabase,
  listLocalMediaAssetsFromDatabase,
  listLocalMediaFoldersFromDatabase,
  syncLocalMediaAssetsToDatabase,
  deleteLocalMediaAsset,
  deleteLocalMediaAssetRecord,
  updateLocalMediaAssetRecord,
  createLocalMediaFolderRecord,
  renameLocalMediaFolderRecord,
  deleteLocalMediaAssetsInFolder,
  updateLocalMediaAssetsTags,
  getPublicBaseUrl,
  toLocalMediaAssetRecord,
  upsertLocalMediaAssetRecord,
};

const resolveRequestedResourceType = (value: unknown) =>
  value === "video"
    ? "video"
    : value === "audio"
      ? "audio"
      : value === "image"
        ? "image"
        : "auto";

const resolveRequestedLibraryFilter = (value: unknown) =>
  value === "image" || value === "video" || value === "audio"
    ? value
    : "all";

const resolveRequestedMediaProviderFilter = (value: unknown) =>
  value === "r2" || value === "cloudinary" || value === "supabase"
    ? value
    : "all";

const resolveLocalFolderName = (value: unknown, fallback = "root") =>
  typeof value === "string" && value.trim()
    ? normalizeFolderName(value)
    : fallback;

const resolveLocalTags = (value: unknown) =>
  normalizeMediaTags(Array.isArray(value) ? value : typeof value === "string" ? value : null);

const resolveObjectPaths = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const buildManagedMediaAssetMetadata = (
  fingerprint: string,
  extra: Record<string, unknown> = {},
) => ({
  ...extra,
  sha256: fingerprint,
});

const findReusableManagedMediaAsset = async (payload: {
  supabase: ReturnType<typeof getSupabase>;
  userId: string;
  resourceType: "image" | "video" | "audio";
  fileBuffer: Buffer;
}) => {
  const sha256 = computeMediaUploadSha256(payload.fileBuffer);
  const existingAsset = await findManagedMediaAssetBySha256(payload.supabase, {
    userId: payload.userId,
    resourceType: payload.resourceType,
    sha256,
  });

  return existingAsset
    ? { asset: existingAsset, sha256, reused: true as const }
    : { asset: null, sha256, reused: false as const };
};

const uploadAvatarToCloudinary = async (file: {
  buffer: Buffer;
  mimetype?: string;
  originalname?: string;
}) =>
  new Promise<{ provider: "cloudinary"; path: string; url: string }>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "avatars",
          resource_type: "image",
          overwrite: false,
          unique_filename: true,
          use_filename: true,
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          if (!result?.public_id || !result?.secure_url) {
            reject(new Error("Cloudinary avatar upload failed."));
            return;
          }

          resolve({
            provider: "cloudinary",
            path: result.public_id,
            url: result.secure_url,
          });
        },
      );

      stream.end(file.buffer);
    },
  );

export const createLocalMediaUploadHandler = (
  deps: Partial<LocalMediaUploadRouteDeps> = {},
) => {
  const resolvedDeps = { ...defaultLocalMediaUploadRouteDeps, ...deps };

  return async (req: AuthenticatedRequest, res: any) => {
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
        }
      }

      const result = await resolvedDeps.uploadToLocalStorage({
        resourceType,
        userId,
        file,
        fileName:
          typeof req.body?.fileName === "string" ? req.body.fileName : undefined,
      });
      const storedResourceType =
        resourceType === "video"
          ? "video"
          : resourceType === "audio"
            ? "audio"
            : "image";
      const folderName = resolveLocalFolderName(req.body?.folderName);
      const tags = resolveLocalTags(req.body?.tags ?? req.body?.tagsText);

      try {
        await resolvedDeps.upsertLocalMediaAssetRecord(
          resolvedDeps.getSupabase(),
          resolvedDeps.toLocalMediaAssetRecord(
            {
              path: result.path,
              url: result.url,
              resourceType: storedResourceType,
              folderName,
              tags,
              fileName:
                typeof req.body?.fileName === "string" &&
                req.body.fileName.trim()
                  ? req.body.fileName.trim()
                  : file.originalname || `${resourceType}.bin`,
              sizeBytes: file.size,
              modifiedAt: new Date().toISOString(),
              mimeType: file.mimetype || "application/octet-stream",
            },
            userId,
          ),
        );
      } catch (metadataError) {
        await deleteLocalMediaAsset({
          userId,
          objectPath: result.path,
        }).catch(() => undefined);
        throw metadataError;
      }

      const publicBaseUrl =
        resolvedDeps.getPublicBaseUrl(req) ||
        `${req.protocol}://${req.get("host")}`;

      return res.json({
        provider: "local",
        url: resolvedDeps.buildLocalMediaUrl(result.path, publicBaseUrl),
        path: result.path,
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  };
};

export const createR2MediaUploadHandler = (
  deps: Partial<R2MediaUploadRouteDeps> = {},
) => {
  const resolvedDeps = { ...defaultR2MediaUploadRouteDeps, ...deps };

  return async (req: AuthenticatedRequest, res: any) => {
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
        }
      }

      const reusable = await findReusableManagedMediaAsset({
        supabase: resolvedDeps.getSupabase(),
        userId,
        resourceType:
          resourceType === "video"
            ? "video"
            : resourceType === "audio"
              ? "audio"
              : "image",
        fileBuffer: file.buffer,
      });

      if (reusable.asset) {
        return res.json({
          provider: reusable.asset.provider,
          url: reusable.asset.url,
          path: reusable.asset.path,
          reused: true,
          deduped: true,
        });
      }

      const result = await resolvedDeps.uploadToR2Storage({
        resourceType,
        userId,
        file: {
          buffer: file.buffer,
          mimetype: file.mimetype,
          originalname: file.originalname,
        },
        fileName:
          typeof req.body?.fileName === "string" ? req.body.fileName : undefined,
      });

      const managedResourceType =
        resourceType === "video"
          ? "video"
          : resourceType === "audio"
            ? "audio"
            : "image";

      await upsertMediaAssetRecord(resolvedDeps.getSupabase(), {
        user_id: userId,
        provider: "r2",
        resource_type: managedResourceType,
        object_path: result.path,
        public_url: result.url,
        folder_name: resolveLocalFolderName(req.body?.folderName),
        tags: resolveLocalTags(req.body?.tags ?? req.body?.tagsText),
        file_name:
          typeof req.body?.fileName === "string" && req.body.fileName.trim()
            ? req.body.fileName.trim()
            : file.originalname || `${resourceType}.bin`,
        size_bytes: file.size,
        modified_at: new Date().toISOString(),
        mime_type: file.mimetype || "application/octet-stream",
        metadata: {
          bucket: result.bucket,
          provider: "r2",
          ...buildManagedMediaAssetMetadata(reusable.sha256),
        },
      });

      return res.json({
        provider: "r2",
        url: result.url,
        path: result.path,
        reused: false,
        deduped: false,
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  };
};

export const createCloudinaryMediaUploadHandler = (
  deps: Partial<CloudinaryMediaUploadRouteDeps> = {},
) => {
  const resolvedDeps = { ...defaultCloudinaryMediaUploadRouteDeps, ...deps };

  return async (req: AuthenticatedRequest, res: any) => {
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
        }
      }

      const cloudName =
        typeof req.body?.cloudName === "string"
          ? req.body.cloudName.trim()
          : "";
      const apiKey =
        typeof req.body?.apiKey === "string" ? req.body.apiKey.trim() : "";
      const signature =
        typeof req.body?.signature === "string"
          ? req.body.signature.trim()
          : "";
      const timestamp =
        typeof req.body?.timestamp === "string"
          ? req.body.timestamp.trim()
          : "";
      const folder =
        typeof req.body?.folder === "string" && req.body.folder.trim()
          ? req.body.folder.trim()
          : CLOUDINARY_UPLOAD_FOLDER;

      if (!cloudName || !apiKey || !signature || !timestamp) {
        return res.status(400).json({
          error: "Cloudinary upload plan is missing required credentials.",
        });
      }

      const reusable = await findReusableManagedMediaAsset({
        supabase: resolvedDeps.getSupabase(),
        userId,
        resourceType:
          resourceType === "video"
            ? "video"
            : resourceType === "audio"
              ? "audio"
              : "image",
        fileBuffer: file.buffer,
      });

      if (reusable.asset) {
        return res.json({
          provider: reusable.asset.provider,
          url: reusable.asset.url,
          path: reusable.asset.path,
          reused: true,
          deduped: true,
        });
      }

      const uploadFormData = new FormData();
      uploadFormData.append(
        "file",
        new Blob([file.buffer], { type: file.mimetype || "application/octet-stream" }),
        file.originalname || `${resourceType}.bin`,
      );
      uploadFormData.append("api_key", apiKey);
      uploadFormData.append("timestamp", timestamp);
      uploadFormData.append("signature", signature);
      uploadFormData.append("folder", folder);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType === "video" ? "video" : "image"}/upload`,
        {
          method: "POST",
          body: uploadFormData,
        },
      );

      const uploadResult = (await uploadResponse.json().catch(() => null)) as
        | {
            secure_url?: string;
            public_id?: string;
            version?: number | string;
            resource_type?: string;
            error?: { message?: string };
            message?: string;
          }
        | null;

      if (!uploadResponse.ok) {
        throw new Error(
          uploadResult?.error?.message ||
            uploadResult?.message ||
            `Cloudinary upload failed (${uploadResponse.status})`,
        );
      }

      const secureUrl = String(uploadResult?.secure_url || "");
      const publicId = String(uploadResult?.public_id || "");
      const version = uploadResult?.version
        ? Number(uploadResult.version)
        : undefined;

      if (!secureUrl || !publicId) {
        throw new Error("Cloudinary upload did not return a public URL.");
      }

      const managedResourceType =
        resourceType === "video"
          ? "video"
          : resourceType === "audio"
            ? "audio"
            : "image";

      await resolvedDeps.upsertMediaAssetRecord(resolvedDeps.getSupabase(), {
        user_id: userId,
        provider: "cloudinary",
        resource_type: managedResourceType,
        object_path: publicId,
        public_url: secureUrl,
        folder_name: resolveLocalFolderName(req.body?.folderName),
        tags: resolveLocalTags(req.body?.tags ?? req.body?.tagsText),
        file_name:
          typeof req.body?.fileName === "string" && req.body.fileName.trim()
            ? req.body.fileName.trim()
            : file.originalname || `${resourceType}.bin`,
        size_bytes: file.size,
        modified_at: new Date().toISOString(),
        mime_type: file.mimetype || "application/octet-stream",
        metadata: {
          version: Number.isFinite(version as number) ? version : undefined,
          resource_type: uploadResult?.resource_type || resourceType,
          cloudinary_folder: CLOUDINARY_UPLOAD_FOLDER,
          ...buildManagedMediaAssetMetadata(reusable.sha256),
        },
      });

      return res.json({
        provider: "cloudinary",
        url: secureUrl,
        path: publicId,
        publicId,
        version,
        reused: false,
        deduped: false,
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  };
};

export const createManagedMediaLibraryHandler = (
  deps: Partial<MediaLibraryRouteDeps> = {},
) => {
  const resolvedDeps = { ...defaultMediaLibraryRouteDeps, ...deps };

  return async (req: AuthenticatedRequest, res: any) => {
    try {
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(400).json({ error: "Unauthorized" });
      }

      const resourceType = resolveRequestedLibraryFilter(
        req.query?.resourceType,
      );
      const provider = resolveRequestedMediaProviderFilter(
        req.query?.provider,
      );

      const assets = await listMediaAssetsFromDatabase(
        resolvedDeps.getSupabase(),
        {
          userId,
          resourceType,
          provider,
        },
      );
      const folders = await listMediaFoldersFromDatabase(
        resolvedDeps.getSupabase(),
        {
          userId,
          provider,
        },
      );

      return res.json({
        resourceType,
        provider,
        folders,
        assets,
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  };
};

export const createMediaLibraryMutationHandler = (
  deps: Partial<MediaLibraryRouteDeps> = {},
) => {
  const resolvedDeps = { ...defaultMediaLibraryRouteDeps, ...deps };

  return async (req: AuthenticatedRequest, res: any) => {
    try {
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(400).json({ error: "Unauthorized" });
      }

      const objectPaths = resolveObjectPaths(
        req.body?.objectPaths ?? req.body?.paths,
      );
      const folderName =
        typeof req.body?.folderName === "string"
          ? req.body.folderName
          : typeof req.body?.currentFolderName === "string"
            ? req.body.currentFolderName
            : "";
      const folderAction =
        typeof req.body?.folderAction === "string"
          ? req.body.folderAction
          : typeof req.body?.action === "string"
            ? req.body.action
            : "";
      const provider = resolveRequestedMediaProviderFilter(req.body?.provider);

      if (objectPaths.length > 0) {
        const addTags = resolveLocalTags(
          req.body?.addTags ?? req.body?.tagsToAdd ?? req.body?.tagsText,
        );
        const removeTags = resolveLocalTags(
          req.body?.removeTags ?? req.body?.tagsToRemove,
        );

        const assets = await updateManagedMediaAssetsTags(
          resolvedDeps.getSupabase(),
          {
            userId,
            objectPaths,
            addTags,
            removeTags,
            provider,
          },
        );

        return res.json({
          success: true,
          updatedCount: assets.length,
          assets: assets.map((asset) => ({
            ...asset,
            url: asset.url,
            folderName: asset.folderName,
            tags: asset.tags,
            provider: asset.provider,
          })),
        });
      }

      if (folderName.trim() && folderAction === "create") {
        const createdFolder = await createManagedMediaFolderRecord(
          resolvedDeps.getSupabase(),
          {
            userId,
            folderName,
          },
        );

        return res.json({
          success: true,
          folderName: createdFolder,
        });
      }

      if (folderName.trim() && folderAction === "rename") {
        const nextFolderName =
          typeof req.body?.nextFolderName === "string"
            ? req.body.nextFolderName
            : typeof req.body?.renameTo === "string"
              ? req.body.renameTo
              : "";

        if (!nextFolderName.trim()) {
          return res.status(400).json({ error: "Missing folder rename target" });
        }

        const assets = await renameManagedMediaFolderRecord(
          resolvedDeps.getSupabase(),
          {
            userId,
            folderName,
            nextFolderName,
            provider,
          },
        );

        return res.json({
          success: true,
          updatedCount: assets.length,
          folderName: normalizeFolderName(folderName),
          nextFolderName: normalizeFolderName(nextFolderName),
        });
      }

      if (folderName.trim() && folderAction === "delete") {
        const deletedCount = await deleteManagedMediaAssetsInFolder(
          resolvedDeps.getSupabase(),
          {
            userId,
            folderName,
            provider,
          },
        );

        return res.json({
          success: true,
          deletedCount,
          folderName: normalizeFolderName(folderName),
        });
      }

      const objectPath =
        typeof req.body?.path === "string"
          ? req.body.path
          : typeof req.body?.objectPath === "string"
            ? req.body.objectPath
            : "";
      const mediaProvider =
        provider === "all" ? null : (provider as ManagedMediaUploadProvider);

      if (!objectPath.trim() || !mediaProvider) {
        return res.status(400).json({ error: "Missing media path" });
      }

      const updated = await updateMediaAssetRecord(
        resolvedDeps.getSupabase(),
        {
          userId,
          provider: mediaProvider,
          objectPath,
          folderName:
            typeof req.body?.folderName === "string"
              ? req.body.folderName
              : undefined,
          tags:
            req.body?.tagsText ??
            req.body?.tags ??
            req.body?.tagList ??
            undefined,
          fileName:
            typeof req.body?.fileName === "string"
              ? req.body.fileName
              : undefined,
        },
      );

      if (!updated) {
        return res.status(404).json({ error: "Media asset not found" });
      }

      return res.json({
        success: true,
        asset: {
          ...updated,
          url: updated.public_url,
          folderName: updated.folder_name,
          tags: updated.tags || [],
        },
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  };
};

export const createManagedMediaDeleteHandler = (
  deps: Partial<MediaLibraryRouteDeps> = {},
) => {
  const resolvedDeps = { ...defaultMediaLibraryRouteDeps, ...deps };

  return async (req: AuthenticatedRequest, res: any) => {
    try {
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(400).json({ error: "Unauthorized" });
      }

      const objectPath =
        typeof req.body?.path === "string"
          ? req.body.path
          : typeof req.query?.path === "string"
            ? req.query.path
            : "";
      const provider = resolveRequestedMediaProviderFilter(req.body?.provider);

      if (!objectPath.trim() || provider === "all") {
        return res.status(400).json({ error: "Missing media path" });
      }

      const assets = await listMediaAssetsFromDatabase(
        resolvedDeps.getSupabase(),
        {
          userId,
          provider,
        },
      );
      const asset = assets.find((item) => item.path === objectPath);

      if (!asset) {
        return res.json({
          success: true,
          path: objectPath,
          alreadyDeleted: true,
        });
      }

      await deleteManagedMediaAsset({
        supabase: resolvedDeps.getSupabase(),
        asset: {
          user_id: userId,
          provider,
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
      });

      return res.json({ success: true, path: objectPath });
    } catch (e: any) {
      if (typeof e?.message === "string" && /invalid media path/i.test(e.message)) {
        return res.status(400).json({ error: e.message });
      }

      return res.status(500).json({ error: e.message });
    }
  };
};

export const createLocalAvatarUploadHandler = (
  deps: Partial<AvatarUploadRouteDeps> = {},
) => {
  const resolvedDeps = { ...defaultAvatarUploadRouteDeps, ...deps };

  return async (req: AuthenticatedRequest, res: any) => {
    try {
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(400).json({ error: "Unauthorized" });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          error: "Invalid file type. Only JPEG, PNG, WebP allowed.",
        });
      }

      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        return res.status(400).json({ error: "File too large. Max 2MB." });
      }

      const result = await resolvedDeps.uploadToLocalStorage({
        resourceType: "image",
        userId,
        file: {
          buffer: file.buffer,
          mimetype: file.mimetype,
          originalname: file.originalname,
        },
        fileName: file.originalname,
      });

      const publicBaseUrl =
        resolvedDeps.getPublicBaseUrl(req) ||
        `${req.protocol}://${req.get("host")}`;
      const secureUrl = resolvedDeps.buildLocalMediaUrl(
        result.path,
        publicBaseUrl,
      );

      try {
        await resolvedDeps.upsertLocalMediaAssetRecord(
          resolvedDeps.getSupabase(),
          {
            user_id: userId,
            provider: "local",
            resource_type: "image",
            object_path: result.path,
            public_url: result.url,
            folder_name: "avatars",
            tags: ["avatar"],
            file_name: file.originalname || "avatar.webp",
            size_bytes: file.size,
            modified_at: new Date().toISOString(),
            mime_type: file.mimetype || "image/webp",
            metadata: {
              kind: "avatar",
            },
          },
        );
      } catch (metadataError) {
        await resolvedDeps.deleteLocalMediaAsset({
          userId,
          objectPath: result.path,
        }).catch(() => undefined);
        throw metadataError;
      }

      return res.json({ secure_url: secureUrl, path: result.path });
    } catch (e: any) {
      console.error("âŒ Avatar upload error:", e);
      return res.status(500).json({ error: e.message });
    }
  };
};

export const createManagedAvatarUploadHandler = (
  deps: Partial<AvatarUploadRouteDeps> = {},
) => {
  const resolvedDeps = { ...defaultAvatarUploadRouteDeps, ...deps };

  return async (req: AuthenticatedRequest, res: any) => {
    try {
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(400).json({ error: "Unauthorized" });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          error: "Invalid file type. Only JPEG, PNG, WebP allowed.",
        });
      }

      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        return res.status(400).json({ error: "File too large. Max 2MB." });
      }

      const reusable = await findReusableManagedMediaAsset({
        supabase: resolvedDeps.getSupabase(),
        userId,
        resourceType: "image",
        fileBuffer: file.buffer,
      });

      if (reusable.asset) {
        return res.json({
          secure_url: reusable.asset.url,
          path: reusable.asset.path,
          provider: reusable.asset.provider,
          reused: true,
          deduped: true,
        });
      }

      const avatarPlans = resolvedDeps.buildMediaUploadPlan("image", {
        fileName: file.originalname,
        fileSize: file.size,
        contentType: file.mimetype,
      });
      const providers: Array<
        AvatarUploadPlan | SupabaseAvatarUploadPlan
      > = [
        avatarPlans.find(
          (provider): provider is AvatarUploadPlan => provider.provider === "r2",
        ),
        avatarPlans.find(
          (provider): provider is AvatarUploadPlan =>
            provider.provider === "cloudinary",
        ),
        avatarPlans.find(
          (provider): provider is SupabaseAvatarUploadPlan =>
            provider.provider === "supabase",
        ),
      ].filter(
        (
          provider,
        ): provider is AvatarUploadPlan | SupabaseAvatarUploadPlan =>
          Boolean(provider),
      );

      if (!providers.length) {
        return res.status(503).json({
          error: "No managed upload providers are available for avatars.",
        });
      }

      const uploadPayload = {
        resourceType: "image" as const,
        userId,
        file: {
          buffer: file.buffer,
          mimetype: file.mimetype,
          originalname: file.originalname,
        },
        fileName: file.originalname,
      };

      const errors: string[] = [];

      for (const provider of providers) {
        try {
          let result:
            | { provider: "r2"; path: string; url: string }
            | { provider: "cloudinary"; path: string; url: string }
            | { provider: "supabase"; path: string; url: string };

          if (provider.provider === "r2") {
            result = await resolvedDeps.uploadToR2Storage(uploadPayload);
          } else if (provider.provider === "cloudinary") {
            result = await uploadAvatarToCloudinary(uploadPayload.file);
          } else if (provider.provider === "supabase") {
            result = await resolvedDeps.uploadToSupabaseStorage(
              resolvedDeps.getSupabase(),
              uploadPayload,
            );
          } else {
            const unreachableProvider: never = provider;
            throw new Error(`Unsupported avatar provider: ${unreachableProvider}`);
          }

          try {
            await resolvedDeps.upsertMediaAssetRecord(
              resolvedDeps.getSupabase(),
              {
                user_id: userId,
                provider: result.provider,
                resource_type: "image",
                object_path: result.path,
                public_url: result.url,
                folder_name: "avatars",
                tags: ["avatar"],
                file_name: file.originalname || "avatar.webp",
                size_bytes: file.size,
                modified_at: new Date().toISOString(),
                mime_type: file.mimetype || "image/webp",
                metadata: {
                  kind: "avatar",
                  provider: result.provider,
                  ...buildManagedMediaAssetMetadata(reusable.sha256),
                },
              },
            );
          } catch (metadataError) {
            await resolvedDeps.deleteManagedMediaAsset({
              supabase: resolvedDeps.getSupabase(),
              asset: {
                user_id: userId,
                provider: result.provider,
                resource_type: "image",
                object_path: result.path,
                public_url: result.url,
                folder_name: "avatars",
                tags: ["avatar"],
                file_name: file.originalname || "avatar.webp",
                size_bytes: file.size,
                modified_at: new Date().toISOString(),
                mime_type: file.mimetype || "image/webp",
                metadata: { kind: "avatar", provider: result.provider },
              },
            }).catch(() => undefined);
            throw metadataError;
          }

          return res.json({
            secure_url: result.url,
            path: result.path,
            provider: result.provider,
            reused: false,
            deduped: false,
          });
        } catch (error) {
          errors.push(
            `${provider.provider}: ${error instanceof Error ? error.message : "upload failed"}`,
          );
        }
      }

      throw new Error(
        errors.length
          ? errors.join(" | ")
          : "No upload providers are available for avatar upload.",
      );
    } catch (e: any) {
      console.error("Avatar upload error:", e);
      return res.status(500).json({ error: e.message });
    }
  };
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
      const providers = resolvedDeps.buildMediaUploadPlan(resourceType, {
        fileName:
          typeof req.body?.fileName === "string" ? req.body.fileName : undefined,
        fileSize: Number.isFinite(fileSize) && fileSize > 0 ? fileSize : undefined,
        contentType:
          typeof req.body?.contentType === "string"
            ? req.body.contentType
            : undefined,
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
  "/media/upload-cloudinary",
  authenticate,
  mediaUpload.single("file"),
  createCloudinaryMediaUploadHandler(),
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

      const reusable = await findReusableManagedMediaAsset({
        supabase: getSupabase(),
        userId,
        resourceType:
          resourceType === "video"
            ? "video"
            : resourceType === "audio"
              ? "audio"
              : "image",
        fileBuffer: file.buffer,
      });

      if (reusable.asset) {
        return res.json({
          provider: reusable.asset.provider,
          url: reusable.asset.url,
          path: reusable.asset.path,
          reused: true,
          deduped: true,
        });
      }

      const result = await uploadToSupabaseStorage(getSupabase(), {
        resourceType,
        userId,
        file,
        fileName:
          typeof req.body?.fileName === "string" ? req.body.fileName : undefined,
      });

      const managedResourceType =
        resourceType === "video"
          ? "video"
          : resourceType === "audio"
            ? "audio"
            : "image";

      await upsertMediaAssetRecord(getSupabase(), {
        user_id: userId,
        provider: "supabase",
        resource_type: managedResourceType,
        object_path: result.path,
        public_url: result.url,
        folder_name: resolveLocalFolderName(req.body?.folderName),
        tags: resolveLocalTags(req.body?.tags ?? req.body?.tagsText),
        file_name:
          typeof req.body?.fileName === "string" && req.body.fileName.trim()
            ? req.body.fileName.trim()
            : file.originalname || `${resourceType}.bin`,
        size_bytes: file.size,
        modified_at: new Date().toISOString(),
        mime_type: file.mimetype || "application/octet-stream",
        metadata: {
          bucket: result.bucket,
          provider: "supabase",
          ...buildManagedMediaAssetMetadata(reusable.sha256),
        },
      });

      return res.json({
        ...result,
        reused: false,
        deduped: false,
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  },
);

router.post(
  "/media/upload-r2",
  authenticate,
  mediaUpload.single("file"),
  createR2MediaUploadHandler(),
);

router.get("/media/library", authenticate, createManagedMediaLibraryHandler());

router.delete("/media/library", authenticate, createManagedMediaDeleteHandler());

router.patch(
  "/media/library",
  authenticate,
  createMediaLibraryMutationHandler(),
);

router.post(
  "/upload-avatar",
  authenticate,
  upload.single("file"),
  createManagedAvatarUploadHandler(),
);

/*
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

      const result = await uploadToLocalStorage({
        resourceType: "image",
        userId,
        file: {
          buffer: file.buffer,
          mimetype: file.mimetype,
          originalname: file.originalname,
        },
        fileName: file.originalname,
      });

      const publicBaseUrl =
        getPublicBaseUrl(req) || `${req.protocol}://${req.get("host")}`;
      const secureUrl = buildLocalMediaUrl(result.path, publicBaseUrl);

      try {
        await upsertLocalMediaAssetRecord(getSupabase(), {
          user_id: userId,
          provider: "local",
          resource_type: "image",
          object_path: result.path,
          public_url: result.url,
          folder_name: "avatars",
          tags: ["avatar"],
          file_name: file.originalname || "avatar.webp",
          size_bytes: file.size,
          modified_at: new Date().toISOString(),
          mime_type: file.mimetype || "image/webp",
          metadata: {
            kind: "avatar",
          },
        });
      } catch (metadataError) {
        await deleteLocalMediaAsset({
          userId,
          objectPath: result.path,
        }).catch(() => undefined);
        throw metadataError;
      }

      return res.json({ secure_url: secureUrl, path: result.path });
    } catch (e: any) {
      console.error("❌ Avatar upload error:", e);
      return res.status(500).json({ error: e.message });
    }
  },
);
*/

export default router;
