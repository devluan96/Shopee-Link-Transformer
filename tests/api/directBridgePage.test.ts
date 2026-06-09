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

test("renderDirectBridgePage exposes TikTok app link metadata and redirects to the HTTPS target", () => {
  const html = renderDirectBridgePage(
    sampleLink,
    "https://test.hotsnew.click/test11",
    {
      primaryRedirectUrl: "https://www.tiktok.com/view/product/1731062681949079816",
    },
  );

  assert.match(
    html,
    /<meta property="al:web:url" content="https:\/\/www\.tiktok\.com\/view\/product\/1731062681949079816" \/>/,
  );
  assert.match(
    html,
    /<meta property="fb:app_id" content="1862952583919182" \/>/,
  );
  assert.match(
    html,
    /<meta property="og:image:width" content="1200" \/>/,
  );
  assert.match(
    html,
    /<meta property="og:image:height" content="630" \/>/,
  );
  assert.match(
    html,
    /<meta property="og:image:type" content="image\/jpeg" \/>/,
  );
  assert.match(
    html,
    /<meta property="al:ios:url" content="snssdk1180:\/\/ec\/pdp\?biz_type=0&amp;need_mall=1&amp;needlaunchlog=1&amp;page_name=reflow_pdp&amp;params_url=https%3A%2F%2Fwww\.tiktok\.com%2Fview%2Fproduct%2F1731062681949079816&amp;refer=web&amp;scene=pdp&amp;use_land_page=1" \/>/,
  );
  assert.match(
    html,
    /<meta property="al:android:url" content="snssdk1180:\/\/ec\/pdp\?biz_type=0&amp;need_mall=1&amp;needlaunchlog=1&amp;page_name=reflow_pdp&amp;params_url=https%3A%2F%2Fwww\.tiktok\.com%2Fview%2Fproduct%2F1731062681949079816&amp;refer=web&amp;scene=pdp&amp;use_land_page=1" \/>/,
  );
  assert.match(
    html,
    /<meta property="al:android:package" content="com\.ss\.android\.ugc\.trill" \/>/,
  );
  assert.match(
    html,
    /<meta property="al:android:app_name" content="TikTok" \/>/,
  );
  assert.match(
    html,
    /<meta property="al:ios:app_name" content="TikTok" \/>/,
  );
  assert.match(
    html,
    /<meta property="al:ios:app_store_id" content="1235601864" \/>/,
  );
  assert.match(
    html,
    /<a class="button button-primary" id="openAppButton" href="https:\/\/www\.tiktok\.com\/view\/product\/1731062681949079816" rel="nofollow">Mở trong ứng dụng<\/a>/,
  );
  assert.match(
    html,
    /<a class="button button-secondary" id="openWebButton" href="https:\/\/www\.tiktok\.com\/view\/product\/1731062681949079816" rel="nofollow">Mở bằng web<\/a>/,
  );
  assert.doesNotMatch(html, /const appUrl = /);
  assert.match(
    html,
    /const webUrl = "https:\/\/www\.tiktok\.com\/view\/product\/1731062681949079816";/,
  );
  assert.match(html, /window\.location\.replace\(webUrl\);/);
  assert.doesNotMatch(html, /window\.location\.href = appUrl;/);
});

test("renderDirectBridgePage keeps non-TikTok targets on HTTPS app links", () => {
  const html = renderDirectBridgePage(
    {
      ...sampleLink,
      original_url: "https://s.shopee.vn/70HVE1d0qK",
    },
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
  assert.doesNotMatch(html, /al:android:package/);
});
