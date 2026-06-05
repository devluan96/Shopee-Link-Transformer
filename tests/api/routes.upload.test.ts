import test from "node:test";
import assert from "node:assert/strict";
import {
  createManagedAvatarUploadHandler,
  createManagedMediaDeleteHandler,
  createManagedMediaLibraryHandler,
  createMediaLibraryMutationHandler,
  createMediaUploadCompleteHandler,
  createMediaUploadPlanHandler,
  createR2MediaUploadHandler,
  createSignUploadHandler,
} from "../../api/routes/upload.js";
import { computeMediaUploadSha256 } from "../../api/services/mediaUploadService.js";
import { createMockRes } from "./testUtils.js";

type MediaAssetSeed = {
  provider: "r2" | "cloudinary" | "supabase";
  object_path: string;
  public_url: string;
  resource_type: "image" | "video" | "audio";
  folder_name: string;
  tags: string[];
  file_name: string;
  size_bytes: number;
  modified_at: string;
  mime_type: string;
  metadata?: Record<string, unknown>;
  user_id?: string;
};

type MediaFolderSeed = {
  user_id: string;
  name: string;
  updated_at?: string;
  created_at?: string;
};

const createManagedMediaSupabaseMock = (seed: {
  assets?: MediaAssetSeed[];
  folders?: MediaFolderSeed[];
} = {}) => {
  const state = {
    assets: [...(seed.assets || [])],
    folders: [...(seed.folders || [])],
    removals: [] as Array<{ bucket: string; paths: string[] }>,
    upserts: [] as Array<{ table: string; payload: unknown }>,
    deletes: [] as Array<{ table: string; filters: Record<string, unknown> }>,
    updates: [] as Array<{ table: string; filters: Record<string, unknown>; payload: unknown }>,
  };

  const matches = (row: Record<string, any>, filters: Array<{ kind: "eq" | "in"; column: string; value: unknown }>) =>
    filters.every((filter) => {
      const value = filter.column.includes("->>")
        ? (() => {
            const [column, key] = filter.column.split("->>");
            const metadata = row[column];
            if (!metadata || typeof metadata !== "object") return undefined;
            return (metadata as Record<string, unknown>)[key];
          })()
        : row[filter.column];
      if (filter.kind === "eq") {
        return value === filter.value;
      }

      return Array.isArray(filter.value) && filter.value.includes(value);
    });

  class QueryMock {
    private filters: Array<{ kind: "eq" | "in"; column: string; value: unknown }> = [];
    private updates: Record<string, unknown> | null = null;
    private ordering: { column: string; ascending: boolean } | null = null;

    constructor(private table: "media_assets" | "media_folders") {}

    select(_columns = "*") {
      return this;
    }

    eq(column: string, value: unknown) {
      this.filters.push({ kind: "eq", column, value });
      return this;
    }

    in(column: string, value: unknown[]) {
      this.filters.push({ kind: "in", column, value });
      return this;
    }

    order(column: string, options?: { ascending?: boolean }) {
      this.ordering = {
        column,
        ascending: options?.ascending !== false,
      };
      return this;
    }

    update(payload: Record<string, unknown>) {
      this.updates = payload;
      return this;
    }

    delete() {
      state.deletes.push({
        table: this.table,
        filters: Object.fromEntries(
          this.filters.map((filter) => [filter.column, filter.value]),
        ),
      });
      return this;
    }

    upsert(payload: unknown) {
      state.upserts.push({ table: this.table, payload });
      if (this.table === "media_folders" && payload && typeof payload === "object") {
        const folder = payload as MediaFolderSeed;
        const existing = state.folders.find(
          (item) => item.user_id === folder.user_id && item.name === folder.name,
        );
        if (existing) {
          Object.assign(existing, folder);
        } else {
          state.folders.push({ ...folder });
        }
      }

      if (this.table === "media_assets" && payload && typeof payload === "object") {
        const asset = payload as MediaAssetSeed & { user_id?: string };
        const userId = asset.user_id || "user-1";
        const existing = state.assets.find(
          (item) =>
            item.user_id === userId &&
            item.provider === asset.provider &&
            item.object_path === asset.object_path,
        );
        if (existing) {
          Object.assign(existing, asset, { user_id: userId });
        } else {
          state.assets.push({ ...asset, user_id: userId });
        }
      }

      return Promise.resolve({ data: payload, error: null });
    }

    async maybeSingle() {
      const { data, error } = await this.execute();
      return { data: (data?.[0] ?? null) as unknown, error };
    }

    then(resolve: (value: any) => unknown, reject?: (reason?: any) => unknown) {
      return this.execute().then(resolve, reject);
    }

    private async execute() {
      if (this.table === "media_folders") {
        if ((this as any)._deleteMode) {
          state.folders = state.folders.filter((row) => !matches(row, this.filters));
          state.deletes.push({
            table: this.table,
            filters: Object.fromEntries(this.filters.map((filter) => [filter.column, filter.value])),
          });
          return { data: null, error: null };
        }

        if (this.updates) {
          const updatedRows = state.folders.filter((row) => matches(row, this.filters));
          for (const row of updatedRows) {
            Object.assign(row, this.updates);
          }
          state.updates.push({
            table: this.table,
            filters: Object.fromEntries(this.filters.map((filter) => [filter.column, filter.value])),
            payload: this.updates,
          });
          return { data: updatedRows.map((row) => ({ ...row })), error: null };
        }

        const rows = state.folders.filter((row) => matches(row, this.filters));
        if (this.ordering) {
          rows.sort((a, b) => {
            const aValue = String(a[this.ordering?.column] || "");
            const bValue = String(b[this.ordering?.column] || "");
            return this.ordering?.ascending
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue);
          });
        }

        if (this.filters.length && !this.updates) {
          return { data: rows.map((row) => ({ ...row })), error: null };
        }

        return { data: rows.map((row) => ({ ...row })), error: null };
      }

      if (this.updates) {
        const updatedRows = state.assets.filter((row) => matches(row, this.filters));
        for (const row of updatedRows) {
          Object.assign(row, this.updates);
        }
        state.updates.push({
          table: this.table,
          filters: Object.fromEntries(this.filters.map((filter) => [filter.column, filter.value])),
          payload: this.updates,
        });
        return { data: updatedRows.map((row) => ({ ...row })), error: null };
      }

      if (this.filters.some((filter) => filter.kind === "eq" && filter.column === "object_path" && this.updates === null)) {
        // fall through to select/delete handling
      }

      if (this.filters.length && this.updates === null && (this as any)._deleteMode) {
        // no-op placeholder for compatibility
      }

      const rows = state.assets.filter((row) => matches(row, this.filters));

      if (this.ordering) {
        rows.sort((a, b) => {
          const aValue = String(a[this.ordering?.column] || "");
          const bValue = String(b[this.ordering?.column] || "");
          return this.ordering?.ascending
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        });
      }

      if ((this as any)._deleteMode) {
        state.assets = state.assets.filter((row) => !matches(row, this.filters));
        state.deletes.push({
          table: this.table,
          filters: Object.fromEntries(this.filters.map((filter) => [filter.column, filter.value])),
        });
        return { data: null, error: null };
      }

      return { data: rows.map((row) => ({ ...row })), error: null };
    }
  }

  const supabase = {
    from(table: "media_assets" | "media_folders") {
      const query = new QueryMock(table) as any;
      const originalDelete = query.delete.bind(query);
      query.delete = () => {
        query._deleteMode = true;
        return originalDelete();
      };
      return query;
    },
    storage: {
      from(bucket: string) {
        return {
          remove: async (paths: string[]) => {
            state.removals.push({ bucket, paths: [...paths] });
            return { error: null };
          },
        };
      },
    },
  };

  return { supabase: supabase as any, state };
};

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

