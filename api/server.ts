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
import { auditAccessLogs, blockBlockedIps } from "./middleware/security.js";

// Routes
import apiRoutes from "./routes/index.js";
import { PublicLinkRecord } from "./types/index.js";

// Utils
import {
  getPublicBaseUrl,
  escapeHtml,
  getTrafficSourceFromRequest,
  getClientIp,
} from "./utils/helpers.js";
import {
  buildPrettyLinkUrl,
  isCandidatePublicSlugPath,
  normalizeLinkSlug,
} from "./utils/linkPaths.js";
import {
  insertClickWithTracking,
  insertOutboundEvent,
} from "./utils/clickTracking.js";
import { handleClickNotification } from "./services/notificationService.js";
import { renderChoiceLandingPage } from "./templates/landingPageChoice.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const isSocialPreviewBot = (userAgent: string) => {
  if (!userAgent) return false;
  return /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|Discordbot|TelegramBot|WhatsApp|SkypeUriPreview|Pinterest|Zalo|Googlebot|bingbot|embedly/i.test(
    userAgent,
  );
};

const parseCookieHeader = (cookieHeader?: string) => {
  const cookieMap = new Map<string, string>();
  if (!cookieHeader) return cookieMap;

  cookieHeader.split(";").forEach((part) => {
    const [rawKey, ...rest] = part.trim().split("=");
    if (!rawKey || !rest.length) return;
    cookieMap.set(rawKey, decodeURIComponent(rest.join("=")));
  });

  return cookieMap;
};

const getAbCookieName = (linkId: string) => `hn_ab_${linkId.slice(0, 8)}`;

const resolveEffectiveAbLink = (
  baseLink: PublicLinkRecord & Record<string, any>,
  req: Request,
  userAgent: string,
) => {
  const isPreviewBot = isSocialPreviewBot(userAgent);
  if (!baseLink.ab_test_enabled || isPreviewBot) {
    return { effectiveLink: baseLink, abVariant: "a" };
  }

  const cookieMap = parseCookieHeader(
    typeof req.headers.cookie === "string" ? req.headers.cookie : undefined,
  );
  const abVariant =
    cookieMap.get(getAbCookieName(baseLink.id)) === "b" ? "b" : "a";

  if (abVariant !== "b") {
    return { effectiveLink: baseLink, abVariant };
  }

  return {
    abVariant,
    effectiveLink: {
      ...baseLink,
      original_url: baseLink.ab_variant_b_original_url || baseLink.original_url,
      secondary_url:
        baseLink.ab_variant_b_secondary_url || baseLink.secondary_url,
      custom_title: baseLink.ab_variant_b_title || baseLink.custom_title,
      custom_description:
        baseLink.ab_variant_b_description || baseLink.custom_description,
      custom_image_url:
        baseLink.ab_variant_b_image_url || baseLink.custom_image_url,
      video_url: baseLink.ab_variant_b_video_url || baseLink.video_url,
    },
  };
};

const shouldIgnoreTrackingRequest = (req: Request) => {
  if (req.method === "HEAD") return true;

  const purpose = String(req.headers.purpose || "").toLowerCase();
  const secPurpose = String(req.headers["sec-purpose"] || "").toLowerCase();
  const xPurpose = String(req.headers["x-purpose"] || "").toLowerCase();
  const xMoz = String(req.headers["x-moz"] || "").toLowerCase();

  return (
    purpose.includes("prefetch") ||
    secPurpose.includes("prefetch") ||
    xPurpose.includes("preview") ||
    xMoz.includes("prefetch")
  );
};

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
app.use(blockBlockedIps);
app.use(auditAccessLogs);

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

