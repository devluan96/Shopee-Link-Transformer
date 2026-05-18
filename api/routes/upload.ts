import { Router } from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth.js";
import { getSupabase } from "../config/supabase.js";
import { cloudinary } from "../config/cloudinary.js";
import { upload } from "../config/multer.js";
import { CLOUDINARY_UPLOAD_FOLDER } from "../config/constants.js";
import { AuthenticatedRequest } from "../types/index.js";
import * as featureLimitService from "../services/featureLimitService.js";
import {
  buildMediaUploadPlan,
  getSupabaseMediaMaxUploadBytes,
  isCloudinaryUploadDisabled,
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

const resolveRequestedResourceType = (value: unknown) =>
  value === "video" ? "video" : value === "image" ? "image" : "auto";

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

      const result = await uploadToSupabaseStorage(getSupabase(), {
        resourceType,
        userId,
        file,
        fileName:
          typeof req.body?.fileName === "string" ? req.body.fileName : undefined,
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
