import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  buildMediaUploadPlan,
  buildR2ManagedObjectPath,
  buildR2PublicUrl,
  createR2PresignedUpload,
  createLocalMediaFolderRecord,
  deleteLocalMediaAsset,
  deleteLocalMediaAssetsInFolder,
  listLocalMediaAssets,
  listLocalMediaFoldersFromDatabase,
  normalizeMediaTags,
  moveLocalMediaAssetsFolderToRoot,
  moveLocalMediaAssetToFolder,
  updateLocalMediaAssetsByFolder,
  updateLocalMediaAssetsTags,
  syncLocalMediaAssetsToDatabase,
  uploadToR2Storage,
  uploadToLocalStorage,
  updateLocalMediaAssetRecord,
} from "../../api/services/mediaUploadService.js";

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

test("buildMediaUploadPlan routes video uploads to Supabase when cloudinary is disabled", () => {
  withEnv(
    {
      CLOUDFLARE_ACCOUNT_ID: "demo-account",
      R2_ACCESS_KEY_ID: "demo-access",
      R2_SECRET_ACCESS_KEY: "demo-secret",
      R2_BUCKET_NAME: "media",
      R2_PUBLIC_BASE_URL: "https://media.example.com",
      CLOUDINARY_CLOUD_NAME: "demo-cloud",
      CLOUDINARY_API_KEY: "demo-key",
      CLOUDINARY_API_SECRET: "demo-secret",
      SUPABASE_UPLOAD_BUCKET: "media",
      MEDIA_UPLOAD_PROVIDER_ORDER: "cloudinary,supabase",
      DISABLE_CLOUDINARY_UPLOAD: "true",
    },
    () => {
      const providers = buildMediaUploadPlan("video", { fileSize: 1024 });
      assert.deepEqual(providers.map((provider) => provider.provider), [
        "supabase",
      ]);
    },
  );
});

