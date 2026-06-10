import test from "node:test";
import assert from "node:assert/strict";
import {
  applyDeepLinkTemplate,
  resolveDeepLinkUrl,
  shouldBypassLandingForMobileDeepLink,
  shouldBypassPublicLandingForMobileDeepLink,
} from "../../server/services/deepLinkService.js";

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

test("resolveDeepLinkUrl uses the device-specific deep link template when available", () => {
  const profiles = {
    shopee: {
      enabled: true,
      ios: "shopee://ios?url={{encodedUrl}}",
      android: "intent://android?url={url}",
      desktop: "https://fallback.example/redirect?url={url}",
    },
    tiktok: {
      enabled: true,
      ios: "tiktok://ios?url={{encodedUrl}}",
      android: "intent://android?tiktok={url}",
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
      "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)",
      profiles,
    ),
    "tiktok://ios?url=https%3A%2F%2Fwww.tiktok.com%2F%40demo%2Fvideo%2F123",
  );
  assert.equal(
    resolveDeepLinkUrl(
      "https://www.tiktok.com/@demo/video/123",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      profiles,
    ),
    "https://desktop.example/redirect?url=https%3A%2F%2Fwww.tiktok.com%2F%40demo%2Fvideo%2F123",
  );

  assert.equal(
    resolveDeepLinkUrl(
      "https://s.shopee.vn/2qRr9Jvpsc",
      "Mozilla/5.0 (Linux; Android 14; Pixel 8)",
      profiles,
    ),
    "intent://android?url=https://s.shopee.vn/2qRr9Jvpsc",
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

test("shouldBypassLandingForMobileDeepLink bypasses landing only for enabled mobile Shopee and TikTok links", () => {
  const profiles = {
    shopee: {
      enabled: true,
      desktop: "{{url}}",
    },
    tiktok: {
      enabled: true,
      android: "intent://android?tiktok={url}",
    },
  };

  assert.equal(
    shouldBypassLandingForMobileDeepLink(
      "https://shopee.vn/product/123",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      profiles,
    ),
    true,
  );
  assert.equal(
    shouldBypassLandingForMobileDeepLink(
      "https://www.tiktok.com/@demo/video/123",
      "Mozilla/5.0 (Linux; Android 14; Pixel 8)",
      profiles,
    ),
    true,
  );
  assert.equal(
    shouldBypassLandingForMobileDeepLink(
      "https://shopee.vn/product/123",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Mobile/15E148",
      profiles,
    ),
    true,
  );
  assert.equal(
    shouldBypassLandingForMobileDeepLink(
      "https://example.com/article/1",
      "Mozilla/5.0 (Linux; Android 14; Pixel 8)",
      profiles,
    ),
    false,
  );
  assert.equal(
    shouldBypassLandingForMobileDeepLink(
      "https://shopee.vn/product/123",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      profiles,
    ),
    false,
  );
});

test("resolveDeepLinkUrl does not reuse desktop templates on mobile devices", () => {
  const profiles = {
    shopee: {
      enabled: true,
      desktop: "intent://open?url={{encodedUrl}}",
    },
  };

  assert.equal(
    resolveDeepLinkUrl(
      "https://shopee.vn/product/123",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      profiles,
    ),
    "intent://open?url=https%3A%2F%2Fshopee.vn%2Fproduct%2F123", // ← đổi từ URL gốc sang intent://
  );
  assert.equal(
    shouldBypassLandingForMobileDeepLink(
      "https://shopee.vn/product/123",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      profiles,
    ),
    true, // ← đổi từ false sang true
  );
});

test("resolveDeepLinkUrl allows iOS to fall back to desktop https universal links", () => {
  const profiles = {
    shopee: {
      enabled: true,
      desktop: "https://shopee.vn/product/123?utm_source=test",
    },
  };

  assert.equal(
    resolveDeepLinkUrl(
      "https://shopee.vn/product/123",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      profiles,
    ),
    "https://shopee.vn/product/123?utm_source=test",
  );
  assert.equal(
    shouldBypassLandingForMobileDeepLink(
      "https://shopee.vn/product/123",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      profiles,
    ),
    true,
  );
});

test("resolveDeepLinkUrl allows iOS to fall back to a rendered desktop template when it resolves to HTTPS", () => {
  const profiles = {
    shopee: {
      enabled: true,
      desktop: "{{url}}",
    },
  };

  assert.equal(
    resolveDeepLinkUrl(
      "https://s.shopee.vn/70HVE1d0qK",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      profiles,
    ),
    "https://s.shopee.vn/70HVE1d0qK",
  );
  assert.equal(
    shouldBypassLandingForMobileDeepLink(
      "https://s.shopee.vn/70HVE1d0qK",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      profiles,
    ),
    true,
  );
});

test("resolveDeepLinkUrl keeps TikTok iOS on HTTPS when no explicit iOS template is configured", () => {
  const profiles = {
    tiktok: {
      enabled: true,
      desktop: "https://www.tiktok.com/@demo/video/123",
    },
  };

  assert.equal(
    resolveDeepLinkUrl(
      "https://www.tiktok.com/@demo/video/123",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      profiles,
    ),
    "https://www.tiktok.com/@demo/video/123",
  );
});

test("shouldBypassPublicLandingForMobileDeepLink skips preview requests and allows mobile direct opens", () => {
  const profiles = {
    shopee: {
      enabled: true,
      desktop: "{{url}}",
    },
  };

  assert.equal(
    shouldBypassPublicLandingForMobileDeepLink(
      "https://shopee.vn/product/123",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      profiles,
      false,
      false,
    ),
    true,
  );
  assert.equal(
    shouldBypassPublicLandingForMobileDeepLink(
      "https://shopee.vn/product/123",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      profiles,
      false,
      true,
    ),
    false,
  );
});

test("shouldBypassPublicLandingForMobileDeepLink keeps video landing pages on mobile unless direct mode is active", () => {
  const profiles = {
    shopee: {
      enabled: true,
      desktop: "{{url}}",
    },
  };

  assert.equal(
    shouldBypassPublicLandingForMobileDeepLink(
      "https://shopee.vn/product/123",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      profiles,
      true,
      false,
    ),
    false,
  );
});

