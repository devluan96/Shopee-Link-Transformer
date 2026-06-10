import "dotenv/config";
import { createHash } from "node:crypto";
import { Readable } from "node:stream";
import { getSupabase } from "../server/config/supabase.js";
import {
  MEDIA_ASSET_FINGERPRINT_METADATA_KEY,
} from "../server/services/mediaUploadService.js";

const MANAGED_PROVIDERS = ["r2", "cloudinary", "supabase"] as const;
const DEFAULT_PAGE_SIZE = 200;
const DEFAULT_CONCURRENCY = 3;

type ManagedProvider = (typeof MANAGED_PROVIDERS)[number];

type MediaAssetRow = {
  id: string;
  user_id: string;
  provider: ManagedProvider;
  resource_type: "image" | "video" | "audio";
  public_url: string;
  metadata: Record<string, unknown> | null;
  object_path: string;
};

type BackfillStats = {
  scanned: number;
  candidates: number;
  updated: number;
  skippedExisting: number;
  skippedFetch: number;
  failed: number;
};

const parsePositiveInteger = (value: string | undefined, fallback: number) => {
  const parsed = Number(value || "");
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const getFingerprintFromMetadata = (metadata: unknown) => {
  if (!metadata || typeof metadata !== "object") {
    return "";
  }

  const rawFingerprint = (
    metadata as Record<string, unknown>
  )[MEDIA_ASSET_FINGERPRINT_METADATA_KEY];
  return typeof rawFingerprint === "string" ? rawFingerprint.trim() : "";
};

const hasFingerprint = (row: MediaAssetRow) =>
  Boolean(getFingerprintFromMetadata(row.metadata));

const hashFromResponse = async (response: Response) => {
  if (!response.ok) {
    throw new Error(`Fetch failed with status ${response.status}`);
  }

  if (!response.body) {
    throw new Error("Response body is empty.");
  }

  const hasher = createHash("sha256");
  const stream = Readable.fromWeb(response.body as any);

  for await (const chunk of stream) {
    hasher.update(chunk);
  }

  return hasher.digest("hex");
};

const fetchAssetSha256 = async (publicUrl: string) => {
  const response = await fetch(publicUrl, {
    redirect: "follow",
  });

  return hashFromResponse(response);
};

const runWithConcurrency = async <T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
) => {
  const queue = [...items];
  const workerCount = Math.min(concurrency, queue.length);
  const workers = Array.from({ length: workerCount }, async () => {
    while (queue.length) {
      const item = queue.shift();
      if (!item) {
        break;
      }

      await worker(item);
    }
  });

  await Promise.all(workers);
};

const main = async () => {
  const supabase = getSupabase();
  const pageSize = parsePositiveInteger(
    process.env.MEDIA_SHA256_BACKFILL_PAGE_SIZE,
    DEFAULT_PAGE_SIZE,
  );
  const concurrency = parsePositiveInteger(
    process.env.MEDIA_SHA256_BACKFILL_CONCURRENCY,
    DEFAULT_CONCURRENCY,
  );
  const limit = parsePositiveInteger(
    process.env.MEDIA_SHA256_BACKFILL_LIMIT,
    0,
  );
  const dryRun = process.argv.includes("--dry-run");

  const stats: BackfillStats = {
    scanned: 0,
    candidates: 0,
    updated: 0,
    skippedExisting: 0,
    skippedFetch: 0,
    failed: 0,
  };

  let offset = 0;
  let stop = false;

  while (!stop) {
    const { data, error } = await supabase
      .from("media_assets")
      .select("id, user_id, provider, resource_type, public_url, metadata, object_path")
      .in("provider", MANAGED_PROVIDERS)
      .order("created_at", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw error;
    }

    const rows = (data || []) as MediaAssetRow[];
    if (!rows.length) {
      break;
    }

    stats.scanned += rows.length;
    const pending = rows.filter((row) => !hasFingerprint(row));
    stats.candidates += pending.length;

    await runWithConcurrency(pending, concurrency, async (row) => {
      if (limit > 0 && stats.updated >= limit) {
        return;
      }

      if (!row.public_url?.trim()) {
        stats.skippedFetch += 1;
        console.warn(`[skip] missing public_url for ${row.id} (${row.provider})`);
        return;
      }

      try {
        const sha256 = await fetchAssetSha256(row.public_url);
        const nextMetadata = {
          ...(row.metadata && typeof row.metadata === "object" ? row.metadata : {}),
          [MEDIA_ASSET_FINGERPRINT_METADATA_KEY]: sha256,
        };

        if (dryRun) {
          console.log(
            `[dry-run] ${row.id} (${row.provider}) => ${sha256} :: ${row.public_url}`,
          );
          stats.updated += 1;
          return;
        }

        const { data: updated, error: updateError } = await supabase
          .from("media_assets")
          .update({ metadata: nextMetadata })
          .eq("id", row.id)
          .select("id")
          .maybeSingle();

        if (updateError) {
          throw updateError;
        }

        if (updated) {
          stats.updated += 1;
          console.log(
            `[ok] ${row.id} (${row.provider}) -> sha256 backfilled`,
          );
        } else {
          stats.skippedExisting += 1;
          console.log(`[skip] ${row.id} already updated by another worker`);
        }
      } catch (error) {
        stats.failed += 1;
        console.warn(
          `[fail] ${row.id} (${row.provider}) ${row.public_url}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    });

    if (limit > 0 && stats.updated >= limit) {
      stop = true;
    }

    if (rows.length < pageSize) {
      break;
    }

    offset += rows.length;
  }

  console.log(
    [
      "Backfill complete.",
      `scanned=${stats.scanned}`,
      `candidates=${stats.candidates}`,
      `updated=${stats.updated}`,
      `skippedExisting=${stats.skippedExisting}`,
      `skippedFetch=${stats.skippedFetch}`,
      `failed=${stats.failed}`,
      dryRun ? "mode=dry-run" : "mode=write",
    ].join(" "),
  );
};

main().catch((error) => {
  console.error(
    "Media sha256 backfill failed:",
    error instanceof Error ? error.stack || error.message : error,
  );
  process.exitCode = 1;
});
