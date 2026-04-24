import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cors from "cors";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { createClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";

console.log("🏁 SERVER.TS LOADING...");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;

// 1. Cloudinary Config - Safe Wrap
try {
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log("✅ Cloudinary Configured");
  } else {
    console.warn("⚠️ Cloudinary Config Missing");
  }
} catch (err) {
  console.error("❌ Cloudinary config error:", err);
}

// 2. Supabase Admin - Lazy & Safe initialization
let _supabaseClient: any = null;
const getSupabase = () => {
  if (!_supabaseClient) {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
      "";

    if (!url || !key) {
      console.error("❌ Supabase Env Missing");
      throw new Error(
        `Supabase configuration missing on server (${!url ? "URL " : ""}${!key ? "KEY" : ""})`,
      );
    }

    try {
      _supabaseClient = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      console.log("✅ Supabase Client Initialized");
    } catch (err) {
      console.error("❌ Supabase Init Fail:", err);
      throw err;
    }
  }
  return _supabaseClient;
};

// 3. Multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

const app = express();
const CLOUDINARY_UPLOAD_FOLDER =
  process.env.CLOUDINARY_SHORTLINK_FOLDER || "hotsnew";

type SubscriptionPlan = "free" | "monthly" | "yearly";
type PaidSubscriptionPlan = Exclude<SubscriptionPlan, "free">;

const ZALOPAY_CREATE_ORDER_PATH = "/v2/create";
const ZALOPAY_QUERY_ORDER_PATH = "/v2/query";

const SUBSCRIPTION_PRICING: Record<
  PaidSubscriptionPlan,
  { amount: number; label: string }
> = {
  monthly: {
    amount: 299000,
    label: "Goi thang Premium",
  },
  yearly: {
    amount: 2490000,
    label: "Goi nam Premium",
  },
};

interface AuthenticatedRequest extends Request {
  authUser?: {
    id: string;
    email?: string;
  };
  authProfile?: {
    id: string;
    email?: string;
    role?: string;
    status?: string;
    full_name?: string;
    avatar_url?: string;
    subscription_plan?: SubscriptionPlan;
    subscription_expiry?: string | null;
  } | null;
}

interface PublicLinkRecord {
  id: string;
  short_code: string;
  original_url: string;
  custom_title?: string | null;
  custom_description?: string | null;
  custom_image_url?: string | null;
  video_url?: string | null;
}

interface LinkMetaRecord {
  short_code: string;
  title: string;
}

interface TrackedSourceSummary {
  label: string;
  count: number;
}

const MAX_SHORT_CODE_LENGTH = 50;

const getBearerToken = (req: Request) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length).trim();
};

const normalizeTrafficSource = (value?: string | null) => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;

  if (normalized.includes("facebook")) return "facebook";
  if (normalized.includes("tiktok")) return "tiktok";
  if (normalized.includes("zalo")) return "zalo";
  if (normalized.includes("instagram")) return "instagram";
  if (normalized.includes("youtube")) return "youtube";
  if (normalized.includes("telegram")) return "telegram";
  if (normalized.includes("google")) return "google";
  if (normalized.includes("direct")) return "direct";
  return normalized.slice(0, 64);
};

const normalizeShortCode = (value?: string | null) => {
  if (!value) return null;

  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!normalized) return null;
  if (normalized.length < 3) {
    throw new Error("Mã rút gọn phải có ít nhất 3 ký tự.");
  }
  if (normalized.length > MAX_SHORT_CODE_LENGTH) {
    throw new Error(
      `Mã rút gọn không được vượt quá ${MAX_SHORT_CODE_LENGTH} ký tự.`,
    );
  }

  return normalized;
};

const getTrafficSourceFromRequest = (req: Request) => {
  const srcParam =
    (typeof req.query.src === "string" && req.query.src) ||
    (typeof req.query.source === "string" && req.query.source) ||
    (typeof req.query.utm_source === "string" && req.query.utm_source) ||
    null;
  const referer =
    typeof req.headers.referer === "string" ? req.headers.referer : null;
  const inferredFromReferer = normalizeTrafficSource(referer);
  const source = normalizeTrafficSource(srcParam) || inferredFromReferer;

  return {
    source,
    source_detail: srcParam?.trim() || null,
    referer,
  };
};

const insertClickWithTracking = async (
  supabase: ReturnType<typeof getSupabase>,
  payload: Record<string, unknown>,
) => {
  const attempts = [
    {
      link_id: payload.link_id,
      user_agent: payload.user_agent,
      ip_address: payload.ip_address ?? payload.ip,
      source: payload.source,
      source_detail: payload.source_detail,
      referer: payload.referer,
    },
    {
      link_id: payload.link_id,
      user_agent: payload.user_agent,
      ip_address: payload.ip_address ?? payload.ip,
      source: payload.source,
      referer: payload.referer,
    },
    {
      link_id: payload.link_id,
      user_agent: payload.user_agent,
      ip: payload.ip ?? payload.ip_address,
      source: payload.source,
      referer: payload.referer,
    },
    {
      link_id: payload.link_id,
      user_agent: payload.user_agent,
      ip_address: payload.ip_address ?? payload.ip,
    },
    {
      link_id: payload.link_id,
      user_agent: payload.user_agent,
      ip: payload.ip ?? payload.ip_address,
    },
  ];

  let lastError: any = null;

  for (const attempt of attempts) {
    const sanitizedPayload = Object.fromEntries(
      Object.entries(attempt).filter(([, value]) => value !== undefined),
    );
    const { error } = await supabase.from("clicks").insert(sanitizedPayload);
    if (!error) return;
    lastError = error;
  }

  throw lastError;
};

