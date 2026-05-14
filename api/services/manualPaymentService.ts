import { SupabaseClient } from "../config/supabase.js";
import {
  ManualPaymentRequestRecord,
  ManualPaymentStatus,
  PaidSubscriptionPlan,
} from "../types/index.js";
import { SUBSCRIPTION_PRICING } from "../config/constants.js";
import * as userService from "./userService.js";
import * as notificationService from "./notificationService.js";

const BLOCKING_PAYMENT_STATUSES: ManualPaymentStatus[] = ["pending"];

export const buildAccountPaymentCode = (userId: string) =>
  `HN${userId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;

export const buildTransferContent = (
  accountCode: string,
  plan: PaidSubscriptionPlan,
) => `${accountCode} ${plan === "monthly" ? "GOI THANG" : "GOI NAM"}`;

export const getManualPaymentPlanMeta = (plan: PaidSubscriptionPlan) => {
  const pricing = SUBSCRIPTION_PRICING[plan];

  return {
    amount: pricing.amount,
    label: plan === "monthly" ? "Gói tháng" : "Gói năm",
  };
};

const normalizePaymentRequest = (
  row: Record<string, any>,
): ManualPaymentRequestRecord => ({
  id: String(row.id),
  user_id: String(row.user_id),
  user_email:
    typeof row.user_email === "string" ? row.user_email : row.user_email ?? null,
  user_full_name:
    typeof row.user_full_name === "string"
      ? row.user_full_name
      : row.user_full_name ?? null,
  account_code: String(row.account_code),
  plan: row.plan as PaidSubscriptionPlan,
  amount: Number(row.amount || 0),
  transfer_content: String(row.transfer_content),
  status: row.status as ManualPaymentStatus,
  user_confirmed_at: String(row.user_confirmed_at),
  admin_confirmed_at:
    typeof row.admin_confirmed_at === "string"
      ? row.admin_confirmed_at
      : row.admin_confirmed_at ?? null,
  admin_confirmed_by:
    typeof row.admin_confirmed_by === "string"
      ? row.admin_confirmed_by
      : row.admin_confirmed_by ?? null,
  created_at: String(row.created_at),
  updated_at:
    typeof row.updated_at === "string" ? row.updated_at : row.updated_at ?? null,
});

export const getUserManualPaymentRequests = async (
  supabase: SupabaseClient,
  userId: string,
) => {
  const { data, error } = await supabase
    .from("payment_requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map((row: any) => normalizePaymentRequest(row));
};

export const createManualPaymentRequest = async (
  supabase: SupabaseClient,
  payload: {
    userId: string;
    userEmail?: string | null;
    userFullName?: string | null;
    plan: PaidSubscriptionPlan;
  },
) => {
  const accountCode = buildAccountPaymentCode(payload.userId);
  const transferContent = buildTransferContent(accountCode, payload.plan);
  const amount = getManualPaymentPlanMeta(payload.plan).amount;

  const { data: existing, error: existingError } = await supabase
    .from("payment_requests")
    .select("*")
    .eq("user_id", payload.userId)
    .eq("plan", payload.plan)
    .in("status", BLOCKING_PAYMENT_STATUSES)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) {
    return normalizePaymentRequest(existing);
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("payment_requests")
    .insert({
      user_id: payload.userId,
      user_email: payload.userEmail || null,
      user_full_name: payload.userFullName || null,
      account_code: accountCode,
      plan: payload.plan,
      amount,
      transfer_content: transferContent,
      status: "pending",
      user_confirmed_at: now,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) throw error;
  return normalizePaymentRequest(data);
};

export const getAdminManualPaymentRequests = async (
  supabase: SupabaseClient,
) => {
  const { data, error } = await supabase
    .from("payment_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || [])
    .map((row: any) => normalizePaymentRequest(row))
    .sort((a, b) => {
      if (a.status === b.status) {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
      if (a.status === "pending") return -1;
      if (b.status === "pending") return 1;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
};

const resolveNextExpiry = (
  plan: PaidSubscriptionPlan,
  currentExpiry?: string | null,
) => {
  const now = Date.now();
  const currentExpiryMs = currentExpiry ? new Date(currentExpiry).getTime() : 0;
  const baseDate = new Date(
    Number.isFinite(currentExpiryMs) && currentExpiryMs > now
      ? currentExpiryMs
      : now,
  );

  if (plan === "monthly") {
    baseDate.setDate(baseDate.getDate() + 30);
  } else {
    baseDate.setFullYear(baseDate.getFullYear() + 1);
  }

  return baseDate.toISOString();
};

export const confirmManualPaymentRequest = async (
  supabase: SupabaseClient,
  paymentRequestId: string,
  adminUserId: string,
) => {
  const { data: existing, error: existingError } = await supabase
    .from("payment_requests")
    .select("*")
    .eq("id", paymentRequestId)
    .maybeSingle();

  if (existingError) throw existingError;
  if (!existing) {
    throw new Error("Không tìm thấy yêu cầu thanh toán");
  }

  const request = normalizePaymentRequest(existing);
  const profile = await userService.getUserProfile(supabase, request.user_id);
  const expiry = resolveNextExpiry(request.plan, profile?.subscription_expiry);

  await userService.updateUserSubscription(
    supabase,
    request.user_id,
    request.plan,
    expiry,
  );
  await userService.approveUser(supabase, request.user_id, true);

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("payment_requests")
    .update({
      status: "confirmed",
      admin_confirmed_at: now,
      admin_confirmed_by: adminUserId,
      updated_at: now,
    })
    .eq("id", paymentRequestId)
    .select("*")
    .single();

  if (error) throw error;
  await notificationService.createPaymentConfirmedNotification(supabase, {
    userId: request.user_id,
    plan: request.plan,
    amount: request.amount,
    paymentRequestId: request.id,
  });
  return normalizePaymentRequest(data);
};

export const rejectManualPaymentRequest = async (
  supabase: SupabaseClient,
  paymentRequestId: string,
  adminUserId: string,
) => {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("payment_requests")
    .update({
      status: "rejected",
      admin_confirmed_at: now,
      admin_confirmed_by: adminUserId,
      updated_at: now,
    })
    .eq("id", paymentRequestId)
    .select("*")
    .single();

  if (error) throw error;
  return normalizePaymentRequest(data);
};