app.get("/robots.txt", (req, res) => {
  const publicBaseUrl =
    getPublicBaseUrl(req) || `${req.protocol}://${req.get("host")}`;
  const robotsContent = [
    "User-agent: facebookexternalhit",
    "Allow: /",
    "",
    "User-agent: Facebot",
    "Allow: /",
    "",
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${publicBaseUrl.replace(/\/+$/, "")}/sitemap.xml`,
  ].join("\n");

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  return res.status(200).send(robotsContent);
});

// D. API ROUTES (modular)
app.use(apiRoutes);

// E. SHORT LINK REDIRECTION
app.get("/s-choice/:shortCode", async (req, res) => {
  const { shortCode } = req.params;
  if (!shortCode) {
    return res.status(400).send("Missing short code");
  }

  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");

  try {
    const supabase = getSupabase();
    const { data: link, error } = await supabase
      .from("links")
      .select(
        "id, user_id, short_code, slug, original_url, custom_domain, custom_title, custom_description, custom_image_url, video_url, secondary_url, redirect_delay_ms, expires_at, ab_test_enabled, ab_variant_b_title, ab_variant_b_description, ab_variant_b_image_url, ab_variant_b_video_url, ab_variant_b_original_url, ab_variant_b_secondary_url",
      )
      .eq("short_code", shortCode)
      .maybeSingle();

    if (error) throw error;

    if (!link) {
      return res.status(404).send("Link not found");
    }

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return res.status(410).send("Link expired");
    }

    const userAgent = req.headers["user-agent"] || "";
    const isPreviewBot = isSocialPreviewBot(
      typeof userAgent === "string" ? userAgent : "",
    );
    let { effectiveLink } = resolveEffectiveAbLink(
      link,
      req,
      typeof userAgent === "string" ? userAgent : "",
    );

    if (link.ab_test_enabled && !isPreviewBot) {
      const cookieMap = parseCookieHeader(
        typeof req.headers.cookie === "string" ? req.headers.cookie : undefined,
      );
      const abCookieName = getAbCookieName(link.id);
      if (!cookieMap.has(abCookieName)) {
        const nextAbVariant = Math.random() < 0.5 ? "a" : "b";
        res.append(
          "Set-Cookie",
          `${abCookieName}=${nextAbVariant}; Max-Age=2592000; Path=/; SameSite=Lax`,
        );
        if (nextAbVariant === "b") {
          effectiveLink = {
            ...link,
            original_url: link.ab_variant_b_original_url || link.original_url,
            secondary_url:
              link.ab_variant_b_secondary_url || link.secondary_url,
            custom_title: link.ab_variant_b_title || link.custom_title,
            custom_description:
              link.ab_variant_b_description || link.custom_description,
            custom_image_url:
              link.ab_variant_b_image_url || link.custom_image_url,
            video_url: link.ab_variant_b_video_url || link.video_url,
          } as typeof effectiveLink;
        }
      }
    }

    const publicBaseUrl =
      getPublicBaseUrl(req) || `${req.protocol}://${req.get("host")}`;
    const canonicalUrl = buildPrettyLinkUrl(publicBaseUrl, {
      slug: effectiveLink.slug,
      shortCode: effectiveLink.short_code,
      title: effectiveLink.custom_title,
    });
    const clickTrackingUrl = `${publicBaseUrl}/api/v1/links/${link.id}/track`;

    if (!effectiveLink.video_url?.trim()) {
      return res.redirect(effectiveLink.original_url);
    }

    return res
      .status(200)
      .type("html")
      .send(
        renderChoiceLandingPage(effectiveLink, canonicalUrl, clickTrackingUrl, {
          experimental: true,
        }),
      );
  } catch (e: any) {
    console.error("[CHOICE LANDING ERROR]", {
      shortCode,
      message: e.message,
      details: e.details,
      hint: e.hint,
      code: e.code,
      stack: e.stack?.slice(0, 500),
    });
    return res.status(500).send("Server error: " + (e.message || "Unknown"));
  }
});

