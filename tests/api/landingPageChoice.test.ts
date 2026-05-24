import test from "node:test";
import assert from "node:assert/strict";
import {
  renderChoiceLandingPage,
  renderTikTokDirectHandoffPage,
} from "../../api/templates/landingPageChoice.js";
import type { PublicLinkRecord } from "../../api/types/index.js";

const sampleLink: PublicLinkRecord = {
  id: "link-1",
  short_code: "test11",
  original_url: "https://example.com/original",
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

test("renderChoiceLandingPage sends primary overlay clicks through server redirect", () => {
  const html = renderChoiceLandingPage(
    sampleLink,
    "https://test.hotsnew.click/test11",
    "https://test.hotsnew.click/api/v1/links/link-1/track",
  );

  assert.match(
    html,
    /<a id="overlay" class="overlay delayed-hidden" href="https:\/\/test\.hotsnew\.click\/api\/v1\/links\/link-1\/open\?stage=primary"/,
  );
  assert.match(
    html,
    /const secondaryRedirectUrl = "https:\/\/test\.hotsnew\.click\/api\/v1\/links\/link-1\/open\?stage=secondary";/,
  );
  assert.doesNotMatch(html, /window\.location\.assign\(url\)/);
});

test("renderTikTokDirectHandoffPage exposes app-link metadata and web fallback", () => {
  const html = renderTikTokDirectHandoffPage(
    {
      ...sampleLink,
      original_url:
        "https://www.tiktok.com/view/product/1734913024708937503?_svg=1",
      video_url: null,
    },
    "https://test.hotsnew.click/test11",
    "https://www.tiktok.com/view/product/1734913024708937503?_svg=1",
  );

  assert.match(html, /property="al:android:url"/);
  assert.match(html, /property="al:ios:url"/);
  assert.match(html, /snssdk1180:\/\/ec\/pdp/);
  assert.match(
    html,
    /window\.location\.replace\(appUrl\)/,
  );
  assert.match(
    html,
    /window\.location\.replace\(webUrl\)/,
  );
  assert.match(
    html,
    /requestParams=.*product_id/i,
  );
});
