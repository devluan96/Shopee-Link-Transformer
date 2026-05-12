import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPrettyLinkPath,
  buildPrettyLinkUrl,
  isCandidatePublicSlugPath,
  normalizeLinkSlug,
} from "../../api/utils/linkPaths.js";

test("normalizes a unicode slug while keeping Vietnamese accents", () => {
  assert.equal(
    normalizeLinkSlug("Trích xuất camera góc quay khác vụ nam thanh niên ngáo đá"),
    "trích-xuất-camera-góc-quay-khác-vụ-nam-thanh-niên-ngáo-đá",
  );
});

test("builds a pretty path from stored slug", () => {
  assert.equal(
    buildPrettyLinkPath({
      slug: "trích-xuất-camera-góc-quay-khác-vụ-nam-thanh-niên-ngáo-đá",
      shortCode: "AbC123_-",
      title: "Tôi yêu Miền Trung",
    }),
    "/trích-xuất-camera-góc-quay-khác-vụ-nam-thanh-niên-ngáo-đá",
  );
});

test("falls back to legacy short path when slug is missing", () => {
  assert.equal(
    buildPrettyLinkPath({ shortCode: "abc123", title: "" }),
    "/s/abc123",
  );
});

test("builds a preview slug path when requested", () => {
  assert.equal(
    buildPrettyLinkPath({
      title: "Tôi yêu Miền Trung",
      fallbackToLegacy: false,
    }),
    "/tôi-yêu-miền-trung",
  );
});

test("detects candidate public slug paths", () => {
  assert.equal(isCandidatePublicSlugPath("/tôi-yêu-miền-trung"), true);
  assert.equal(isCandidatePublicSlugPath("/s/abc123"), false);
  assert.equal(isCandidatePublicSlugPath("/robots.txt"), false);
});

test("builds a full pretty URL", () => {
  assert.equal(
    buildPrettyLinkUrl("https://hotsnew.click/", {
      slug: "trích-xuất-camera-góc-quay-khác-vụ-nam-thanh-niên-ngáo-đá",
      shortCode: "abc123",
      title: "Tin nóng hôm nay",
    }),
    "https://hotsnew.click/trích-xuất-camera-góc-quay-khác-vụ-nam-thanh-niên-ngáo-đá",
  );
});