const handlePublicShortLinkRequest = async (
  req: Request,
  res: Response,
  shortCode: string,
  lookupField: "short_code" | "slug" = "short_code",
) => {
  if (!shortCode) {
    return res.status(400).send("Missing short code");
  }

  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");

  try {
    const supabase = getSupabase();
    const { data: link, error } = await supabase
      .from("links")
      .select(
        "id, user_id, short_code, slug, original_url, custom_domain, custom_title, custom_description, custom_image_url, video_url, secondary_url, redirect_delay_ms, expires_at, ab_test_enabled, ab_variant_b_title, ab_variant_b_description, ab_variant_b_image_url, ab_variant_b_video_url, ab_variant_b_original_url, ab_variant_b_secondary_url",
      )
      .eq(lookupField, shortCode)
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

    // Store request info for potential tracking (used when user clicks overlay)
    const { source, source_detail, referer } = getTrafficSourceFromRequest(req);
    const userAgent = req.headers["user-agent"] || "";
    const ipAddress = getClientIp(req);
    const isPreviewBot = isSocialPreviewBot(
      typeof userAgent === "string" ? userAgent : "",
    );
    let { effectiveLink, abVariant } = resolveEffectiveAbLink(
      link,
      req,
      typeof userAgent === "string" ? userAgent : "",
    );

    if (link.ab_test_enabled && !isPreviewBot) {
      const cookieMap = parseCookieHeader(
        typeof req.headers.cookie === "string" ? req.headers.cookie : undefined,
      );
      const abCookieName = getAbCookieName(link.id);
      if (!cookieMap.has(abCookieName)) {
        abVariant = Math.random() < 0.5 ? "a" : "b";
        res.append(
          "Set-Cookie",
          `${abCookieName}=${abVariant}; Max-Age=2592000; Path=/; SameSite=Lax`,
        );
        if (abVariant === "b") {
          effectiveLink = {
            ...link,
            original_url: link.ab_variant_b_original_url || link.original_url,
            secondary_url:
              link.ab_variant_b_secondary_url || link.secondary_url,
            custom_title: link.ab_variant_b_title || link.custom_title,
            custom_description:
              link.ab_variant_b_description || link.custom_description,
            custom_image_url:
              link.ab_variant_b_image_url || link.custom_image_url,
            video_url: link.ab_variant_b_video_url || link.video_url,
          } as typeof effectiveLink;
        }
      }
    }

    const hasVideoLanding = Boolean(effectiveLink.video_url?.trim());
    const isPreviewRequest =
      isPreviewBot || shouldIgnoreTrackingRequest(req);
    const shouldRenderPreviewPage = hasVideoLanding || isPreviewRequest;

    if (shouldRenderPreviewPage) {
      const publicBaseUrl =
        getPublicBaseUrl(req) || `${req.protocol}://${req.get("host")}`;
      const canonicalUrl = buildPrettyLinkUrl(publicBaseUrl, {
        slug: effectiveLink.slug,
        shortCode: effectiveLink.short_code,
        title: effectiveLink.custom_title,
      });
      const clickTrackingUrl = `${publicBaseUrl}/api/v1/links/${link.id}/track`;

      return res
        .status(200)
        .type("html")
        .send(
          renderChoiceLandingPage(effectiveLink, canonicalUrl, clickTrackingUrl, {
            experimental: false,
          }),
        );
    }

    if (shouldIgnoreTrackingRequest(req)) {
      return res.redirect(effectiveLink.original_url);
    }

    let clickInserted = false;
    try {
      clickInserted = await insertClickWithTracking(supabase, {
        link_id: link.id,
        user_agent: userAgent,
        ip_address: ipAddress,
        source,
        source_detail,
        referer,
      });
    } catch (trackError) {
      console.error("Direct click tracking error:", trackError);
    }

    let outboundInserted = false;
    try {
      outboundInserted = await insertOutboundEvent(supabase, {
        link_id: link.id,
        short_code: effectiveLink.short_code,
        stage: "primary",
        destination_url: effectiveLink.original_url,
        user_agent: typeof userAgent === "string" ? userAgent : null,
        ip_address: ipAddress,
        source,
        source_detail,
        referer,
      });
    } catch (trackError) {
      console.error("Direct outbound tracking error:", trackError);
    }

    if (outboundInserted) {
      try {
        await supabase.rpc("increment_link_clicks", { link_id: link.id });
      } catch (rpcError: any) {
        console.error(
          "Direct increment clicks failed:",
          rpcError?.message || rpcError,
        );
      }
    }

    if (link.user_id && (clickInserted || outboundInserted)) {
      try {
        handleClickNotification(
          supabase,
          link.user_id,
          link.id,
          link.short_code,
          {
            source:
              abVariant === "b"
                ? `${source || "direct"}:ab-b`
                : source || "direct",
            created_at: new Date().toISOString(),
          },
          {
            linkTitle: effectiveLink.custom_title || null,
          },
        );
      } catch (notifyError) {
        console.error("Direct notification error:", notifyError);
      }
    }

    return res.redirect(effectiveLink.original_url);
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
};

app.get("/:slug", async (req, res, next) => {
  const slugParam =
    typeof req.params.slug === "string" ? req.params.slug.trim() : "";

  if (!isCandidatePublicSlugPath(req.path) || !slugParam) {
    return next();
  }

  const normalizedSlug = normalizeLinkSlug(slugParam);
  const supabase = getSupabase();
  const { data: existingLink, error } = await supabase
    .from("links")
    .select("id")
    .eq("slug", normalizedSlug)
    .maybeSingle();

  if (error) {
    console.error("[SLUG LOOKUP ERROR]", error);
    return next();
  }

  if (!existingLink) {
    return next();
  }

  return handlePublicShortLinkRequest(req, res, normalizedSlug, "slug");
});

app.get("/s/:shortCode", async (req, res) => {
  return handlePublicShortLinkRequest(req, res, req.params.shortCode);
});

// F. OUTBOUND TRACKING
app.post("/api/v1/links/:linkId/track-preview-click", async (req, res) => {
  try {
    const { linkId } = req.params;
    if (!linkId) {
      return res.status(400).json({ error: "Missing linkId" });
    }
    if (shouldIgnoreTrackingRequest(req)) {
      return res.json({ success: true, ignored: true });
    }

    const supabase = getSupabase();
    const { source, source_detail, referer } = getTrafficSourceFromRequest(req);
    const userAgent = req.headers["user-agent"] || "";
    const ipAddress = getClientIp(req);

    const inserted = await insertClickWithTracking(supabase, {
      link_id: linkId,
      user_agent: userAgent,
      ip_address: ipAddress,
      source,
      source_detail,
      referer,
    });

    return res.json({ success: true, counted: inserted, deduped: !inserted });
  } catch (e: any) {
    console.error("Track preview click error:", e);
    return res.status(500).json({ error: e.message });
  }
});

app.post("/api/v1/links/:linkId/track", async (req, res) => {
  try {
    const { linkId } = req.params;
    if (!linkId) {
      return res.status(400).json({ error: "Missing linkId" });
    }
    if (shouldIgnoreTrackingRequest(req)) {
      return res.json({ success: true, ignored: true });
    }

    const supabase = getSupabase();
    const { source, source_detail, referer } = getTrafficSourceFromRequest(req);
    const userAgent = req.headers["user-agent"] || "";
    const ipAddress = getClientIp(req);

    // Fetch link details to get required fields
    const { data: link, error: linkError } = await supabase
      .from("links")
      .select(
        "id, user_id, short_code, custom_title, original_url, secondary_url, ab_test_enabled, ab_variant_b_title, ab_variant_b_description, ab_variant_b_image_url, ab_variant_b_video_url, ab_variant_b_original_url, ab_variant_b_secondary_url",
      )
      .eq("id", linkId)
      .maybeSingle();

    if (linkError || !link) {
      return res.status(404).json({ error: "Link not found" });
    }
    const { effectiveLink } = resolveEffectiveAbLink(
      link,
      req,
      typeof userAgent === "string" ? userAgent : "",
    );

    // Record real click when user clicks overlay (not just page load)
    let clickInserted = false;
    try {
      clickInserted = await insertClickWithTracking(supabase, {
        link_id: effectiveLink.id,
        user_agent: userAgent,
        ip_address: ipAddress,
        source,
        source_detail,
        referer,
      });
    } catch (trackError) {
      console.error("Click tracking error:", trackError);
    }

    let outboundInserted = false;
    try {
      outboundInserted = await insertOutboundEvent(supabase, {
        link_id: effectiveLink.id,
        short_code: effectiveLink.short_code,
        stage: "primary",
        destination_url: effectiveLink.original_url,
        user_agent: userAgent,
        ip_address: ipAddress,
        source,
        source_detail,
        referer,
      });
    } catch (trackError) {
      console.error("Outbound tracking error:", trackError);
    }

    if (outboundInserted) {
      try {
        await supabase.rpc("increment_link_clicks", { link_id: link.id });
      } catch (e: any) {
        console.error("Failed to increment clicks:", e.message);
      }
    }

    // Send notification (fire and forget)
    if (link.user_id && (clickInserted || outboundInserted)) {
      try {
        const clickData = {
          source: source || "direct",
          created_at: new Date().toISOString(),
        };
        handleClickNotification(
          supabase,
          link.user_id,
          effectiveLink.id,
          effectiveLink.short_code,
          clickData,
          {
            linkTitle: effectiveLink.custom_title || null,
          },
        );
      } catch (notifyError) {
        console.error("Notification error:", notifyError);
      }
    }

    return res.json({
      success: true,
      counted: outboundInserted,
      deduped: !outboundInserted,
    });
  } catch (e: any) {
    console.error("Track error:", e);
    return res.status(500).json({ error: e.message });
  }
});

app.post("/api/v1/links/:linkId/track-outbound", async (req, res) => {
  try {
    const { linkId } = req.params;
    const stage =
      req.body?.stage === "secondary" ? "secondary" : "primary";
    if (!linkId) {
      return res.status(400).json({ error: "Missing linkId" });
    }
    if (shouldIgnoreTrackingRequest(req)) {
      return res.json({ success: true, ignored: true });
    }

    const supabase = getSupabase();
    const { source, source_detail, referer } = getTrafficSourceFromRequest(req);
    const userAgent = req.headers["user-agent"] || "";
    const ipAddress = getClientIp(req);

    const { data: link, error: linkError } = await supabase
      .from("links")
      .select(
        "id, short_code, original_url, secondary_url, ab_test_enabled, ab_variant_b_title, ab_variant_b_description, ab_variant_b_image_url, ab_variant_b_video_url, ab_variant_b_original_url, ab_variant_b_secondary_url",
      )
      .eq("id", linkId)
      .maybeSingle();

    if (linkError || !link) {
      return res.status(404).json({ error: "Link not found" });
    }
    const { effectiveLink } = resolveEffectiveAbLink(
      link,
      req,
      typeof userAgent === "string" ? userAgent : "",
    );

    const destinationUrl =
      stage === "secondary"
        ? effectiveLink.secondary_url
        : effectiveLink.original_url;

    if (!destinationUrl) {
      return res.status(400).json({ error: "Missing destination URL" });
    }

    const inserted = await insertOutboundEvent(supabase, {
      link_id: effectiveLink.id,
      short_code: effectiveLink.short_code,
      stage,
      destination_url: destinationUrl,
      user_agent: typeof userAgent === "string" ? userAgent : null,
      ip_address: ipAddress,
      source,
      source_detail,
      referer,
    });

    return res.json({ success: true, counted: inserted, deduped: !inserted });
  } catch (e: any) {
    console.error("Track outbound error:", e);
    return res.status(500).json({ error: e.message });
  }
});

app.post("/api/v1/links/:linkId/client-debug", async (req, res) => {
  try {
    const { linkId } = req.params;
    const payload = {
      linkId,
      event: req.body?.event || "unknown",
      detail: req.body?.detail || null,
      ua: req.headers["user-agent"] || "",
      at: new Date().toISOString(),
    };

    console.log("[LANDING DEBUG]", JSON.stringify(payload));
    return res.json({ success: true });
  } catch (e: any) {
    console.error("Landing debug error:", e);
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
      .select("short_code, slug, custom_title, created_at, updated_at")
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
    <loc>${escapeHtml(
      buildPrettyLinkUrl(publicBaseUrl, {
        slug: link.slug || undefined,
        shortCode: link.short_code,
        title: link.custom_title || undefined,
      }),
    )}</loc>${lastmod}
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
  if (
    req.path.startsWith("/api/") ||
    req.path.startsWith("/s/") ||
    req.path.startsWith("/s-choice/")
  ) {
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
