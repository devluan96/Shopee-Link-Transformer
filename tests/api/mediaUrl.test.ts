import test from "node:test";
import assert from "node:assert/strict";
import { buildPublicVideoUrl } from "../../api/utils/mediaUrl.js";

test("buildPublicVideoUrl keeps ImageKit video URLs unchanged", () => {
  const directUrl =
    "https://ik.example.com/hotsnew/uploads/demo-video.mp4?updatedAt=123";

  assert.equal(buildPublicVideoUrl(directUrl), directUrl);
});

test("buildPublicVideoUrl keeps transformed ImageKit URLs unchanged", () => {
  const transformedUrl =
    "https://ik.example.com/hotsnew/tr:q-auto/uploads/demo-video.mp4";

  assert.equal(buildPublicVideoUrl(transformedUrl), transformedUrl);
});

test("buildPublicVideoUrl trims surrounding spaces", () => {
  assert.equal(
    buildPublicVideoUrl("  https://cdn.example.com/videos/demo-video.mp4  "),
    "https://cdn.example.com/videos/demo-video.mp4",
  );
});
