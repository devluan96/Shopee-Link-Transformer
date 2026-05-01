import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getSupabase } from "../config/supabase.js";
import { getPublicBaseUrl } from "../utils/helpers.js";
import { AuthenticatedRequest, PaidSubscriptionPlan } from "../types/index.js";
import * as paymentService from "../services/paymentService.js";
import * as userService from "../services/userService.js";

const router = Router();

// POST /api/v1/billing/zalopay/create-order - Create ZaloPay order
router.post(
  "/billing/zalopay/create-order",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }

      const { plan } = req.body as { plan: PaidSubscriptionPlan };
      if (!plan || !["monthly", "yearly"].includes(plan)) {
        return res.status(400).json({ error: "Invalid plan" });
      }

      const publicBaseUrl = getPublicBaseUrl(req);
      if (!publicBaseUrl) {
        return res.status(500).json({ error: "Could not determine public base URL" });
      }

      const result = await paymentService.createZaloPayOrder(userId, plan, publicBaseUrl);

      return res.json({
        app_trans_id: result.appTransId,
        order_url: result.orderUrl,
        zp_trans_token: result.zpTransToken,
      });
    } catch (e: any) {
      console.error("❌ ZaloPay create order error:", e);
      return res.status(500).json({ error: e.message });
    }
  },
);

// GET /api/v1/billing/zalopay/status/:appTransId - Check payment status
router.get(
  "/billing/zalopay/status/:appTransId",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { appTransId } = req.params;
      const userId = req.authUser?.id;

      if (!appTransId || !userId) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const status = await paymentService.queryZaloPayOrder(appTransId);

      // If paid, update user subscription
      if (status.paid) {
        const supabase = getSupabase();
        const plan: PaidSubscriptionPlan = appTransId.includes("year")
          ? "yearly"
          : "monthly";

        let expiry = null;
        if (plan === "monthly") {
          const d = new Date();
          d.setDate(d.getDate() + 30);
          expiry = d.toISOString();
        } else if (plan === "yearly") {
          const d = new Date();
          d.setFullYear(d.getFullYear() + 1);
          expiry = d.toISOString();
        }

        await userService.updateUserSubscription(supabase, userId, plan, expiry);
      }

      return res.json({
        paid: status.paid,
        processing: status.processing,
        message: status.message,
      });
    } catch (e: any) {
      console.error("❌ ZaloPay status check error:", e);
      return res.status(500).json({ error: e.message });
    }
  },
);

// POST /api/v1/billing/zalopay/callback - ZaloPay callback
router.post("/billing/zalopay/callback", async (req, res) => {
  try {
    const { data, mac } = req.body;

    if (!data || !mac) {
      return res.status(400).json({ return_code: -1, return_message: "Missing data or mac" });
    }

    const isValid = paymentService.verifyZaloPayCallback(data, mac);
    if (!isValid) {
      return res.status(400).json({ return_code: -1, return_message: "Invalid MAC" });
    }

    const callbackData = JSON.parse(data);
    const { app_trans_id, zp_trans_id, amount } = callbackData;

    console.log(`✅ ZaloPay callback received: ${app_trans_id}, amount: ${amount}`);

    // Update user subscription based on transaction
    const supabase = getSupabase();
    const plan: PaidSubscriptionPlan = app_trans_id.includes("year")
      ? "yearly"
      : "monthly";

    let expiry = null;
    if (plan === "monthly") {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      expiry = d.toISOString();
    } else if (plan === "yearly") {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      expiry = d.toISOString();
    }

    // Extract userId from app_trans_id or app_user
    const userId = callbackData.app_user;
    if (userId) {
      await userService.updateUserSubscription(supabase, userId, plan, expiry);
    }

    return res.json({ return_code: 1, return_message: "Success" });
  } catch (e: any) {
    console.error("❌ ZaloPay callback error:", e);
    return res.status(500).json({ return_code: -1, return_message: e.message });
  }
});

export default router;