test("buildMediaUploadPlan prefers Cloudinary for video uploads and keeps Supabase fallback", () => {
  withEnv(
    {
      CLOUDFLARE_ACCOUNT_ID: "demo-account",
      R2_ACCESS_KEY_ID: "demo-access",
      R2_SECRET_ACCESS_KEY: "demo-secret",
      R2_BUCKET_NAME: "media",
      R2_PUBLIC_BASE_URL: "https://media.example.com",
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
        ["cloudinary:demo-cloud-1", "cloudinary:demo-cloud-2", "supabase"],
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

test("buildMediaUploadPlan ignores local in create-link plans", () => {
  withEnv(
    {
      CLOUDFLARE_ACCOUNT_ID: "demo-account",
      R2_ACCESS_KEY_ID: "demo-access",
      R2_SECRET_ACCESS_KEY: "demo-secret",
      R2_BUCKET_NAME: "media",
      R2_PUBLIC_BASE_URL: "https://media.example.com",
      LOCAL_MEDIA_STORAGE_DIR: "uploads/media",
      LOCAL_MEDIA_PUBLIC_PATH: "media",
      MEDIA_UPLOAD_PROVIDER_ORDER: "local,cloudinary,supabase",
      CLOUDINARY_CLOUD_NAME: "demo-cloud-1",
      CLOUDINARY_API_KEY: "demo-key-1",
      CLOUDINARY_API_SECRET: "demo-secret-1",
      SUPABASE_UPLOAD_BUCKET: "media",
    },
    () => {
      const providers = buildMediaUploadPlan("video", {
        fileName: "demo.mp4",
        fileSize: 1024,
      });

      assert.deepEqual(
        providers.map((provider) => provider.provider),
        ["cloudinary", "supabase"],
      );
    },
  );
});

test("buildMediaUploadPlan uses Cloudinary first for video uploads", () => {
  withEnv(
    {
      CLOUDFLARE_ACCOUNT_ID: "demo-account",
      R2_ACCESS_KEY_ID: "demo-access",
      R2_SECRET_ACCESS_KEY: "demo-secret",
      R2_BUCKET_NAME: "media",
      R2_PUBLIC_BASE_URL: "https://media.example.com",
      CLOUDINARY_CLOUD_NAME: "demo-cloud-1",
      CLOUDINARY_API_KEY: "demo-key-1",
      CLOUDINARY_API_SECRET: "demo-secret-1",
      SUPABASE_UPLOAD_BUCKET: "media",
    },
    () => {
      const providers = buildMediaUploadPlan("video", {
        fileName: "demo.mp4",
        fileSize: 1024,
      });

      assert.deepEqual(providers.map((provider) => provider.provider), [
        "cloudinary",
        "supabase",
      ]);
      assert.equal(
        (providers[0] as any).uploadUrl,
        "/api/v1/media/upload-cloudinary",
      );
    },
  );
});

test("buildR2ManagedObjectPath creates stable media prefixes", () => {
  const objectPath = buildR2ManagedObjectPath({
    resourceType: "video",
    userId: "user-1",
    fileName: "demo clip.mp4",
  });

  assert.match(objectPath, /^videos\/user-1\/\d+-[a-f0-9-]{36}-demo_clip\.mp4$/);
});

test("buildR2ManagedObjectPath infers extensions from content type when needed", () => {
  const objectPath = buildR2ManagedObjectPath({
    resourceType: "image",
    userId: "user-1",
    fileName: "image.bin",
    contentType: "image/jpeg",
  });

  assert.match(objectPath, /^images\/user-1\/\d+-[a-f0-9-]{36}-image\.jpg$/);
});

test("createR2PresignedUpload returns a signed direct upload url", () => {
  withEnv(
    {
      CLOUDFLARE_ACCOUNT_ID: "demo-account",
      R2_ACCESS_KEY_ID: "demo-access",
      R2_SECRET_ACCESS_KEY: "demo-secret",
    },
    () => {
      const result = createR2PresignedUpload({
        bucket: "media",
        objectPath: "videos/user-1/demo.mp4",
        contentType: "video/mp4",
        now: new Date("2026-06-04T12:00:00.000Z"),
        expiresInSeconds: 600,
      });

      assert.match(
        result.uploadUrl,
        /^https:\/\/demo-account\.r2\.cloudflarestorage\.com\/media\/videos\/user-1\/demo\.mp4\?/,
      );
      assert.equal(result.headers["Content-Type"], "video/mp4");
      assert.match(result.uploadUrl, /X-Amz-Algorithm=AWS4-HMAC-SHA256/);
      assert.match(result.uploadUrl, /X-Amz-SignedHeaders=content-type%3Bhost/);
      assert.match(result.uploadUrl, /X-Amz-Signature=[a-f0-9]{64}$/);
    },
  );
});

test("buildMediaUploadPlan can disable cloudinary backup for image uploads independently", () => {
  withEnv(
    {
      CLOUDFLARE_ACCOUNT_ID: "demo-account",
      R2_ACCESS_KEY_ID: "demo-access",
      R2_SECRET_ACCESS_KEY: "demo-secret",
      R2_BUCKET_NAME: "media",
      R2_PUBLIC_BASE_URL: "https://media.example.com",
      CLOUDINARY_CLOUD_NAME: "demo-cloud-1",
      CLOUDINARY_API_KEY: "demo-key-1",
      CLOUDINARY_API_SECRET: "demo-secret-1",
      SUPABASE_UPLOAD_BUCKET: "media",
      ENABLE_CLOUDINARY_BACKUP: "false",
    },
    () => {
      const providers = buildMediaUploadPlan("image", {
        fileName: "demo.jpg",
        fileSize: 1024,
      });

      assert.deepEqual(
        providers.map((provider) => provider.provider),
        ["supabase"],
      );
    },
  );
});

test("normalizeMediaTags trims, lowercases, and deduplicates tags", () => {
  assert.deepEqual(
    normalizeMediaTags("Avatar, avatar, Sale 6 6, , Team"),
    ["avatar", "sale-6-6", "team"],
  );
});

test("uploadToLocalStorage writes the file and returns a public url", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "hotsnew-media-"));
  const previousEnv = {
    LOCAL_MEDIA_STORAGE_DIR: process.env.LOCAL_MEDIA_STORAGE_DIR,
    LOCAL_MEDIA_PUBLIC_PATH: process.env.LOCAL_MEDIA_PUBLIC_PATH,
  };

  process.env.LOCAL_MEDIA_STORAGE_DIR = tempDir;
  process.env.LOCAL_MEDIA_PUBLIC_PATH = "media";

  try {
    const result = await uploadToLocalStorage({
      resourceType: "image",
      userId: "user-1",
      file: {
        buffer: Buffer.from("hello-media"),
        mimetype: "image/png",
        originalname: "thumbnail.png",
      },
    });

    assert.equal(result.provider, "local");
    assert.match(result.path, /^images\/user-1\//);
    assert.match(result.url, /^\/media\/images\/user-1\//);

    const absolutePath = path.join(tempDir, ...result.path.split("/"));
    const written = await fs.readFile(absolutePath, "utf8");
    assert.equal(written, "hello-media");
  } finally {
    if (previousEnv.LOCAL_MEDIA_STORAGE_DIR === undefined) {
      delete process.env.LOCAL_MEDIA_STORAGE_DIR;
    } else {
      process.env.LOCAL_MEDIA_STORAGE_DIR = previousEnv.LOCAL_MEDIA_STORAGE_DIR;
    }

    if (previousEnv.LOCAL_MEDIA_PUBLIC_PATH === undefined) {
      delete process.env.LOCAL_MEDIA_PUBLIC_PATH;
    } else {
      process.env.LOCAL_MEDIA_PUBLIC_PATH = previousEnv.LOCAL_MEDIA_PUBLIC_PATH;
    }
  }
});

test("uploadToR2Storage writes the object and returns a public url", async () => {
  const previousEnv = {
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL,
  };

  process.env.CLOUDFLARE_ACCOUNT_ID = "demo-account";
  process.env.R2_ACCESS_KEY_ID = "demo-access";
  process.env.R2_SECRET_ACCESS_KEY = "demo-secret";
  process.env.R2_BUCKET_NAME = "media";
  process.env.R2_PUBLIC_BASE_URL = "https://media.example.com";

  try {
    const sent: Array<Record<string, unknown>> = [];
    const result = await uploadToR2Storage(
      {
        resourceType: "video",
        userId: "user-1",
        file: {
          buffer: Buffer.from("hello-r2"),
          mimetype: "video/mp4",
          originalname: "clip.mp4",
        },
      },
      {
        client: {
          send: async (command: any) => {
            sent.push(command.input as Record<string, unknown>);
            return { $metadata: { httpStatusCode: 200 } };
          },
        } as any,
        publicBaseUrl: "https://media.example.com",
      },
    );

    assert.equal(result.provider, "r2");
    assert.match(result.path, /^videos\/user-1\//);
    assert.equal(
      result.url,
      buildR2PublicUrl(result.path, "https://media.example.com"),
    );
    assert.equal(sent.length, 1);
    assert.equal(sent[0]?.Bucket, "media");
    assert.equal(sent[0]?.ContentType, "video/mp4");
    assert.equal(sent[0]?.CacheControl, "public, max-age=31536000");
  } finally {
    if (previousEnv.CLOUDFLARE_ACCOUNT_ID === undefined) {
      delete process.env.CLOUDFLARE_ACCOUNT_ID;
    } else {
      process.env.CLOUDFLARE_ACCOUNT_ID = previousEnv.CLOUDFLARE_ACCOUNT_ID;
    }
    if (previousEnv.R2_ACCESS_KEY_ID === undefined) {
      delete process.env.R2_ACCESS_KEY_ID;
    } else {
      process.env.R2_ACCESS_KEY_ID = previousEnv.R2_ACCESS_KEY_ID;
    }
    if (previousEnv.R2_SECRET_ACCESS_KEY === undefined) {
      delete process.env.R2_SECRET_ACCESS_KEY;
    } else {
      process.env.R2_SECRET_ACCESS_KEY = previousEnv.R2_SECRET_ACCESS_KEY;
    }
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
  }
});

test("listLocalMediaAssets and deleteLocalMediaAsset work for local storage", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "hotsnew-media-"));
  const previousEnv = {
    LOCAL_MEDIA_STORAGE_DIR: process.env.LOCAL_MEDIA_STORAGE_DIR,
    LOCAL_MEDIA_PUBLIC_PATH: process.env.LOCAL_MEDIA_PUBLIC_PATH,
    MEDIA_UPLOAD_PROVIDER_ORDER: process.env.MEDIA_UPLOAD_PROVIDER_ORDER,
  };

  process.env.LOCAL_MEDIA_STORAGE_DIR = tempDir;
  process.env.LOCAL_MEDIA_PUBLIC_PATH = "media";
  process.env.MEDIA_UPLOAD_PROVIDER_ORDER = "local";

  try {
    const created = await uploadToLocalStorage({
      resourceType: "video",
      userId: "user-99",
      file: {
        buffer: Buffer.from("demo-video"),
        mimetype: "video/mp4",
        originalname: "intro.mp4",
      },
    });

    const assets = await listLocalMediaAssets({
      userId: "user-99",
      resourceType: "all",
    });

    assert.equal(assets.length, 1);
    assert.equal(assets[0]?.path, created.path);
    assert.equal(assets[0]?.resourceType, "video");

    const deleted = await deleteLocalMediaAsset({
      userId: "user-99",
      objectPath: created.path,
    });

    assert.equal(deleted.path, created.path);

    const afterDelete = await listLocalMediaAssets({
      userId: "user-99",
      resourceType: "all",
    });
    assert.equal(afterDelete.length, 0);
  } finally {
    if (previousEnv.LOCAL_MEDIA_STORAGE_DIR === undefined) {
      delete process.env.LOCAL_MEDIA_STORAGE_DIR;
    } else {
      process.env.LOCAL_MEDIA_STORAGE_DIR = previousEnv.LOCAL_MEDIA_STORAGE_DIR;
    }

    if (previousEnv.LOCAL_MEDIA_PUBLIC_PATH === undefined) {
      delete process.env.LOCAL_MEDIA_PUBLIC_PATH;
    } else {
      process.env.LOCAL_MEDIA_PUBLIC_PATH = previousEnv.LOCAL_MEDIA_PUBLIC_PATH;
    }

    if (previousEnv.MEDIA_UPLOAD_PROVIDER_ORDER === undefined) {
      delete process.env.MEDIA_UPLOAD_PROVIDER_ORDER;
    } else {
      process.env.MEDIA_UPLOAD_PROVIDER_ORDER =
        previousEnv.MEDIA_UPLOAD_PROVIDER_ORDER;
    }
  }
});

test("syncLocalMediaAssetsToDatabase upserts scanned local assets", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "hotsnew-media-"));
  const previousEnv = {
    LOCAL_MEDIA_STORAGE_DIR: process.env.LOCAL_MEDIA_STORAGE_DIR,
    LOCAL_MEDIA_PUBLIC_PATH: process.env.LOCAL_MEDIA_PUBLIC_PATH,
    MEDIA_UPLOAD_PROVIDER_ORDER: process.env.MEDIA_UPLOAD_PROVIDER_ORDER,
  };

  process.env.LOCAL_MEDIA_STORAGE_DIR = tempDir;
  process.env.LOCAL_MEDIA_PUBLIC_PATH = "media";
  process.env.MEDIA_UPLOAD_PROVIDER_ORDER = "local";

  const upsertedRows: any[] = [];
  const fakeSupabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            async then(resolve: any) {
              return resolve({ data: [], error: null });
            },
          }),
        }),
      }),
      upsert: async (rows: any) => {
        upsertedRows.push(...(Array.isArray(rows) ? rows : [rows]));
        return { error: null };
      },
    }),
  } as any;

  try {
    await uploadToLocalStorage({
      resourceType: "image",
      userId: "user-99",
      file: {
        buffer: Buffer.from("demo-image"),
        mimetype: "image/png",
        originalname: "cover.png",
      },
    });

    const records = await syncLocalMediaAssetsToDatabase(fakeSupabase, {
      userId: "user-99",
      resourceType: "all",
    });

    assert.equal(records.length, 1);
    assert.equal(upsertedRows.length, 1);
    assert.equal(upsertedRows[0]?.user_id, "user-99");
    assert.equal(upsertedRows[0]?.provider, "local");
  } finally {
    if (previousEnv.LOCAL_MEDIA_STORAGE_DIR === undefined) {
      delete process.env.LOCAL_MEDIA_STORAGE_DIR;
    } else {
      process.env.LOCAL_MEDIA_STORAGE_DIR = previousEnv.LOCAL_MEDIA_STORAGE_DIR;
    }

    if (previousEnv.LOCAL_MEDIA_PUBLIC_PATH === undefined) {
      delete process.env.LOCAL_MEDIA_PUBLIC_PATH;
    } else {
      process.env.LOCAL_MEDIA_PUBLIC_PATH = previousEnv.LOCAL_MEDIA_PUBLIC_PATH;
    }

    if (previousEnv.MEDIA_UPLOAD_PROVIDER_ORDER === undefined) {
      delete process.env.MEDIA_UPLOAD_PROVIDER_ORDER;
    } else {
      process.env.MEDIA_UPLOAD_PROVIDER_ORDER =
        previousEnv.MEDIA_UPLOAD_PROVIDER_ORDER;
    }
  }
});

