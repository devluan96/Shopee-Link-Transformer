import test from "node:test";
import assert from "node:assert/strict";
import {
  buildZaloPayAppTransId,
  isZaloPayAppTransOwnedByUser,
} from "../../server/services/paymentService.js";
import { SUBSCRIPTION_PRICING } from "../../server/config/constants.js";
import { createZaloPayStatusHandler } from "../../server/routes/payment.js";
import {
  buildTransferContent,
  getManualPaymentPlanMeta,
} from "../../server/services/manualPaymentService.js";
import { createMockRes } from "./testUtils.js";

test("ZaloPay app trans id is tied to the owning user", () => {
  const appTransId = buildZaloPayAppTransId("user-1", "monthly");

  assert.match(appTransId, /^\d{6}_(monthly|yearly)_[a-f0-9]{12}_\d{6}$/i);
  assert.equal(isZaloPayAppTransOwnedByUser(appTransId, "user-1"), true);
  assert.equal(isZaloPayAppTransOwnedByUser(appTransId, "user-2"), false);
});

test("yearly subscription pricing matches the 20% annual discount", () => {
  assert.equal(SUBSCRIPTION_PRICING.monthly.amount, 149000);
  assert.equal(SUBSCRIPTION_PRICING.yearly.amount, 1430400);
});

test("business manual payment pricing uses the dedicated business amounts", () => {
  assert.equal(getManualPaymentPlanMeta("business_monthly").amount, 299000);
  assert.equal(getManualPaymentPlanMeta("business_yearly").amount, 2870400);
  assert.equal(
    buildTransferContent("HN12345678", "business_yearly"),
    "HN12345678 GOI BUSINESS NAM",
  );
});

test("ZaloPay status handler blocks cross-account references", async () => {
  let queryCalled = 0;
  let updateCalled = 0;
  const handler = createZaloPayStatusHandler({
    queryZaloPayOrder: async () => {
      queryCalled += 1;
      return { paid: true, processing: false, message: "ok" };
    },
    getSupabase: () => ({}) as never,
    updateUserSubscription: async () => {
      updateCalled += 1;
    },
  });

  const res = createMockRes();
  await handler(
    {
      authUser: { id: "user-2" },
      params: {
        appTransId: buildZaloPayAppTransId("user-1", "monthly"),
      },
    } as any,
    res as any,
  );

  assert.equal(res.statusCode, 403);
  assert.equal(queryCalled, 0);
  assert.equal(updateCalled, 0);
});

test("ZaloPay status handler updates the authenticated user's subscription when paid", async () => {
  let capturedUpdate: {
    userId: string;
    plan: "free" | "monthly" | "yearly";
    expiry: string | null;
  } | null = null;

  const handler = createZaloPayStatusHandler({
    queryZaloPayOrder: async () => ({
      paid: true,
      processing: false,
      message: "ok",
    }),
    getSupabase: () => ({}) as never,
    updateUserSubscription: async (_supabase, userId, plan, expiry) => {
      capturedUpdate = { userId, plan, expiry };
    },
  });

  const res = createMockRes();
  await handler(
    {
      authUser: { id: "user-1" },
      params: {
        appTransId: buildZaloPayAppTransId("user-1", "yearly"),
      },
    } as any,
    res as any,
  );

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    paid: true,
    processing: false,
    message: "ok",
  });
  assert.ok(capturedUpdate);
  assert.equal(capturedUpdate?.userId, "user-1");
  assert.equal(capturedUpdate?.plan, "yearly");
  assert.ok(capturedUpdate?.expiry);
});

