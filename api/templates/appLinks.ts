const escapeHtml = (unsafe: string): string => {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const isHttpUrl = (value?: string | null) =>
  /^https?:\/\//i.test((value || "").trim());

export const buildAppLinkMetaTags = (
  canonicalUrl: string,
  primaryRedirectUrl?: string | null,
) => {
  const tags = [
    `<meta property="al:web:url" content="${escapeHtml(canonicalUrl.trim())}" />`,
    `<meta property="al:web:should_fallback" content="true" />`,
  ];

  const appLinkUrl = primaryRedirectUrl?.trim();
  if (appLinkUrl && isHttpUrl(appLinkUrl)) {
    const safeAppLinkUrl = escapeHtml(appLinkUrl);
    tags.push(`<meta property="al:ios:url" content="${safeAppLinkUrl}" />`);
    tags.push(`<meta property="al:android:url" content="${safeAppLinkUrl}" />`);
  }

  return tags.join("");
};
