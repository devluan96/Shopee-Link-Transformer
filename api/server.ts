import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cors from "cors";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { createClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";

console.log("🏁 SERVER.TS LOADING...");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;

// 1. Cloudinary Config - Safe Wrap
try {
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log("✅ Cloudinary Configured");
  } else {
    console.warn("⚠️ Cloudinary Config Missing");
  }
} catch (err) {
  console.error("❌ Cloudinary config error:", err);
}

// 2. Supabase Admin - Lazy & Safe initialization
let _supabaseClient: any = null;
const getSupabase = () => {
  if (!_supabaseClient) {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
      "";

    if (!url || !key) {
      console.error("❌ Supabase Env Missing");
      throw new Error(
        `Supabase configuration missing on server (${!url ? "URL " : ""}${!key ? "KEY" : ""})`,
      );
    }

    try {
      _supabaseClient = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      console.log("✅ Supabase Client Initialized");
    } catch (err) {
      console.error("❌ Supabase Init Fail:", err);
      throw err;
    }
  }
  return _supabaseClient;
};

// 3. Multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

const app = express();

type SubscriptionPlan = "free" | "monthly" | "yearly";
type PaidSubscriptionPlan = Exclude<SubscriptionPlan, "free">;

const ZALOPAY_CREATE_ORDER_PATH = "/v2/create";
const ZALOPAY_QUERY_ORDER_PATH = "/v2/query";

const SUBSCRIPTION_PRICING: Record<
  PaidSubscriptionPlan,
  { amount: number; label: string }
> = {
  monthly: {
    amount: 299000,
    label: "Goi thang Premium",
  },
  yearly: {
    amount: 2490000,
    label: "Goi nam Premium",
  },
};

interface AuthenticatedRequest extends Request {
  authUser?: {
    id: string;
    email?: string;
  };
  authProfile?: {
    id: string;
    email?: string;
    role?: string;
    status?: string;
    full_name?: string;
    avatar_url?: string;
    subscription_plan?: SubscriptionPlan;
    subscription_expiry?: string | null;
  } | null;
}

const getBearerToken = (req: Request) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length).trim();
};

const hmacSha256 = (input: string, key: string) =>
  crypto.createHmac("sha256", key).update(input).digest("hex");

const getVietnamDatePrefix = () => {
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

const getPublicBaseUrl = (req?: Request) => {
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

const getZaloPayConfig = () => {
  const appIdRaw = process.env.ZALOPAY_APP_ID;
  const key1 = process.env.ZALOPAY_KEY1;
  const key2 = process.env.ZALOPAY_KEY2;
  const apiBaseUrl = process.env.ZALOPAY_API_BASE_URL;

  if (!appIdRaw || !key1 || !key2 || !apiBaseUrl) {
    throw new Error(
      "Missing ZaloPay configuration. Required: ZALOPAY_APP_ID, ZALOPAY_KEY1, ZALOPAY_KEY2, ZALOPAY_API_BASE_URL",
    );
  }

  const appId = Number(appIdRaw);
  if (!Number.isFinite(appId)) {
    throw new Error("ZALOPAY_APP_ID must be a number");
  }

  return {
    appId,
    key1,
    key2,
    apiBaseUrl: apiBaseUrl.replace(/\/+$/, ""),
  };
};

const addSubscriptionDuration = (
  currentExpiry: string | null | undefined,
  plan: PaidSubscriptionPlan,
) => {
  const now = new Date();
  const baseDate =
    currentExpiry && new Date(currentExpiry).getTime() > now.getTime()
      ? new Date(currentExpiry)
      : now;

  if (plan === "monthly") {
    baseDate.setDate(baseDate.getDate() + 30);
  } else {
    baseDate.setFullYear(baseDate.getFullYear() + 1);
  }

  return baseDate.toISOString();
};

const syncSubscriptionForUser = async (
  userId: string,
  plan: PaidSubscriptionPlan,
) => {
  const supabase = getSupabase();
  const { data: existingProfile, error: existingError } = await supabase
    .from("profiles")
    .select("email, full_name, avatar_url, role, status, subscription_expiry")
    .eq("id", userId)
    .maybeSingle();

  if (existingError) throw existingError;

  const nextExpiry = addSubscriptionDuration(
    existingProfile?.subscription_expiry,
    plan,
  );

  const { error: updateError } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      email: existingProfile?.email,
      full_name: existingProfile?.full_name,
      avatar_url: existingProfile?.avatar_url,
      role: existingProfile?.role || "user",
      status: existingProfile?.status || "approved",
      subscription_plan: plan,
      subscription_expiry: nextExpiry,
      updated_at: new Date().toISOString(),
    });

  if (updateError) throw updateError;

  return nextExpiry;
};

