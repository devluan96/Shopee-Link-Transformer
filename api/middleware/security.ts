import { NextFunction, Request, Response } from "express";
import { getSupabase } from "../config/supabase.js";
import { getClientIp } from "../utils/helpers.js";
import { isCandidatePublicSlugPath } from "../utils/linkPaths.js";
import * as securityService from "../services/securityService.js";
import { AuthenticatedRequest } from "../types/index.js";

const SOCIAL_PREVIEW_BOT_REGEX =
  /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|Discordbot|TelegramBot|WhatsApp|SkypeUriPreview|Pinterest|Zalo|Googlebot|bingbot|embedly/i;

const isPublicPreviewPath = (req: Request) =>
  req.path.startsWith("/s/") ||
  req.path.startsWith("/s-choice/") ||
  isCandidatePublicSlugPath(req.path);

const isSocialPreviewRequest = (req: Request) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return false;
  }

  const userAgent = String(req.headers["user-agent"] || "");
  return SOCIAL_PREVIEW_BOT_REGEX.test(userAgent);
};

const shouldAuditRequest = (req: Request) => {
  return (
    req.path.startsWith("/api/") ||
    isPublicPreviewPath(req)
  );
};

export const blockBlockedIps = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!shouldAuditRequest(req)) return next();
    if (isPublicPreviewPath(req) && isSocialPreviewRequest(req)) {
      return next();
    }

    const ipAddress = getClientIp(req);
    if (!ipAddress) return next();

    const supabase = getSupabase();
    const blockedIp = await securityService.isIpBlocked(supabase, ipAddress);
    if (!blockedIp) return next();

    await securityService.logAccessEvent(supabase, {
      ip_address: ipAddress,
      method: req.method,
      path: req.originalUrl || req.path,
      status_code: 403,
      user_agent: req.headers["user-agent"] || null,
      referer: typeof req.headers.referer === "string" ? req.headers.referer : null,
      blocked: true,
      block_reason: blockedIp.reason || "Blocked IP",
      metadata: {
        blocked_ip_id: blockedIp.id,
      },
    });

    return res.status(403).json({
      error: "IP address blocked",
      reason: blockedIp.reason || "Blocked by administrator",
    });
  } catch (error: any) {
    console.error("[Security] blockBlockedIps error:", error?.message || error);
    next();
  }
};

export const auditAccessLogs = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!shouldAuditRequest(req)) return next();

  res.on("finish", () => {
    try {
      const supabase = getSupabase();
      const authReq = req as AuthenticatedRequest;
      void securityService.logAccessEvent(supabase, {
        user_id: authReq.authUser?.id || null,
        email: authReq.authUser?.email || authReq.authProfile?.email || null,
        ip_address: getClientIp(req),
        method: req.method,
        path: req.originalUrl || req.path,
        status_code: res.statusCode,
        user_agent: req.headers["user-agent"] || null,
        referer: typeof req.headers.referer === "string" ? req.headers.referer : null,
        blocked: res.statusCode === 403,
        block_reason: res.statusCode === 403 ? "Forbidden" : null,
        metadata: {
          authenticated: !!authReq.authUser?.id,
        },
      });
    } catch (error: any) {
      console.error("[Security] auditAccessLogs error:", error?.message || error);
    }
  });

  next();
};