test("media upload complete stores r2 metadata and records video usage", async () => {
  const { supabase, state } = createManagedMediaSupabaseMock();
  const recorded: Array<{ key: string; metadata: Record<string, unknown> }> = [];
  const handler = createMediaUploadCompleteHandler({
    getSupabase: () => supabase as never,
    recordFeatureUsage: async (_supabase, _userId, key, metadata) => {
      recorded.push({ key, metadata: (metadata || {}) as Record<string, unknown> });
    },
  });

  const res = createMockRes();
  await handler(
    {
      authUser: { id: "user-1" },
      body: {
        resourceType: "video",
        provider: "r2",
        objectPath: "videos/user-1/demo.mp4",
        publicUrl: "https://media.example.com/videos/user-1/demo.mp4",
        bucket: "media",
        fileName: "demo.mp4",
        sizeBytes: 2048,
        mimeType: "video/mp4",
        sha256: "abc123",
      },
    } as any,
    res as any,
  );

  assert.equal(res.statusCode, 200);
  assert.equal(state.upserts.length, 1);
  assert.equal((state.upserts[0]?.payload as any)?.provider, "r2");
  assert.equal((state.upserts[0]?.payload as any)?.object_path, "videos/user-1/demo.mp4");
  assert.equal((state.upserts[0]?.payload as any)?.metadata?.sha256, "abc123");
  assert.equal(recorded.length, 1);
  assert.equal(recorded[0]?.key, "video_upload");
  assert.equal(recorded[0]?.metadata.provider, "r2");
});

