import test from "node:test";
import assert from "node:assert/strict";
import { renderDirectBridgePage } from "../../api/templates/directBridgePage.js";
import type { PublicLinkRecord } from "../../api/types/index.js";

const sampleLink: PublicLinkRecord = {
  id: "link-1",
  short_code: "test11",
  original_url: "https://www.tiktok.com/view/product/1731062681949079816",
  secondary_url: "",
  custom_title: "test11",
  custom_description: "mo ta test",
  custom_image_url: "https://cdn.example.com/preview.jpg",
  video_url: "",
};

const TIKTOK_SHOP_URL =
  "https://www.tiktok.com/view/product/1731062681949079816";
const TIKTOK_SHOP_SCHEME =
  "snssdk1233://ec/pdp?params_url=" +
  encodeURIComponent(TIKTOK_SHOP_URL) +
  "&refer=web";
const TIKTOK_SHOP_SCHEME_ESCAPED = TIKTOK_SHOP_SCHEME.replace(/&/g, "&amp;");

// ─── TikTok Shop ────────────────────────────────────────────────────────────

test("renderDirectBridgePage — TikTok Shop: App Link meta tags", () => {
  const html = renderDirectBridgePage(
    sampleLink,
    "https://test.hotsnew.click/test11",
    {
      primaryRedirectUrl: TIKTOK_SHOP_URL,
    },
  );

  // fb:app_id
  assert.match(
    html,
    /<meta property="fb:app_id" content="1862952583919182" \/>/,
  );

  // al:web:url
  assert.match(
    html,
    /<meta property="al:web:url" content="https:\/\/www\.tiktok\.com\/view\/product\/1731062681949079816" \/>/,
  );

  // al:ios:url — snssdk1233 scheme
  assert.match(
    html,
    new RegExp(
      `<meta property="al:ios:url" content="${TIKTOK_SHOP_SCHEME_ESCAPED.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}" \\/>`,
    ),
  );

  // al:android:url — snssdk1233 scheme
  assert.match(
    html,
    new RegExp(
      `<meta property="al:android:url" content="${TIKTOK_SHOP_SCHEME_ESCAPED.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}" \\/>`,
    ),
  );

  // android package & app name
  assert.match(
    html,
    /<meta property="al:android:package" content="com\.ss\.android\.ugc\.trill" \/>/,
  );
  assert.match(
    html,
    /<meta property="al:android:app_name" content="TikTok" \/>/,
  );
  assert.match(html, /<meta property="al:ios:app_name" content="TikTok" \/>/);
  assert.match(
    html,
    /<meta property="al:ios:app_store_id" content="1235601864" \/>/,
  );
});

test("renderDirectBridgePage — TikTok Shop: script có đủ biến", () => {
  const html = renderDirectBridgePage(
    sampleLink,
    "https://test.hotsnew.click/test11",
    {
      primaryRedirectUrl: TIKTOK_SHOP_URL,
    },
  );

  // appUrl và webUrl phải có mặt trong script
  assert.match(html, /const appUrl\s*=/);
  assert.match(html, /const webUrl\s*=/);
  assert.match(
    html,
    new RegExp(`"${TIKTOK_SHOP_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`),
  );
});

test("renderDirectBridgePage — TikTok Shop: script xử lý Intent URL cho Android in-app", () => {
  const html = renderDirectBridgePage(
    sampleLink,
    "https://test.hotsnew.click/test11",
    {
      primaryRedirectUrl: TIKTOK_SHOP_URL,
    },
  );

  assert.match(html, /isAndroid/);
  assert.match(html, /isFacebook|isInApp/);
  assert.match(html, /intent:\/\//);
  assert.match(html, /com\.ss\.android\.ugc\.trill/);
});

test("renderDirectBridgePage — TikTok Shop: script fallback web sau timeout", () => {
  const html = renderDirectBridgePage(
    sampleLink,
    "https://test.hotsnew.click/test11",
    {
      primaryRedirectUrl: TIKTOK_SHOP_URL,
    },
  );

  assert.match(html, /setTimeout/);
  assert.match(html, /window\.location\.(replace|href)\s*=\s*webUrl/);
});

test("renderDirectBridgePage — TikTok Shop: không có UI button", () => {
  const html = renderDirectBridgePage(
    sampleLink,
    "https://test.hotsnew.click/test11",
    {
      primaryRedirectUrl: TIKTOK_SHOP_URL,
    },
  );

  assert.doesNotMatch(html, /openAppButton/);
  assert.doesNotMatch(html, /openWebButton/);
});

// ─── TikTok Video ───────────────────────────────────────────────────────────

test("renderDirectBridgePage — TikTok Video: al:ios:url dùng snssdk1233://aweme/detail", () => {
  const html = renderDirectBridgePage(
    {
      ...sampleLink,
      original_url: "https://www.tiktok.com/@user/video/7391234567890123456",
    },
    "https://test.hotsnew.click/test11",
    {
      primaryRedirectUrl:
        "https://www.tiktok.com/@user/video/7391234567890123456",
    },
  );

  assert.match(
    html,
    /snssdk1233:\/\/aweme\/detail\/\?aweme_id=7391234567890123456/,
  );
});

// ─── TikTok Profile ─────────────────────────────────────────────────────────

test("renderDirectBridgePage — TikTok Profile: al:ios:url dùng snssdk1233://user/profile", () => {
  const html = renderDirectBridgePage(
    { ...sampleLink, original_url: "https://www.tiktok.com/@someuser" },
    "https://test.hotsnew.click/test11",
    { primaryRedirectUrl: "https://www.tiktok.com/@someuser" },
  );

  assert.match(html, /snssdk1233:\/\/user\/profile\/\?uniqueId=someuser/);
});

// ─── Non-TikTok (Shopee) ────────────────────────────────────────────────────

test("renderDirectBridgePage — Shopee: al:ios:url và al:android:url dùng https", () => {
  const html = renderDirectBridgePage(
    { ...sampleLink, original_url: "https://s.shopee.vn/70HVE1d0qK" },
    "https://test.hotsnew.click/test11",
  );

  assert.match(
    html,
    /<meta property="al:ios:url" content="https:\/\/s\.shopee\.vn\/70HVE1d0qK" \/>/,
  );
  assert.match(
    html,
    /<meta property="al:android:url" content="https:\/\/s\.shopee\.vn\/70HVE1d0qK" \/>/,
  );
  // Không có android:package vì không phải TikTok
  assert.doesNotMatch(html, /al:android:package/);
  assert.doesNotMatch(html, /openAppButton/);
  assert.doesNotMatch(html, /openWebButton/);
});
