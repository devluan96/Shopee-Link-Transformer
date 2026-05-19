import test from "node:test";
import assert from "node:assert/strict";
import { buildPublicVideoUrl } from "../../api/utils/mediaUrl.js";

const withImageKitEndpoint = (endpoint: string | undefined, callback: () => void) => {
  const previousValue = process.env.IMAGEKIT_URL_ENDPOINT;

  if (endpoint === undefined) {
    delete process.env.IMAGEKIT_URL_ENDPOINT;
  } else {
    process.env.IMAGEKIT_URL_ENDPOINT = endpoint;
  }

  try {
    callback();
  } finally {
    if (previousValue === undefined) {
      delete process.env.IMAGEKIT_URL_ENDPOINT;
      return;
    }

    process.env.IMAGEKIT_URL_ENDPOINT = previousValue;
  }
};

test("buildPublicVideoUrl rewrites ImageKit videos to transformed playback URLs", () => {
  withImageKitEndpoint("https://ik.example.com/hotsnew", () => {
    assert.equal(
      buildPublicVideoUrl(
        "https://ik.example.com/hotsnew/uploads/demo-video.mp4?updatedAt=123",
      ),
      "https://ik.example.com/hotsnew/tr:q-auto/uploads/demo-video.mp4?updatedAt=123",
    );
  });
});

test("buildPublicVideoUrl keeps transformed ImageKit URLs unchanged", () => {
  withImageKitEndpoint("https://ik.example.com/hotsnew", () => {
    const transformedUrl =
      "https://ik.example.com/hotsnew/tr:q-auto/uploads/demo-video.mp4";

    assert.equal(buildPublicVideoUrl(transformedUrl), transformedUrl);
  });
});

test("buildPublicVideoUrl leaves non-ImageKit videos unchanged", () => {
  withImageKitEndpoint("https://ik.example.com/hotsnew", () => {
    const directUrl = "https://cdn.example.com/videos/demo-video.mp4";

    assert.equal(buildPublicVideoUrl(directUrl), directUrl);
  });
});
