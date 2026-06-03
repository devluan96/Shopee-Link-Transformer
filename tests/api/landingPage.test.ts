import test from "node:test";
import assert from "node:assert/strict";
import { renderLinkLandingPage } from "../../api/templates/landingPage.js";
import type { PublicLinkRecord } from "../../api/types/index.js";

const sampleLink: PublicLinkRecord = {
  id: "link-1",
  short_code: "test11",
  original_url: "https://example.com/original",
  secondary_url: "https://shopee.vn/secondary",
  custom_title: "test11",
  custom_description: "mo ta test",
  custom_image_url: "https://cdn.example.com/preview.jpg",
  video_url: "",
};

test("renderLinkLandingPage opens targets in the same tab", () => {
  const html = renderLinkLandingPage(
    sampleLink,
    "https://test.hotsnew.click/test11",
    "https://test.hotsnew.click/api/v1/links/link-1/track",
  );

  assert.match(html, /window\.location\.replace\(url\);/);
  assert.match(html, /window\.location\.href = url;/);
  assert.doesNotMatch(html, /trackOutbound\("primary"\);/);
});

test("renderLinkLandingPage can auto-open the primary target", () => {
  const html = renderLinkLandingPage(
    sampleLink,
    "https://test.hotsnew.click/test11",
    "https://test.hotsnew.click/api/v1/links/link-1/track",
    {
      autoOpen: true,
      autoOpenDelayMs: 0,
    },
  );

  assert.match(html, /const autoOpenEnabled = true;/);
  assert.match(html, /autoOpenTimerId = window\.setTimeout/);
  assert.match(html, /openPrimaryStep\(\);/);
});
