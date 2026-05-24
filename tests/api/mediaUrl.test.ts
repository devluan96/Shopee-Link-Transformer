import test from "node:test";
import assert from "node:assert/strict";
import { buildPublicVideoUrl } from "../../api/utils/mediaUrl.js";

test("buildPublicVideoUrl keeps direct video URLs unchanged", () => {
  const directUrl =
    "https://cdn.example.com/hotsnew/uploads/demo-video.mp4?updatedAt=123";

  assert.equal(buildPublicVideoUrl(directUrl), directUrl);
});

test("buildPublicVideoUrl keeps transformed CDN video URLs unchanged", () => {
  const transformedUrl =
    "https://cdn.example.com/hotsnew/tr:q-auto/uploads/demo-video.mp4";

  assert.equal(buildPublicVideoUrl(transformedUrl), transformedUrl);
});

test("buildPublicVideoUrl trims surrounding spaces", () => {
  assert.equal(
    buildPublicVideoUrl("  https://cdn.example.com/videos/demo-video.mp4  "),
    "https://cdn.example.com/videos/demo-video.mp4",
  );
});