const attachTrackedSourcesToLinks = async (
  supabase: ReturnType<typeof getSupabase>,
  links: any[],
) => {
  if (!links.length) return links;

  try {
    const linkIds = links.map((link) => link.id).filter(Boolean);
    let clicks: any[] | null = null;
    let error: any = null;

    ({ data: clicks, error } = await supabase
      .from("clicks")
      .select("link_id, source, source_detail, referer")
      .in("link_id", linkIds)
      .limit(5000));

    if (error) {
      ({ data: clicks, error } = await supabase
        .from("clicks")
        .select("link_id, source, referer")
        .in("link_id", linkIds)
        .limit(5000));
    }

    if (error) throw error;

    const sourceMap = new Map<string, Map<string, number>>();
    const clickCountMap = new Map<string, number>();

    (clicks || []).forEach((click: any) => {
      const sourceLabel =
        normalizeTrafficSource(click.source_detail) ||
        normalizeTrafficSource(click.source) ||
        normalizeTrafficSource(click.referer) ||
        "unknown";
      const linkId = click.link_id;
      if (!linkId) return;

      clickCountMap.set(linkId, (clickCountMap.get(linkId) || 0) + 1);

      if (!sourceMap.has(linkId)) {
        sourceMap.set(linkId, new Map<string, number>());
      }

      const linkSources = sourceMap.get(linkId)!;
      linkSources.set(sourceLabel, (linkSources.get(sourceLabel) || 0) + 1);
    });

    return links.map((link) => {
      const trackedSources = Array.from(
        sourceMap.get(link.id)?.entries() || [],
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([label, count]) => ({ label, count })) as TrackedSourceSummary[];

      return {
        ...link,
        clicks: clickCountMap.get(link.id) || 0,
        tracked_sources: trackedSources,
      };
    });
  } catch (error: any) {
    console.warn(
      "[Links] tracked source aggregation skipped:",
      error?.message || error,
    );
    return links;
  }
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const escapeJsString = (value: string) =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${");

const capitalizeFirstCharacter = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  const firstCharacter = trimmed.charAt(0).toLocaleUpperCase("vi-VN");
  return `${firstCharacter}${trimmed.slice(1)}`;
};

const renderLinkLandingPage = (
  link: PublicLinkRecord,
  canonicalUrl: string,
) => {
  const title = capitalizeFirstCharacter(
    link.custom_title?.trim() || "HotsNew Click",
  );
  const description =
    capitalizeFirstCharacter(
      link.custom_description?.trim() ||
        "Noi dung dang san sang. Bam vao man hinh de tiep tuc.",
    );
  const imageUrl = link.custom_image_url?.trim() || "";
  const videoUrl = link.video_url?.trim() || "";
  const originalUrl = link.original_url.trim();
  const defaultOgImage = `${canonicalUrl.replace(/\/s\/[^/]+$/, "")}/og-image.png`;
  const fallbackFavicon = `${canonicalUrl.replace(/\/s\/[^/]+$/, "")}/logo-app.png`;
  const faviconUrl = imageUrl || fallbackFavicon;
  const socialImageUrl = imageUrl || defaultOgImage;
  const hasVideo = Boolean(videoUrl);
  const previewMedia = hasVideo
    ? `
      <video class="hero-media" src="${escapeHtml(videoUrl)}" autoplay muted loop playsinline controls></video>
    `
    : imageUrl
      ? `<img class="hero-media" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}" />`
      : `
        <div class="hero-placeholder">
          <div class="hero-placeholder-ring"></div>
          <div class="hero-placeholder-core">HN</div>
        </div>
      `;

  const metaVideo = hasVideo
    ? `
    <meta property="og:video" content="${escapeHtml(videoUrl)}" />
    <meta property="og:video:type" content="video/mp4" />
    <meta property="og:video:secure_url" content="${escapeHtml(videoUrl)}" />
  `
    : "";

  const metaImage = `<meta property="og:image" content="${escapeHtml(socialImageUrl)}" />
       <meta property="og:image:alt" content="${escapeHtml(title)}" />
       <meta name="twitter:image" content="${escapeHtml(socialImageUrl)}" />`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: canonicalUrl,
    image: socialImageUrl,
    inLanguage: "vi-VN",
    isPartOf: {
      "@type": "WebSite",
      name: "HotsNew Click",
      url: canonicalUrl.replace(/\/s\/[^/]+$/, "/"),
    },
  };

  return `<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="icon" href="${escapeHtml(faviconUrl)}" />
    <link rel="shortcut icon" href="${escapeHtml(faviconUrl)}" />
    <link rel="apple-touch-icon" href="${escapeHtml(faviconUrl)}" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <meta property="og:locale" content="vi_VN" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:site_name" content="HotsNew Click" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    ${metaImage}
    ${metaVideo}
    <script type="application/ld+json">${JSON.stringify(structuredData)}</script>
    <style>
      :root {
        color-scheme: dark;
        --bg: #07111f;
        --panel: rgba(9, 18, 32, 0.58);
        --border: rgba(255, 255, 255, 0.14);
        --text: #f8fafc;
        --muted: rgba(226, 232, 240, 0.78);
        --accent: #fb7185;
        --accent2: #22d3ee;
        --accent3: #f59e0b;
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        min-height: 100vh;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at 14% 18%, rgba(34, 211, 238, 0.28), transparent 22%),
          radial-gradient(circle at 82% 20%, rgba(251, 113, 133, 0.22), transparent 24%),
          radial-gradient(circle at 76% 72%, rgba(245, 158, 11, 0.18), transparent 20%),
          linear-gradient(135deg, #030712 0%, #07111f 42%, #111827 100%);
        overflow-x: hidden;
      }

      .orb {
        position: fixed;
        border-radius: 999px;
        filter: blur(12px);
        opacity: 0.9;
        transform: translateZ(0);
        pointer-events: none;
      }

      .orb-1 {
        inset: 6% auto auto 8%;
        width: 17rem;
        height: 17rem;
        background: linear-gradient(135deg, rgba(34, 211, 238, 0.95), rgba(59, 130, 246, 0.25));
        box-shadow: 1.6rem 1.8rem 0 rgba(8, 47, 73, 0.34);
      }

      .orb-2 {
        inset: auto 12% 10% auto;
        width: 15rem;
        height: 15rem;
        background: linear-gradient(135deg, rgba(251, 113, 133, 0.96), rgba(168, 85, 247, 0.24));
        box-shadow: -1.4rem 1.3rem 0 rgba(76, 29, 149, 0.24);
      }

      .orb-3 {
        inset: 34% auto auto 68%;
        width: 8rem;
        height: 8rem;
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(251, 191, 36, 0.26));
        box-shadow: 0.8rem 1rem 0 rgba(120, 53, 15, 0.25);
      }

      .shell {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 2rem;
        position: relative;
      }

      .card {
        position: relative;
        width: min(880px, 100%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 2rem;
        padding: 1.5rem;
        backdrop-filter: blur(24px) saturate(130%);
        box-shadow:
          0 1.5rem 4rem rgba(0, 0, 0, 0.34),
          inset 0 1px 0 rgba(255, 255, 255, 0.08);
      }

      .media-panel,
      .content-panel {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 1.5rem;
      }

      .media-panel {
        width: min(100%, 46rem);
        display: flex;
        justify-content: center;
        overflow: hidden;
        padding: 0.9rem;
      }

      .hero-media {
        width: min(100%, 40rem);
        aspect-ratio: 9 / 13;
        max-height: 42rem;
        object-fit: cover;
        border-radius: 1.15rem;
        display: block;
        background: rgba(15, 23, 42, 0.72);
        margin-inline: auto;
      }

      .hero-placeholder {
        width: min(100%, 40rem);
        aspect-ratio: 9 / 13;
        max-height: 42rem;
        border-radius: 1.15rem;
        display: grid;
        place-items: center;
        margin-inline: auto;
        background:
          radial-gradient(circle at 30% 24%, rgba(34, 211, 238, 0.2), transparent 18%),
          radial-gradient(circle at 72% 68%, rgba(251, 113, 133, 0.24), transparent 24%),
          linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(17, 24, 39, 0.7));
      }

      .hero-placeholder-ring {
        position: absolute;
        width: 10rem;
        height: 10rem;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 999px;
      }

      .hero-placeholder-core {
        position: relative;
        width: 6rem;
        height: 6rem;
        display: grid;
        place-items: center;
        border-radius: 1.5rem;
        background: linear-gradient(135deg, rgba(249, 115, 22, 1), rgba(239, 68, 68, 1));
        font-size: 1.6rem;
        font-weight: 900;
        letter-spacing: 0.06em;
        box-shadow: 0 1rem 2rem rgba(249, 115, 22, 0.26);
      }

      .content-panel {
        width: min(100%, 46rem);
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        text-align: left;
        padding: 1.2rem 1.35rem 1.45rem;
      }

      .headline {
        display: inline-flex;
        align-items: center;
        justify-content: flex-start;
        gap: 0.7rem;
        margin-bottom: 0.65rem;
      }

      .hot-badge {
        flex: 0 0 auto;
        width: 2.25rem;
        height: 2.25rem;
        display: grid;
        place-items: center;
        border-radius: 999px;
        background: linear-gradient(135deg, rgba(249, 115, 22, 1), rgba(239, 68, 68, 1));
        box-shadow: 0 0.8rem 1.8rem rgba(249, 115, 22, 0.28);
        font-size: 1rem;
      }

      h1 {
        margin: 0;
        font-size: clamp(1.05rem, 2vw, 1.5rem);
        line-height: 1.22;
        letter-spacing: -0.04em;
        max-width: 34rem;
        text-wrap: pretty;
      }

      p {
        margin: 0;
        color: var(--muted);
        font-size: 0.84rem;
        line-height: 1.6;
        max-width: 34rem;
        text-wrap: pretty;
      }

      .overlay {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
        background: rgba(2, 6, 23, 0.1);
        backdrop-filter: blur(4px);
        z-index: 20;
        cursor: pointer;
        transition: opacity 220ms ease, visibility 220ms ease;
      }

      .overlay.hidden {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
      }

      .overlay-close {
        position: fixed;
        top: 1.25rem;
        right: 1.25rem;
        width: 3.1rem;
        height: 3.1rem;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.22);
        background: rgba(15, 23, 42, 0.34);
        color: var(--text);
        font-size: 1.35rem;
        font-weight: 900;
        cursor: pointer;
        backdrop-filter: blur(16px);
        box-shadow: 0 0.8rem 2rem rgba(0, 0, 0, 0.22);
        z-index: 21;
      }

      @media (max-width: 900px) {
        .content-panel {
          padding: 1.2rem 1rem 1.4rem;
        }

        .hero-media,
        .hero-placeholder {
          width: min(100%, 24rem);
          max-height: min(64vh, 32rem);
        }

        h1 {
          max-width: 100%;
          font-size: clamp(0.98rem, 4.6vw, 1.3rem);
        }

        .hot-badge {
          width: 2rem;
          height: 2rem;
        }
      }
    </style>
  </head>
  <body>
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>

    <main class="shell">
      <section class="card">
        <div class="media-panel">
          ${previewMedia}
        </div>

        <div class="content-panel">
          <div class="headline">
            <span class="hot-badge" aria-hidden="true">🔥</span>
            <h1>${escapeHtml(title)}</h1>
          </div>
          <p>${escapeHtml(description)}</p>
        </div>
      </section>
    </main>

    <div id="overlay" class="overlay" role="button" tabindex="0" aria-label="Mở link đích">
      <button class="overlay-close" id="overlayClose" aria-label="Đóng lớp mờ">×</button>
    </div>

    <script>
      (() => {
        const overlay = document.getElementById("overlay");
        const overlayClose = document.getElementById("overlayClose");
        const targetUrl = \`${escapeJsString(originalUrl)}\`;
        let opened = false;

        const hideOverlay = () => {
          overlay?.classList.add("hidden");
        };

        const beginRedirectFlow = () => {
          if (opened) return;
          opened = true;

          hideOverlay();

          const link = document.createElement("a");
          link.href = targetUrl;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.style.display = "none";
          document.body.appendChild(link);

          try {
            link.click();
          } catch (error) {
            console.error("Popup open failed", error);
            window.location.href = targetUrl;
          } finally {
            link.remove();
          }
        };

        overlay?.addEventListener("click", (event) => {
          if (event.target !== overlay) return;
          beginRedirectFlow();
        });
        overlayClose?.addEventListener("click", (event) => {
          event.stopPropagation();
          beginRedirectFlow();
        });
        overlay?.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            beginRedirectFlow();
          }
        });
      })();
    </script>
  </body>
</html>`;
};