const isPremiumProfile = (profile: AuthenticatedRequest["authProfile"]) => {
  if (!profile) return false;
  if (profile.role === "admin") return true;
  if (
    profile.subscription_plan === "monthly" ||
    profile.subscription_plan === "yearly"
  ) {
    if (!profile.subscription_expiry) return true;
    return new Date(profile.subscription_expiry).getTime() > Date.now();
  }
  return false;
};

const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ error: "Missing bearer token" });

    const supabase = getSupabase();
    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.authUser = {
      id: userData.user.id,
      email: userData.user.email ?? undefined,
    };

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        "id, email, role, status, full_name, avatar_url, subscription_plan, subscription_expiry",
      )
      .eq("id", userData.user.id)
      .maybeSingle();

    if (profileError) {
      return res.status(500).json({ error: profileError.message });
    }

    req.authProfile = profile ?? null;
    next();
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Authentication failed" });
  }
};

const checkPremium = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.authUser) return res.status(401).json({ error: "Unauthorized" });
  if (!isPremiumProfile(req.authProfile)) {
    return res.status(403).json({ error: "Premium plan required" });
  }
  next();
};

const checkAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.authUser) return res.status(401).json({ error: "Unauthorized" });
  if (req.authProfile?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// A. MIDDLEWARES
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  }),
);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.set("trust proxy", 1);
app.set("etag", false);

// B. CACHE-BUSTING & LOGGING
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
  }
  next();
});

// C. API ROUTES
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    msg: "Health Check Success",
    serverInfo: {
      nodeEnv: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL,
      hasUrl: !!(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL),
      hasKey: !!(
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
      ),
    },
  });
});

app.post(
  "/api/v1/upload-video",
  authenticate,
  checkPremium,
  upload.single("file"),
  async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file provided" });
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "auto", folder: "hotsnew" },
        (error, result) => {
          if (error) return res.status(500).json({ error: error.message });
          res.json({ secure_url: result?.secure_url });
        },
      );
      stream.end(req.file.buffer);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
);

app.post(
  "/api/v1/upload-avatar",
  authenticate,
  upload.single("file"),
  async (req: any, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const supabase = getSupabase();
      if (!req.file) return res.status(400).json({ error: "No file provided" });
      const userId = authReq.authUser?.id;
      if (!userId) return res.status(400).json({ error: "Missing userId" });

      const fileExt = req.file.originalname.split(".").pop() || "png";
      const fileName = `${userId}_${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from("avatars")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });

      if (error) throw error;
      const { data: publicData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);
      res.json({ secure_url: publicData.publicUrl });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
);

app.get(
  "/api/v1/user/profile",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const userId = req.authUser?.id;
      if (!userId) return res.status(400).json({ error: "Missing userId" });
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      res.json(data || { id: userId, is_new: true });
    } catch (e: any) {
      console.error("API Error /api/v1/user/profile:", e.message);
      res.status(500).json({ error: e.message || "Unknown error" });
    }
  },
);

app.post(
  "/api/v1/user/profile/update",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const userId = req.authUser?.id;
      const email = req.authUser?.email;
      const { full_name, avatar_url } = req.body;
      if (!userId) return res.status(400).json({ error: "Missing userId" });
      // 1. Get existing profile to preserve sensitive fields (role, subscription)
      const { data: existing } = await supabase
        .from("profiles")
        .select("subscription_plan, subscription_expiry, role")
        .eq("id", userId)
        .maybeSingle();

      const { data, error } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          email,
          full_name,
          avatar_url,
          role: existing?.role || "user",
          subscription_plan: existing?.subscription_plan || "free",
          subscription_expiry: existing?.subscription_expiry || null,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
);

app.post(
  "/api/v1/convert",
  authenticate,
  checkPremium,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const userId = req.authUser?.id;
      const { url, customTitle, customDescription, customImageUrl, videoUrl } =
        req.body;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const shortCode = nanoid(8);
      const { data, error } = await supabase
        .from("links")
        .insert({
          original_url: url,
          short_code: shortCode,
          user_id: userId,
          custom_title: customTitle,
          custom_description: customDescription,
          custom_image_url: customImageUrl,
          video_url: videoUrl,
        })
        .select()
        .single();
      if (error) throw error;
      res.json({
        id: data.id,
        converted_url: `https://hotsnew.click/s/${shortCode}`,
        short_code: data.short_code,
        shortCode: data.short_code,
        custom_image_url: data.custom_image_url,
        video_url: data.video_url,
      });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  },
);