test("syncLocalMediaAssetsToDatabase preserves existing media metadata", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "hotsnew-media-"));
  const previousEnv = {
    LOCAL_MEDIA_STORAGE_DIR: process.env.LOCAL_MEDIA_STORAGE_DIR,
    LOCAL_MEDIA_PUBLIC_PATH: process.env.LOCAL_MEDIA_PUBLIC_PATH,
    MEDIA_UPLOAD_PROVIDER_ORDER: process.env.MEDIA_UPLOAD_PROVIDER_ORDER,
  };

  process.env.LOCAL_MEDIA_STORAGE_DIR = tempDir;
  process.env.LOCAL_MEDIA_PUBLIC_PATH = "media";
  process.env.MEDIA_UPLOAD_PROVIDER_ORDER = "local";

  const upsertedRows: any[] = [];
  let createdPath = "";
  const fakeSupabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            async then(resolve: any) {
              return resolve({
                data: [
                  { object_path: createdPath },
                ],
                error: null,
              });
            },
          }),
        }),
      }),
      upsert: async (rows: any) => {
        upsertedRows.push(...(Array.isArray(rows) ? rows : [rows]));
        return { error: null };
      },
    }),
  } as any;

  try {
    const created = await uploadToLocalStorage({
      resourceType: "image",
      userId: "user-99",
      file: {
        buffer: Buffer.from("demo-image"),
        mimetype: "image/png",
        originalname: "existing.png",
      },
    });
    createdPath = created.path;

    const records = await syncLocalMediaAssetsToDatabase(fakeSupabase, {
      userId: "user-99",
      resourceType: "all",
    });

    assert.equal(records.length, 0);
    assert.equal(upsertedRows.length, 0);
  } finally {
    if (previousEnv.LOCAL_MEDIA_STORAGE_DIR === undefined) {
      delete process.env.LOCAL_MEDIA_STORAGE_DIR;
    } else {
      process.env.LOCAL_MEDIA_STORAGE_DIR = previousEnv.LOCAL_MEDIA_STORAGE_DIR;
    }

    if (previousEnv.LOCAL_MEDIA_PUBLIC_PATH === undefined) {
      delete process.env.LOCAL_MEDIA_PUBLIC_PATH;
    } else {
      process.env.LOCAL_MEDIA_PUBLIC_PATH = previousEnv.LOCAL_MEDIA_PUBLIC_PATH;
    }

    if (previousEnv.MEDIA_UPLOAD_PROVIDER_ORDER === undefined) {
      delete process.env.MEDIA_UPLOAD_PROVIDER_ORDER;
    } else {
      process.env.MEDIA_UPLOAD_PROVIDER_ORDER =
        previousEnv.MEDIA_UPLOAD_PROVIDER_ORDER;
    }
  }
});

