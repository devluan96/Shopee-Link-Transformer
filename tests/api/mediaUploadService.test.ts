import test from "node:test";
import assert from "node:assert/strict";
import { buildMediaUploadPlan } from "../../api/services/mediaUploadService.js";

const withEnv = (
  overrides: Record<string, string>,
  callback: () => void,
) => {
  const previousValues = new Map<string, string | undefined>();
  Object.keys(overrides).forEach((key) => {
    previousValues.set(key, process.env[key]);
    process.env[key] = overrides[key];
  });

  try {
    callback();
  } finally {
    previousValues.forEach((value, key) => {
      if (value === undefined) {
        delete process.env[key];
        return;
      }
      process.env[key] = value;
    });
  }
};

test("buildMediaUploadPlan skips cloudinary when DISABLE_CLOUDINARY_UPLOAD is enabled", () => {
  withEnv(
    {
      CLOUDINARY_CLOUD_NAME: "demo-cloud",
      CLOUDINARY_API_KEY: "demo-key",
      CLOUDINARY_API_SECRET: "demo-secret",
      IMAGEKIT_PUBLIC_KEY: "demo-public",
      IMAGEKIT_PRIVATE_KEY: "demo-private",
      IMAGEKIT_URL_ENDPOINT: "https://ik.example.com",
      SUPABASE_UPLOAD_BUCKET: "media",
      MEDIA_UPLOAD_PROVIDER_ORDER: "cloudinary,imagekit,supabase",
      DISABLE_CLOUDINARY_UPLOAD: "true",
    },
    () => {
    const providers = buildMediaUploadPlan("video", { fileSize: 1024 });
    assert.deepEqual(
      providers.map((provider) => provider.provider),
      ["imagekit", "supabase"],
    );
    },
  );
});