test("r2 media upload handler returns a direct upload plan", async () => {
  const { supabase, state } = createManagedMediaSupabaseMock();
  const previousEnv = {
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL,
    R2_MAX_UPLOAD_BYTES: process.env.R2_MAX_UPLOAD_BYTES,
  };
  process.env.R2_BUCKET_NAME = "media";
  process.env.R2_PUBLIC_BASE_URL = "https://media.example.com";
  process.env.R2_MAX_UPLOAD_BYTES = "104857600";
  const handler = createR2MediaUploadHandler({
    getSupabase: () => supabase as never,
    getFeatureLimitsForProfile: () => ({
      plan: "yearly" as const,
      canUseAbTesting: true,
      dailyVideoUploads: 20,
      maxTeamWorkspaces: 5,
      maxTeamMembersPerWorkspace: 20,
    }),
    getVideoUploadUsageToday: async () => 0,
    buildR2ManagedObjectPath: () => "videos/user-1/demo.mp4",
    createR2PresignedUpload: () => ({
      uploadUrl: "https://r2.example.com/upload",
      headers: { "Content-Type": "video/mp4" },
    }),
    buildR2PublicUrl: () => "https://media.example.com/videos/user-1/demo.mp4",
  });

  try {
    const res = createMockRes();
    await handler(
      {
        authUser: { id: "user-1" },
        authProfile: { plan: "yearly" } as any,
        body: {
          resourceType: "video",
          fileName: "demo.mp4",
          fileSize: 1024,
          contentType: "video/mp4",
        },
      } as any,
      res as any,
    );

    assert.equal(res.statusCode, 200);
    assert.equal((res.body as any).provider, "r2");
    assert.equal((res.body as any).uploadUrl, "https://r2.example.com/upload");
    assert.equal((res.body as any).headers?.["Content-Type"], "video/mp4");
    assert.equal((res.body as any).path, "videos/user-1/demo.mp4");
    assert.equal((res.body as any).url, "https://media.example.com/videos/user-1/demo.mp4");
    assert.equal(state.assets.length, 0);
  } finally {
    if (previousEnv.R2_BUCKET_NAME === undefined) {
      delete process.env.R2_BUCKET_NAME;
    } else {
      process.env.R2_BUCKET_NAME = previousEnv.R2_BUCKET_NAME;
    }

    if (previousEnv.R2_PUBLIC_BASE_URL === undefined) {
      delete process.env.R2_PUBLIC_BASE_URL;
    } else {
      process.env.R2_PUBLIC_BASE_URL = previousEnv.R2_PUBLIC_BASE_URL;
    }

    if (previousEnv.R2_MAX_UPLOAD_BYTES === undefined) {
      delete process.env.R2_MAX_UPLOAD_BYTES;
    } else {
      process.env.R2_MAX_UPLOAD_BYTES = previousEnv.R2_MAX_UPLOAD_BYTES;
    }
  }
});

