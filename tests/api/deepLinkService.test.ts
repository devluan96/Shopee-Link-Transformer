import test from "node:test";
import assert from "node:assert/strict";
import {
  applyDeepLinkTemplate,
  resolveDeepLinkUrl,
} from "../../api/services/deepLinkService.js";

test("applyDeepLinkTemplate replaces url placeholders", () => {
  const destinationUrl = "https://shopee.vn/product/123?campaign=summer sale";

  assert.equal(
    applyDeepLinkTemplate(
      "shopee://open?url={{encodedUrl}}&fallback={url}",
      destinationUrl,
    ),
    "shopee://open?url=https%3A%2F%2Fshopee.vn%2Fproduct%2F123%3Fcampaign%3Dsummer%20sale&fallback=https://shopee.vn/product/123?campaign=summer sale",
  );
});

test("resolveDeepLinkUrl picks platform and device templates", () => {
  const profiles = {
    shopee: {
      enabled: true,
      ios: "shopee://ios?url={{encodedUrl}}",
      android: "intent://android?url={url}",
      desktop: "https://fallback.example/redirect?url={url}",
    },
    tiktok: {
      enabled: true,
      desktop: "https://desktop.example/redirect?url={{encodedUrl}}",
    },
  };

  assert.equal(
    resolveDeepLinkUrl(
      "https://shopee.vn/product/123",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      profiles,
    ),
    "shopee://ios?url=https%3A%2F%2Fshopee.vn%2Fproduct%2F123",
  );
  assert.equal(
    resolveDeepLinkUrl(
      "https://shopee.vn/product/123",
      "Mozilla/5.0 (Linux; Android 14; Pixel 8)",
      profiles,
    ),
    "intent://android?url=https://shopee.vn/product/123",
  );
  assert.equal(
    resolveDeepLinkUrl(
      "https://www.tiktok.com/@demo/video/123",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      profiles,
    ),
    "https://desktop.example/redirect?url=https%3A%2F%2Fwww.tiktok.com%2F%40demo%2Fvideo%2F123",
  );
});

test("resolveDeepLinkUrl falls back for unsupported destinations", () => {
  const profiles = {
    shopee: {
      enabled: true,
      desktop: "https://fallback.example/redirect?url={{url}}",
    },
  };

  assert.equal(
    resolveDeepLinkUrl(
      "https://example.com/article/1",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      profiles,
    ),
    "https://example.com/article/1",
  );
});
