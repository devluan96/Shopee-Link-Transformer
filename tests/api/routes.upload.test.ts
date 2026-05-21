import test from "node:test";
import assert from "node:assert/strict";
import {
  createMediaUploadCompleteHandler,
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
