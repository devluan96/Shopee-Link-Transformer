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

test("buildMediaUploadPlan returns fallback cloudinary accounts before other providers", () => {
  withEnv(
    {
      CLOUDINARY_CLOUD_NAME: "demo-cloud-1",
      CLOUDINARY_API_KEY: "demo-key-1",
      CLOUDINARY_API_SECRET: "demo-secret-1",
      CLOUDINARY_CLOUD_NAME_2: "demo-cloud-2",
      CLOUDINARY_API_KEY_2: "demo-key-2",
      CLOUDINARY_API_SECRET_2: "demo-secret-2",
      IMAGEKIT_PUBLIC_KEY: "demo-public",
      IMAGEKIT_PRIVATE_KEY: "demo-private",
      IMAGEKIT_URL_ENDPOINT: "https://ik.example.com",
      SUPABASE_UPLOAD_BUCKET: "media",
      MEDIA_UPLOAD_PROVIDER_ORDER: "cloudinary,imagekit,supabase",
      DISABLE_CLOUDINARY_UPLOAD: "false",
    },
    () => {
      const providers = buildMediaUploadPlan("video", { fileSize: 1024 });
      assert.deepEqual(
        providers.map((provider) =>
          provider.provider === "cloudinary"
            ? `cloudinary:${provider.cloudName}`
            : provider.provider,
        ),
        [
          "cloudinary:demo-cloud-1",
          "cloudinary:demo-cloud-2",
          "imagekit",
          "supabase",
        ],
      );
    },
  );
});