const hmacSha256 = (input: string, key: string) =>
  crypto.createHmac("sha256", key).update(input).digest("hex");

const getVietnamDatePrefix = () => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const year = parts.find((part) => part.type === "year")?.value ?? "00";

  return `${year}${month}${day}`;
};

const getPublicBaseUrl = (req?: Request) => {
  const configured =
    process.env.APP_BASE_URL ||
    process.env.PUBLIC_BASE_URL ||
    process.env.VITE_APP_BASE_URL ||
    process.env.VERCEL_URL;

  if (configured) {
    return configured.startsWith("http") ? configured : `https://${configured}`;
  }

  if (!req) return null;
  return `${req.protocol}://${req.get("host")}`;
};

const getZaloPayConfig = () => {
  const appIdRaw = process.env.ZALOPAY_APP_ID;
  const key1 = process.env.ZALOPAY_KEY1;
  const key2 = process.env.ZALOPAY_KEY2;
  const apiBaseUrl = process.env.ZALOPAY_API_BASE_URL;

  if (!appIdRaw || !key1 || !key2 || !apiBaseUrl) {
    throw new Error(
      "Missing ZaloPay configuration. Required: ZALOPAY_APP_ID, ZALOPAY_KEY1, ZALOPAY_KEY2, ZALOPAY_API_BASE_URL",
    );
  }

  const appId = Number(appIdRaw);
  if (!Number.isFinite(appId)) {
    throw new Error("ZALOPAY_APP_ID must be a number");
  }

  return {
    appId,
    key1,
    key2,
    apiBaseUrl: apiBaseUrl.replace(/\/+$/, ""),
  };
};

