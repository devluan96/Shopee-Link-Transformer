import test from "node:test";
import assert from "node:assert/strict";
import { createConvertHandler, createDeleteLinkHandler } from "../../server/routes/links.js";
import { createMockRes } from "./testUtils.js";

test("convert blocks when daily link quota is exhausted", async () => {
  let createCalled = false;
  const handler = createConvertHandler({
    getSupabase: () => ({}) as never,
    getDailyLinkQuota: async () => ({
      plan: "monthly" as const,
      dailyLimit: 5,
      usedToday: 5,
      remainingToday: 0,
      canCreate: false,
    }),
    createLink: async () => {
      createCalled = true;
      throw new Error("should not create");
    },
  });

  const res = createMockRes();
  await handler(
    {
      authUser: { id: "user-1" },
      authProfile: { subscription_plan: "monthly" },
      body: { url: "https://shopee.vn/test" },
    } as any,
    res as any,
  );

  assert.equal(res.statusCode, 429);
  assert.equal(createCalled, false);
  assert.match((res.body as any).error, /5/);
});

test("convert blocks A/B testing for monthly plan", async () => {
  let createCalled = false;
  const handler = createConvertHandler({
    getSupabase: () => ({}) as never,
    getDailyLinkQuota: async () => ({
      plan: "monthly" as const,
      dailyLimit: 5,
      usedToday: 1,
      remainingToday: 4,
      canCreate: true,
    }),
    getFeatureLimitsForProfile: () => ({
      plan: "monthly" as const,
      canUseAbTesting: false,
      dailyVideoUploads: 3,
      maxTeamWorkspaces: 1,
      maxTeamMembersPerWorkspace: 3,
    }),
    createLink: async () => {
      createCalled = true;
      throw new Error("should not create");
    },
  });

  const res = createMockRes();
  await handler(
    {
      authUser: { id: "user-1" },
      authProfile: { subscription_plan: "monthly" },
      body: {
        url: "https://shopee.vn/test",
        abTestEnabled: true,
      },
    } as any,
    res as any,
  );

  assert.equal(res.statusCode, 403);
  assert.equal(createCalled, false);
  assert.match((res.body as any).error, /A\/B/i);
});

test("convert strips custom domain for non-yearly plans", async () => {
  let capturedPayload: Record<string, unknown> | null = null;
  const handler = createConvertHandler({
    getSupabase: () => ({}) as never,
    getDailyLinkQuota: async () => ({
      plan: "monthly" as const,
      dailyLimit: 5,
      usedToday: 0,
      remainingToday: 5,
      canCreate: true,
    }),
    getFeatureLimitsForProfile: () => ({
      plan: "monthly" as const,
      canUseAbTesting: false,
      dailyVideoUploads: 3,
      maxTeamWorkspaces: 1,
      maxTeamMembersPerWorkspace: 3,
    }),
    createLink: async (_supabase, _userId, payload) => {
      capturedPayload = payload as Record<string, unknown>;
      return { id: "link-1", short_code: "abc123" } as any;
    },
  });

  const res = createMockRes();
  await handler(
    {
      authUser: { id: "user-1" },
      authProfile: { subscription_plan: "monthly" },
      body: {
        url: "https://shopee.vn/test",
        customDomain: "go.hotsnew.click",
      },
    } as any,
    res as any,
  );

  assert.equal(res.statusCode, 200);
  assert.ok(capturedPayload);
  assert.equal(capturedPayload?.customDomain, undefined);
});

test("convert blocks secondary link when no video is provided", async () => {
  let createCalled = false;
  const handler = createConvertHandler({
    getSupabase: () => ({}) as never,
    getDailyLinkQuota: async () => ({
      plan: "monthly" as const,
      dailyLimit: 5,
      usedToday: 0,
      remainingToday: 5,
      canCreate: true,
    }),
    getFeatureLimitsForProfile: () => ({
      plan: "monthly" as const,
      canUseAbTesting: false,
      dailyVideoUploads: 3,
      maxTeamWorkspaces: 1,
      maxTeamMembersPerWorkspace: 3,
    }),
    createLink: async () => {
      createCalled = true;
      throw new Error("should not create");
    },
  });

  const res = createMockRes();
  await handler(
    {
      authUser: { id: "user-1" },
      authProfile: { subscription_plan: "monthly" },
      body: {
        url: "https://shopee.vn/test",
        secondaryUrl: "https://www.tiktok.com/@demo/video/123",
        secondaryTargetType: "tiktok",
        videoUrl: "",
      },
    } as any,
    res as any,
  );

  assert.equal(res.statusCode, 400);
  assert.equal(createCalled, false);
  assert.match((res.body as any).error, /video/i);
});

