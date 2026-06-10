import test from "node:test";
import assert from "node:assert/strict";

import { renderDirectBridgePage } from "../../api/templates/directBridgePage.js";
import type { PublicLinkRecord } from "../../api/types/index.js";

const createLink = (
  overrides: Partial<PublicLinkRecord> = {},
): PublicLinkRecord =>
  ({
    id: "test-id",
    slug: "test-slug",
    original_url: "https://www.tiktok.com/@demo/video/123456789",
    created_at: new Date().toISOString(),
    clicks: 0,
    ...overrides,
  }) as PublicLinkRecord;

test("renderDirectBridgePage emits minimal bridge markup for TikTok targets", () => {
  const link = createLink();
  const html = renderDirectBridgePage(link, "https://hotsnew.click/test-slug");

  assert.match(html, /<!DOCTYPE html>/i);
  assert.match(html, /<html lang="vi">/i);
  assert.match(html, /<title>HotsNew Click<\/title>/i);
  assert.match(html, /property="og:title"/i);
  assert.match(html, /property="og:description"/i);
  assert.match(html, /property="og:image"/i);
  assert.match(html, /snssdk1233:\/\/aweme\/detail\/\?aweme_id=123456789/i);
  assert.match(
    html,
    /property="al:android:package" content="com\.ss\.android\.ugc\.trill"/i,
  );
  assert.match(html, /property="al:android:app_name" content="TikTok"/i);
  assert.match(html, /property="al:ios:app_name" content="TikTok"/i);
  assert.match(html, /property="al:ios:app_store_id" content="1235601864"/i);
  assert.match(html, /window\.location\.href = appUrl/i);
  assert.match(html, /window\.location\.replace\(webUrl\)/i);
  assert.match(html, /FBAN\|FBAV\|FB_IAB\|FBIOS/i);
  assert.match(html, /ZaloApp/i);
  assert.match(html, /isInAppBrowser && isIOS/i);
  assert.match(html, /isInAppBrowser && isAndroid/i);
  assert.match(html, /intent:\/\//i);
});

test("renderDirectBridgePage renders TikTok Shop deep links", () => {
  const link = createLink({
    original_url: "https://shop.tiktok.com/view/product/1731105588598300000",
  });
  const html = renderDirectBridgePage(link, "https://hotsnew.click/shop-link");

  assert.match(html, /snssdk1180:\/\/ec\/pdp/i);
  assert.match(html, /params_url=/i);
  assert.match(html, /refer=web/i);
  assert.match(html, /biz_type=0/i);
  assert.match(html, /need_mall=1/i);
});

test("renderDirectBridgePage handles Shopee short links", () => {
  const link = createLink({
    original_url: "https://s.shopee.vn/ABC123",
  });
  const html = renderDirectBridgePage(
    link,
    "https://hotsnew.click/shopee-link",
  );

  assert.doesNotMatch(html, /snssdk1233:\/\//i);
  assert.doesNotMatch(html, /snssdk1180:\/\//i);
  assert.match(
    html,
    /property="al:android:package" content="com\.shopee\.vn"/i,
  );
  assert.match(html, /property="al:ios:app_store_id" content="959841449"/i);
  assert.match(html, /property="al:ios:app_name" content="Shopee"/i);
  assert.match(html, /com\.shopee\.vn/i);
  assert.match(html, /isInAppBrowser && isIOS/i);
  assert.match(html, /window\.location\.replace\(webUrl\)/i);
});

test("renderDirectBridgePage falls back for non TikTok/Shopee links", () => {
  const link = createLink({
    original_url: "https://example.com/article",
  });
  const html = renderDirectBridgePage(
    link,
    "https://hotsnew.click/example-link",
  );

  assert.doesNotMatch(html, /snssdk1233:\/\//i);
  assert.doesNotMatch(html, /snssdk1180:\/\//i);
  assert.match(html, /window\.location\.replace\(webUrl\)/i);
});

test("renderDirectBridgePage escapes html safely", () => {
  const link = createLink({
    custom_title: `<script>alert("xss")</script>`,
    custom_description: `"quoted" <b>tag</b>`,
  });
  const html = renderDirectBridgePage(
    link,
    "https://hotsnew.click/escape-test",
  );

  assert.doesNotMatch(html, /<script>alert/i);
  assert.match(html, /&lt;script&gt;/i);
  assert.match(html, /&quot;quoted&quot;/i);
});