const addSubscriptionDuration = (
  currentExpiry: string | null | undefined,
  plan: PaidSubscriptionPlan,
) => {
  const now = new Date();
  const baseDate =
    currentExpiry && new Date(currentExpiry).getTime() > now.getTime()
      ? new Date(currentExpiry)
      : now;

  if (plan === "monthly") {
    baseDate.setDate(baseDate.getDate() + 30);
  } else {
    baseDate.setFullYear(baseDate.getFullYear() + 1);
  }

  return baseDate.toISOString();
};

const syncSubscriptionForUser = async (
  userId: string,
  plan: PaidSubscriptionPlan,
) => {
  const supabase = getSupabase();
  const { data: existingProfile, error: existingError } = await supabase
    .from("profiles")
    .select("email, full_name, avatar_url, role, status, subscription_expiry")
    .eq("id", userId)
    .maybeSingle();

  if (existingError) throw existingError;

  const nextExpiry = addSubscriptionDuration(
    existingProfile?.subscription_expiry,
    plan,
  );

  const { error: updateError } = await supabase.from("profiles").upsert({
    id: userId,
    email: existingProfile?.email,
    full_name: existingProfile?.full_name,
    avatar_url: existingProfile?.avatar_url,
    role: existingProfile?.role || "user",
    status: existingProfile?.status || "approved",
    subscription_plan: plan,
    subscription_expiry: nextExpiry,
    updated_at: new Date().toISOString(),
  });

  if (updateError) throw updateError;

  return nextExpiry;
};

const listAllAuthUsers = async () => {
  const supabase = getSupabase();
  const users: Array<any> = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) throw error;

    const batch = data?.users ?? [];
    users.push(...batch);

    if (batch.length < perPage) break;
    page += 1;
  }

  return users;
};

const syncProfilesFromAuthUsers = async () => {
  const supabase = getSupabase();
  const authUsers = await listAllAuthUsers();

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, avatar_url, role, status, subscription_plan, subscription_expiry",
    );

  if (profilesError) throw profilesError;

  const existingProfileIds = new Set((profiles ?? []).map((profile) => profile.id));
  const missingProfiles = authUsers
    .filter((authUser) => !existingProfileIds.has(authUser.id))
    .map((authUser) => ({
      id: authUser.id,
      email: authUser.email ?? "",
      full_name:
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        authUser.email?.split("@")[0] ||
        "User",
      avatar_url: authUser.user_metadata?.avatar_url || null,
      role: "user",
      status: "pending",
      subscription_plan: "free",
      subscription_expiry: null,
      updated_at: new Date().toISOString(),
    }));

  if (missingProfiles.length > 0) {
    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert(missingProfiles);

    if (upsertError) throw upsertError;
  }
};

