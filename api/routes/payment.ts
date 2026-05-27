import { Router } from "express";
import { authenticate, checkAdmin } from "../middleware/auth.js";
import { getSupabase } from "../config/supabase.js";
import { getPublicBaseUrl } from "../utils/helpers.js";
import {
  AuthenticatedRequest,
  ManualPaymentPlan,
  PaidSubscriptionPlan,
} from "../types/index.js";
import * as paymentService from "../services/paymentService.js";
import * as manualPaymentService from "../services/manualPaymentService.js";
import * as userService from "../services/userService.js";
import * as securityService from "../services/securityService.js";

const router = Router();

const logAdminAction = async (
  req: AuthenticatedRequest,
  action: string,
  payload?: Record<string, unknown>,
) => {
  const supabase = getSupabase();
  await securityService.logAdminAction(supabase, {
    actorUserId: req.authUser?.id || null,
    actorEmail: req.authUser?.email || req.authProfile?.email || null,
    action,
    metadata: payload,
  });
};

type ZaloPayStatusHandlerDeps = {
  queryZaloPayOrder: typeof paymentService.queryZaloPayOrder;
  getSupabase: typeof getSupabase;
  updateUserSubscription: typeof userService.updateUserSubscription;
  getPlanFromAppTransId: typeof paymentService.getZaloPayPlanFromAppTransId;
  isAppTransOwnedByUser: typeof paymentService.isZaloPayAppTransOwnedByUser;
};

const defaultZaloPayStatusHandlerDeps: ZaloPayStatusHandlerDeps = {
  queryZaloPayOrder: paymentService.queryZaloPayOrder,
  getSupabase,
  updateUserSubscription: userService.updateUserSubscription,
  getPlanFromAppTransId: paymentService.getZaloPayPlanFromAppTransId,
  isAppTransOwnedByUser: paymentService.isZaloPayAppTransOwnedByUser,
};

export const createZaloPayStatusHandler = (
  deps: Partial<ZaloPayStatusHandlerDeps> = {},
) => {
  const resolvedDeps = { ...defaultZaloPayStatusHandlerDeps, ...deps };

  return async (req: AuthenticatedRequest, res: any) => {
    try {
      const { appTransId } = req.params;
      const userId = req.authUser?.id;

      if (!appTransId || !userId) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      if (!resolvedDeps.isAppTransOwnedByUser(appTransId, userId)) {
        return res.status(403).json({
          error: "Payment reference does not belong to the current account.",
        });
      }

      const plan = resolvedDeps.getPlanFromAppTransId(appTransId);
      if (!plan) {
        return res.status(400).json({ error: "Invalid payment reference" });
      }

      const status = await resolvedDeps.queryZaloPayOrder(appTransId);

      if (status.paid) {
        const supabase = resolvedDeps.getSupabase();

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

        await resolvedDeps.updateUserSubscription(supabase, userId, plan, expiry);
      }

      return res.json({
        paid: status.paid,
        processing: status.processing,
        message: status.message,
      });
    } catch (e: any) {
      console.error("âŒ ZaloPay status check error:", e);
      return res.status(500).json({ error: e.message });
    }
  };
};

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
      console.error("âŒ ZaloPay create order error:", e);
      return res.status(500).json({ error: e.message });
    }
  },
);

// GET /api/v1/billing/zalopay/status/:appTransId - Check payment status
router.get(
  "/billing/zalopay/status/:appTransId",
  authenticate,
  createZaloPayStatusHandler(),
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

    console.log(`âœ… ZaloPay callback received: ${app_trans_id}, amount: ${amount}`);

    // Update user subscription based on transaction
    const supabase = getSupabase();
    const plan =
      paymentService.getZaloPayPlanFromAppTransId(app_trans_id) || "monthly";

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
    console.error("âŒ ZaloPay callback error:", e);
    return res.status(500).json({ return_code: -1, return_message: e.message });
  }
});

router.get(
  "/billing/manual-requests/mine",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }

      const supabase = getSupabase();
      const requests = await manualPaymentService.getUserManualPaymentRequests(
        supabase,
        userId,
      );

      return res.json(requests);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  },
);

router.post(
  "/billing/manual-requests",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }

      const { plan } = req.body as { plan: ManualPaymentPlan };
      if (
        !plan ||
        !["monthly", "yearly", "business_monthly", "business_yearly"].includes(plan)
      ) {
        return res.status(400).json({ error: "Invalid plan" });
      }

      const supabase = getSupabase();
      const request = await manualPaymentService.createManualPaymentRequest(
        supabase,
        {
          userId,
          userEmail: req.authUser?.email || req.authProfile?.email || null,
          userFullName: req.authProfile?.full_name || null,
          plan,
        },
      );

      return res.json(request);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  },
);

router.get(
  "/admin/payment-requests",
  authenticate,
  checkAdmin,
  async (_req, res) => {
    try {
      const supabase = getSupabase();
      const requests =
        await manualPaymentService.getAdminManualPaymentRequests(supabase);

      return res.json(requests);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  },
);

router.post(
  "/admin/payment-requests/:paymentRequestId/confirm",
  authenticate,
  checkAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { paymentRequestId } = req.params;
      const adminUserId = req.authUser?.id;
      if (!paymentRequestId || !adminUserId) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const supabase = getSupabase();
      const request = await manualPaymentService.confirmManualPaymentRequest(
        supabase,
        paymentRequestId,
        adminUserId,
      );

      await logAdminAction(req, "confirm_payment_request", {
        payment_request_id: paymentRequestId,
        user_id: request.user_id,
        plan: request.plan,
      });

      return res.json(request);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  },
);

router.post(
  "/admin/payment-requests/:paymentRequestId/reject",
  authenticate,
  checkAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { paymentRequestId } = req.params;
      const adminUserId = req.authUser?.id;
      if (!paymentRequestId || !adminUserId) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const supabase = getSupabase();
      const request = await manualPaymentService.rejectManualPaymentRequest(
        supabase,
        paymentRequestId,
        adminUserId,
      );

      await logAdminAction(req, "reject_payment_request", {
        payment_request_id: paymentRequestId,
        user_id: request.user_id,
        plan: request.plan,
      });

      return res.json(request);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  },
);

export default router;
