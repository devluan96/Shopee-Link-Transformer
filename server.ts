import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cors from "cors";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { createClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Multer
const upload = multer({ storage: multer.memoryStorage() });

const PORT = 3000;

async function startServer() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "100mb" }));

  // ===== HEALTH =====
  app.get("/api/health", (req, res) => {
    res.json({ ok: true });
  });

  // ===== PROFILE (FIX 404 + ADMIN BUG) =====
  app.post("/api/v1/user/profiles", async (req, res) => {
    try {
      const { userId, email, displayName, photoURL } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }

      // 1. Lấy profile từ DB
      let { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;

      // 2. Nếu chưa có → tạo mới (MẶC ĐỊNH user)
      if (!profile) {
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: userId,
            email,
            full_name: displayName,
            avatar_url: photoURL,
            role: "user", // ❗ luôn default user
            status: "pending", // ❗ luôn pending
          })
          .select()
          .single();

        if (insertError) throw insertError;

        profile = newProfile;
      }

      // 3. QUAN TRỌNG: lấy quyền từ DB
      const isAdmin = profile.role === "admin";
      const isApproved = isAdmin || profile.status === "approved";

      res.json({
        uid: userId,
        email,
        displayName: profile.full_name,
        photoURL: profile.avatar_url,
        isAdmin,
        isApproved,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ===== UPLOAD AVATAR =====
  app.post(
    "/api/v1/upload-avatar",
    upload.single("file"),
    async (req: any, res) => {
      try {
        const { userId } = req.body;
        if (!req.file || !userId) {
          return res.status(400).json({ error: "Missing file or userId" });
        }

        const filePath = `avatars/${userId}.jpg`;

        const { error } = await supabase.storage
          .from("avatars")
          .upload(filePath, req.file.buffer, { upsert: true });

        if (error) throw error;

        const { data } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        res.json({ publicUrl: data.publicUrl });
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    },
  );

  // ===== UPLOAD VIDEO =====
  app.post(
    "/api/v1/upload-video",
    upload.single("file"),
    async (req: any, res) => {
      try {
        if (!req.file) return res.status(400).json({ error: "No file" });

        const stream = cloudinary.uploader.upload_stream(
          { resource_type: "auto" },
          (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ secure_url: result?.secure_url });
          },
        );

        stream.end(req.file.buffer);
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    },
  );

  // ===== CREATE LINK =====
  app.post("/api/v1/convert", async (req, res) => {
    try {
      const {
        url,
        userId,
        customTitle,
        customDescription,
        customImageUrl,
        videoUrl,
      } = req.body;

      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const shortCode = nanoid(8);

      const { error } = await supabase.from("links").insert({
        original_url: url,
        short_code: shortCode,
        user_id: userId,
        custom_title: customTitle,
        custom_description: customDescription,
        custom_image_url: customImageUrl,
        video_url: videoUrl,
      });

      if (error) throw error;

      res.json({
        converted_url: `https://hotsnew.click/s/${shortCode}`,
        shortCode,
      });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // ===== GET LINKS =====
  app.get("/api/v1/user/links", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: "Missing userId" });

      const { data, error } = await supabase
        .from("links")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ===== STATS =====
  app.get("/api/v1/user/stats", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: "Missing userId" });

      const { count } = await supabase
        .from("links")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);

      res.json({
        totalLinks: count || 0,
        totalClicks: 0,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ===== ANALYTICS (TEMP DISABLED) =====
  app.get("/api/v1/user/analytics", async (req, res) => {
    return res.json({ history: [], topLinks: [] });
  });

  // ===== REDIRECT =====
  app.get("/s/:shortCode", async (req, res) => {
    try {
      const { shortCode } = req.params;

      const { data, error } = await supabase
        .from("links")
        .select("original_url")
        .eq("short_code", shortCode)
        .maybeSingle();

      if (error || !data) return res.status(404).send("Not found");

      res.redirect(data.original_url);
    } catch {
      res.status(500).send("Error");
    }
  });

  // ===== VITE =====
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log("🚀 Server running on port", PORT);
  });
}

startServer();
