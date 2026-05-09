#!/usr/bin/env node
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { S3Client, HeadBucketCommand, PutObjectCommand } = require("@aws-sdk/client-s3");

const rootDir = path.resolve(__dirname, "..");
const releaseDir = path.join(rootDir, "release");
const rootPackage = require(path.join(rootDir, "package.json"));
const appVersion = rootPackage.version;

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || "";
const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";
const bucketName = process.env.R2_BUCKET_NAME || "downloads";
const publicBaseUrl = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/+$/, "");

const defaultFiles = [
  `hotsnew-click-setup-${appVersion}-x64.exe`,
  `hotsnew-click-portable-${appVersion}-x64.exe`,
  "latest.yml",
  `hotsnew-click-setup-${appVersion}-x64.exe.blockmap`,
];

if (!accountId || !accessKeyId || !secretAccessKey) {
  console.error(
    "Missing Cloudflare R2 credentials. Set CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY in .env.",
  );
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

const inferContentType = (fileName) => {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".exe")) {
    return "application/vnd.microsoft.portable-executable";
  }
  if (lower.endsWith(".zip")) {
    return "application/zip";
  }
  if (lower.endsWith(".yml") || lower.endsWith(".yaml")) {
    return "text/yaml";
  }
  if (lower.endsWith(".blockmap")) {
    return "application/octet-stream";
  }
  return "application/octet-stream";
};

const ensureBucketAccessible = async () => {
  await client.send(
    new HeadBucketCommand({
      Bucket: bucketName,
    }),
  );
};

const buildPublicUrl = (fileName) => {
  if (!publicBaseUrl) return null;
  return `${publicBaseUrl}/${encodeURIComponent(fileName)}`;
};

const uploadFile = async (fileName) => {
  const absolutePath = path.join(releaseDir, fileName);
  if (!fs.existsSync(absolutePath)) {
    console.warn(`Skip missing file: ${absolutePath}`);
    return null;
  }

  const body = fs.readFileSync(absolutePath);
  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: body,
      ContentType: inferContentType(fileName),
      CacheControl: "public, max-age=3600",
    }),
  );

  const publicUrl = buildPublicUrl(fileName);
  console.log(`Uploaded ${fileName}`);
  if (publicUrl) {
    console.log(`Public URL: ${publicUrl}`);
  } else {
    console.log("Uploaded successfully. Set R2_PUBLIC_BASE_URL to print the public URL automatically.");
  }
  return publicUrl;
};

const main = async () => {
  const targets = process.argv.slice(2);
  const files = targets.length ? targets : defaultFiles;

  console.log(`Checking bucket "${bucketName}"...`);
  await ensureBucketAccessible();
  console.log(`Bucket "${bucketName}" is reachable.`);

  const urls = [];
  for (const fileName of files) {
    const publicUrl = await uploadFile(fileName);
    if (publicUrl) urls.push(publicUrl);
  }

  console.log("\nDone.");
  if (urls.length) {
    console.log("Uploaded URLs:");
    urls.forEach((urlValue) => console.log(`- ${urlValue}`));
  } else {
    console.log(
      "Set R2_PUBLIC_BASE_URL in .env after enabling a public bucket domain to get final download URLs.",
    );
  }
};

main().catch((error) => {
  console.error("Cloudflare R2 publish failed:", error);
  process.exit(1);
});
