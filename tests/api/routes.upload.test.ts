import test from "node:test";
import assert from "node:assert/strict";
import {
  createMediaUploadCompleteHandler,
  createMediaReuseCheckHandler,
  createMediaUploadPlanHandler,
  createSignUploadHandler,
} from "../../api/routes/upload.js";
import { createMockRes } from "./testUtils.js";

test("sign-upload blocks video upload for free plan", async () => {
  const handler = createSignUploadHandler({
    getSupabase: () => ({}) as never,
    getFeatureLimitsForProfile: () => ({
      plan: "free" as const,
      canUseAbTesting: false,
      dailyVideoUploads: 0,
      maxTeamWorkspaces: 0,
      maxTeamMembersPerWorkspace: 0,
    }),
  });

  const res = createMockRes();
  await handler(
    {
      authUser: { id: "user-1" },
      body: { resourceType: "video" },
    } as any,
    res as any,
  );

  assert.equal(res.statusCode, 403);
  assert.match((res.body as any).error, /upload video/i);
});

test("sign-upload blocks video upload when daily quota is exhausted", async () => {
  let usageRecorded = false;
  const handler = createSignUploadHandler({
    getSupabase: () => ({}) as never,
    getFeatureLimitsForProfile: () => ({
      plan: "monthly" as const,
      canUseAbTesting: false,
      dailyVideoUploads: 3,
      maxTeamWorkspaces: 1,
      maxTeamMembersPerWorkspace: 3,
    }),
    getVideoUploadUsageToday: async () => 3,
    recordFeatureUsage: async () => {
      usageRecorded = true;
    },
  });

  const res = createMockRes();
  await handler(
    {
      authUser: { id: "user-1" },
      body: { resourceType: "video" },
    } as any,
    res as any,
  );

  assert.equal(res.statusCode, 429);
  assert.equal(usageRecorded, false);
  assert.match((res.body as any).error, /3/);
});

test("sign-upload records usage and returns signed payload for allowed video upload", async () => {
  let usageRecorded = false;
  const handler = createSignUploadHandler({
    getSupabase: () => ({}) as never,
    getFeatureLimitsForProfile: () => ({
      plan: "yearly" as const,
      canUseAbTesting: true,
      dailyVideoUploads: 20,
      maxTeamWorkspaces: 5,
      maxTeamMembersPerWorkspace: 20,
    }),
    getVideoUploadUsageToday: async () => 2,
    recordFeatureUsage: async () => {
      usageRecorded = true;
    },
    signUploadSignature: () => "signed-value",
    getCloudinaryConfig: () => ({
      cloudName: "demo-cloud",
      apiKey: "demo-key",
      folder: "hotsnew",
    }),
  });

  const res = createMockRes();
  await handler(
    {
      authUser: { id: "user-1" },
      body: { resourceType: "video" },
    } as any,
    res as any,
  );

  assert.equal(res.statusCode, 200);
  assert.equal(usageRecorded, true);
  assert.equal((res.body as any).signature, "signed-value");
  assert.equal((res.body as any).folder, "hotsnew");
});

test("sign-upload does not consume video quota for image uploads", async () => {
  let usageRecorded = false;
  const handler = createSignUploadHandler({
    getSupabase: () => ({}) as never,
    recordFeatureUsage: async () => {
      usageRecorded = true;
    },
    signUploadSignature: () => "signed-image",
    getCloudinaryConfig: () => ({
      cloudName: "demo-cloud",
      apiKey: "demo-key",
      folder: "hotsnew",
    }),
  });

  const res = createMockRes();
  await handler(
    {
      authUser: { id: "user-1" },
      body: { resourceType: "image" },
    } as any,
    res as any,
  );

  assert.equal(res.statusCode, 200);
  assert.equal(usageRecorded, false);
  assert.equal((res.body as any).signature, "signed-image");
});

test("sign-upload returns 503 when Cloudinary uploads are manually disabled", async () => {
  const previousFlag = process.env.DISABLE_CLOUDINARY_UPLOAD;
  process.env.DISABLE_CLOUDINARY_UPLOAD = "true";

  try {
    let usageRecorded = false;
    const handler = createSignUploadHandler({
      getSupabase: () => ({}) as never,
      recordFeatureUsage: async () => {
        usageRecorded = true;
      },
    });

    const res = createMockRes();
    await handler(
      {
        authUser: { id: "user-1" },
        body: { resourceType: "image" },
      } as any,
      res as any,
    );

    assert.equal(res.statusCode, 503);
    assert.equal(usageRecorded, false);
    assert.match((res.body as any).error, /disabled/i);
  } finally {
    if (previousFlag === undefined) {
      delete process.env.DISABLE_CLOUDINARY_UPLOAD;
    } else {
      process.env.DISABLE_CLOUDINARY_UPLOAD = previousFlag;
    }
  }
});

test("media upload plan returns configured fallback providers in order", async () => {
  const handler = createMediaUploadPlanHandler({
    getSupabase: () => ({}) as never,
    getFeatureLimitsForProfile: () => ({
      plan: "yearly" as const,
      canUseAbTesting: true,
      dailyVideoUploads: 20,
      maxTeamWorkspaces: 5,
      maxTeamMembersPerWorkspace: 20,
    }),
    getVideoUploadUsageToday: async () => 0,
    getVideoUploadProviderPreference: async () => "cloudinary",
    buildMediaUploadPlan: () =>
      [
        { provider: "cloudinary", uploadUrl: "https://cloudinary.test" },
        { provider: "supabase", uploadUrl: "/api/v1/media/upload-supabase" },
      ] as any,
  });

  const res = createMockRes();
  await handler(
    {
      authUser: { id: "user-1" },
      body: { resourceType: "video", fileSize: 1024 },
    } as any,
    res as any,
  );

  assert.equal(res.statusCode, 200);
  assert.deepEqual(
    (res.body as any).providers.map((provider: any) => provider.provider),
    ["cloudinary", "supabase"],
  );
});

