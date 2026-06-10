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
import * as securityService from "./services/securityService.js";

// Utils
import {
  getPublicBaseUrl,
  escapeHtml,
  getTrafficSourceFromRequest,
  getClientIp,
} from "./utils/helpers.js";
import {
  renderPublicLinkNotFoundPage,
  shouldReturnPublicLinkNotFound,
} from "./utils/publicFallback.js";
import {
  buildPrettyLinkUrl,
  isCandidatePublicSlugPath,
  normalizeLinkSlug,
} from "./utils/linkPaths.js";
import { isMetaPreviewBot, isSocialPreviewBot } from "./utils/socialPreview.js";
import {
  insertClickWithTracking,
  insertOutboundEvent,
} from "./utils/clickTracking.js";
import { handleClickNotification } from "./services/notificationService.js";
import {
  getLinkDeepLinkProfiles,
  resolveDeepLinkUrl,
  shouldBypassLandingForMobileDeepLink,
  shouldBypassPublicLandingForMobileDeepLink,
} from "./services/deepLinkService.js";
import { renderLinkLandingPage } from "./templates/landingPage.js";
import { renderChoiceLandingPage } from "./templates/landingPageChoice.js";
import {
  renderDirectBridgePage,
  buildTikTokAppScheme,
  isTikTokHostname,
} from "./templates/directBridgePage.js";
import { isBlockedInAppBrowser } from "./services/deepLinkService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PUBLIC_MARKETING_PATHS = [
  "/",
  "/discover/pricing",
  "/discover/install",
  "/discover/faq",
  "/discover/landing-page-shopee",
  "/discover/landing-page-tiktok",
  "/discover/rut-gon-link-shopee",
  "/discover/rut-gon-link-tiktok",
  "/discover/tracking-click-affiliate",
  "/discover/link-tiktok-affiliate",
  "/discover/cach-rut-gon-link-shopee",
  "/discover/cach-rut-gon-link-tiktok",
  "/discover/cach-theo-doi-click-affiliate",
] as const;
// Thêm hàm bổ trợ kiểm tra In-App Browser Facebook / Zalo ở đầu file

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
): {
  effectiveLink: PublicLinkRecord & Record<string, any>;
  abVariant: "a" | "b";
} => {
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

const trackDirectPublicOpen = async (
  supabase: ReturnType<typeof getSupabase>,
  req: Request,
  link: PublicLinkRecord,
  effectiveLink: PublicLinkRecord,
  userAgent: string,
  abVariant: "a" | "b",
) => {
  const { source, source_detail, referer } = getTrafficSourceFromRequest(req);
  const ipAddress = getClientIp(req);

  let clickInserted = false;
  try {
    clickInserted = await insertClickWithTracking(supabase, {
      link_id: link.id,
      workspace_id: link.workspace_id || effectiveLink.workspace_id || null,
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
      workspace_id: link.workspace_id || effectiveLink.workspace_id || null,
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
};

const scheduleDirectPublicOpenTracking = (
  supabase: ReturnType<typeof getSupabase>,
  req: Request,
  link: PublicLinkRecord,
  effectiveLink: PublicLinkRecord,
  userAgent: string,
  abVariant: "a" | "b",
) => {
  setImmediate(() => {
    void trackDirectPublicOpen(
      supabase,
      req,
      link,
      effectiveLink,
      userAgent,
      abVariant,
    ).catch((trackError) => {
      console.error("Direct public open tracking failed:", trackError);
    });
  });
};

const fetchEffectiveTrackedLink = async (
  supabase: ReturnType<typeof getSupabase>,
  req: Request,
  linkId: string,
) => {
  const userAgent = req.headers["user-agent"] || "";
  const { data: link, error: linkError } = await supabase
    .from("links")
    .select(
      "id, user_id, workspace_id, short_code, custom_title, original_url, secondary_url, ab_test_enabled, ab_variant_b_title, ab_variant_b_description, ab_variant_b_image_url, ab_variant_b_video_url, ab_variant_b_original_url, ab_variant_b_secondary_url",
    )
    .eq("id", linkId)
    .maybeSingle();

  if (linkError || !link) {
    return { link: null, effectiveLink: null, userAgent };
  }

  const { effectiveLink } = resolveEffectiveAbLink(
    link,
    req,
    typeof userAgent === "string" ? userAgent : "",
  );

  return { link, effectiveLink, userAgent };
};

const trackPrimaryOpen = async (
  supabase: ReturnType<typeof getSupabase>,
  req: Request,
  link: Record<string, any>,
  effectiveLink: Record<string, any>,
  userAgent: string,
) => {
  const { source, source_detail, referer } = getTrafficSourceFromRequest(req);
  const ipAddress = getClientIp(req);

  let clickInserted = false;
  try {
    clickInserted = await insertClickWithTracking(supabase, {
      link_id: effectiveLink.id,
      workspace_id: link.workspace_id || effectiveLink.workspace_id || null,
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
      workspace_id: link.workspace_id || effectiveLink.workspace_id || null,
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

  return { clickInserted, outboundInserted };
};

const trackSecondaryOpen = async (
  supabase: ReturnType<typeof getSupabase>,
  req: Request,
  effectiveLink: Record<string, any>,
) => {
  const { source, source_detail, referer } = getTrafficSourceFromRequest(req);
  const userAgent = req.headers["user-agent"] || "";
  const ipAddress = getClientIp(req);

  try {
    await insertOutboundEvent(supabase, {
      link_id: effectiveLink.id,
      short_code: effectiveLink.short_code,
      workspace_id: effectiveLink.workspace_id || null,
      stage: "secondary",
      destination_url: effectiveLink.secondary_url,
      user_agent: typeof userAgent === "string" ? userAgent : null,
      ip_address: ipAddress,
      source,
      source_detail,
      referer,
    });
  } catch (trackError) {
    console.error("Secondary outbound tracking error:", trackError);
  }
};

const resolveTrackedRedirectUrl = (
  destinationUrl: string,
  userAgent: string,
  profiles: Awaited<ReturnType<typeof getLinkDeepLinkProfiles>>,
) => resolveDeepLinkUrl(destinationUrl, userAgent, profiles);

const shouldReturnInspectResponse = (req: Request) => {
  const inspectValue = req.query.inspect ?? req.query.debug;
  return inspectValue === "1" || inspectValue === "true";
};

const shouldReturnInspectHtmlResponse = (req: Request) => {
  const inspectValue = req.query.inspect ?? req.query.debug;
  return inspectValue === "html" || inspectValue === "page";
};

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value.trim());

const renderInspectDebugPage = (
  title: string,
  data: Record<string, unknown>,
) => {
  const json = JSON.stringify(data, null, 2);
  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      body {
        margin: 0;
        padding: 1rem;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        background: #0f172a;
        color: #e2e8f0;
      }
      .card {
        max-width: 960px;
        margin: 0 auto;
        background: #111827;
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 16px;
        padding: 1rem;
      }
      h1 {
        font-size: 1rem;
        margin: 0 0 0.75rem;
      }
      p {
        margin: 0 0 1rem;
        color: #94a3b8;
        line-height: 1.5;
        font-size: 0.9rem;
      }
      pre {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
        font-size: 0.82rem;
        line-height: 1.5;
        color: #dbeafe;
      }
      code {
        color: #f8fafc;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${escapeHtml(title)}</h1>
      <p>Dùng trang này để kiểm tra nhanh response của server trên mobile/browser. Nếu bạn thấy popup trước khi trang này xuất hiện thì request đang bị browser/app chặn ngoài server.</p>
      <pre>${escapeHtml(json)}</pre>
    </div>
  </body>
</html>`;
};

const renderDeepLinkLaunchPage = (destinationUrl: string, title: string) => {
  const escapedDestinationUrl = escapeHtml(destinationUrl);
  const launchScriptUrl = JSON.stringify(destinationUrl);
  const safeTitle = escapeHtml(title || "HotsNew Click");
  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>${safeTitle}</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #020617;
        --panel: rgba(15, 23, 42, 0.96);
        --border: rgba(148, 163, 184, 0.18);
        --text: #f8fafc;
        --muted: rgba(226, 232, 240, 0.72);
        --accent: linear-gradient(135deg, #22d3ee, #3b82f6);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 1rem;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        background:
          radial-gradient(circle at 18% 12%, rgba(34, 211, 238, 0.18), transparent 24%),
          radial-gradient(circle at 78% 18%, rgba(59, 130, 246, 0.22), transparent 22%),
          linear-gradient(135deg, #020617 0%, #0f172a 56%, #111827 100%);
        color: var(--text);
      }
      .card {
        width: min(92vw, 32rem);
        padding: 1.5rem;
        border-radius: 1.25rem;
        border: 1px solid var(--border);
        background: var(--panel);
        box-shadow: 0 1.5rem 4rem rgba(0, 0, 0, 0.4);
        text-align: center;
      }
      .title {
        margin: 0 0 0.75rem;
        font-size: 1.15rem;
        line-height: 1.35;
      }
      .desc {
        margin: 0;
        font-size: 0.92rem;
        line-height: 1.55;
        color: var(--muted);
      }
      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-top: 1rem;
        padding: 0.8rem 1.2rem;
        border-radius: 999px;
        border: 0;
        text-decoration: none;
        color: white;
        background: var(--accent);
        font-weight: 800;
        letter-spacing: 0.01em;
      }
      .hint {
        margin-top: 0.85rem;
        font-size: 0.78rem;
        color: rgba(226, 232, 240, 0.55);
      }
    </style>
  </head>
  <body>
    <main class="card">
      <h1 class="title">Đang mở ứng dụng</h1>
      <p class="desc">
        Nếu ứng dụng không tự mở, bấm nút bên dưới để chuyển tiếp thủ công.
      </p>
      <a class="button" href="${escapedDestinationUrl}">Mở ứng dụng</a>
      <div class="hint">Bắt đầu chuyển ngay...</div>
    </main>
    <script>
      (() => {
        const launchUrl = ${launchScriptUrl};
        try {
          window.location.replace(launchUrl);
        } catch (error) {
          window.location.href = launchUrl;
        }
      })();
    </script>
  </body>
</html>`;
};

const sendPrimaryRedirectResponse = (
  res: Response,
  redirectUrl: string,
  title: string,
) => {
  if (!isHttpUrl(redirectUrl)) {
    return res
      .status(200)
      .type("html")
      .send(renderDeepLinkLaunchPage(redirectUrl, title));
  }

  return res.status(302).setHeader("Location", redirectUrl).end();
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

app.get("/api/v1/debug/browser-probe", async (req, res) => {
  try {
    const supabase = getSupabase();
    const ipAddress = getClientIp(req);
    const userAgent =
      typeof req.headers["user-agent"] === "string"
        ? req.headers["user-agent"]
        : "";
    const tag =
      typeof req.query.tag === "string" ? req.query.tag : "browser-probe";
    const mode = typeof req.query.mode === "string" ? req.query.mode : "html";
    const payload = {
      ok: false,
      kind: "debug_probe",
      tag,
      mode,
      userAgent,
      path: req.originalUrl || req.path,
    };

    await securityService.logAccessEvent(supabase, {
      ip_address: ipAddress,
      method: req.method,
      path: req.originalUrl || req.path,
      status_code: 500,
      user_agent: userAgent || null,
      referer:
        typeof req.headers.referer === "string" ? req.headers.referer : null,
      blocked: false,
      block_reason: null,
      metadata: {
        kind: "debug_probe",
        tag,
        mode,
        query: req.query,
      },
    });

    if (mode === "json") {
      return res.status(500).json(payload);
    }

    return res.status(500).type("html").send(`<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Debug probe</title>
    <style>
      body {
        margin: 0;
        padding: 24px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        background: #111827;
        color: #e5e7eb;
      }
      .box {
        max-width: 760px;
        margin: 0 auto;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 16px;
        padding: 20px;
        background: #0f172a;
      }
      h1 {
        margin: 0 0 12px;
        font-size: 18px;
      }
      pre {
        white-space: pre-wrap;
        word-break: break-word;
        color: #bfdbfe;
      }
    </style>
  </head>
  <body>
    <div class="box">
      <h1>Debug probe reached server</h1>
      <pre>${escapeHtml(JSON.stringify(payload, null, 2))}</pre>
    </div>
  </body>
</html>`);
  } catch (error: any) {
    console.error("[DEBUG PROBE ERROR]", error?.message || error);
    return res.status(500).json({
      ok: false,
      kind: "debug_probe_error",
      message: error?.message || "Unknown error",
    });
  }
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
    "User-agent: meta-externalagent",
    "Allow: /",
    "",
    "User-agent: meta-externalfetcher",
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
        "id, user_id, short_code, slug, original_url, custom_domain, tags, custom_title, custom_description, custom_image_url, video_url, secondary_url, redirect_delay_ms, expires_at, ab_test_enabled, ab_variant_b_title, ab_variant_b_description, ab_variant_b_image_url, ab_variant_b_video_url, ab_variant_b_original_url, ab_variant_b_secondary_url",
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
    const deepLinkProfiles = await getLinkDeepLinkProfiles(supabase);
    const userAgentString = typeof userAgent === "string" ? userAgent : "";
    const primaryRedirectUrl = resolveTrackedRedirectUrl(
      effectiveLink.original_url,
      userAgentString,
      deepLinkProfiles,
    );
    const secondaryRedirectUrl = effectiveLink.secondary_url?.trim()
      ? resolveTrackedRedirectUrl(
          effectiveLink.secondary_url,
          userAgentString,
          deepLinkProfiles,
        )
      : "";
    const canonicalUrl = buildPrettyLinkUrl(publicBaseUrl, {
      slug: effectiveLink.slug,
      shortCode: effectiveLink.short_code,
      title: effectiveLink.custom_title,
    });
    const clickTrackingUrl = `${publicBaseUrl}/api/v1/links/${link.id}/track`;

    if (shouldReturnInspectResponse(req)) {
      const inspectData = {
        route: "s-choice",
        shortCode,
        userAgent: userAgentString,
        isPreviewBot,
        hasVideoLanding: Boolean(effectiveLink.video_url?.trim()),
        shouldRenderPreviewPage: false,
        shouldBypassLandingForMobileDeepLink:
          shouldBypassLandingForMobileDeepLink(
            effectiveLink.original_url,
            userAgentString,
            deepLinkProfiles,
          ),
        originalUrl: effectiveLink.original_url,
        primaryRedirectUrl,
        secondaryRedirectUrl,
        canonicalUrl,
      };

      if (shouldReturnInspectHtmlResponse(req)) {
        return res
          .status(200)
          .type("html")
          .send(renderInspectDebugPage("Inspect: s-choice", inspectData));
      }

      return res.json(inspectData);
    }

    if (
      !effectiveLink.video_url?.trim() &&
      shouldBypassLandingForMobileDeepLink(
        effectiveLink.original_url,
        userAgentString,
        deepLinkProfiles,
      )
    ) {
      await trackDirectPublicOpen(
        supabase,
        req,
        link,
        effectiveLink,
        userAgentString,
        "a",
      );
      return sendPrimaryRedirectResponse(
        res,
        primaryRedirectUrl,
        effectiveLink.custom_title?.trim() || "HotsNew Click",
      );
    }

    if (!effectiveLink.video_url?.trim()) {
      return sendPrimaryRedirectResponse(
        res,
        primaryRedirectUrl,
        effectiveLink.custom_title?.trim() || "HotsNew Click",
      );
    }

    return res
      .status(200)
      .type("html")
      .send(
        renderChoiceLandingPage(effectiveLink, canonicalUrl, clickTrackingUrl, {
          experimental: true,
          preferImageCard: isMetaPreviewBot(userAgentString),
          primaryRedirectUrl,
          secondaryRedirectUrl,
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
        "id, user_id, short_code, slug, original_url, custom_domain, tags, custom_title, custom_description, custom_image_url, video_url, secondary_url, redirect_delay_ms, expires_at, ab_test_enabled, ab_variant_b_title, ab_variant_b_description, ab_variant_b_image_url, ab_variant_b_video_url, ab_variant_b_original_url, ab_variant_b_secondary_url",
      )
      .eq(lookupField, shortCode)
      .maybeSingle();

    if (error) throw error;

    if (!link) {
      return res.status(404).send("Link not found");
    }

    // Check if link has expired
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      // ... GIỮ NGUYÊN ĐOẠN ĐIỀU HƯỚNG GIAO DIỆN HẾT HẠN CỦA BẠN ...
      return res.status(410).send(`...HTML Hết hạn...`);
    }

    const userAgent = req.headers["user-agent"] || "";
    const userAgentString = typeof userAgent === "string" ? userAgent : "";
    const isPreviewBot = isSocialPreviewBot(userAgentString);

    const resolvedAbLink = resolveEffectiveAbLink(link, req, userAgentString);
    let effectiveLink = resolvedAbLink.effectiveLink;
    let abVariant: "a" | "b" = resolvedAbLink.abVariant;

    if (link.ab_test_enabled && !isPreviewBot) {
      // ... GIỮ NGUYÊN ĐOẠN XỬ LÝ SET-COOKIE AB TEST CỦA BẠN ...
      const cookieMap = parseCookieHeader(
        typeof req.headers.cookie === "string" ? req.headers.cookie : undefined,
      );
      const abCookieName = getAbCookieName(link.id);
      if (!cookieMap.has(abCookieName)) {
        const nextAbVariant: "a" | "b" = Math.random() < 0.5 ? "a" : "b";
        abVariant = nextAbVariant;
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
    // Thay bằng: để directBridgePage xử lý tất cả UA

    // LUỒNG TÍNH TOÁN REDIRECT THÔNG THƯỜNG CỦA BẠN (GIỮ NGUYÊN)
    const hasVideoLanding = Boolean(effectiveLink.video_url?.trim());
    const isPreviewRequest = isPreviewBot || shouldIgnoreTrackingRequest(req);
    const shouldRenderPreviewPage = hasVideoLanding || isPreviewRequest;
    const deepLinkProfiles = await getLinkDeepLinkProfiles(supabase);

    const primaryRedirectUrl = resolveTrackedRedirectUrl(
      effectiveLink.original_url,
      userAgentString,
      deepLinkProfiles,
    );
    const secondaryRedirectUrl = effectiveLink.secondary_url?.trim()
      ? resolveTrackedRedirectUrl(
          effectiveLink.secondary_url,
          userAgentString,
          deepLinkProfiles,
        )
      : "";
    const shouldBypassMobileLanding =
      shouldBypassPublicLandingForMobileDeepLink(
        effectiveLink.original_url,
        userAgentString,
        deepLinkProfiles,
        hasVideoLanding,
        isPreviewRequest,
      );

    const publicBaseUrl =
      getPublicBaseUrl(req) || `${req.protocol}://${req.get("host")}`;
    const canonicalUrl = buildPrettyLinkUrl(publicBaseUrl, {
      slug: effectiveLink.slug,
      shortCode: effectiveLink.short_code,
      title: effectiveLink.custom_title,
    });
    const clickTrackingUrl = `${publicBaseUrl}/api/v1/links/${link.id}/track`;

    if (shouldReturnInspectResponse(req)) {
      const inspectData = {
        route: "public-slug",
        userAgent: userAgentString,
        isPreviewBot,
        hasVideoLanding,
        shouldBypassMobileLanding,
        shouldRenderPreviewPage,
        originalUrl: effectiveLink.original_url,
        primaryRedirectUrl,
        secondaryRedirectUrl,
        canonicalUrl,
        deepLinkProfiles,
      };

      if (shouldReturnInspectHtmlResponse(req)) {
        return res
          .status(200)
          .type("html")
          .send(renderInspectDebugPage("Inspect: public-slug", inspectData));
      }

      return res.json(inspectData);
    }

    if (shouldBypassMobileLanding) {
      scheduleDirectPublicOpenTracking(
        supabase,
        req,
        link,
        effectiveLink,
        userAgentString,
        abVariant,
      );
      return res
        .status(301)
        .setHeader("Location", `https://vn-express.cloud/r/${link.short_code}`)
        .end();
    }

    if (shouldRenderPreviewPage && !shouldBypassMobileLanding) {
      return res
        .status(200)
        .type("html")
        .send(
          renderChoiceLandingPage(
            effectiveLink,
            canonicalUrl,
            clickTrackingUrl,
            {
              experimental: false,
              preferImageCard: isMetaPreviewBot(userAgentString),
              primaryRedirectUrl,
              secondaryRedirectUrl,
            },
          ),
        );
    }

    if (shouldIgnoreTrackingRequest(req)) {
      return sendPrimaryRedirectResponse(
        res,

        primaryRedirectUrl,
        effectiveLink.custom_title?.trim() || "HotsNew Click",
      );
    }

    scheduleDirectPublicOpenTracking(
      supabase,
      req,
      link,
      effectiveLink,
      typeof userAgent === "string" ? userAgent : "",
      abVariant,
    );
    return res
      .status(200)
      .type("html")
      .send(
        renderDirectBridgePage(effectiveLink, canonicalUrl, {
          primaryRedirectUrl,
        }),
      );
  } catch (e: any) {
    console.error("[REDIRECT ERROR]", {
      shortCode,
      message: e.message,
      details: e.details,
      hint: e.hint,
      code: e.code,
      stack: e.stack?.slice(0, 500),
    });
    return res.status(500).send("Server error: " + (e.message || "Unknown"));
  }
};

app.get("/r/:shortCode", async (req, res) => {
  const supabase = getSupabase();
  const { data: link } = await supabase
    .from("links")
    .select("original_url")
    .eq("short_code", req.params.shortCode)
    .maybeSingle();

  if (!link) return res.status(404).end();

  return res
    .status(200)
    .type("html")
    .send(
      `<!DOCTYPE html><html><head>` +
        `<meta content="video.other" property="og:type" />` +
        `<script>window.location.replace(${JSON.stringify(link.original_url)})</script>` +
        `</head></html>`,
    );
});

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
app.get("/api/v1/links/:linkId/open", async (req, res) => {
  try {
    const { linkId } = req.params;
    const stage = req.query.stage === "secondary" ? "secondary" : "primary";

    if (!linkId) {
      return res.status(400).send("Missing linkId");
    }

    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");

    const supabase = getSupabase();
    const { link, effectiveLink, userAgent } = await fetchEffectiveTrackedLink(
      supabase,
      req,
      linkId,
    );

    if (!link || !effectiveLink) {
      return res.status(404).send("Link not found");
    }

    const destinationUrl =
      stage === "secondary"
        ? effectiveLink.secondary_url
        : effectiveLink.original_url;

    if (!destinationUrl) {
      return res.status(400).send("Missing destination URL");
    }
    const deepLinkProfiles = await getLinkDeepLinkProfiles(supabase);
    const resolvedDestinationUrl = resolveTrackedRedirectUrl(
      destinationUrl,
      typeof userAgent === "string" ? userAgent : "",
      deepLinkProfiles,
    );

    if (shouldIgnoreTrackingRequest(req)) {
      return res.redirect(resolvedDestinationUrl);
    }

    if (stage === "secondary") {
      await trackSecondaryOpen(supabase, req, effectiveLink);
    } else {
      await trackPrimaryOpen(
        supabase,
        req,
        link,
        effectiveLink,
        typeof userAgent === "string" ? userAgent : "",
      );
    }

    return res.redirect(resolvedDestinationUrl);
  } catch (e: any) {
    console.error("Open redirect error:", e);
    return res.status(500).send("Server error: " + (e.message || "Unknown"));
  }
});

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

    const { data: link, error: linkError } = await supabase
      .from("links")
      .select("id, workspace_id")
      .eq("id", linkId)
      .maybeSingle();

    if (linkError || !link) {
      return res.status(404).json({ error: "Link not found" });
    }

    const inserted = await insertClickWithTracking(supabase, {
      link_id: linkId,
      workspace_id: link.workspace_id || null,
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
    const { link, effectiveLink, userAgent } = await fetchEffectiveTrackedLink(
      supabase,
      req,
      linkId,
    );

    if (!link || !effectiveLink) {
      return res.status(404).json({ error: "Link not found" });
    }
    const { outboundInserted } = await trackPrimaryOpen(
      supabase,
      req,
      link,
      effectiveLink,
      typeof userAgent === "string" ? userAgent : "",
    );

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
    const stage = req.body?.stage === "secondary" ? "secondary" : "primary";
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
        "id, workspace_id, short_code, original_url, secondary_url, ab_test_enabled, ab_variant_b_title, ab_variant_b_description, ab_variant_b_image_url, ab_variant_b_video_url, ab_variant_b_original_url, ab_variant_b_secondary_url",
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
      workspace_id: link.workspace_id || effectiveLink.workspace_id || null,
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
    const publicBaseUrl =
      getPublicBaseUrl(req) || `${req.protocol}://${req.get("host")}`;
    let links: any[] = [];

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("links")
        .select("short_code, slug, custom_title, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(5000);

      if (error) {
        console.error("Sitemap link query warning:", error);
      } else {
        links = data || [];
      }
    } catch (dbError) {
      console.error(
        "Sitemap link source unavailable, serving static sitemap:",
        dbError,
      );
    }

    const urls = [
      ...PUBLIC_MARKETING_PATHS.map(
        (routePath, index) => `  <url>
    <loc>${escapeHtml(
      `${publicBaseUrl.replace(/\/+$/, "")}${routePath === "/" ? "/" : routePath}`,
    )}</loc>
    <changefreq>${routePath === "/" ? "daily" : "weekly"}</changefreq>
    <priority>${index === 0 ? "1.0" : "0.9"}</priority>
  </url>`,
      ),
      ...links
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

  if (shouldReturnPublicLinkNotFound(req.path)) {
    return res
      .status(404)
      .type("html")
      .send(renderPublicLinkNotFoundPage(req.path));
  }

  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

// Start server
const validateRequiredEnvVars = () => {
  const requiredVars = [
    "SECURITY_ENCRYPTION_KEY",
    "APP_SECRET",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];

  const encryptionKey =
    process.env.SECURITY_ENCRYPTION_KEY ||
    process.env.APP_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!encryptionKey) {
    console.error("❌ SECURITY_ENCRYPTION_KEY is not configured!");
    console.error(
      "Set one of these environment variables: SECURITY_ENCRYPTION_KEY, APP_SECRET, or SUPABASE_SERVICE_ROLE_KEY",
    );
    console.error(
      "See docs/security-encryption-setup.md for instructions on generating a key.",
    );
    process.exit(1);
  }
};

validateRequiredEnvVars();

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

export default app;