const isPremiumProfile = (profile: AuthenticatedRequest["authProfile"]) => {
  if (!profile) return false;
  if (profile.role === "admin") return true;
  if (
    profile.subscription_plan === "monthly" ||
    profile.subscription_plan === "yearly"
  ) {
    if (!profile.subscription_expiry) return true;
    return new Date(profile.subscription_expiry).getTime() > Date.now();
  }
  return false;
};

const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ error: "Missing bearer token" });

    const supabase = getSupabase();
    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      console.error("[Auth] getUser failed:", {
        message: userError?.message,
        status: userError?.status,
      });
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.authUser = {
      id: userData.user.id,
      email: userData.user.email ?? undefined,
    };

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        "id, email, role, status, full_name, avatar_url, subscription_plan, subscription_expiry",
      )
      .eq("id", userData.user.id)
      .maybeSingle();

    if (profileError) {
      return res.status(500).json({ error: profileError.message });
    }

    req.authProfile = profile ?? null;
    next();
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Authentication failed" });
  }
};

const checkPremium = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.authUser) return res.status(401).json({ error: "Unauthorized" });
  if (!isPremiumProfile(req.authProfile)) {
    return res.status(403).json({ error: "Premium plan required" });
  }
  next();
};

const checkAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.authUser) return res.status(401).json({ error: "Unauthorized" });
  if (req.authProfile?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
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

// C. API ROUTES
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

app.post(
  "/api/v1/cloudinary/sign-upload",
  authenticate,
  checkPremium,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!process.env.CLOUDINARY_API_SECRET || !process.env.CLOUDINARY_API_KEY) {
        return res
          .status(500)
          .json({ error: "Cloudinary signing is not configured" });
      }

      const timestamp = Math.floor(Date.now() / 1000);
      const signature = cloudinary.utils.api_sign_request(
        {
          folder: CLOUDINARY_UPLOAD_FOLDER,
          timestamp,
        },
        process.env.CLOUDINARY_API_SECRET,
      );

      res.json({
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        folder: CLOUDINARY_UPLOAD_FOLDER,
        timestamp,
        signature,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Cannot sign upload" });
    }
  },
);

app.post(
  "/api/v1/upload-video",
  authenticate,
  checkPremium,
  upload.single("file"),
  async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file provided" });
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "auto", folder: CLOUDINARY_UPLOAD_FOLDER },
        (error, result) => {
          if (error) return res.status(500).json({ error: error.message });
          res.json({ secure_url: result?.secure_url });
        },
      );
      stream.end(req.file.buffer);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
);

app.post(
  "/api/v1/upload-avatar",
  authenticate,
  upload.single("file"),
  async (req: any, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const supabase = getSupabase();
      if (!req.file) return res.status(400).json({ error: "No file provided" });
      const userId = authReq.authUser?.id;
      if (!userId) return res.status(400).json({ error: "Missing userId" });

      const fileExt = req.file.originalname.split(".").pop() || "png";
      const fileName = `${userId}_${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from("avatars")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });

      if (error) throw error;
      const { data: publicData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);
      res.json({ secure_url: publicData.publicUrl });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
);

app.get(
  "/api/v1/user/profile",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const userId = req.authUser?.id;
      if (!userId) return res.status(400).json({ error: "Missing userId" });
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      res.json(data || { id: userId, is_new: true });
    } catch (e: any) {
      console.error("API Error /api/v1/user/profile:", e.message);
      res.status(500).json({ error: e.message || "Unknown error" });
    }
  },
);

app.post(
  "/api/v1/user/profile/update",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const userId = req.authUser?.id;
      const email = req.authUser?.email;
      const { full_name, avatar_url } = req.body;
      if (!userId) return res.status(400).json({ error: "Missing userId" });
      // 1. Get existing profile to preserve sensitive fields (role, subscription)
      const { data: existing } = await supabase
        .from("profiles")
        .select("subscription_plan, subscription_expiry, role, status")
        .eq("id", userId)
        .maybeSingle();

      const { data, error } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          email,
          full_name,
          avatar_url,
          role: existing?.role || "user",
          status: existing?.status || "pending",
          subscription_plan: existing?.subscription_plan || "free",
          subscription_expiry: existing?.subscription_expiry || null,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
);

app.post(
  "/api/v1/convert",
  authenticate,
  checkPremium,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const userId = req.authUser?.id;
      const {
        url,
        customShortCode,
        customTitle,
        customDescription,
        usageContext,
        customImageUrl,
        videoUrl,
      } = req.body;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const requestedShortCode = normalizeShortCode(customShortCode);
      if (
        requestedShortCode &&
        requestedShortCode.length > MAX_SHORT_CODE_LENGTH
      ) {
        throw new Error(
          `Mã rút gọn không được vượt quá ${MAX_SHORT_CODE_LENGTH} ký tự.`,
        );
      }
      const shortCode = requestedShortCode || nanoid(8);

      if (requestedShortCode) {
        const { data: existingLink, error: existingError } = await supabase
          .from("links")
          .select("id")
          .eq("short_code", requestedShortCode)
          .maybeSingle();

        if (existingError) throw existingError;
        if (existingLink) {
          return res
            .status(409)
            .json({ error: "Mã rút gọn này đã tồn tại. Vui lòng chọn mã khác." });
        }
      }

      const { data, error } = await supabase
        .from("links")
        .insert({
          original_url: url,
          short_code: shortCode,
          user_id: userId,
          custom_title: customTitle,
          custom_description: customDescription,
          usage_context: usageContext,
          custom_image_url: customImageUrl,
          video_url: videoUrl,
        })
        .select()
        .single();
      if (error) throw error;
      res.json({
        id: data.id,
        converted_url: `https://hotsnew.click/s/${shortCode}`,
        short_code: data.short_code,
        shortCode: data.short_code,
        custom_image_url: data.custom_image_url,
        video_url: data.video_url,
      });
    } catch (e: any) {
      const message = e?.message || "Convert failed";
      if (message.includes("value too long for type character varying(50)")) {
        return res.status(400).json({
          error: `Mã rút gọn không được vượt quá ${MAX_SHORT_CODE_LENGTH} ký tự.`,
        });
      }
      res.status(400).json({ error: message });
    }
  },
);

