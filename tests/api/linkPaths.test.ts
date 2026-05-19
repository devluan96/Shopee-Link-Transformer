import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPrettyLinkPath,
  buildPrettyLinkUrl,
  isCandidatePublicSlugPath,
  normalizeLinkSlug,
} from "../../api/utils/linkPaths.js";

test("normalizes a Vietnamese slug without accents", () => {
  assert.equal(
    normalizeLinkSlug(
      "Tr\u00edch xu\u1ea5t camera g\u00f3c quay kh\u00e1c v\u1ee5 nam thanh ni\u00ean ng\u00e1o \u0111\u00e1",
    ),
    "trich-xuat-camera-goc-quay-khac-vu-nam-thanh-nien-ngao-da",
  );
});

test("builds a pretty path from stored slug", () => {
  assert.equal(
    buildPrettyLinkPath({
      slug: "trich-xuat-camera-goc-quay-khac-vu-nam-thanh-nien-ngao-da",
      shortCode: "AbC123_-",
      title: "Toi yeu Mien Trung",
    }),
    "/trich-xuat-camera-goc-quay-khac-vu-nam-thanh-nien-ngao-da",
  );
});

test("falls back to legacy short path when slug is missing", () => {
  assert.equal(
    buildPrettyLinkPath({ shortCode: "abc123", title: "" }),
    "/s/abc123",
  );
});

test("builds a preview slug path from title when requested", () => {
  assert.equal(
    buildPrettyLinkPath({
      title: "T\u00f4i y\u00eau Mi\u1ec1n Trung",
      fallbackToLegacy: false,
    }),
    "/toi-yeu-mien-trung",
  );
});

test("detects candidate public slug paths", () => {
  assert.equal(isCandidatePublicSlugPath("/toi-yeu-mien-trung"), true);
  assert.equal(isCandidatePublicSlugPath("/s/abc123"), false);
  assert.equal(isCandidatePublicSlugPath("/robots.txt"), false);
});

test("builds a full pretty URL", () => {
  assert.equal(
    buildPrettyLinkUrl("https://hotsnew.click/", {
      slug: "trich-xuat-camera-goc-quay-khac-vu-nam-thanh-nien-ngao-da",
      shortCode: "abc123",
      title: "Tin nong hom nay",
    }),
    "https://hotsnew.click/trich-xuat-camera-goc-quay-khac-vu-nam-thanh-nien-ngao-da",
  );
});