test("media upload plan uses video upload provider preference for videos", async () => {
  let receivedPreference: unknown = null;
  const handler = createMediaUploadPlanHandler({
    getSupabase: () => ({}) as never,
    getFeatureLimitsForProfile: () => ({
      plan: "yearly" as const,
      canUseAbTesting: true,
      dailyVideoUploads: 20,
      maxTeamWorkspaces: 5,
      maxTeamMembersPerWorkspace: 20,
    }),
    getVideoUploadUsageToday: async () => 0,
    getVideoUploadProviderPreference: async () => "r2",
    buildMediaUploadPlan: (_resourceType, _fileMeta, options) => {
      receivedPreference = options?.videoUploadProviderPreference || null;
      return [
        { provider: "r2", uploadUrl: "/api/v1/media/upload-r2" },
        { provider: "cloudinary", uploadUrl: "https://cloudinary.test" },
        { provider: "supabase", uploadUrl: "/api/v1/media/upload-supabase" },
      ] as any;
    },
  });

  const res = createMockRes();
  await handler(
    {
      authUser: { id: "user-1" },
      body: { resourceType: "video", fileSize: 1024 },
    } as any,
    res as any,
  );

  assert.equal(res.statusCode, 200);
  assert.equal(receivedPreference, "r2");
  assert.deepEqual(
    (res.body as any).providers.map((provider: any) => provider.provider),
    ["r2", "cloudinary", "supabase"],
  );
});

test("media upload complete records usage only for video uploads", async () => {
  const recorded: Array<{ key: string; metadata: Record<string, unknown> }> = [];
  const handler = createMediaUploadCompleteHandler({
    getSupabase: () => ({}) as never,
    recordFeatureUsage: async (_supabase, _userId, key, metadata) => {
      recorded.push({ key, metadata: (metadata || {}) as Record<string, unknown> });
    },
  });

  const videoRes = createMockRes();
  await handler(
    {
      authUser: { id: "user-1" },
      body: { resourceType: "video", provider: "cloudinary" },
    } as any,
    videoRes as any,
  );

  const imageRes = createMockRes();
  await handler(
    {
      authUser: { id: "user-1" },
      body: { resourceType: "image", provider: "supabase" },
    } as any,
    imageRes as any,
  );

  assert.equal(videoRes.statusCode, 200);
  assert.equal(imageRes.statusCode, 200);
  assert.equal(recorded.length, 1);
  assert.equal(recorded[0]?.key, "video_upload");
  assert.equal(recorded[0]?.metadata.provider, "cloudinary");
});

test("media upload complete persists metadata for non-video uploads", async () => {
  const upserts: unknown[] = [];
  const handler = createMediaUploadCompleteHandler({
    getSupabase: () =>
      ({
        from: (table: string) => {
          assert.equal(table, "media_assets");
          return {
            upsert: async (rows: unknown[]) => {
              upserts.push(...rows);
              return { data: null, error: null };
            },
          };
        },
      }) as never,
    recordFeatureUsage: async () => undefined,
  });

  const res = createMockRes();
  await handler(
    {
      authUser: { id: "user-1" },
      body: {
        resourceType: "image",
        provider: "cloudinary",
        publicUrl: "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
        objectPath: "sample",
        fileName: "sample.jpg",
        sizeBytes: 2048,
        mimeType: "image/jpeg",
        metadata: { public_id: "sample" },
      },
    } as any,
    res as any,
  );

  assert.equal(res.statusCode, 200);
  assert.equal(upserts.length, 1);
  const row = upserts[0] as Record<string, unknown>;
  assert.equal(row.user_id, "user-1");
  assert.equal(row.provider, "cloudinary");
  assert.equal(row.object_path, "sample");
  assert.equal(row.public_url, "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg");
});

test("media reuse check returns a reusable asset when fingerprint matches", async () => {
  const handler = createMediaReuseCheckHandler({
    getSupabase: () =>
      ({
        from: () => ({
          select: () => ({
            eq: () => ({
              eq: () => ({
                in: () => ({
                  filter: () => ({
                    order: () => ({
                      limit: () => ({
                        maybeSingle: async () => ({
                          data: {
                            object_path: "videos/user-1/sample.mp4",
                            public_url: "https://cdn.example.com/sample.mp4",
                            provider: "r2",
                            resource_type: "video",
                            folder_name: "videos",
                            tags: ["demo"],
                            file_name: "sample.mp4",
                            size_bytes: 1234,
                            modified_at: "2026-06-06T00:00:00.000Z",
                            mime_type: "video/mp4",
                            metadata: { sha256: "abc123" },
                            created_at: "2026-06-06T00:00:00.000Z",
                            updated_at: "2026-06-06T00:00:00.000Z",
                          },
                          error: null,
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
      }) as never,
  });

  const res = createMockRes();
  await handler(
    {
      authUser: { id: "user-1" },
      body: { resourceType: "video", fingerprint: "abc123" },
    } as any,
    res as any,
  );

  assert.equal(res.statusCode, 200);
  assert.equal((res.body as any).reused, true);
  assert.equal((res.body as any).asset.provider, "r2");
  assert.equal((res.body as any).asset.url, "https://cdn.example.com/sample.mp4");
});
