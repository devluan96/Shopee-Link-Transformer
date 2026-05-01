import { Request } from "express";
import crypto from "crypto";
import { normalizeTrafficSource } from "./normalizers.js";

export const getBearerToken = (req: Request) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length).trim();
};

export const getTrafficSourceFromRequest = (req: Request) => {
  const srcParam =
    (typeof req.query.src === "string" && req.query.src) ||
    (typeof req.query.source === "string" && req.query.source) ||
    (typeof req.query.utm_source === "string" && req.query.utm_source) ||
    null;
  const referer =
    typeof req.headers.referer === "string" ? req.headers.referer : null;
  const inferredFromReferer = normalizeTrafficSource(referer);
  const source =
    normalizeTrafficSource(srcParam) || inferredFromReferer || "direct";

  return {
    source,
    source_detail: srcParam?.trim() || null,
    referer,
  };
};

export const escapeHtml = (unsafe: string) => {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const chunkArray = <T>(items: T[], chunkSize: number) => {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
};

export const getPublicBaseUrl = (req?: Request) => {
  const configured =
    process.env.APP_BASE_URL ||
    process.env.PUBLIC_BASE_URL ||
    process.env.VITE_APP_BASE_URL ||
    process.env.VERCEL_URL;

  if (configured) {
    return configured.startsWith("http") ? configured : `https://${configured}`;
  }

  if (!req) return null;
  return `${req.protocol}://${req.get("host")}`;
};

export const hmacSha256 = (input: string, key: string) =>
  crypto.createHmac("sha256", key).update(input).digest("hex");

export const getVietnamDatePrefix = () => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const year = parts.find((part) => part.type === "year")?.value ?? "00";

  return `${year}${month}${day}`;
};