test("updateLocalMediaAssetRecord updates folder and tags", async () => {
  const updates: any[] = [];
  const fakeSupabase = {
    from: () => ({
      update: (payload: any) => {
        updates.push(payload);
        return {
          eq: () => ({
            eq: () => ({
              eq: () => ({
                select: () => ({
                  maybeSingle: async () => ({
                    data: {
                      object_path: "images/user-1/demo.png",
                      public_url: "/media/images/user-1/demo.png",
                      resource_type: "image",
                      folder_name: "campaign-a",
                      tags: ["avatar", "campaign-a"],
                      file_name: "demo.png",
                      size_bytes: 11,
                      modified_at: "2026-06-03T00:00:00.000Z",
                      mime_type: "image/png",
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      },
    }),
  } as any;

  const result = await updateLocalMediaAssetRecord(fakeSupabase, {
    userId: "user-1",
    objectPath: "images/user-1/demo.png",
    folderName: "campaign-a",
    tags: "Avatar, campaign-a",
  });

  assert.equal(updates[0]?.folder_name, "campaign-a");
  assert.deepEqual(updates[0]?.tags, ["avatar", "campaign-a"]);
  assert.equal(result?.folder_name, "campaign-a");
  assert.deepEqual(result?.tags, ["avatar", "campaign-a"]);
});

test("updateLocalMediaAssetsByFolder renames every asset in the folder", async () => {
  const payloads: any[] = [];
  const fakeSupabase = {
    from: () => ({
      update: (payload: any) => {
        payloads.push(payload);
        return {
          eq: () => ({
            eq: () => ({
              eq: () => ({
                select: () => ({
                  async maybeSingle() {
                    return { data: null, error: null };
                  },
                  async then(resolve: any) {
                    return resolve({
                      data: [
                        {
                          object_path: "images/user-1/a.png",
                          public_url: "/media/images/user-1/a.png",
                          resource_type: "image",
                          folder_name: "campaign-b",
                          tags: [],
                          file_name: "a.png",
                          size_bytes: 1,
                          modified_at: "2026-06-03T00:00:00.000Z",
                          mime_type: "image/png",
                        },
                      ],
                      error: null,
                    });
                  },
                }),
              }),
            }),
          }),
        };
      },
    }),
  } as any;

  const result = await updateLocalMediaAssetsByFolder(fakeSupabase, {
    userId: "user-1",
    folderName: "campaign-a",
    nextFolderName: "campaign-b",
  });

  assert.equal(payloads[0]?.folder_name, "campaign-b");
  assert.equal(result[0]?.folderName, "campaign-b");
});

test("moveLocalMediaAssetsFolderToRoot moves folder assets back to root", async () => {
  const payloads: any[] = [];
  const fakeSupabase = {
    from: () => ({
      update: (payload: any) => {
        payloads.push(payload);
        return {
          eq: () => ({
            eq: () => ({
              eq: () => ({
                select: () => ({
                  async then(resolve: any) {
                    return resolve({
                      data: [
                        {
                          object_path: "images/user-1/a.png",
                          public_url: "/media/images/user-1/a.png",
                          resource_type: "image",
                          folder_name: "root",
                          tags: [],
                          file_name: "a.png",
                          size_bytes: 1,
                          modified_at: "2026-06-03T00:00:00.000Z",
                          mime_type: "image/png",
                        },
                      ],
                      error: null,
                    });
                  },
                }),
              }),
            }),
          }),
        };
      },
    }),
  } as any;

  const result = await moveLocalMediaAssetsFolderToRoot(fakeSupabase, {
    userId: "user-1",
    folderName: "campaign-a",
  });

  assert.equal(payloads[0]?.folder_name, "root");
  assert.equal(result[0]?.folderName, "root");
});

test("listLocalMediaFoldersFromDatabase merges folder registry and asset folders", async () => {
  const fakeSupabase = {
    from: (table: string) => {
      if (table === "media_folders") {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({
                data: [
                  { name: "campaign-a" },
                  { name: "root" },
                ],
                error: null,
              }),
            }),
          }),
        };
      }

      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              async then(resolve: any) {
                return resolve({
                  data: [
                    { folder_name: "campaign-b" },
                    { folder_name: "campaign-a" },
                  ],
                  error: null,
                });
              },
            }),
          }),
        }),
      };
    },
  } as any;

  const folders = await listLocalMediaFoldersFromDatabase(fakeSupabase, {
    userId: "user-1",
  });

  assert.deepEqual(folders, ["campaign-a", "campaign-b", "root"]);
});