test("convert blocks mobile direct mode when thumbnail is missing", async () => {
  let createCalled = false;
  const handler = createConvertHandler({
    getSupabase: () => ({}) as never,
    getDailyLinkQuota: async () => ({
      plan: "monthly" as const,
      dailyLimit: 5,
      usedToday: 0,
      remainingToday: 5,
      canCreate: true,
    }),
    getFeatureLimitsForProfile: () => ({
      plan: "monthly" as const,
      canUseAbTesting: false,
      dailyVideoUploads: 3,
      maxTeamWorkspaces: 1,
      maxTeamMembersPerWorkspace: 3,
    }),
    createLink: async () => {
      createCalled = true;
      throw new Error("should not create");
    },
  });

  const res = createMockRes();
  await handler(
    {
      authUser: { id: "user-1" },
      authProfile: { subscription_plan: "monthly" },
      body: {
        url: "https://www.tiktok.com/view/product/123",
        mobileDirectMode: true,
        customImageUrl: "",
      },
    } as any,
    res as any,
  );

  assert.equal(res.statusCode, 400);
  assert.equal(createCalled, false);
  assert.match((res.body as any).error, /ảnh|thumbnail/i);
});

test("convert strips video and step-2 fields in mobile direct mode", async () => {
  let capturedPayload: Record<string, unknown> | null = null;
  const handler = createConvertHandler({
    getSupabase: () => ({}) as never,
    getDailyLinkQuota: async () => ({
      plan: "monthly" as const,
      dailyLimit: 5,
      usedToday: 0,
      remainingToday: 5,
      canCreate: true,
    }),
    getFeatureLimitsForProfile: () => ({
      plan: "monthly" as const,
      canUseAbTesting: true,
      dailyVideoUploads: 3,
      maxTeamWorkspaces: 1,
      maxTeamMembersPerWorkspace: 3,
    }),
    createLink: async (_supabase, _userId, payload) => {
      capturedPayload = payload as Record<string, unknown>;
      return { id: "link-1", short_code: "abc123" } as any;
    },
  });

  const res = createMockRes();
  await handler(
    {
      authUser: { id: "user-1" },
      authProfile: { subscription_plan: "monthly" },
      body: {
        url: "https://www.tiktok.com/view/product/123",
        mobileDirectMode: true,
        customImageUrl: "https://cdn.example.com/thumb.jpg",
        videoUrl: "https://cdn.example.com/video.mp4",
        secondaryUrl: "",
        abTestEnabled: true,
        abVariantBVideoUrl: "https://cdn.example.com/b.mp4",
        abVariantBSecondaryUrl: "https://shopee.vn/product",
      },
    } as any,
    res as any,
  );

  assert.equal(res.statusCode, 200);
  assert.ok(capturedPayload);
  assert.equal(capturedPayload?.mobileDirectMode, true);
  assert.equal(capturedPayload?.videoUrl, "");
  assert.equal(capturedPayload?.secondaryUrl, "");
  assert.equal(capturedPayload?.abVariantBVideoUrl, "");
  assert.equal(capturedPayload?.abVariantBSecondaryUrl, "");
});

test("delete handler deletes link successfully", async () => {
  let deletedArgs: [string, string] | null = null;
  const handler = createDeleteLinkHandler({
    getSupabase: () => ({}) as never,
    deleteLink: async (_supabase, linkId, userId) => {
      deletedArgs = [linkId, userId];
    },
  });

  const res = createMockRes();
  await handler(
    {
      authUser: { id: "user-1" },
      params: { id: "link-99" },
    } as any,
    res as any,
  );

  assert.equal(res.statusCode, 200);
  assert.deepEqual(deletedArgs, ["link-99", "user-1"]);
  assert.deepEqual(res.body, { success: true });
});

