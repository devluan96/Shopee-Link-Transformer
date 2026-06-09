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

const buildTikTokAppScheme = (destinationUrl: string): string => {
  const url = new URL(destinationUrl);
  const path = url.pathname;

  // TikTok Shop product page
  if (path.includes("/view/") || url.hostname.includes("shop")) {
    const encodedUrl = encodeURIComponent(destinationUrl);
    return `snssdk1180://ec/pdp?biz_type=0&need_mall=1&page_name=reflow_pdp&params_url=${encodedUrl}&refer=web&scene=pdp`;
  }

  // Video page: /video/123456
  if (path.match(/\/video\/(\d+)/)) {
    const videoId = path.match(/\/video\/(\d+)/)![1];
    return `snssdk1233://aweme/detail/?aweme_id=${videoId}`;
  }

  // Profile page: /@username
  if (path.match(/\/@[\w.]+/)) {
    const username = path.match(/\/@([\w.]+)/)![1];
    return `snssdk1233://user/profile/?uniqueId=${username}`;
  }

  // Fallback: universal scheme
  return `snssdk1233://`;
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
    ${buildAppLinkMetaTags(
      canonicalUrl,
      webFallbackUrl,
      appLinkOverrideUrl,
      appLinkOverrideUrl
        ? {
            androidPackage: TIKTOK_ANDROID_PACKAGE,
            androidAppName: TIKTOK_APP_NAME,
            iosAppName: TIKTOK_APP_NAME,
            iosAppStoreId: TIKTOK_APP_STORE_ID,
          }
        : undefined,
    )}
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
  </head>
    <body>
    <script>
      (() => {
        const appUrl   = "${escapeJsString(appLinkOverrideUrl || "")}";
        const webUrl   = "${escapeJsString(webFallbackUrl)}";
        const ua       = navigator.userAgent || "";

        // Detect Facebook / Zalo in-app browser
        const isFbBrowser  = /FBAN|FBAV|FB_IAB|FBIOS/i.test(ua);
        const isZalo       = /ZaloApp/i.test(ua);
        const isInAppBrowser = isFbBrowser || isZalo;

        // Không có app scheme → redirect web thẳng
        if (!appUrl) {
          window.location.replace(webUrl);
          return;
        }

        // Trong Facebook in-app browser: dùng intent URL (Android)
        // hoặc universal link để bypass popup
        if (isInAppBrowser) {
          const isAndroid = /android/i.test(ua);
          const isIOS     = /iphone|ipad|ipod/i.test(ua);

          if (isAndroid) {
            // Intent URL sẽ mở app trực tiếp, bỏ qua popup Facebook
            const intentUrl =
              "intent://" +
              webUrl.replace(/^https?:\/\//, "") +
              "#Intent;scheme=https;package=com.ss.android.ugc.trill;end";
            window.location.href = intentUrl;
            return;
          }

          if (isIOS) {
            // Universal link — iOS sẽ tự nhận và mở TikTok app
            // không cần scheme, không hiện popup
            window.location.replace(webUrl);
            return;
          }
        }

        // Trình duyệt thông thường: thử app scheme trước, fallback web
        const timer = setTimeout(() => {
          window.location.replace(webUrl);
        }, 1500);

        // Nếu app mở được, page sẽ bị blur → clear timer
        window.addEventListener("blur", () => clearTimeout(timer));
        window.addEventListener("pagehide", () => clearTimeout(timer));

        window.location.href = appUrl;
      })();
    </script>
  </body>
</html>`;
};
