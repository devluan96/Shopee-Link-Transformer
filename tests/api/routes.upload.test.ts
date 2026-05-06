import test from "node:test";
import assert from "node:assert/strict";
import { createSignUploadHandler } from "../../api/routes/upload.js";
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
