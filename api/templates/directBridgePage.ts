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

const isTikTokHostname = (url: string) => {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return h === "tiktok.com" || h.endsWith(".tiktok.com");
  } catch {
    return false;
  }
};

const isShopeeHostname = (url: string) => {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return (
      h === "shopee.vn" ||
      h.endsWith(".shopee.vn") ||
      h === "shope.ee" ||
      h.endsWith(".shope.ee")
    );
  } catch {
    return false;
  }
};

const buildTikTokAppScheme = (destinationUrl: string): string => {
  try {
    const url = new URL(destinationUrl);
    const path = url.pathname;

    const videoMatch = path.match(/\/video\/(\d+)/);
    if (videoMatch) {
      return `snssdk1233://aweme/detail/?aweme_id=${videoMatch[1]}`;
    }

    const profileMatch = path.match(/\/@([\w.]+)/);
    if (profileMatch) {
      return `snssdk1233://user/profile/?uniqueId=${profileMatch[1]}`;
    }

    if (path.includes("/view/product/") || url.hostname.includes("shop")) {
      const productMatch = path.match(/\/view\/product\/(\d+)/);
      const productId = productMatch?.[1] || "";
      const encodedUrl = encodeURIComponent(destinationUrl);
      return (
        `snssdk1180://ec/pdp` +
        `?biz_type=0&need_mall=1&needlaunchlog=1&page_name=reflow_pdp` +
        `&params_url=${encodedUrl}&refer=web&is_commerce=1` +
        (productId
          ? `&requestParams=${encodeURIComponent(JSON.stringify({ product_id: [productId] }))}`
          : "")
      );
    }

    return destinationUrl;
  } catch {
    return destinationUrl;
  }
};

const buildAppLinkOverride = (destinationUrl: string): string | null => {
  if (isTikTokHostname(destinationUrl)) {
    return buildTikTokAppScheme(destinationUrl);
  }
  if (isShopeeHostname(destinationUrl)) {
    return null; // ← Shopee không cần override scheme
  }
  return null;
};

const TIKTOK_ANDROID_PACKAGE = "com.ss.android.ugc.trill";
const TIKTOK_APP_NAME = "TikTok";
const TIKTOK_APP_STORE_ID = "1235601864";

const SHOPEE_ANDROID_PACKAGE = "com.shopee.vn";
const SHOPEE_APP_NAME = "Shopee";
const SHOPEE_APP_STORE_ID = "959841449";

const FACEBOOK_APP_ID = "1609970790226254";

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
  const isTikTok = isTikTokHostname(primaryRedirectUrl);
  const isShopee = isShopeeHostname(primaryRedirectUrl);

  const appMeta = isTikTok
    ? {
        androidPackage: TIKTOK_ANDROID_PACKAGE,
        androidAppName: TIKTOK_APP_NAME,
        iosAppName: TIKTOK_APP_NAME,
        iosAppStoreId: TIKTOK_APP_STORE_ID,
      }
    : isShopee
      ? {
          androidPackage: SHOPEE_ANDROID_PACKAGE,
          androidAppName: SHOPEE_APP_NAME,
          iosAppName: SHOPEE_APP_NAME,
          iosAppStoreId: SHOPEE_APP_STORE_ID,
        }
      : undefined;

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
      appMeta, // ← luôn truyền, kể cả khi appLinkOverrideUrl = null
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
        const appUrl = "${escapeJsString(appLinkOverrideUrl || "")}";
        const webUrl = "${escapeJsString(webFallbackUrl)}";
        const ua     = navigator.userAgent || "";

        const isFbBrowser    = /FBAN|FBAV|FB_IAB|FBIOS/i.test(ua);
        const isZalo         = /ZaloApp/i.test(ua);
        const isInAppBrowser = isFbBrowser || isZalo;
        const isIOS          = /iphone|ipad|ipod/i.test(ua);
        const isAndroid      = /android/i.test(ua);

        // DEBUG: hiển thị info lên màn hình
        document.body.style.cssText = "background:#fff;color:#000;padding:20px;font-size:13px;font-family:monospace;white-space:pre-wrap;word-break:break-all";
        document.body.innerHTML = JSON.stringify({
          appUrl: appUrl || "(empty)",
          webUrl,
          isFbBrowser,
          isZalo,
          isInAppBrowser,
          isIOS,
          isAndroid,
          ua
        }, null, 2);

      })();
    </script>
  </body>
</html>`;
};
