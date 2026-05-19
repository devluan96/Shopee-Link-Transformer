import test from "node:test";
import assert from "node:assert/strict";
import { renderChoiceLandingPage } from "../../api/templates/landingPageChoice.js";
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
  assert.match(html, /heroVideo\.currentTime \|\| 0\) >= 5/);
});
