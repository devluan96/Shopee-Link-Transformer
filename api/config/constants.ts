export const PORT = Number(process.env.PORT) || 3000;

export const MAX_SHORT_CODE_LENGTH = 50;
export const DEFAULT_REDIRECT_DELAY_MS = 3000;
export const MIN_REDIRECT_DELAY_MS = 1000;
export const MAX_REDIRECT_DELAY_MS = 10000;

export const SHOPEE_HOST_REGEX = /(^|\.)shopee\.[a-z.]+$/i;
export const TIKTOK_HOST_REGEX =
  /(^|\.)tiktok\.com$|(^|\.)vt\.tiktok\.com$|(^|\.)vm\.tiktok\.com$/i;

export const ZALOPAY_CREATE_ORDER_PATH = "/v2/create";
export const ZALOPAY_QUERY_ORDER_PATH = "/v2/query";

export const SUBSCRIPTION_PRICING: Record<
  import("../types/index.js").PaidSubscriptionPlan,
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

export const LINK_DAILY_LIMITS: Record<
  import("../types/index.js").SubscriptionPlan,
  number
> = {
  free: 0,
  monthly: 5,
  yearly: 50,
};

export const CLOUDINARY_UPLOAD_FOLDER =
  process.env.CLOUDINARY_SHORTLINK_FOLDER || "hotsnew";

export const CLICK_SELECT_ATTEMPTS = [
  "id, link_id, created_at, source, source_detail, referer, user_agent, ip_address, ip, country, city, device_type, browser, os",
  "id, link_id, created_at, source, source_detail, referer, user_agent, ip_address, country, city, device_type, browser, os",
  "id, link_id, created_at, source, source_detail, referer, user_agent, ip, country, city, device_type, browser, os",
  "id, link_id, created_at, source, source_detail, referer, user_agent, country, city, device_type, browser, os",
  "id, link_id, created_at, source, referer, user_agent, country, city, device_type, browser, os",
  "id, link_id, created_at, source, source_detail, referer, user_agent",
  "id, link_id, created_at, source, referer, user_agent",
  "id, link_id, created_at, source, source_detail, referer",
  "id, link_id, created_at, source, referer",
] as const;
