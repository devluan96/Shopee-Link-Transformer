import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cors from "cors";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import { nanoid } from "nanoid";
import { z } from "zod";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Firebase Admin
const firebaseConfigPath = path.join(__dirname, "firebase-applet-config.json");
const firebaseServiceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const firebaseServiceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

const firebaseAdminOptions: admin.AppOptions = {};

if (firebaseServiceAccountKey) {
  firebaseAdminOptions.credential = admin.credential.cert(
    JSON.parse(firebaseServiceAccountKey),
  );
} else if (
  firebaseServiceAccountPath &&
  fs.existsSync(firebaseServiceAccountPath)
) {
  firebaseAdminOptions.credential = admin.credential.cert(
    JSON.parse(fs.readFileSync(firebaseServiceAccountPath, "utf-8")),
  );
} else if (fs.existsSync(firebaseConfigPath)) {
  const firebaseConfig = JSON.parse(
    fs.readFileSync(firebaseConfigPath, "utf-8"),
  );
  firebaseAdminOptions.projectId = firebaseConfig.projectId;
}

if (!admin.apps.length) {
  admin.initializeApp(firebaseAdminOptions);
}
const db = getFirestore();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing Supabase server configuration. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
  );
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// 3. Multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

const PORT = 3000;

async function startServer() {
  const app = express();

  // A. ENSURE CORS IS AT THE VERY TOP
  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    }),
  );

  // B. TRUST PROXY FOR CLOUD ENV
  app.set("trust proxy", 1);

  // C. ENHANCED DEBUG LOGGING WITH REQUEST/RESPONSE DATA
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const requestId = crypto.randomBytes(8).toString("hex");

    console.log(`\n[${timestamp}] 🔹 REQUEST ${requestId}`);
    console.log(`  Method: ${req.method}`);
    console.log(`  Path: ${req.path}`);
    console.log(`  URL: ${req.url}`);
    console.log(`  IP: ${req.ip || req.connection.remoteAddress}`);
    console.log(`  Headers:`, JSON.stringify(req.headers, null, 2));

    // Log body for POST/PUT requests
    if (req.method === "POST" || req.method === "PUT") {
      if (req.headers["content-type"]?.includes("application/json")) {
        console.log(
          `  Body (buffered):`,
          JSON.stringify(req.body || {}, null, 2),
        );
      } else if (req.headers["content-type"]?.includes("multipart/form-data")) {
        console.log(`  Content-Type: multipart/form-data (file upload)`);
      }
    }

    // Intercept response
    const originalSend = res.send;
    res.send = function (data: any) {
      console.log(`\n[${timestamp}] ✅ RESPONSE ${requestId}`);
      console.log(`  Status: ${res.statusCode}`);
      console.log(
        `  Response Headers:`,
        JSON.stringify(res.getHeaders(), null, 2),
      );
      try {
        if (typeof data === "string" && data.startsWith("{")) {
          console.log(`  Body:`, JSON.stringify(JSON.parse(data), null, 2));
        } else {
          console.log(`  Body:`, data);
        }
      } catch (e) {
        console.log(`  Body (raw):`, data);
      }
      console.log(`---`);
      return originalSend.call(this, data);
    };

    next();
  });

  // D. CRITICAL API HANDLERS (DEFINED DIRECTLY ON APP)

  // Health check - Absolute verification
  app.get("/api/health", (req, res) => {
    console.log("--- API Health Accessed ---");
    res.setHeader("Content-Type", "application/json");
    res.status(200).send(
      JSON.stringify({
        status: "ok",
        ok: true,
        msg: "Server is receiving and responding to API calls",
      }),
    );
  });

  // Avatar Upload - Uses Service Role to bypass RLS
  app.post(
    "/api/v1/upload-avatar",
    upload.single("file"),
    async (req: any, res) => {
      console.log(
        `[AVATAR-UPLOAD] File received: ${req.file?.originalname || "No file"}`,
      );
      try {
        if (!req.file)
          return res.status(400).json({ error: "No file provided" });

        const { userId } = req.body || {};
        if (!userId) {
          console.warn(`[AVATAR-UPLOAD] Missing userId in request`);
          return res.status(400).json({ error: "Missing userId" });
        }

        const fileExt =
          req.file.originalname.split(".").pop()?.toLowerCase() || "jpg";
        const filePath = `avatars/${userId}.${fileExt}`;

        console.log(
          `[AVATAR-UPLOAD] Uploading to path: ${filePath}, size: ${req.file.size} bytes`,
        );

        // Use Service Role to bypass RLS
        const { data, error: uploadError } = await supabaseAdmin.storage
          .from("avatars")
          .upload(filePath, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: true,
            cacheControl: "3600",
          });

        if (uploadError) {
          console.error(`[AVATAR-UPLOAD-ERROR] Upload failed:`, uploadError);
          return res.status(500).json({ error: uploadError.message });
        }

        console.log(`[AVATAR-UPLOAD] File uploaded successfully:`, data);

        // Get public URL
        const {
          data: { publicUrl },
        } = supabaseAdmin.storage.from("avatars").getPublicUrl(filePath);

        console.log(`[AVATAR-UPLOAD-SUCCESS] Public URL: ${publicUrl}`);
        res.json({ publicUrl, path: filePath });
      } catch (e: any) {
        console.error(`[AVATAR-UPLOAD-CATCH-ERROR]`, e);
        res.status(500).json({ error: e.message });
      }
    },
  );
  // NEW: Avatar Upload Endpoint (uses Service Role to bypass RLS)
  app.post(
    "/api/v1/upload-avatar",
    upload.single("file"),
    async (req: any, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No file provided" });
        }

        const { userId } = req.body || {};
        if (!userId) {
          return res.status(400).json({ error: "Missing userId" });
        }

        const fileExt = req.file.originalname.split(".").pop() || "jpg";
        const filePath = `avatars/${userId}.${fileExt}`;

        console.log(`[AVATAR] Uploading ${filePath} via Service Role...`);

        // Service Role key bypasses RLS
        const { data, error: uploadError } = await supabaseAdmin.storage
          .from("avatars")
          .upload(filePath, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: true,
          });

        if (uploadError) {
          console.error("[AVATAR-ERROR]", uploadError);
          return res.status(500).json({ error: uploadError.message });
        }

        const {
          data: { publicUrl },
        } = supabaseAdmin.storage.from("avatars").getPublicUrl(filePath);

        console.log("[AVATAR-SUCCESS]", publicUrl);
        res.json({ publicUrl });
      } catch (e: any) {
        console.error("[AVATAR-CATCH]", e);
        res.status(500).json({ error: e.message });
      }
    },
  );
  // Video Upload - Defined with Multer inline
  app.post(
    "/api/v1/upload-video",
    upload.single("file"),
    async (req: any, res) => {
      console.log(
        `--- Upload API Hit: ${req.file?.originalname || "No file"} ---`,
      );
      try {
        if (!req.file)
          return res.status(400).json({ error: "No file provided in body" });

        const stream = cloudinary.uploader.upload_stream(
          { resource_type: "auto", folder: "hotsnew" },
          (error, result) => {
            if (error) {
              console.error("Cloudinary Stream Error:", error);
              return res.status(500).json({ error: error.message });
            }
            console.log("Cloudinary Upload Success:", result?.secure_url);
            res.json({ secure_url: result?.secure_url });
          },
        );
        stream.end(req.file.buffer);
      } catch (e: any) {
        console.error("Server Upload Catch-all Error:", e);
        res.status(500).json({ error: e.message });
      }
    },
  );

  // E. SECONDARY MIDDLEWARES (After critical routes to avoid interference)
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json({ limit: "100mb" }));
  app.use(express.urlencoded({ limit: "100mb", extended: true }));

  // F. OTHER FUNCTIONAL API ROUTES
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
      await db.collection("links").add({
        originalUrl: url,
        shortCode,
        userId,
        customTitle,
        customDescription,
        customImageUrl,
        videoUrl,
        createdAt: FieldValue.serverTimestamp(),
      });
      res.json({
        converted_url: `https://hotsnew.click/s/${shortCode}`,
        shortCode,
      });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/v1/user/stats", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: "Missing userId" });

      const { data: profileData, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("status")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("Supabase profile lookup failed", profileError);
      }

      const status = profileData?.status || "pending";
      let totalLinks = 0;
      let totalClicks = 0;

      const { error: linksError, count } = await supabaseAdmin
        .from("links")
        .select("id", { head: true, count: "exact" })
        .eq("user_id", userId);

      if (!linksError) {
        totalLinks = count || 0;
      } else {
        console.warn(
          "Supabase links table not found or query failed, falling back to Firestore",
          linksError.message,
        );
        const snap = await db
          .collection("links")
          .where("userId", "==", userId)
          .get();
        totalLinks = snap.size;
      }

      res.json({ totalLinks, totalClicks, status });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/v1/user/analytics", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: "Missing userId" });

      const linksSnap = await db
        .collection("links")
        .where("userId", "==", userId)
        .get();
      const linkIds = linksSnap.docs.map((d) => d.id);
      const linkMap = Object.fromEntries(
        linksSnap.docs.map((d) => [
          d.id,
          d.data().customTitle || d.data().shortCode,
        ]),
      );

      if (linkIds.length === 0) return res.json({ history: [], topLinks: [] });

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Batch linkIds for 'in' query (Firestore limit 30)
      const targetLinkIds = linkIds.slice(0, 30);
      const clicksSnap = await db
        .collection("clicks")
        .where("linkId", "in", targetLinkIds)
        .where("timestamp", ">=", thirtyDaysAgo)
        .get();

      const historyMap: Record<string, number> = {};
      const linksStats: Record<string, number> = {};

      clicksSnap.docs.forEach((doc) => {
        const data = doc.data();
        const date = data.timestamp.toDate().toISOString().split("T")[0];
        historyMap[date] = (historyMap[date] || 0) + 1;
        linksStats[data.linkId] = (linksStats[data.linkId] || 0) + 1;
      });

      const history = Object.entries(historyMap)
        .map(([date, clicks]) => ({ date, clicks }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const topLinks = Object.entries(linksStats)
        .map(([id, clicks]) => ({ id, clicks, title: linkMap[id] }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 5);

      res.json({ history, topLinks });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/v1/user/links", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: "Missing userId" });

      const snap = await db
        .collection("links")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .get();

      const links = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.json(links);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  const DEFAULT_AVATAR_URL =
    "https://ui-avatars.com/api/?name=HotsNew&background=F97316&color=FFFFFF&size=128";

  app.post("/api/v1/user/profiles", async (req, res) => {
    try {
      const { userId, email, displayName, photoURL } = req.body;
      if (!userId) return res.status(400).json({ error: "Missing userId" });

      const { data: profileData, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("role,status,avatar_url,full_name")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("Supabase profile lookup failed", profileError);
      }

      const isAdmin = profileData?.role === "admin";
      const isApproved = profileData?.status === "approved" || isAdmin;
      const finalAvatar =
        profileData?.avatar_url || photoURL || DEFAULT_AVATAR_URL;
      const finalName = profileData?.full_name || displayName || "User";

      if (!profileData) {
        const { error: createError } = await supabaseAdmin
          .from("profiles")
          .upsert(
            {
              id: userId,
              email,
              full_name: finalName,
              avatar_url: finalAvatar,
              status: "pending",
              role: "user",
            },
            { onConflict: "id" },
          );

        if (createError) {
          console.error("Supabase profile create failed", createError);
        }
      }

      res.json({
        uid: userId,
        email,
        displayName: finalName,
        photoURL: finalAvatar,
        isAdmin: Boolean(isAdmin),
        isApproved: Boolean(isApproved),
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/v1/user/profile", async (req, res) => {
    try {
      const { userId, email, displayName, photoURL } = req.body;
      if (!userId) return res.status(400).json({ error: "Missing userId" });

      const updates: Record<string, any> = {};
      if (displayName !== undefined) updates.full_name = displayName;
      if (photoURL !== undefined) updates.avatar_url = photoURL;
      if (email !== undefined) updates.email = email;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No profile fields provided" });
      }

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .upsert({ id: userId, ...updates }, { onConflict: "id" });

      if (updateError) {
        console.error("Supabase profile update failed", updateError);
        return res.status(500).json({ error: updateError.message });
      }

      res.json({ success: true, ...updates });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/v1/user/profile", async (req, res) => {
    try {
      const { userId, email, displayName, photoURL } = req.body;
      if (!userId) return res.status(400).json({ error: "Missing userId" });

      const { data: profileData, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("role,status")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("Supabase profile lookup failed", profileError);
      }

      const isAdmin = profileData?.role === "admin";
      const isApproved = profileData?.status === "approved" || isAdmin;

      res.json({
        uid: userId,
        email,
        displayName,
        photoURL,
        isAdmin: Boolean(isAdmin),
        isApproved: Boolean(isApproved),
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/v1/admin/users", async (req, res) => {
    try {
      const adminId = req.query.adminId as string;
      if (!adminId) return res.status(400).json({ error: "Missing adminId" });

      const { data: adminProfile, error: adminError } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", adminId)
        .maybeSingle();

      if (adminError) {
        console.error("Supabase admin lookup failed", adminError);
        return res.status(500).json({ error: adminError.message });
      }

      if (adminProfile?.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from("profiles")
        .select("id, email, full_name, role, status, approved_at");

      if (profilesError) {
        console.error("Supabase profiles fetch failed", profilesError);
        return res.status(500).json({ error: profilesError.message });
      }

      const users = (profiles || []).map((profile: any) => ({
        uid: profile.id,
        email: profile.email,
        displayName: profile.full_name || profile.email,
        photoURL: "",
        isAdmin: profile.role === "admin",
        isApproved: profile.status === "approved" || profile.role === "admin",
      }));

      res.json(users);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/v1/admin/users/:targetUid/approve", async (req, res) => {
    try {
      const { adminId } = req.body;
      const targetUid = req.params.targetUid;
      if (!adminId) return res.status(400).json({ error: "Missing adminId" });
      if (!targetUid)
        return res.status(400).json({ error: "Missing targetUid" });

      const { data: adminProfile, error: adminError } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", adminId)
        .maybeSingle();

      if (adminError) {
        console.error("Supabase admin lookup failed", adminError);
        return res.status(500).json({ error: adminError.message });
      }

      if (adminProfile?.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ status: "approved" })
        .eq("id", targetUid);

      if (updateError) {
        console.error("Supabase approve failed", updateError);
        return res.status(500).json({ error: updateError.message });
      }

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // G. REDIRECTS
  app.get("/s/:shortCode", async (req, res) => {
    try {
      const { shortCode } = req.params;
      const snap = await db
        .collection("links")
        .where("shortCode", "==", shortCode)
        .limit(1)
        .get();
      if (snap.empty) return res.status(404).send("Not found");
      res.redirect(snap.docs[0].data().originalUrl);
    } catch (e) {
      res.status(500).send("Error");
    }
  });

  // H. API 404 FALLTHROUGH
  app.all("/api/*", (req, res) => {
    console.log(`[404 API] No match for: ${req.method} ${req.url}`);
    res.status(404).json({
      error: `API Route Not Found: ${req.method} ${req.url}`,
      diagnostics: { method: req.method, path: req.path, url: req.url },
    });
  });

  // I. VITE / SPA / STATIC (LAST PRIORITY)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { port: 3001 } },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`>>> SERVER LISTENING ON PORT ${PORT} <<<`);
    console.log(`--- Ready to handle API and Web traffic ---`);
  });
}

startServer().catch((err) => {
  console.error("FATAL SERVER STARTUP FAIL:", err);
  process.exit(1);
});