app.get(
  "/api/v1/user/links",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const userId = req.authUser?.id;
      if (!userId) return res.status(400).json({ error: "Missing userId" });
      const { data, error } = await supabase
        .from("links")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const linksWithSources = await attachTrackedSourcesToLinks(
        supabase,
        data || [],
      );
      res.json(linksWithSources);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
);

app.patch(
  "/api/v1/user/links/:id",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const { id } = req.params;
      const {
        custom_title,
        custom_description,
        usage_context,
        custom_image_url,
        original_url,
      } = req.body;
      const userId = req.authUser?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { data, error } = await supabase
        .from("links")
        .update({
          custom_title,
          custom_description,
          usage_context,
          custom_image_url,
          original_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
);

app.delete(
  "/api/v1/user/links/:id",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const { id } = req.params;
      const userId = req.authUser?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // First delete clicks associated with this link
      await supabase.from("clicks").delete().eq("link_id", id);

      const { error } = await supabase
        .from("links")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) throw error;
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
);

app.get(
  "/api/v1/user/stats",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const userId = req.authUser?.id;
      if (!userId) return res.status(400).json({ error: "Missing userId" });
      const { count, error } = await supabase
        .from("links")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      if (error) throw error;

      const { data: links, error: linksError } = await supabase
        .from("links")
        .select("id, short_code, custom_title")
        .eq("user_id", userId);
      if (linksError) throw linksError;

      if (!links || links.length === 0) {
        return res.json({
          totalLinks: count || 0,
          totalClicks: 0,
          recentClicks: [],
          topLinks: [],
          growthPercentage: 0,
        });
      }

      const linkIds = links.map((link: any) => link.id).filter(Boolean);
      const linkMetaMap = new Map<string, LinkMetaRecord>(
        links.map((link: any) => [
          link.id,
          {
            short_code: link.short_code,
            title: link.custom_title || link.short_code,
          },
        ]),
      );

      const { data: clicks, error: clicksError } = await supabase
        .from("clicks")
        .select("link_id, created_at")
        .in("link_id", linkIds)
        .limit(5000);
      if (clicksError) throw clicksError;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const historyMap: Record<string, number> = {};
      const linkClickMap = new Map<string, number>();
      let previousWindowClicks = 0;
      let currentWindowClicks = 0;

      (clicks || []).forEach((click: any) => {
        if (!click?.link_id) return;

        linkClickMap.set(
          click.link_id,
          (linkClickMap.get(click.link_id) || 0) + 1,
        );

        if (!click.created_at) return;
        const createdAt = new Date(click.created_at);
        if (Number.isNaN(createdAt.getTime()) || createdAt < sixtyDaysAgo) {
          return;
        }

        if (createdAt >= thirtyDaysAgo) {
          const date = click.created_at.split("T")[0];
          historyMap[date] = (historyMap[date] || 0) + 1;
          currentWindowClicks += 1;
        } else {
          previousWindowClicks += 1;
        }
      });

      const totalClicks = Array.from(linkClickMap.values()).reduce(
        (sum, value) => sum + value,
        0,
      );
      const recentClicks = Object.entries(historyMap)
        .map(([date, total]) => ({ date, clicks: total }))
        .sort((a, b) => a.date.localeCompare(b.date));
      const topLinks = Array.from(linkClickMap.entries())
        .map(([id, total]) => ({
          short_code: linkMetaMap.get(id)?.short_code || "",
          title: linkMetaMap.get(id)?.title || "",
          clicks: total,
        }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 5);
      const growthPercentage =
        previousWindowClicks <= 0
          ? currentWindowClicks > 0
            ? 100
            : 0
          : Number(
              (
                ((currentWindowClicks - previousWindowClicks) /
                  previousWindowClicks) *
                100
              ).toFixed(1),
            );

      res.json({
        totalLinks: count || 0,
        totalClicks,
        recentClicks,
        topLinks,
        growthPercentage,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
);

app.get(
  "/api/v1/user/analytics",
  authenticate,
  checkPremium,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const userId = req.authUser?.id;
      console.log(`📈 [Analytics] Request for userId: ${userId}`);

      if (!userId) {
        console.warn("⚠️ [Analytics] Missing userId");
        return res.status(400).json({ error: "Missing userId" });
      }

      const { data: links, error: linksError } = await supabase
        .from("links")
        .select("id, custom_title, short_code")
        .eq("user_id", userId);

      if (linksError) {
        console.error("❌ [Analytics] Links query error:", linksError);
        throw linksError;
      }

      if (!links || links.length === 0) {
        console.log("ℹ️ [Analytics] No links found for user");
        return res.json({
          history: [],
          topLinks: [],
          trafficSources: [],
          growthPercentage: 0,
        });
      }

      const linkIds = links.map((d: any) => d.id);
      const linkMap = Object.fromEntries(
        links.map((d: any) => [d.id, d.custom_title || d.short_code]),
      );
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      console.log(
        `📊 [Analytics] Fetching clicks for ${linkIds.length} links since ${thirtyDaysAgo.toISOString()}`,
      );

      const { data: clicks, error: clicksError } = await supabase
        .from("clicks")
        .select("link_id, created_at, source, source_detail, referer")
        .in("link_id", linkIds.slice(0, 100)) // Increased slice to 100
        .gte("created_at", sixtyDaysAgo.toISOString());

      if (clicksError) {
        console.error("❌ [Analytics] Clicks query error:", clicksError);
        // Don't throw here, just return empty clicks but log it
        return res.json({
          history: [],
          topLinks: [],
          trafficSources: [],
          growthPercentage: 0,
        });
      }

      const historyMap: any = {};
      const linksStats: any = {};
      const trafficSourceStats: Record<string, number> = {};
      let previousWindowClicks = 0;
      let currentWindowClicks = 0;
      if (clicks) {
        clicks.forEach((c: any) => {
          const createdAt = new Date(c.created_at);
          if (Number.isNaN(createdAt.getTime())) return;

          if (createdAt >= thirtyDaysAgo) {
            const date = c.created_at.split("T")[0];
            historyMap[date] = (historyMap[date] || 0) + 1;
            linksStats[c.link_id] = (linksStats[c.link_id] || 0) + 1;

            const sourceLabel =
              normalizeTrafficSource(c.source_detail) ||
              normalizeTrafficSource(c.source) ||
              normalizeTrafficSource(c.referer) ||
              "unknown";
            trafficSourceStats[sourceLabel] =
              (trafficSourceStats[sourceLabel] || 0) + 1;
            currentWindowClicks += 1;
          } else if (createdAt >= sixtyDaysAgo) {
            previousWindowClicks += 1;
          }
        });
      }

      const history = Object.entries(historyMap)
        .map(([date, clicks]) => ({ date, clicks }))
        .sort((a: any, b: any) => a.date.localeCompare(b.date));
      const topLinks = Object.entries(linksStats)
        .map(([id, clicks]) => ({ id, clicks, title: linkMap[id] }))
        .sort((a: any, b: any) => b.clicks - a.clicks)
        .slice(0, 5);
      const trafficSources = Object.entries(trafficSourceStats)
        .map(([name, value]) => ({ name, value }))
        .sort((a: any, b: any) => b.value - a.value)
        .slice(0, 5);
      const growthPercentage =
        previousWindowClicks <= 0
          ? currentWindowClicks > 0
            ? 100
            : 0
          : Number(
              (
                ((currentWindowClicks - previousWindowClicks) /
                  previousWindowClicks) *
                100
              ).toFixed(1),
            );

      console.log(
        `✅ [Analytics] Success: ${history.length} history points, ${topLinks.length} top links`,
      );
      res.json({ history, topLinks, trafficSources, growthPercentage });
    } catch (e: any) {
      console.error("💥 [Analytics] Final catch block error:", e.message);
      res.json({
        history: [],
        topLinks: [],
        trafficSources: [],
        growthPercentage: 0,
      });
    }
  },
);

app.post(
  "/api/v1/billing/zalopay/create-order",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.authUser?.id;
      const userEmail = req.authUser?.email;
      const plan = req.body?.plan as PaidSubscriptionPlan;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (plan !== "monthly" && plan !== "yearly") {
        return res.status(400).json({ error: "Invalid subscription plan" });
      }

      const { appId, key1, apiBaseUrl } = getZaloPayConfig();
      const publicBaseUrl = getPublicBaseUrl(req);
      if (!publicBaseUrl) {
        return res.status(500).json({
          error:
            "Missing APP_BASE_URL or PUBLIC_BASE_URL for ZaloPay redirect/callback",
        });
      }

      const pricing = SUBSCRIPTION_PRICING[plan];
      const appTransId = `${getVietnamDatePrefix()}_${plan}_${nanoid(10)}`;
      const appTime = Date.now();
      const redirectUrl = `${publicBaseUrl}/?tab=pricing&payment=return&plan=${plan}&app_trans_id=${encodeURIComponent(appTransId)}`;
      const callbackUrl = `${publicBaseUrl}/api/v1/billing/zalopay/callback`;
      const embedData = JSON.stringify({
        redirecturl: redirectUrl,
        preferred_payment_method: ["zalopay_wallet", "vietqr"],
        plan,
      });
      const item = JSON.stringify([
        {
          plan,
          user_id: userId,
          amount: pricing.amount,
        },
      ]);
      const description = `${pricing.label} cho ${userEmail || userId}`.slice(
        0,
        256,
      );
      const macInput = [
        appId,
        appTransId,
        userId,
        pricing.amount,
        appTime,
        embedData,
        item,
      ].join("|");

      const requestBody = new URLSearchParams({
        app_id: String(appId),
        app_user: userId,
        app_trans_id: appTransId,
        app_time: String(appTime),
        amount: String(pricing.amount),
        description,
        item,
        embed_data: embedData,
        callback_url: callbackUrl,
        mac: hmacSha256(macInput, key1),
      });

      const response = await fetch(
        `${apiBaseUrl}${ZALOPAY_CREATE_ORDER_PATH}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: requestBody.toString(),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        return res.status(502).json({
          error: "ZaloPay create-order request failed",
          details: data,
        });
      }

      if (data?.return_code !== 1 || !data?.order_url) {
        return res.status(400).json({
          error:
            data?.sub_return_message ||
            data?.return_message ||
            "Cannot create ZaloPay order",
          details: data,
        });
      }

      res.json({
        app_trans_id: appTransId,
        order_url: data.order_url,
        zp_trans_token: data.zp_trans_token,
        qr_code: data.qr_code,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Create order failed" });
    }
  },
);

app.post("/api/v1/billing/zalopay/callback", async (req, res) => {
  try {
    const { key2 } = getZaloPayConfig();
    const dataStr = req.body?.data;
    const requestMac = req.body?.mac;

    if (!dataStr || !requestMac) {
      return res
        .status(400)
        .json({ return_code: 2, return_message: "Invalid callback payload" });
    }

    const validMac = hmacSha256(dataStr, key2);
    if (validMac !== requestMac) {
      return res
        .status(200)
        .json({ return_code: 2, return_message: "Invalid callback MAC" });
    }

    const callbackData = JSON.parse(dataStr);
    const embedData = JSON.parse(callbackData.embed_data || "{}");
    const itemData = JSON.parse(callbackData.item || "[]");
    const plan =
      itemData?.[0]?.plan ||
      embedData?.plan ||
      (callbackData.app_trans_id?.includes("_yearly_") ? "yearly" : "monthly");
    const userId = itemData?.[0]?.user_id || callbackData.app_user;

    if (userId && (plan === "monthly" || plan === "yearly")) {
      await syncSubscriptionForUser(userId, plan);
    }

    return res.status(200).json({ return_code: 1, return_message: "success" });
  } catch (e: any) {
    return res
      .status(200)
      .json({ return_code: 0, return_message: e.message || "retry" });
  }
});

app.get(
  "/api/v1/billing/zalopay/status/:appTransId",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.authUser?.id;
      const { appTransId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { appId, key1, apiBaseUrl } = getZaloPayConfig();
      const mac = hmacSha256(`${appId}|${appTransId}|${key1}`, key1);

      const requestBody = new URLSearchParams({
        app_id: String(appId),
        app_trans_id: appTransId,
        mac,
      });

      const response = await fetch(`${apiBaseUrl}${ZALOPAY_QUERY_ORDER_PATH}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: requestBody.toString(),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        return res.status(502).json({
          error: "ZaloPay order-status request failed",
          details: data,
        });
      }

      const plan = appTransId.includes("_yearly_") ? "yearly" : "monthly";
      const isPaid = data?.return_code === 1;
      let subscriptionExpiry: string | null = null;

      if (isPaid) {
        subscriptionExpiry = await syncSubscriptionForUser(
          userId,
          plan as PaidSubscriptionPlan,
        );
      }

      return res.json({
        paid: isPaid,
        processing: data?.return_code === 3,
        plan,
        subscription_expiry: subscriptionExpiry,
        status: data,
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || "Query order failed" });
    }
  },
);