test("createLocalMediaFolderRecord normalizes and stores folder names", async () => {
  const payloads: any[] = [];
  const fakeSupabase = {
    from: () => ({
      upsert: async (payload: any) => {
        payloads.push(payload);
        return { error: null };
      },
    }),
  } as any;

  const folderName = await createLocalMediaFolderRecord(fakeSupabase, {
    userId: "user-1",
    folderName: "Campaign A",
  });

  assert.equal(folderName, "campaign-a");
  assert.equal(payloads[0]?.name, "campaign-a");
});

test("deleteLocalMediaAssetsInFolder removes files and metadata", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "hotsnew-media-"));
  const previousEnv = {
    LOCAL_MEDIA_STORAGE_DIR: process.env.LOCAL_MEDIA_STORAGE_DIR,
    LOCAL_MEDIA_PUBLIC_PATH: process.env.LOCAL_MEDIA_PUBLIC_PATH,
    MEDIA_UPLOAD_PROVIDER_ORDER: process.env.MEDIA_UPLOAD_PROVIDER_ORDER,
  };

  process.env.LOCAL_MEDIA_STORAGE_DIR = tempDir;
  process.env.LOCAL_MEDIA_PUBLIC_PATH = "media";
  process.env.MEDIA_UPLOAD_PROVIDER_ORDER = "local";

  const deletedMetadata: string[] = [];
  const selectChain = {
    eq: () => selectChain,
    order: async () => ({
      data: [
        {
          object_path: "images/user-1/campaign-a/demo.png",
          public_url: "/media/images/user-1/campaign-a/demo.png",
          resource_type: "image",
          folder_name: "campaign-a",
          tags: [],
          file_name: "demo.png",
          size_bytes: 11,
          modified_at: "2026-06-03T00:00:00.000Z",
          mime_type: "image/png",
        },
      ],
      error: null,
    }),
  };
  const deleteChain = {
    eq: () => deleteChain,
    then: (resolve: (value: { data: null; error: null }) => void) => {
      deletedMetadata.push("campaign-a");
      return resolve({ data: null, error: null });
    },
  };
  const fakeSupabase = {
    from: (table: string) => {
      if (table === "media_assets") {
        return {
          select: () => selectChain,
          delete: () => deleteChain,
        };
      }

      return {
        delete: () => deleteChain,
      };
    },
  } as any;

  try {
    const assetPath = path.join(
      tempDir,
      "images",
      "user-1",
      "campaign-a",
      "demo.png",
    );
    await fs.mkdir(path.dirname(assetPath), { recursive: true });
    await fs.writeFile(assetPath, "demo");

    const deletedCount = await deleteLocalMediaAssetsInFolder(fakeSupabase, {
      userId: "user-1",
      folderName: "campaign-a",
    });

    assert.equal(deletedCount, 1);
    assert.equal(deletedMetadata.length, 2);
    await assert.rejects(fs.access(assetPath));
  } finally {
    if (previousEnv.LOCAL_MEDIA_STORAGE_DIR === undefined) {
      delete process.env.LOCAL_MEDIA_STORAGE_DIR;
    } else {
      process.env.LOCAL_MEDIA_STORAGE_DIR = previousEnv.LOCAL_MEDIA_STORAGE_DIR;
    }

    if (previousEnv.LOCAL_MEDIA_PUBLIC_PATH === undefined) {
      delete process.env.LOCAL_MEDIA_PUBLIC_PATH;
    } else {
      process.env.LOCAL_MEDIA_PUBLIC_PATH = previousEnv.LOCAL_MEDIA_PUBLIC_PATH;
    }

    if (previousEnv.MEDIA_UPLOAD_PROVIDER_ORDER === undefined) {
      delete process.env.MEDIA_UPLOAD_PROVIDER_ORDER;
    } else {
      process.env.MEDIA_UPLOAD_PROVIDER_ORDER =
        previousEnv.MEDIA_UPLOAD_PROVIDER_ORDER;
    }
  }
});