test("r2 media upload handler reuses an existing uploaded asset by hash", async () => {
  const fileBuffer = Buffer.from("demo-r2-reuse");
  const sha256 = computeMediaUploadSha256(fileBuffer);
  const { supabase, state } = createManagedMediaSupabaseMock({
    assets: [
      {
        user_id: "user-1",
        provider: "r2",
        object_path: "videos/user-1/existing.mp4",
        public_url: "https://media.example.com/videos/user-1/existing.mp4",
        resource_type: "video",
        folder_name: "root",
        tags: [],
        file_name: "existing.mp4",
        size_bytes: fileBuffer.length,
        modified_at: "2026-06-03T00:00:00.000Z",
        mime_type: "video/mp4",
        metadata: { sha256 },
      },
    ],
  });
  const handler = createR2MediaUploadHandler({
    getSupabase: () => supabase as never,
    getFeatureLimitsForProfile: () => ({
      plan: "yearly" as const,
      canUseAbTesting: true,
      dailyVideoUploads: 20,
      maxTeamWorkspaces: 5,
      maxTeamMembersPerWorkspace: 20,
    }),
    getVideoUploadUsageToday: async () => 0,
  });

  const res = createMockRes();
  await handler(
    {
      authUser: { id: "user-1" },
      authProfile: { plan: "yearly" } as any,
      body: {
        resourceType: "video",
        fileName: "demo.mp4",
        sha256,
      },
    } as any,
    res as any,
  );

  assert.equal(res.statusCode, 200);
  assert.equal((res.body as any).provider, "r2");
  assert.equal((res.body as any).reused, true);
  assert.equal((res.body as any).deduped, true);
  assert.equal((res.body as any).url, "https://media.example.com/videos/user-1/existing.mp4");
  assert.equal(state.assets.length, 1);
  assert.equal((res.body as any).path, "videos/user-1/existing.mp4");
});

test("managed avatar upload handler stores avatar metadata on r2", async () => {
  const { supabase, state } = createManagedMediaSupabaseMock();
  const handler = createManagedAvatarUploadHandler({
    getSupabase: () => supabase as never,
    buildMediaUploadPlan: () =>
      [
        {
          provider: "r2",
          resourceType: "image",
          uploadUrl: "/api/v1/media/upload-r2",
          bucket: "media",
          publicBaseUrl: "https://media.example.com",
          maxFileSizeBytes: 100 * 1024 * 1024,
        },
      ] as any,
    uploadToR2Storage: async () => ({
      provider: "r2",
      bucket: "media",
      path: "images/user-1/avatar.webp",
      url: "https://media.example.com/images/user-1/avatar.webp",
    }),
    uploadToSupabaseStorage: async () => ({
      provider: "supabase",
      bucket: "media",
      path: "images/user-1/avatar.webp",
      url: "https://media.example.com/images/user-1/avatar.webp",
    }),
    upsertMediaAssetRecord: async (_supabase, asset) => {
      state.upserts.push({ table: "media_assets", payload: asset });
    },
    deleteManagedMediaAsset: async () => undefined,
  });

  const res = createMockRes();
  await handler(
    {
      authUser: { id: "user-1" },
      file: {
        buffer: Buffer.from("avatar"),
        originalname: "avatar.webp",
        mimetype: "image/webp",
        size: 1024,
      },
      protocol: "https",
      get: () => "example.com",
    } as any,
    res as any,
  );

  assert.equal(res.statusCode, 200);
  assert.equal((res.body as any).provider, "r2");
  assert.equal((res.body as any).secure_url, "https://media.example.com/images/user-1/avatar.webp");
  assert.equal(state.upserts.length, 1);
  const recordedAsset = state.upserts[0]?.payload as any;
  assert.equal(recordedAsset?.provider, "r2");
  assert.equal(recordedAsset?.folder_name, "avatars");
  assert.deepEqual(recordedAsset?.tags, ["avatar"]);
});

