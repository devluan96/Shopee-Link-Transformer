import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getSupabase } from "../config/supabase.js";
import { cloudinary } from "../config/cloudinary.js";
import { upload } from "../config/multer.js";
import { CLOUDINARY_UPLOAD_FOLDER } from "../config/constants.js";
import { AuthenticatedRequest } from "../types/index.js";

const router = Router();

// POST /api/v1/cloudinary/sign-upload - Get signed upload URL
router.post(
  "/cloudinary/sign-upload",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
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
      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ error: "Invalid file type. Only JPEG, PNG, GIF, WebP allowed." });
      }

      // Check file size (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        return res.status(400).json({ error: "File too large. Max 5MB." });
      }

      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `${CLOUDINARY_UPLOAD_FOLDER}/avatars`,
            public_id: `avatar_${userId}_${Date.now()}`,
            transformation: [{ width: 400, height: 400, crop: "fill" }],
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