test("moveLocalMediaAssetToFolder creates the target folder if needed", async () => {
  const folderCreates: string[] = [];
  const updates: any[] = [];
  const fakeSupabase = {
    from: (table: string) => {
      if (table === "media_folders") {
        return {
          upsert: async (payload: any) => {
            folderCreates.push(payload.name);
            return { error: null };
          },
        };
      }

      return {
        update: (payload: any) => {
          updates.push(payload);
          return {
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  select: () => ({
                    async maybeSingle() {
                      return {
                        data: {
                          object_path: "images/user-1/demo.png",
                          public_url: "/media/images/user-1/demo.png",
                          resource_type: "image",
                          folder_name: "campaign-b",
                          tags: [],
                          file_name: "demo.png",
                          size_bytes: 1,
                          modified_at: "2026-06-03T00:00:00.000Z",
                          mime_type: "image/png",
                        },
                        error: null,
                      };
                    },
                  }),
                }),
              }),
            }),
          };
        },
      };
    },
  } as any;

  const result = await moveLocalMediaAssetToFolder(fakeSupabase, {
    userId: "user-1",
    objectPath: "images/user-1/demo.png",
    folderName: "Campaign B",
  });

  assert.equal(folderCreates[0], "campaign-b");
  assert.equal(updates[0]?.folder_name, "campaign-b");
  assert.equal(result?.folder_name, "campaign-b");
});

