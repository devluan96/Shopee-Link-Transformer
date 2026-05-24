import crypto from "crypto";
import { SUBSCRIPTION_PRICING, ZALOPAY_CREATE_ORDER_PATH, ZALOPAY_QUERY_ORDER_PATH } from "../config/constants.js";
import { hmacSha256, getVietnamDatePrefix } from "../utils/helpers.js";
import { PaidSubscriptionPlan } from "../types/index.js";

const getZaloPayUserTag = (userId: string) =>
  crypto.createHash("sha256").update(userId).digest("hex").slice(0, 12);

const parseZaloPayAppTransId = (appTransId: string) => {
  const parts = appTransId.split("_");
  if (parts.length === 4) {
    const [datePrefix, planToken, userTag, randomSuffix] = parts;
    if (
      /^\d{6}$/.test(datePrefix) &&
      (planToken === "monthly" || planToken === "yearly") &&
      /^[a-f0-9]{12}$/i.test(userTag) &&
      /^\d{6}$/.test(randomSuffix)
    ) {
      return {
        plan: planToken as PaidSubscriptionPlan,
        userTag,
      };
    }
  }

  const legacyPlan = appTransId.includes("year")
    ? "yearly"
    : appTransId.includes("month")
      ? "monthly"
      : null;

  if (!legacyPlan) {
    return null;
  }

  return {
    plan: legacyPlan as PaidSubscriptionPlan,
    userTag: null,
  };
};

export const buildZaloPayAppTransId = (
  userId: string,
  plan: PaidSubscriptionPlan,
) => {
  const datePrefix = getVietnamDatePrefix();
  const randomSuffix = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  const planToken = plan === "yearly" ? "yearly" : "monthly";

  return `${datePrefix}_${planToken}_${getZaloPayUserTag(userId)}_${randomSuffix}`;
};

export const getZaloPayPlanFromAppTransId = (appTransId: string) =>
  parseZaloPayAppTransId(appTransId)?.plan || null;

export const isZaloPayAppTransOwnedByUser = (
  appTransId: string,
  userId: string,
) => {
  const parsed = parseZaloPayAppTransId(appTransId);
  if (!parsed?.userTag) {
    return false;
  }

  return parsed.userTag === getZaloPayUserTag(userId);
};

export const getZaloPayConfig = () => {
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
    apiBaseUrl,
  };
};

export const createZaloPayOrder = async (
  userId: string,
  plan: PaidSubscriptionPlan,
  publicBaseUrl: string,
) => {
  const config = getZaloPayConfig();
  const pricing = SUBSCRIPTION_PRICING[plan];

  const appTransId = buildZaloPayAppTransId(userId, plan);

  const orderData = {
    app_id: config.appId,
    app_trans_id: appTransId,
    app_user: userId,
    app_time: Date.now(),
    amount: pricing.amount,
    item: JSON.stringify([
      { item_id: plan, item_name: pricing.label, item_price: pricing.amount, item_quantity: 1 },
    ]),
    description: `Thanh toan goi ${plan} - ${appTransId}`,
    embed_data: JSON.stringify({
      redirecturl: `${publicBaseUrl}/?tab=pricing&payment=return`,
    }),
    bank_code: "",
    callback_url: `${publicBaseUrl}/api/v1/billing/zalopay/callback`,
  };

  const dataString = `${orderData.app_id}|${orderData.app_trans_id}|${orderData.app_user}|${orderData.amount}|${orderData.app_time}|${orderData.embed_data}|${orderData.item}`;
  const mac = hmacSha256(dataString, config.key1);

  const payload = { ...orderData, mac };

  const response = await fetch(`${config.apiBaseUrl}${ZALOPAY_CREATE_ORDER_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(payload as any).toString(),
  });

  const result = await response.json();

  if (result.return_code !== 1 || !result.order_url) {
    throw new Error(result.return_message || "Không thể tạo đơn thanh toán ZaloPay");
  }

  return {
    appTransId,
    orderUrl: result.order_url,
    zpTransToken: result.zp_trans_token,
  };
};

export const queryZaloPayOrder = async (appTransId: string) => {
  const config = getZaloPayConfig();

  const dataString = `${config.appId}|${appTransId}|${config.key1}`;
  const mac = hmacSha256(dataString, config.key1);

  const payload = {
    app_id: String(config.appId),
    app_trans_id: appTransId,
    mac,
  };

  const response = await fetch(`${config.apiBaseUrl}${ZALOPAY_QUERY_ORDER_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(payload).toString(),
  });

  const result = await response.json();

  return {
    paid: result.return_code === 1,
    processing: result.return_code === 2,
    message: result.return_message,
  };
};

export const verifyZaloPayCallback = (data: any, receivedMac: string) => {
  const config = getZaloPayConfig();
  const dataString = `${data.app_id}|${data.app_trans_id}|${config.key1}`;
  const calculatedMac = hmacSha256(dataString, config.key2);
  return calculatedMac === receivedMac;
};
