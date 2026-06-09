const escapeHtml = (unsafe: string): string => {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export type AppLinkMetaOptions = {
  androidUrl?: string | null;
  androidPackage?: string | null;
  androidAppName?: string | null;
  iosUrl?: string | null;
  iosAppName?: string | null;
  iosAppStoreId?: string | null;
};

export const buildAppLinkMetaTags = (
  canonicalUrl: string,
  primaryRedirectUrl?: string | null,
  appLinkOverrideUrl?: string | null,
  options?: AppLinkMetaOptions,
) => {
  const webUrl = primaryRedirectUrl?.trim() || canonicalUrl.trim();
  const fallbackAppUrl = appLinkOverrideUrl?.trim() || primaryRedirectUrl?.trim() || "";
  const androidUrl = options?.androidUrl?.trim() || fallbackAppUrl;
  const iosUrl = options?.iosUrl?.trim() || fallbackAppUrl;
  const hasAndroidUrl = Boolean(androidUrl?.trim());
  const hasIosUrl = Boolean(iosUrl?.trim());
  const tags = [
    `<meta property="al:web:url" content="${escapeHtml(webUrl)}" />`,
    `<meta property="al:web:should_fallback" content="true" />`,
  ];

  if (hasAndroidUrl || hasIosUrl) {
    if (hasIosUrl) {
      tags.push(`<meta property="al:ios:url" content="${escapeHtml(iosUrl)}" />`);
      if (options?.iosAppName?.trim()) {
        tags.push(
          `<meta property="al:ios:app_name" content="${escapeHtml(options.iosAppName.trim())}" />`,
        );
      }
      if (options?.iosAppStoreId?.trim()) {
        tags.push(
          `<meta property="al:ios:app_store_id" content="${escapeHtml(options.iosAppStoreId.trim())}" />`,
        );
      }
    }
    if (hasAndroidUrl) {
      tags.push(`<meta property="al:android:url" content="${escapeHtml(androidUrl)}" />`);
      if (options?.androidPackage?.trim()) {
        tags.push(
          `<meta property="al:android:package" content="${escapeHtml(options.androidPackage.trim())}" />`,
        );
      }
      if (options?.androidAppName?.trim()) {
        tags.push(
          `<meta property="al:android:app_name" content="${escapeHtml(options.androidAppName.trim())}" />`,
        );
      }
    }
  }

  return tags.join("\n");
};