test("updateLocalMediaAssetsTags adds and removes bulk tags", async () => {
  const selectedPaths: string[] = [];
  const updatePayloads: any[] = [];
  const fakeSupabase = {
    from: (_table: string) => {
      let mode: "select" | "update" = "select";
      let currentPath = "";

      return {
        select: () => {
          mode = "select";
          return {
            eq: () => ({
              eq: () => ({
                in: () => ({
                  async then(resolve: any) {
                    selectedPaths.push("images/user-1/a.png", "images/user-1/b.png");
                    return resolve({
                      data: [
                        {
                          object_path: "images/user-1/a.png",
                          public_url: "/media/images/user-1/a.png",
                          resource_type: "image",
                          folder_name: "root",
                          tags: ["avatar"],
                          file_name: "a.png",
                          size_bytes: 1,
                          modified_at: "2026-06-03T00:00:00.000Z",
                          mime_type: "image/png",
                        },
                        {
                          object_path: "images/user-1/b.png",
                          public_url: "/media/images/user-1/b.png",
                          resource_type: "image",
                          folder_name: "root",
                          tags: ["sale"],
                          file_name: "b.png",
                          size_bytes: 1,
                          modified_at: "2026-06-03T00:00:00.000Z",
                          mime_type: "image/png",
                        },
                      ],
                      error: null,
                    });
                  },
                }),
              }),
            }),
          };
        },
        update: (payload: any) => {
          mode = "update";
          updatePayloads.push(payload);
          return {
            eq: (key: string, value: string) => {
              if (key === "object_path") {
                currentPath = value;
              }
              return {
                eq: () => ({
                  eq: () => ({
                    select: () => ({
                      async maybeSingle() {
                        return {
                          data: {
                            object_path: currentPath,
                          public_url: `/media/${currentPath}`,
                          resource_type: "image",
                          folder_name: "root",
                          tags: payload.tags,
                          file_name: "updated.png",
                          size_bytes: 1,
                          modified_at: "2026-06-03T00:00:00.000Z",
                          mime_type: "image/png",
                        },
                          error: null,
                        };
                      },
                    }),
                  }),
                }),
              };
            },
          };
        },
      };
    },
  } as any;

  const result = await updateLocalMediaAssetsTags(fakeSupabase, {
    userId: "user-1",
    objectPaths: ["images/user-1/a.png", "images/user-1/b.png"],
    addTags: "campaign-a, Avatar",
    removeTags: "sale",
  });

  assert.equal(selectedPaths.length, 2);
  assert.equal(updatePayloads.length, 2);
  assert.deepEqual(result[0]?.tags.sort(), ["avatar", "campaign-a"]);
});
