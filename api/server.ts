import "dotenv/config";
import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cors from "cors";

// Config
import { PORT } from "./config/constants.js";
import { getSupabase } from "./config/supabase.js";

// Middleware
import { authenticate } from "./middleware/auth.js";

// Routes
import apiRoutes from "./routes/index.js";

// Utils
import {
  getPublicBaseUrl,
  escapeHtml,
  getTrafficSourceFromRequest,
} from "./utils/helpers.js";
import { normalizeTrafficSource } from "./utils/normalizers.js";
import {
  insertClickWithTracking,
  insertOutboundEvent,
} from "./utils/clickTracking.js";

// Templates
import { renderLinkLandingPage } from "./templates/landingPage.js";

// Types
import { PublicLinkRecord } from "./types/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// A. MIDDLEWARES
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  }),
);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.set("trust proxy", 1);
app.set("etag", false);

// B. CACHE-BUSTING & LOGGING
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
  }
  next();
});

// C. HEALTH CHECK
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    msg: "Health Check Success",
    serverInfo: {
      nodeEnv: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL,
      hasUrl: !!(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL),
      hasKey: !!(
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
      ),
    },
  });
});

// D. API ROUTES (modular)
app.use(apiRoutes);

// E. SHORT LINK REDIRECTION
app.get("/s/:shortCode", async (req, res) => {
  const { shortCode } = req.params;
  if (!shortCode) {
    return res.status(400).send("Missing short code");
  }

  try {
    const supabase = getSupabase();
    const { data: link, error } = await supabase
      .from("links")
      .select(
        "id, short_code, original_url, custom_title, custom_description, custom_image_url, video_url, secondary_url, redirect_delay_ms, expires_at",
      )
      .eq("short_code", shortCode)
      .maybeSingle();

    if (error) throw error;

    if (!link) {
      return res.status(404).send("Link not found");
    }

    // Check if link has expired
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return res.status(410).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Link Expired</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
              .container { text-align: center; padding: 2rem; background: white; border-radius: 1rem; box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 400px; margin: 1rem; }
              .icon { font-size: 4rem; margin-bottom: 1rem; }
              h1 { color: #1a202c; margin: 0 0 0.5rem; font-size: 1.5rem; }
              p { color: #718096; margin: 0 0 1.5rem; line-height: 1.6; }
              a { display: inline-block; padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 0.5rem; font-weight: 600; }
              a:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3); }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">⏰</div>
              <h1>Link đã hết hạn</h1>
              <p>Link này đã hết hạn và không còn khả dụng nữa. Vui lòng liên hệ người tạo link để được hỗ trợ.</p>
              <a href="/">Về trang chủ</a>
            </div>
          </body>
        </html>
      `);
    }

    // Track click
    const { source, source_detail, referer } = getTrafficSourceFromRequest(req);
    const userAgent = req.headers["user-agent"] || "";
    const ipAddress =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "";

    try {
      await insertClickWithTracking(supabase, {
        link_id: link.id,
        user_agent: userAgent,
        ip_address: ipAddress,
        source,
        source_detail,
        referer,
      });
    } catch (trackError) {
      console.error("Click tracking error:", trackError);
    }

    // Increment click count (fire and forget)
    try {
      await supabase.rpc("increment_link_clicks", { link_id: link.id });
    } catch (e: any) {
      console.error("Failed to increment clicks:", e.message);
    }

    // Redirect or render landing page
    const wantsRedirect = req.query.redirect === "true";
    const hasMedia = link.custom_image_url || link.video_url;

    if (wantsRedirect || !hasMedia) {
      return res.redirect(link.original_url);
    }

    // Render landing page
    const publicBaseUrl =
      getPublicBaseUrl(req) || `${req.protocol}://${req.get("host")}`;
    const canonicalUrl = `${publicBaseUrl}/s/${shortCode}`;
    const clickTrackingUrl = `${publicBaseUrl}/api/v1/links/${link.id}/track`;

    const html = renderLinkLandingPage(
      link as PublicLinkRecord,
      canonicalUrl,
      clickTrackingUrl,
    );

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300");
    return res.send(html);
  } catch (e: any) {
    console.error("[REDIRECT ERROR]", {
      shortCode,
      message: e.message,
      details: e.details,
      hint: e.hint,
      code: e.code,
      stack: e.stack?.slice(0, 500)
    });
    return res.status(500).send("Server error: " + (e.message || "Unknown"));
  }
});

// F. OUTBOUND TRACKING
app.post("/api/v1/links/:linkId/track", async (req, res) => {
  try {
    const { linkId } = req.params;
    if (!linkId) {
      return res.status(400).json({ error: "Missing linkId" });
    }

    const supabase = getSupabase();
    const { source, source_detail, referer } = getTrafficSourceFromRequest(req);
    const userAgent = req.headers["user-agent"] || "";
    const ipAddress =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "";

    // Fetch link details to get required fields
    const { data: link, error: linkError } = await supabase
      .from("links")
      .select("id, short_code, original_url, secondary_url")
      .eq("id", linkId)
      .maybeSingle();

    if (linkError || !link) {
      return res.status(404).json({ error: "Link not found" });
    }

    await insertOutboundEvent(supabase, {
      link_id: linkId,
      short_code: link.short_code,
      stage: "primary",
      destination_url: link.original_url,
      user_agent: userAgent,
      ip_address: ipAddress,
      source,
      source_detail,
      referer,
    });

    return res.json({ success: true });
  } catch (e: any) {
    console.error("Track error:", e);
    return res.status(500).json({ error: e.message });
  }
});

// G. SITEMAP
app.get("/sitemap.xml", async (req, res) => {
  try {
    const supabase = getSupabase();
    const publicBaseUrl =
      getPublicBaseUrl(req) || `${req.protocol}://${req.get("host")}`;

    const { data: links, error } = await supabase
      .from("links")
      .select("short_code, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(5000);

    if (error) throw error;

    const urls = [
      `  <url>
    <loc>${escapeHtml(`${publicBaseUrl}/`)}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`,
      ...(links || [])
        .filter((link: any) => link?.short_code)
        .map((link: any) => {
          const lastModified = link.updated_at || link.created_at;
          const lastmod = lastModified
            ? `\n    <lastmod>${new Date(lastModified).toISOString()}</lastmod>`
            : "";
          return `  <url>
    <loc>${escapeHtml(`${publicBaseUrl}/s/${encodeURIComponent(link.short_code)}`)}</loc>${lastmod}
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
        }),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    return res.send(xml);
  } catch (e: any) {
    console.error("Sitemap error:", e);
    return res.status(500).send("Error generating sitemap");
  }
});

// H. STATIC FILES & SPA FALLBACK
app.use(express.static(path.join(__dirname, "../public"), { etag: false }));
app.use(express.static(path.join(__dirname, "../dist"), { etag: false }));

app.get("*", (req, res) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/s/")) {
    return res.status(404).json({ error: "Not found" });
  }
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

export default app;
