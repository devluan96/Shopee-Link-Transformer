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
      SUPABASE_UPLOAD_BUCKET: "media",
      MEDIA_UPLOAD_PROVIDER_ORDER: "cloudinary,supabase",
      DISABLE_CLOUDINARY_UPLOAD: "true",
    },
    () => {
    const providers = buildMediaUploadPlan("video", { fileSize: 1024 });
    assert.deepEqual(
      providers.map((provider) => provider.provider),
      ["supabase"],
    );
    },
  );
});

test("buildMediaUploadPlan prioritizes supabase before cloudinary for video uploads", () => {
  withEnv(
    {
      CLOUDINARY_CLOUD_NAME: "demo-cloud-1",
      CLOUDINARY_API_KEY: "demo-key-1",
      CLOUDINARY_API_SECRET: "demo-secret-1",
      CLOUDINARY_CLOUD_NAME_2: "demo-cloud-2",
      CLOUDINARY_API_KEY_2: "demo-key-2",
      CLOUDINARY_API_SECRET_2: "demo-secret-2",
      SUPABASE_UPLOAD_BUCKET: "media",
      MEDIA_UPLOAD_PROVIDER_ORDER: "cloudinary,supabase",
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
        ["supabase", "cloudinary:demo-cloud-1", "cloudinary:demo-cloud-2"],
      );
    },
  );
});

test("buildMediaUploadPlan keeps cloudinary first for image uploads", () => {
  withEnv(
    {
      CLOUDINARY_CLOUD_NAME: "demo-cloud-1",
      CLOUDINARY_API_KEY: "demo-key-1",
      CLOUDINARY_API_SECRET: "demo-secret-1",
      SUPABASE_UPLOAD_BUCKET: "media",
      MEDIA_UPLOAD_PROVIDER_ORDER: "cloudinary,supabase",
      DISABLE_CLOUDINARY_UPLOAD: "false",
    },
    () => {
      const providers = buildMediaUploadPlan("image", { fileSize: 1024 });
      assert.deepEqual(
        providers.map((provider) =>
          provider.provider === "cloudinary"
            ? `cloudinary:${provider.cloudName}`
            : provider.provider,
        ),
        ["cloudinary:demo-cloud-1", "supabase"],
      );
    },
  );
});

test("buildMediaUploadPlan routes audio uploads to supabase only", () => {
  withEnv(
    {
      SUPABASE_AUDIO_BUCKET: "audio-media",
      CLOUDINARY_CLOUD_NAME: "demo-cloud-1",
      CLOUDINARY_API_KEY: "demo-key-1",
      CLOUDINARY_API_SECRET: "demo-secret-1",
    },
    () => {
      const providers = buildMediaUploadPlan("audio", {
        fileName: "voice-sample.mp3",
        contentType: "audio/mpeg",
      });

      assert.deepEqual(
        providers.map((provider) => provider.provider),
        ["supabase"],
      );
      assert.equal((providers[0] as any).bucket, "audio-media");
      assert.equal((providers[0] as any).folder, "audio");
    },
  );
});
