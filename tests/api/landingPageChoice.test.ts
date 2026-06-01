import test from "node:test";
import assert from "node:assert/strict";
import { renderChoiceLandingPage } from "../../api/templates/landingPageChoice.js";
import type { PublicLinkRecord } from "../../api/types/index.js";

const sampleLink: PublicLinkRecord = {
  id: "link-1",
  short_code: "test11",
  original_url: "https://example.com/original",
  secondary_url: "https://shopee.vn/secondary",
  custom_title: "test11",
  custom_description: "mo ta test",
  custom_image_url: "https://cdn.example.com/preview.jpg",
  video_url: "https://cdn.example.com/demo.mp4",
};

test("renderChoiceLandingPage keeps social preview metadata for test domains", () => {
  const html = renderChoiceLandingPage(
    sampleLink,
    "https://test.hotsnew.click/test11",
    "https://test.hotsnew.click/api/v1/public-links/test11/track",
    { experimental: false },
  );

  assert.match(
    html,
    /<meta property="og:title" content="Test11" \/>/,
  );
  assert.match(
    html,
    /<meta property="og:description" content="Mo ta test" \/>/,
  );
  assert.match(
    html,
    /<meta property="og:image" content="https:\/\/cdn\.example\.com\/preview\.jpg" \/>/,
  );
  assert.match(
    html,
    /<meta property="og:url" content="https:\/\/test\.hotsnew\.click\/test11" \/>/,
  );
});

test("renderChoiceLandingPage waits for actual playback instead of page-load timeout", () => {
  const html = renderChoiceLandingPage(
    sampleLink,
    "https://test.hotsnew.click/test11",
    "https://test.hotsnew.click/api/v1/public-links/test11/track",
  );

  assert.doesNotMatch(html, /window\.setTimeout/);
  assert.doesNotMatch(html, /overlayRevealAfterDelay/);
  assert.match(html, /heroVideo\.addEventListener\("playing", startPreviewPlaybackTracking\)/);
  assert.match(html, /getPreviewPlaybackMs\(\) >= 5000/);
  assert.match(html, /heroVideo\.addEventListener\("waiting", stopPreviewPlaybackTracking\)/);
});

test("renderChoiceLandingPage attaches playback listeners before starting preview", () => {
  const html = renderChoiceLandingPage(
    sampleLink,
    "https://test.hotsnew.click/test11",
    "https://test.hotsnew.click/api/v1/public-links/test11/track",
  );

  const playingListenerIndex = html.indexOf(
    'heroVideo.addEventListener("playing", startPreviewPlaybackTracking);',
  );
  const startPreviewIndex = html.indexOf("startVideoPreview();");
  const syncPlaybackIndex = html.indexOf("startPreviewPlaybackTracking();");

  assert.notEqual(playingListenerIndex, -1);
  assert.notEqual(startPreviewIndex, -1);
  assert.notEqual(syncPlaybackIndex, -1);
  assert.ok(
    playingListenerIndex < startPreviewIndex,
    "playing listener must be attached before play is attempted",
  );
  assert.ok(
    startPreviewIndex < syncPlaybackIndex,
    "playback tracking should be re-synced after preview start",
  );
});

test("renderChoiceLandingPage sends primary overlay clicks directly to the target", () => {
  const html = renderChoiceLandingPage(
    sampleLink,
    "https://test.hotsnew.click/test11",
    "https://test.hotsnew.click/api/v1/links/link-1/track",
  );

  assert.match(
    html,
    /<a id="overlay" class="overlay delayed-hidden" href="https:\/\/example\.com\/original"/,
  );
  assert.match(
    html,
    /const secondaryRedirectUrl = "https:\/\/shopee\.vn\/secondary";/,
  );
  assert.match(
    html,
    /const outboundTrackingUrl = "https:\/\/test\.hotsnew\.click\/api\/v1\/links\/link-1\/track-outbound";/,
  );
  assert.match(html, /trackPrimaryClick\(\);/);
  assert.match(html, /trackSecondaryOutbound\(\);/);
});

test("renderChoiceLandingPage accepts redirect overrides", () => {
  const html = renderChoiceLandingPage(
    sampleLink,
    "https://test.hotsnew.click/test11",
    "https://test.hotsnew.click/api/v1/links/link-1/track",
    {
      primaryRedirectUrl: "shopee://open?url=https%3A%2F%2Fexample.com%2Foriginal",
      secondaryRedirectUrl: "tiktok://open?url=https%3A%2F%2Fshopee.vn%2Fsecondary",
    },
  );

  assert.match(
    html,
    /<a id="overlay" class="overlay delayed-hidden" href="shopee:\/\/open\?url=https%3A%2F%2Fexample\.com%2Foriginal"/,
  );
  assert.match(
    html,
    /const secondaryRedirectUrl = "tiktok:\/\/open\?url=https%3A%2F%2Fshopee\.vn%2Fsecondary";/,
  );
});
