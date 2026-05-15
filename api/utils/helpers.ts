import { Request } from "express";
import { isIP } from "node:net";
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

export const normalizeClientIp = (value: unknown) => {
  if (typeof value !== "string") return "";

  let candidate = value.split(",")[0]?.trim() || "";
  if (!candidate) return "";

  candidate = candidate
    .replace(/^for=/i, "")
    .replace(/^"+|"+$/g, "")
    .replace(/^\[|\]$/g, "")
    .replace(/^::ffff:/i, "");

  if (candidate.includes(":") && candidate.includes(".") && /:\d+$/.test(candidate)) {
    candidate = candidate.replace(/:\d+$/, "");
  }

  if (candidate === "::1") return candidate;

  return isIP(candidate) ? candidate : "";
};

export const isPrivateOrLocalIp = (ip: string) => {
  const normalizedIp = normalizeClientIp(ip);
  if (!normalizedIp) return true;

  const version = isIP(normalizedIp);
  if (version === 4) {
    if (
      normalizedIp.startsWith("10.") ||
      normalizedIp.startsWith("127.") ||
      normalizedIp.startsWith("192.168.") ||
      normalizedIp.startsWith("169.254.")
    ) {
      return true;
    }

    const secondOctet = Number(normalizedIp.split(".")[1] || 0);
    if (normalizedIp.startsWith("172.") && secondOctet >= 16 && secondOctet <= 31) {
      return true;
    }

    return false;
  }

  if (version === 6) {
    const lower = normalizedIp.toLowerCase();
    return (
      lower === "::1" ||
      lower.startsWith("fc") ||
      lower.startsWith("fd") ||
      lower.startsWith("fe80:")
    );
  }

  return true;
};

export const getClientIp = (req: Request) => {
  const headerCandidates = [
    req.headers["cf-connecting-ip"],
    req.headers["x-real-ip"],
    req.headers["x-client-ip"],
    req.headers["true-client-ip"],
    req.headers["fly-client-ip"],
    req.headers["x-forwarded-for"],
  ];

  for (const candidate of headerCandidates) {
    const normalized = normalizeClientIp(
      Array.isArray(candidate) ? candidate[0] : candidate,
    );
    if (normalized) {
      return normalized;
    }
  }

  return (
    normalizeClientIp(req.ip) ||
    normalizeClientIp(req.socket.remoteAddress) ||
    ""
  );
};

export const getPublicBaseUrl = (req?: Request) => {
  if (req) {
    return `${req.protocol}://${req.get("host")}`;
  }

  const configured =
    process.env.APP_BASE_URL ||
    process.env.PUBLIC_BASE_URL ||
    process.env.VITE_APP_BASE_URL ||
    process.env.VERCEL_URL;

  if (configured) {
    return configured.startsWith("http") ? configured : `https://${configured}`;
  }

  return null;
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