app.get(
  "/api/v1/user/links",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const userId = req.authUser?.id;
      if (!userId) return res.status(400).json({ error: "Missing userId" });
      const { data, error } = await supabase
        .from("links")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
);

app.patch(
  "/api/v1/user/links/:id",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const { id } = req.params;
      const {
        custom_title,
        custom_description,
        custom_image_url,
        original_url,
      } = req.body;
      const userId = req.authUser?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { data, error } = await supabase
        .from("links")
        .update({
          custom_title,
          custom_description,
          custom_image_url,
          original_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
);

app.delete(
  "/api/v1/user/links/:id",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const { id } = req.params;
      const userId = req.authUser?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // First delete clicks associated with this link
      await supabase.from("clicks").delete().eq("link_id", id);

      const { error } = await supabase
        .from("links")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) throw error;
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
);

app.get(
  "/api/v1/user/stats",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const userId = req.authUser?.id;
      if (!userId) return res.status(400).json({ error: "Missing userId" });
      const { count, error } = await supabase
        .from("links")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      if (error) throw error;
      res.json({
        totalLinks: count || 0,
        totalClicks: 0,
        recentClicks: [],
        topLinks: [],
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
);

app.get(
  "/api/v1/user/analytics",
  authenticate,
  checkPremium,
  async (req: AuthenticatedRequest, res) => {
    try {
      const supabase = getSupabase();
      const userId = req.authUser?.id;
      console.log(`📈 [Analytics] Request for userId: ${userId}`);

      if (!userId) {
        console.warn("⚠️ [Analytics] Missing userId");
        return res.status(400).json({ error: "Missing userId" });
      }

      const { data: links, error: linksError } = await supabase
        .from("links")
        .select("id, custom_title, short_code")
        .eq("user_id", userId);

      if (linksError) {
        console.error("❌ [Analytics] Links query error:", linksError);
        throw linksError;
      }

      if (!links || links.length === 0) {
        console.log("ℹ️ [Analytics] No links found for user");
        return res.json({ history: [], topLinks: [] });
      }

      const linkIds = links.map((d: any) => d.id);
      const linkMap = Object.fromEntries(
        links.map((d: any) => [d.id, d.custom_title || d.short_code]),
      );
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      console.log(
        `📊 [Analytics] Fetching clicks for ${linkIds.length} links since ${thirtyDaysAgo.toISOString()}`,
      );

      const { data: clicks, error: clicksError } = await supabase
        .from("clicks")
        .select("link_id, created_at")
        .in("link_id", linkIds.slice(0, 100)) // Increased slice to 100
        .gte("created_at", thirtyDaysAgo.toISOString());

      if (clicksError) {
        console.error("❌ [Analytics] Clicks query error:", clicksError);
        // Don't throw here, just return empty clicks but log it
        return res.json({ history: [], topLinks: [] });
      }

      const historyMap: any = {};
      const linksStats: any = {};
      if (clicks) {
        clicks.forEach((c: any) => {
          const date = c.created_at.split("T")[0];
          historyMap[date] = (historyMap[date] || 0) + 1;
          linksStats[c.link_id] = (linksStats[c.link_id] || 0) + 1;
        });
      }

      const history = Object.entries(historyMap)
        .map(([date, clicks]) => ({ date, clicks }))
        .sort((a: any, b: any) => a.date.localeCompare(b.date));
      const topLinks = Object.entries(linksStats)
        .map(([id, clicks]) => ({ id, clicks, title: linkMap[id] }))
        .sort((a: any, b: any) => b.clicks - a.clicks)
        .slice(0, 5);

      console.log(
        `✅ [Analytics] Success: ${history.length} history points, ${topLinks.length} top links`,
      );
      res.json({ history, topLinks });
    } catch (e: any) {
      console.error("💥 [Analytics] Final catch block error:", e.message);
      res.json({ history: [], topLinks: [] });
    }
  },
);

app.post(
  "/api/v1/billing/zalopay/create-order",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.authUser?.id;
      const userEmail = req.authUser?.email;
      const plan = req.body?.plan as PaidSubscriptionPlan;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (plan !== "monthly" && plan !== "yearly") {
        return res.status(400).json({ error: "Invalid subscription plan" });
      }

      const { appId, key1, apiBaseUrl } = getZaloPayConfig();
      const publicBaseUrl = getPublicBaseUrl(req);
      if (!publicBaseUrl) {
        return res.status(500).json({
          error: "Missing APP_BASE_URL or PUBLIC_BASE_URL for ZaloPay redirect/callback",
        });
      }

      const pricing = SUBSCRIPTION_PRICING[plan];
      const appTransId = `${getVietnamDatePrefix()}_${plan}_${nanoid(10)}`;
      const appTime = Date.now();
      const redirectUrl = `${publicBaseUrl}/?tab=pricing&payment=return&plan=${plan}&app_trans_id=${encodeURIComponent(appTransId)}`;
      const callbackUrl = `${publicBaseUrl}/api/v1/billing/zalopay/callback`;
      const embedData = JSON.stringify({
        redirecturl: redirectUrl,
        preferred_payment_method: ["zalopay_wallet", "vietqr"],
        plan,
      });
      const item = JSON.stringify([
        {
          plan,
          user_id: userId,
          amount: pricing.amount,
        },
      ]);
      const description = `${pricing.label} cho ${userEmail || userId}`.slice(
        0,
        256,
      );
      const macInput = [
        appId,
        appTransId,
        userId,
        pricing.amount,
        appTime,
        embedData,
        item,
      ].join("|");

      const requestBody = new URLSearchParams({
        app_id: String(appId),
        app_user: userId,
        app_trans_id: appTransId,
        app_time: String(appTime),
        amount: String(pricing.amount),
        description,
        item,
        embed_data: embedData,
        callback_url: callbackUrl,
        mac: hmacSha256(macInput, key1),
      });

      const response = await fetch(`${apiBaseUrl}${ZALOPAY_CREATE_ORDER_PATH}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: requestBody.toString(),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        return res.status(502).json({
          error: "ZaloPay create-order request failed",
          details: data,
        });
      }

      if (data?.return_code !== 1 || !data?.order_url) {
        return res.status(400).json({
          error:
            data?.sub_return_message ||
            data?.return_message ||
            "Cannot create ZaloPay order",
          details: data,
        });
      }

      res.json({
        app_trans_id: appTransId,
        order_url: data.order_url,
        zp_trans_token: data.zp_trans_token,
        qr_code: data.qr_code,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Create order failed" });
    }
  },
);

app.post("/api/v1/billing/zalopay/callback", async (req, res) => {
  try {
    const { key2 } = getZaloPayConfig();
    const dataStr = req.body?.data;
    const requestMac = req.body?.mac;

    if (!dataStr || !requestMac) {
      return res
        .status(400)
        .json({ return_code: 2, return_message: "Invalid callback payload" });
    }

    const validMac = hmacSha256(dataStr, key2);
    if (validMac !== requestMac) {
      return res
        .status(200)
        .json({ return_code: 2, return_message: "Invalid callback MAC" });
    }

    const callbackData = JSON.parse(dataStr);
    const embedData = JSON.parse(callbackData.embed_data || "{}");
    const itemData = JSON.parse(callbackData.item || "[]");
    const plan =
      itemData?.[0]?.plan ||
      embedData?.plan ||
      (callbackData.app_trans_id?.includes("_yearly_") ? "yearly" : "monthly");
    const userId = itemData?.[0]?.user_id || callbackData.app_user;

    if (userId && (plan === "monthly" || plan === "yearly")) {
      await syncSubscriptionForUser(userId, plan);
    }

    return res
      .status(200)
      .json({ return_code: 1, return_message: "success" });
  } catch (e: any) {
    return res
      .status(200)
      .json({ return_code: 0, return_message: e.message || "retry" });
  }
});

app.get(
  "/api/v1/billing/zalopay/status/:appTransId",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.authUser?.id;
      const { appTransId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { appId, key1, apiBaseUrl } = getZaloPayConfig();
      const mac = hmacSha256(`${appId}|${appTransId}|${key1}`, key1);

      const requestBody = new URLSearchParams({
        app_id: String(appId),
        app_trans_id: appTransId,
        mac,
      });

      const response = await fetch(`${apiBaseUrl}${ZALOPAY_QUERY_ORDER_PATH}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: requestBody.toString(),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        return res.status(502).json({
          error: "ZaloPay order-status request failed",
          details: data,
        });
      }

      const plan = appTransId.includes("_yearly_") ? "yearly" : "monthly";
      const isPaid = data?.return_code === 1;
      let subscriptionExpiry: string | null = null;

      if (isPaid) {
        subscriptionExpiry = await syncSubscriptionForUser(
          userId,
          plan as PaidSubscriptionPlan,
        );
      }

      return res.json({
        paid: isPaid,
        processing: data?.return_code === 3,
        plan,
        subscription_expiry: subscriptionExpiry,
        status: data,
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || "Query order failed" });
    }
  },
);

app.get("/api/v1/admin/users", authenticate, checkAdmin, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post(
  "/api/v1/admin/users/:targetUid/approve",
  authenticate,
  checkAdmin,
  async (req, res) => {
    try {
      const supabase = getSupabase();
      const { targetUid } = req.params;
      const { isApproved } = req.body;
      const { error } = await supabase
        .from("profiles")
        .update({ status: isApproved ? "approved" : "pending" })
        .eq("id", targetUid);
      if (error) throw error;
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
);

app.post(
  "/api/v1/admin/users/:targetUid/subscription",
  authenticate,
  checkAdmin,
  async (req, res) => {
    try {
      const supabase = getSupabase();
      const { targetUid } = req.params;
      const { plan, expiry } = req.body;

      console.log(`🛠 [Admin] Updating sub for ${targetUid} to ${plan}`);

      const { error } = await supabase
        .from("profiles")
        .update({
          subscription_plan: plan,
          subscription_expiry: expiry,
        })
        .eq("id", targetUid);

      if (error) {
        console.error("❌ Supabase Update Error:", error);
        return res.status(400).json({
          error: error.message,
          details:
            "Vui lòng kiểm tra bảng profiles đã có cột subscription_plan và subscription_expiry chưa.",
        });
      }

      res.json({ success: true });
    } catch (e: any) {
      console.error("💥 Server Error in subscription update:", e.message);
      res.status(500).json({ error: e.message });
    }
  },
);

app.delete(
  "/api/v1/admin/users/:targetUid",
  authenticate,
  checkAdmin,
  async (req, res) => {
    try {
      const supabase = getSupabase();
      const { targetUid } = req.params;

      // 1. Delete associated links first
      await supabase.from("links").delete().eq("user_id", targetUid);

      // 2. Delete profile
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", targetUid);

      if (error) throw error;
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
);

app.get("/s/:shortCode", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { shortCode } = req.params;
    const { data: link } = await supabase
      .from("links")
      .select("*")
      .eq("short_code", shortCode)
      .single();
    if (!link) return res.status(404).send("Not found");
    supabase
      .from("clicks")
      .insert({
        link_id: link.id,
        user_agent: req.headers["user-agent"],
        ip: req.ip,
      })
      .then();
    res.redirect(link.original_url);
  } catch (e) {
    res.status(500).send("Error");
  }
});

// D. FALLBACKS
app.all("/api/*", (req, res) => {
  res
    .status(404)
    .json({ error: `API route not found: ${req.method} ${req.url}` });
});

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("💥 FINAL EXPRESS ERROR:", err);
  res
    .status(500)
    .json({ error: "Internal Server Error", message: err.message });
});

// E. LOCAL SERVER START & VITE MIDDLEWARE
async function startLocalServer() {
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { port: 3001 } },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(__dirname, "../dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  }
}

if (!process.env.VERCEL) {
  startLocalServer().catch(console.error);
}

export default app;