app.get("/api/v1/admin/users", authenticate, checkAdmin, async (req, res) => {
  try {
    const supabase = getSupabase();
    await syncProfilesFromAuthUsers();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post(
  "/api/v1/admin/users/:targetUid/approve",
  authenticate,
  checkAdmin,
  async (req, res) => {
    try {
      const supabase = getSupabase();
      const { targetUid } = req.params;
      const { isApproved } = req.body;
      const { error } = await supabase
        .from("profiles")
        .update({ status: isApproved ? "approved" : "pending" })
        .eq("id", targetUid);
      if (error) throw error;
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
);

app.post(
  "/api/v1/admin/users/:targetUid/subscription",
  authenticate,
  checkAdmin,
  async (req, res) => {
    try {
      const supabase = getSupabase();
      const { targetUid } = req.params;
      const { plan, expiry } = req.body;

      console.log(`🛠 [Admin] Updating sub for ${targetUid} to ${plan}`);

      const { error } = await supabase
        .from("profiles")
        .update({
          subscription_plan: plan,
          subscription_expiry: expiry,
        })
        .eq("id", targetUid);

      if (error) {
        console.error("❌ Supabase Update Error:", error);
        return res.status(400).json({
          error: error.message,
          details:
            "Vui lòng kiểm tra bảng profiles đã có cột subscription_plan và subscription_expiry chưa.",
        });
      }

      res.json({ success: true });
    } catch (e: any) {
      console.error("💥 Server Error in subscription update:", e.message);
      res.status(500).json({ error: e.message });
    }
  },
);

app.delete(
  "/api/v1/admin/users/:targetUid",
  authenticate,
  checkAdmin,
  async (req, res) => {
    try {
      const supabase = getSupabase();
      const { targetUid } = req.params;

      // 1. Delete associated links first
      await supabase.from("links").delete().eq("user_id", targetUid);

      // 2. Delete profile
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", targetUid);

      if (error) throw error;
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
);

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
    res.status(200).send(xml);
  } catch (error: any) {
    console.error("[SEO] sitemap generation failed:", error?.message || error);
    res.status(500).send("Failed to generate sitemap");
  }
});

app.get("/s/:shortCode", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { shortCode } = req.params;
    const { data: link } = await supabase
      .from("links")
      .select("*")
      .eq("short_code", shortCode)
      .single();
    if (!link) return res.status(404).send("Not found");

    const trafficSource = getTrafficSourceFromRequest(req);
    insertClickWithTracking(supabase, {
      link_id: link.id,
      user_agent: req.headers["user-agent"],
      ip: req.ip,
      ip_address: req.ip,
      source: trafficSource.source,
      source_detail: trafficSource.source_detail,
      referer: trafficSource.referer,
    }).catch((error) => {
      console.warn("[Clicks] insert failed:", error?.message || error);
    });

    const publicBaseUrl =
      getPublicBaseUrl(req) || `${req.protocol}://${req.get("host")}`;
    const canonicalUrl = `${publicBaseUrl}/s/${encodeURIComponent(shortCode)}`;
    const html = renderLinkLandingPage(link as PublicLinkRecord, canonicalUrl);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
  } catch (e) {
    res.status(500).send("Error");
  }
});

// D. FALLBACKS
app.all("/api/*", (req, res) => {
  res
    .status(404)
    .json({ error: `API route not found: ${req.method} ${req.url}` });
});

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("💥 FINAL EXPRESS ERROR:", err);
  res
    .status(500)
    .json({ error: "Internal Server Error", message: err.message });
});

// E. LOCAL SERVER START & VITE MIDDLEWARE
async function startLocalServer() {
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { port: 3001 } },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(__dirname, "../dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  }
}

if (!process.env.VERCEL) {
  startLocalServer().catch(console.error);
}

export default app;