test("managed avatar upload handler falls back to supabase when needed", async () => {
  const { supabase, state } = createManagedMediaSupabaseMock();
  const handler = createManagedAvatarUploadHandler({
    getSupabase: () => supabase as never,
    buildMediaUploadPlan: () =>
      [
        {
          provider: "supabase",
          resourceType: "image",
          uploadUrl: "/api/v1/media/upload-supabase",
          bucket: "media",
          folder: "avatars",
          maxFileSizeBytes: 100 * 1024 * 1024,
        },
      ] as any,
    uploadToR2Storage: async () => {
      throw new Error("R2 should not be called");
    },
    uploadToSupabaseStorage: async () => ({
      provider: "supabase",
      bucket: "media",
      path: "images/user-1/avatar.webp",
      url: "https://media.example.com/images/user-1/avatar.webp",
    }),
    upsertMediaAssetRecord: async (_supabase, asset) => {
      state.upserts.push({ table: "media_assets", payload: asset });
    },
    deleteManagedMediaAsset: async () => undefined,
  });

  const res = createMockRes();
  await handler(
    {
      authUser: { id: "user-1" },
      file: {
        buffer: Buffer.from("avatar"),
        originalname: "avatar.webp",
        mimetype: "image/webp",
        size: 1024,
      },
      protocol: "https",
      get: () => "example.com",
    } as any,
    res as any,
  );

  assert.equal(res.statusCode, 200);
  assert.match(
    String((res.body as any)?.provider || ""),
    /supabase/i,
  );
  assert.equal((res.body as any).secure_url, "https://media.example.com/images/user-1/avatar.webp");
  assert.equal(state.upserts.length, 1);
  const recordedAsset = state.upserts[0]?.payload as any;
  assert.equal(recordedAsset?.provider, "supabase");
});

test("managed media library handler returns assets with provider metadata", async () => {
  const { supabase } = createManagedMediaSupabaseMock({
    assets: [
      {
        user_id: "user-1",
        provider: "r2",
        object_path: "images/user-1/demo.png",
        public_url: "https://media.example.com/images/user-1/demo.png",
        resource_type: "image",
        folder_name: "root",
        tags: [],
        file_name: "demo.png",
        size_bytes: 11,
        modified_at: "2026-06-03T00:00:00.000Z",
        mime_type: "image/png",
      },
    ],
    folders: [{ user_id: "user-1", name: "campaign-a" }],
  });
  const handler = createManagedMediaLibraryHandler({
    getSupabase: () => supabase as never,
  });

  const res = createMockRes();
  await handler(
    {
      authUser: { id: "user-1" },
      query: { resourceType: "all" },
      protocol: "https",
      get: () => "example.com",
    } as any,
    res as any,
  );

  assert.equal(res.statusCode, 200);
  assert.equal((res.body as any).provider, "all");
  assert.deepEqual((res.body as any).folders, ["campaign-a", "root"]);
  assert.equal((res.body as any).assets[0]?.provider, "r2");
  assert.equal((res.body as any).assets[0]?.url, "https://media.example.com/images/user-1/demo.png");
});

test("media library mutation handler can create a folder", async () => {
  const { supabase, state } = createManagedMediaSupabaseMock();
  const handler = createMediaLibraryMutationHandler({
    getSupabase: () => supabase as never,
  });

  const res = createMockRes();
  await handler(
    {
      authUser: { id: "user-1" },
      body: { folderAction: "create", folderName: "campaign-a" },
    } as any,
    res as any,
  );

  assert.equal(res.statusCode, 200);
  assert.equal((res.body as any).success, true);
  assert.equal((res.body as any).folderName, "campaign-a");
  assert.equal(state.folders.some((folder) => folder.name === "campaign-a"), true);
});

