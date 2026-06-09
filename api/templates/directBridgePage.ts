import { PublicLinkRecord } from "../types/index.js";
import { buildAppLinkMetaTags } from "./appLinks.js";

const escapeHtml = (unsafe: string): string => {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const escapeJsString = (value: string) => {
  if (!value) return "";
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
};

const capitalizeFirstCharacter = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  const firstCharacter = trimmed.charAt(0).toLocaleUpperCase("vi-VN");
  return `${firstCharacter}${trimmed.slice(1)}`;
};

const isTikTokHostname = (destinationUrl: string) => {
  try {
    const hostname = new URL(destinationUrl).hostname.trim().toLowerCase();
    return hostname === "tiktok.com" || hostname.endsWith(".tiktok.com");
  } catch {
    return false;
  }
};

const buildTikTokAppScheme = (destinationUrl: string) => {
  const encodedUrl = encodeURIComponent(destinationUrl);
  return `snssdk1180://ec/pdp?biz_type=0&need_mall=1&needlaunchlog=1&page_name=reflow_pdp&params_url=${encodedUrl}&refer=web&scene=pdp&use_land_page=1`;
};

const buildAppLinkOverride = (destinationUrl: string) => {
  if (!isTikTokHostname(destinationUrl)) return null;
  return buildTikTokAppScheme(destinationUrl);
};

const TIKTOK_ANDROID_PACKAGE = "com.ss.android.ugc.trill";
const TIKTOK_APP_NAME = "TikTok";
const TIKTOK_APP_STORE_ID = "1235601864";
const FACEBOOK_APP_ID = "1862952583919182";

export const renderDirectBridgePage = (
  link: PublicLinkRecord,
  canonicalUrl: string,
  options?: {
    primaryRedirectUrl?: string;
  },
) => {
  const title = capitalizeFirstCharacter(
    link.custom_title?.trim() || "HotsNew Click",
  );
  const description = capitalizeFirstCharacter(
    link.custom_description?.trim() ||
      "Đang mở ứng dụng gốc để tiếp tục xem nội dung.",
  );
  const imageUrl = link.custom_image_url?.trim() || "";
  const originBase = new URL(canonicalUrl).origin;
  const defaultOgImage = `${originBase}/og-image.png`;
  const fallbackFavicon = `${originBase}/logo-app-192.png`;
  const primaryRedirectUrl =
    options?.primaryRedirectUrl?.trim() || link.original_url.trim();
  const appLinkOverrideUrl = buildAppLinkOverride(primaryRedirectUrl);
  const webFallbackUrl = primaryRedirectUrl;
  const socialImageUrl = imageUrl || defaultOgImage;
  const faviconUrl = imageUrl || fallbackFavicon;

  return `<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="noindex, nofollow" />
    <link rel="icon" href="${escapeHtml(faviconUrl)}" />
    <link rel="shortcut icon" href="${escapeHtml(faviconUrl)}" />
    <link rel="apple-touch-icon" href="${escapeHtml(faviconUrl)}" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <meta property="fb:app_id" content="${FACEBOOK_APP_ID}" />
    ${buildAppLinkMetaTags(canonicalUrl, primaryRedirectUrl, appLinkOverrideUrl, appLinkOverrideUrl ? {
      androidPackage: TIKTOK_ANDROID_PACKAGE,
      androidAppName: TIKTOK_APP_NAME,
      iosAppName: TIKTOK_APP_NAME,
      iosAppStoreId: TIKTOK_APP_STORE_ID,
    } : undefined)}
    <meta property="og:locale" content="vi_VN" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:site_name" content="HotsNew Click" />
    <meta property="og:image" content="${escapeHtml(socialImageUrl)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(socialImageUrl)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(socialImageUrl)}" />
    <style>
      :root {
        color-scheme: dark;
        --bg: #050b16;
        --panel: rgba(8, 16, 30, 0.78);
        --border: rgba(255, 255, 255, 0.12);
        --text: #f8fafc;
        --muted: rgba(226, 232, 240, 0.78);
        --accent: #fb7185;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at 16% 18%, rgba(34, 211, 238, 0.24), transparent 22%),
          radial-gradient(circle at 82% 20%, rgba(251, 113, 133, 0.22), transparent 24%),
          linear-gradient(135deg, #020617 0%, #050b16 45%, #0f172a 100%);
        overflow: hidden;
      }
      .shell {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 1rem;
      }
      .card {
        width: min(30rem, 94vw);
        border: 1px solid var(--border);
        border-radius: 1.5rem;
        background: var(--panel);
        backdrop-filter: blur(20px) saturate(130%);
        box-shadow: 0 1.25rem 3rem rgba(0, 0, 0, 0.28);
        padding: 1.35rem;
      }
      .eyebrow {
        font-size: 0.7rem;
        font-weight: 900;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: rgba(226, 232, 240, 0.72);
      }
      .title {
        margin: 0.55rem 0 0;
        font-size: 1.35rem;
        line-height: 1.35;
      }
      .desc {
        margin: 0.7rem 0 0;
        color: var(--muted);
        font-size: 0.95rem;
        line-height: 1.6;
      }
      .actions {
        display: grid;
        gap: 0.75rem;
        margin-top: 1.15rem;
      }
      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        min-height: 3rem;
        padding: 0.9rem 1.1rem;
        border-radius: 999px;
        text-decoration: none;
        font-size: 0.86rem;
        font-weight: 900;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        border: 0;
      }
      .button-primary {
        color: #fff;
        background: linear-gradient(135deg, rgba(251, 113, 133, 0.98), rgba(249, 115, 22, 0.98));
        box-shadow: 0 1rem 2rem rgba(249, 115, 22, 0.22);
      }
      .button-secondary {
        color: rgba(226, 232, 240, 0.92);
        background: rgba(30, 41, 59, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.12);
      }
      .hint {
        margin-top: 0.9rem;
        color: rgba(226, 232, 240, 0.6);
        font-size: 0.8rem;
        line-height: 1.5;
        text-align: center;
      }
      .spinner {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 999px;
        border: 3px solid rgba(255,255,255,0.15);
        border-top-color: rgba(251, 113, 133, 0.95);
        animation: spin 0.9s linear infinite;
        margin-bottom: 1rem;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <section class="card" aria-label="Bridge page">
        <div class="spinner" aria-hidden="true"></div>
        <div class="eyebrow">Đang mở ứng dụng</div>
        <h1 class="title">${escapeHtml(title)}</h1>
        <p class="desc">${escapeHtml(description)}</p>
        <div class="actions">
          <a class="button button-primary" id="openAppButton" href="${escapeHtml(webFallbackUrl)}" rel="nofollow">Mở trong ứng dụng</a>
          <a class="button button-secondary" id="openWebButton" href="${escapeHtml(webFallbackUrl)}" rel="nofollow">Mở bằng web</a>
        </div>
        <div class="hint">Nếu ứng dụng chưa tự mở, bạn vẫn có thể dùng nút bên trên để tiếp tục.</div>
      </section>
    </main>
    <script>
      (() => {
        const webUrl = "${escapeJsString(webFallbackUrl)}";
        const openButton = document.getElementById("openAppButton");
        const webButton = document.getElementById("openWebButton");
        if (openButton) {
          openButton.setAttribute("href", webUrl);
        }
        if (webButton) {
          webButton.setAttribute("href", webUrl);
        }
        window.location.replace(webUrl);
      })();
    </script>
  </body>
</html>`;
};