test("media library mutation handler physically deletes a folder", async () => {
  const previousBucket = process.env.SUPABASE_UPLOAD_BUCKET;
  process.env.SUPABASE_UPLOAD_BUCKET = "media";
  const { supabase, state } = createManagedMediaSupabaseMock({
    assets: [
      {
        user_id: "user-1",
        provider: "supabase",
        object_path: "images/user-1/demo-1.png",
        public_url: "https://media.example.com/images/user-1/demo-1.png",
        resource_type: "image",
        folder_name: "campaign-a",
        tags: [],
        file_name: "demo-1.png",
        size_bytes: 11,
        modified_at: "2026-06-03T00:00:00.000Z",
        mime_type: "image/png",
      },
      {
        user_id: "user-1",
        provider: "supabase",
        object_path: "images/user-1/demo-2.png",
        public_url: "https://media.example.com/images/user-1/demo-2.png",
        resource_type: "image",
        folder_name: "campaign-a",
        tags: [],
        file_name: "demo-2.png",
        size_bytes: 12,
        modified_at: "2026-06-03T00:00:00.000Z",
        mime_type: "image/png",
      },
    ],
    folders: [{ user_id: "user-1", name: "campaign-a" }],
  });
  const handler = createMediaLibraryMutationHandler({
    getSupabase: () => supabase as never,
  });

  try {
    const res = createMockRes();
    await handler(
      {
        authUser: { id: "user-1" },
        body: { folderAction: "delete", folderName: "campaign-a", provider: "supabase" },
      } as any,
      res as any,
    );

    assert.equal(res.statusCode, 200);
    assert.equal((res.body as any).deletedCount, 2);
    assert.equal(state.removals.length, 2);
    assert.equal(state.folders.some((folder) => folder.name === "campaign-a"), false);
  } finally {
    if (previousBucket === undefined) {
      delete process.env.SUPABASE_UPLOAD_BUCKET;
    } else {
      process.env.SUPABASE_UPLOAD_BUCKET = previousBucket;
    }
  }
});

test("managed media delete handler deletes only the authenticated user's files", async () => {
  const previousBucket = process.env.SUPABASE_UPLOAD_BUCKET;
  process.env.SUPABASE_UPLOAD_BUCKET = "media";
  const { supabase, state } = createManagedMediaSupabaseMock({
    assets: [
      {
        user_id: "user-1",
        provider: "supabase",
        object_path: "images/user-1/demo.png",
        public_url: "https://media.example.com/images/user-1/demo.png",
        resource_type: "image",
        folder_name: "root",
        tags: [],
        file_name: "demo.png",
        size_bytes: 11,
        modified_at: "2026-06-03T00:00:00.000Z",
        mime_type: "image/png",
      },
    ],
  });
  const handler = createManagedMediaDeleteHandler({
    getSupabase: () => supabase as never,
  });

  const res = createMockRes();
  await handler(
    {
      authUser: { id: "user-1" },
      body: { path: "images/user-1/demo.png", provider: "supabase" },
    } as any,
    res as any,
  );

  assert.equal(res.statusCode, 200);
  assert.equal(state.removals.length, 1);
  assert.equal(state.assets.length, 0);
  assert.equal((res.body as any).success, true);
  if (previousBucket === undefined) {
    delete process.env.SUPABASE_UPLOAD_BUCKET;
  } else {
    process.env.SUPABASE_UPLOAD_BUCKET = previousBucket;
  }
});

test("managed media delete handler is idempotent when asset is already missing", async () => {
  const { supabase, state } = createManagedMediaSupabaseMock();
  const handler = createManagedMediaDeleteHandler({
    getSupabase: () => supabase as never,
  });

  const res = createMockRes();
  await handler(
    {
      authUser: { id: "user-1" },
      body: { path: "images/user-1/missing.png", provider: "supabase" },
    } as any,
    res as any,
  );

  assert.equal(res.statusCode, 200);
  assert.equal((res.body as any).success, true);
  assert.equal((res.body as any).alreadyDeleted, true);
  assert.equal(state.removals.length, 0);
  assert.equal(state.assets.length, 0);
});
