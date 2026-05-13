import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  Crown,
  Loader2,
  QrCode,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { useLocale } from "@/src/hooks/useLocale";
import { cn } from "@/src/lib/utils";
import {
  LinkQuota,
  ManualPaymentPlan,
  ManualPaymentRequest,
  UserLimits,
  UserProfile,
} from "@/src/types";

interface PricingProps {
  userProfile: UserProfile | null;
  linkQuota: LinkQuota | null;
  userLimits: UserLimits | null;
  fetchWithAuth: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>;
}

const PLAN_AMOUNTS: Record<ManualPaymentPlan, number> = {
  monthly: 149000,
  yearly: 1609200,
};

const buildAccountPaymentCode = (userId: string) =>
  `HN${userId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;

const buildTransferContent = (accountCode: string, plan: ManualPaymentPlan) =>
  `${accountCode} ${plan === "monthly" ? "GOI THANG" : "GOI NAM"}`;

const getManualPaymentCopy = (locale: "vi" | "en") =>
  locale === "vi"
    ? {
        openQr: "Xem mã QR thanh toán",
        paymentCenterTitle: "Thanh toán chuyển khoản",
        paymentCenterDescription:
          "Mỗi tài khoản có mã thanh toán riêng. Quét QR, chuyển đúng số tiền, rồi bấm đã thanh toán để gửi yêu cầu xác nhận.",
        modalTitle: "Thanh toán gói",
        modalDescription:
          "Quét QR hoặc sao chép nội dung chuyển khoản bên dưới. Nội dung đã chứa mã tài khoản riêng cho gói này.",
        bankInfo: "Thông tin nhận tiền",
        transferContent: "Nội dung chuyển khoản",
        accountCode: "Mã tài khoản",
        amount: "Số tiền",
        accountName: "Chủ tài khoản",
        accountNumber: "Số tài khoản",
        bankName: "Ngân hàng",
        copy: "Sao chép",
        copied: "Đã sao chép",
        paidAction: "Đã thanh toán",
        pendingAction: "Chờ xác nhận",
        confirmedAction: "Đã kích hoạt",
        requestSent: "Yêu cầu thanh toán đã được gửi tới quản trị viên.",
        pendingHint:
          "Yêu cầu thanh toán của gói này đang chờ quản trị viên xác nhận.",
        confirmedHint:
          "Yêu cầu thanh toán gần nhất của gói này đã được xác nhận.",
        note: "Lưu ý: vui lòng chuyển đúng số tiền và giữ nguyên nội dung để quản trị viên đối soát nhanh.",
        close: "Đóng",
        qrFallbackHint:
          "QR này chứa nội dung thanh toán. Nếu app ngân hàng không nhận diện, hãy sao chép thủ công thông tin bên dưới.",
        emptyBank: "Chưa cấu hình tài khoản nhận tiền.",
      }
    : {
        openQr: "Open payment QR",
        paymentCenterTitle: "Manual bank transfer",
        paymentCenterDescription:
          "Each account gets a unique payment code. Scan the QR, transfer the exact amount, then submit your payment for confirmation.",
        modalTitle: "Plan payment",
        modalDescription:
          "Scan the QR code or copy the bank transfer details below. The transfer note already includes this account's unique code.",
        bankInfo: "Receiving account",
        transferContent: "Transfer note",
        accountCode: "Account code",
        amount: "Amount",
        accountName: "Account name",
        accountNumber: "Account number",
        bankName: "Bank",
        copy: "Copy",
        copied: "Copied",
        paidAction: "I have paid",
        pendingAction: "Waiting for review",
        confirmedAction: "Activated",
        requestSent: "Your payment request has been sent to the administrator.",
        pendingHint: "This plan already has a pending payment confirmation.",
        confirmedHint:
          "The latest payment request for this plan was confirmed.",
        note: "Please transfer the exact amount and keep the transfer note unchanged for faster verification.",
        close: "Close",
        qrFallbackHint:
          "This QR contains the payment details. If your banking app cannot read it, copy the information below manually.",
        emptyBank: "No receiving bank account has been configured yet.",
      };

export const Pricing = ({
  userProfile,
  linkQuota,
  userLimits,
  fetchWithAuth,
}: PricingProps) => {
  const { locale, messages, t } = useLocale();
  const copy = messages.pricing;
  const paymentCopy = getManualPaymentCopy(locale);
  const currentPlan = userProfile?.subscription_plan || "free";
  const expiryTimestamp = userProfile?.subscription_expiry
    ? new Date(userProfile.subscription_expiry).getTime()
    : null;
  const expiryDate =
    expiryTimestamp && Number.isFinite(expiryTimestamp)
      ? new Date(expiryTimestamp).toLocaleDateString(
          locale === "vi" ? "vi-VN" : "en-US",
        )
      : null;
  const [remainingMs, setRemainingMs] = useState(() =>
    expiryTimestamp ? Math.max(0, expiryTimestamp - Date.now()) : 0,
  );
  const [selectedPlan, setSelectedPlan] = useState<ManualPaymentPlan | null>(
    null,
  );
  const [paymentRequests, setPaymentRequests] = useState<
    ManualPaymentRequest[]
  >([]);
  const [paymentRequestsLoading, setPaymentRequestsLoading] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const bankId = (import.meta.env.VITE_PAYMENT_BANK_ID || "").trim();
  const bankAccountNo = (import.meta.env.VITE_PAYMENT_ACCOUNT_NO || "").trim();
  const bankAccountName = (
    import.meta.env.VITE_PAYMENT_ACCOUNT_NAME || ""
  ).trim();
  const bankLabel = (
    import.meta.env.VITE_PAYMENT_BANK_NAME ||
    bankId ||
    ""
  ).trim();

  const hasBankQrConfig = !!(bankId && bankAccountNo && bankAccountName);
  const accountCode = userProfile?.id
    ? buildAccountPaymentCode(userProfile.id)
    : "HNUNKNOWN";

  useEffect(() => {
    if (!expiryTimestamp || !Number.isFinite(expiryTimestamp)) {
      setRemainingMs(0);
      return;
    }

    const updateRemaining = () => {
      setRemainingMs(Math.max(0, expiryTimestamp - Date.now()));
    };

    updateRemaining();
    const timer = window.setInterval(updateRemaining, 1000);

    return () => window.clearInterval(timer);
  }, [expiryTimestamp]);

  const refreshPaymentRequests = React.useCallback(async () => {
    if (!userProfile?.id) {
      setPaymentRequests([]);
      return;
    }

    setPaymentRequestsLoading(true);
    try {
      const response = await fetchWithAuth(
        "/api/v1/billing/manual-requests/mine",
      );
      const data = await response.json();
      setPaymentRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setPaymentRequests([]);
    } finally {
      setPaymentRequestsLoading(false);
    }
  }, [fetchWithAuth, userProfile?.id]);

  useEffect(() => {
    void refreshPaymentRequests();
  }, [refreshPaymentRequests]);

  const plans = [
    {
      id: "monthly" as const,
      name: copy.plans.monthly.name,
      price: locale === "vi" ? "149.000đ" : "149,000đ",
      previousPrice: null,
      period: copy.plans.monthly.period,
      description: copy.plans.monthly.description,
      features:
        locale === "vi"
          ? [
              "10 link/ngày và 10 video/ngày cho tài khoản vận hành ngắn hạn.",
              "1 không gian làm việc với tối đa 3 thành viên cùng thao tác.",
              "Quản lý link, upload ảnh/video và xem thống kê cơ bản.",
              "Kích hoạt thủ công qua QR ngân hàng hoặc admin xác nhận.",
            ]
          : [
              "10 links/day and 10 video uploads/day for short-term operations.",
              "1 workspace with up to 3 members.",
              "Link management, image/video uploads, and basic analytics.",
              "Manual activation via bank QR or admin confirmation.",
            ],
      highlight: true,
      badge: copy.plans.monthly.badge,
    },
    {
      id: "yearly" as const,
      name: copy.plans.yearly.name,
      price: locale === "vi" ? "1.609.200đ" : "1,609,200đ",
      previousPrice: locale === "vi" ? "1.788.000đ" : "1,788,000đ",
      period: copy.plans.yearly.period,
      description:
        locale === "vi"
          ? "Giảm 10% so với 12 tháng, phù hợp cho tài khoản vận hành lâu dài."
          : "10% off compared with paying 12 monthly cycles.",
      features:
        locale === "vi"
          ? [
              "30 link/ngày và 30 video/ngày cho nhu cầu vận hành cao hơn.",
              "5 không gian làm việc với tối đa 20 thành viên.",
              "Mở A/B testing và domain đầu ra riêng cho chiến dịch dài hạn.",
              "Phù hợp team vận hành lớn, tiết kiệm chi phí theo năm.",
            ]
          : [
              "30 links/day and 30 video uploads/day for larger operations.",
              "5 workspaces with up to 20 members.",
              "Unlock A/B testing and custom output domains.",
              "Built for larger teams with lower annual cost.",
            ],
      highlight: false,
      badge: locale === "vi" ? "Giảm 10%" : "10% off",
    },
  ];

  const latestRequestByPlan = useMemo(() => {
    const map = new Map<ManualPaymentPlan, ManualPaymentRequest>();
    for (const request of paymentRequests) {
      if (!map.has(request.plan)) {
        map.set(request.plan, request);
      }
    }
    return map;
  }, [paymentRequests]);

  const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
  const hasValidExpiry =
    expiryTimestamp !== null &&
    Number.isFinite(expiryTimestamp) &&
    remainingMs > 0;
  const canRenewCurrentPlan =
    currentPlan !== "free" && hasValidExpiry && remainingDays <= 7;
  const isYearlyPlanActive = currentPlan === "yearly";

  const formatCountdown = (durationMs: number) => {
    const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${days} ${copy.countdown.day} ${hours} ${copy.countdown.hour} ${minutes} ${copy.countdown.minute} ${seconds} ${copy.countdown.second}`;
  };

  const getCurrentPlanLabel = () => {
    if (currentPlan === "monthly") return copy.status.monthly;
    if (currentPlan === "yearly") return copy.status.yearly;
    return copy.status.free;
  };

  const getButtonState = (planId: ManualPaymentPlan) => {
    const isCurrentPlan = currentPlan === planId;
    const disableByActiveYearly = isYearlyPlanActive && planId !== "yearly";
    const disableRenew = isCurrentPlan && !canRenewCurrentPlan;
    const request = latestRequestByPlan.get(planId);
    const hasPendingRequest = request?.status === "pending";
    const hasConfirmedRequest = request?.status === "confirmed";
    const disabled =
      disableByActiveYearly || disableRenew || hasPendingRequest || false;

    let buttonText: string = isCurrentPlan
      ? copy.actions.renew
      : copy.actions.activate;
    let helperText = "";

    if (hasPendingRequest) {
      buttonText = paymentCopy.pendingAction;
      helperText = paymentCopy.pendingHint;
    } else if (hasConfirmedRequest && isCurrentPlan) {
      buttonText = paymentCopy.confirmedAction;
      helperText = paymentCopy.confirmedHint;
    } else if (disableByActiveYearly) {
      helperText = copy.actions.disabledYearly;
    } else if (disableRenew) {
      helperText = copy.actions.disabledRenew;
    }

    return {
      disabled,
      buttonText,
      helperText,
      request,
    };
  };

  const getPlanDailyLimit = (planId: ManualPaymentPlan) =>
    planId === "monthly" ? 10 : 30;
  const getPlanVideoLimit = (planId: ManualPaymentPlan) =>
    planId === "monthly" ? 10 : 30;
  const getPlanWorkspaceLimit = (planId: ManualPaymentPlan) =>
    planId === "monthly" ? 1 : 5;
  const getPlanMemberLimit = (planId: ManualPaymentPlan) =>
    planId === "monthly" ? 3 : 20;

  const selectedAmount = selectedPlan ? PLAN_AMOUNTS[selectedPlan] : 0;
  const selectedTransferContent = selectedPlan
    ? buildTransferContent(accountCode, selectedPlan)
    : "";
  const selectedRequest = selectedPlan
    ? latestRequestByPlan.get(selectedPlan)
    : undefined;
  const qrTextPayload = selectedPlan
    ? [
        `${paymentCopy.bankName}: ${bankLabel || "N/A"}`,
        `${paymentCopy.accountNumber}: ${bankAccountNo || "N/A"}`,
        `${paymentCopy.accountName}: ${bankAccountName || "N/A"}`,
        `${paymentCopy.amount}: ${selectedAmount.toLocaleString("vi-VN")} VND`,
        `${paymentCopy.transferContent}: ${selectedTransferContent}`,
      ].join("\n")
    : "";
  const vietQrImageUrl =
    selectedPlan && hasBankQrConfig
      ? `https://img.vietqr.io/image/${encodeURIComponent(bankId)}-${encodeURIComponent(bankAccountNo)}-compact2.png?amount=${selectedAmount}&addInfo=${encodeURIComponent(selectedTransferContent)}&accountName=${encodeURIComponent(bankAccountName)}`
      : "";

  const copyValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(paymentCopy.copied);
    } catch {
      toast.error("Copy failed");
    }
  };

  const submitManualPayment = async () => {
    if (!selectedPlan) return;

    setSubmittingPayment(true);
    try {
      const response = await fetchWithAuth("/api/v1/billing/manual-requests", {
        method: "POST",
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Không thể gửi yêu cầu thanh toán");
      }

      toast.success(paymentCopy.requestSent);
      await refreshPaymentRequests();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể gửi yêu cầu thanh toán",
      );
    } finally {
      setSubmittingPayment(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-12">
        <h2 className="mb-2 text-3xl font-black text-gray-900 dark:text-slate-100">
          {copy.header.title}
        </h2>
        <p className="font-medium italic text-gray-500 dark:text-slate-400">
          {copy.header.description}
        </p>
      </header>

      <div className="mb-12 flex flex-col items-center justify-between gap-6 rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800 md:flex-row">
        <div className="flex items-center gap-6 text-center md:text-left">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
            <Crown className="h-8 w-8 text-orange-600" />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
              {copy.status.eyebrow}
            </p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-slate-100">
              {getCurrentPlanLabel()}
            </h3>
            {expiryDate && (
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
                {t("pricing.status.activeUntil", { date: expiryDate })}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-full border border-green-100 bg-green-50 px-6 py-2 text-xs font-black uppercase tracking-widest text-green-600">
            {currentPlan === "free"
              ? copy.status.badgeFree
              : copy.status.badgeActive}
          </div>
          {currentPlan !== "free" && hasValidExpiry && (
            <p className="text-center text-sm font-black text-orange-600">
              {t("pricing.status.remaining", {
                duration: formatCountdown(remainingMs),
              })}
            </p>
          )}
          {currentPlan !== "free" && !hasValidExpiry && (
            <p className="text-center text-sm font-bold text-amber-600">
              {copy.status.noExpiry}
            </p>
          )}
        </div>
      </div>

      <section className="mb-10 rounded-[2.5rem] border border-sky-100 bg-sky-50/70 p-6 shadow-sm dark:border-sky-500/20 dark:bg-sky-500/10">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
              {paymentCopy.paymentCenterTitle}
            </h3>
            <p className="mt-1 max-w-3xl text-sm font-medium text-slate-600 dark:text-slate-300">
              {paymentCopy.paymentCenterDescription}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="rounded-2xl bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-sky-700 shadow-sm dark:bg-slate-900 dark:text-sky-200">
              {paymentCopy.accountCode}: {accountCode}
            </div>
            {paymentRequestsLoading && (
              <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-300">
                <Loader2 size={14} className="animate-spin" />
                Loading
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {plans.map((plan) => {
          const buttonState = getButtonState(plan.id);
          const isHighlighted =
            currentPlan === "free" ? plan.highlight : currentPlan === plan.id;

          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex h-full flex-col rounded-[3rem] border bg-white p-10 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800",
                isHighlighted
                  ? "border-orange-500 ring-4 ring-orange-50 dark:ring-orange-500/10"
                  : "border-gray-100 dark:border-slate-700",
              )}
            >
              <div className="absolute right-10 top-10">
                {isHighlighted ? (
                  <Sparkles className="h-6 w-6 text-orange-500" />
                ) : (
                  <Zap className="h-6 w-6 text-orange-500" />
                )}
              </div>

              <div className="mb-8">
                <span className="mb-4 block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">
                  {plan.badge}
                </span>
                <h4 className="mb-4 text-3xl font-black text-gray-900 dark:text-slate-100">
                  {plan.name}
                </h4>
                <div className="mb-4">
                  {plan.previousPrice && (
                    <div className="mb-1 text-sm font-black uppercase tracking-widest text-gray-400 line-through dark:text-slate-500">
                      {plan.previousPrice}
                    </div>
                  )}
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-gray-900 dark:text-slate-100">
                      {plan.price}
                    </span>
                    <span className="text-sm font-bold text-gray-400 dark:text-slate-500">
                      {plan.period}
                    </span>
                  </div>
                </div>
                <p className="text-sm font-medium leading-relaxed text-gray-500 dark:text-slate-400">
                  {plan.description}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 text-[11px] font-black uppercase tracking-widest text-gray-600 dark:text-slate-300">
                  <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200">
                    {t("pricing.metrics.linksPerDay", {
                      value: getPlanDailyLimit(plan.id),
                    })}
                  </div>
                  <div className="rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-200">
                    {t("pricing.metrics.videosPerDay", {
                      value: getPlanVideoLimit(plan.id),
                    })}
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                    {t("pricing.metrics.workspaces", {
                      value: getPlanWorkspaceLimit(plan.id),
                    })}
                  </div>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                    {t("pricing.metrics.members", {
                      value: getPlanMemberLimit(plan.id),
                    })}
                  </div>
                </div>
              </div>

              <div className="mb-10 flex-1 space-y-4">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-green-100 bg-green-50">
                      <Check size={12} className="text-green-600" />
                    </div>
                    <span className="text-sm font-bold leading-tight text-gray-600 dark:text-slate-300">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setSelectedPlan(plan.id)}
                disabled={buttonState.disabled}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-3xl py-5 text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60",
                  isHighlighted
                    ? "bg-orange-600 text-white shadow-lg shadow-orange-200 hover:bg-orange-700"
                    : "bg-gray-900 text-white hover:bg-black dark:bg-slate-700 dark:hover:bg-slate-600",
                )}
              >
                <QrCode size={16} />
                <span>{buttonState.buttonText}</span>
              </button>

              <p className="mt-3 text-center text-[11px] font-medium text-gray-400 dark:text-slate-500">
                {buttonState.helperText || paymentCopy.openQr}
              </p>
            </div>
          );
        })}
      </div>

      {selectedPlan && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedPlan(null)}
          />
          <div className="relative max-h-[92vh] w-full max-w-4xl overflow-auto rounded-[2.5rem] border border-gray-100 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-5 dark:border-slate-700 dark:bg-slate-800">
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">
                  {paymentCopy.modalTitle}{" "}
                  {selectedPlan === "monthly"
                    ? copy.plans.monthly.name
                    : copy.plans.yearly.name}
                </h3>
                <p className="mt-1 text-sm font-medium text-gray-500 dark:text-slate-400">
                  {paymentCopy.modalDescription}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="rounded-2xl p-2 text-gray-500 transition-all hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-8 p-6 lg:grid-cols-[1fr_1.1fr]">
              <div className="rounded-4xl border border-gray-100 bg-gray-50 p-6 dark:border-slate-700 dark:bg-slate-900">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-lg font-black text-gray-900 dark:text-slate-100">
                    QR
                  </h4>
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-orange-700">
                    {selectedAmount.toLocaleString("vi-VN")} VND
                  </span>
                </div>

                <div className="rounded-4xl bg-white p-4 shadow-sm dark:bg-slate-800">
                  {hasBankQrConfig ? (
                    <img
                      src={vietQrImageUrl}
                      alt="Payment QR"
                      className="mx-auto w-full max-w-[320px] rounded-3xl"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <QRCodeCanvas
                        value={qrTextPayload}
                        size={280}
                        level="M"
                        includeMargin
                        className="rounded-2xl"
                      />
                      <p className="text-center text-xs font-medium text-gray-500 dark:text-slate-400">
                        {paymentCopy.qrFallbackHint}
                      </p>
                    </div>
                  )}
                </div>

                {!hasBankQrConfig && (
                  <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-200">
                    {paymentCopy.emptyBank}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div className="rounded-4xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <h4 className="mb-4 text-lg font-black text-gray-900 dark:text-slate-100">
                    {paymentCopy.bankInfo}
                  </h4>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-4 rounded-2xl bg-gray-50 px-4 py-3 dark:bg-slate-800">
                      <span className="font-bold text-gray-500 dark:text-slate-400">
                        {paymentCopy.bankName}
                      </span>
                      <span className="font-black text-gray-900 dark:text-slate-100">
                        {bankLabel || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 rounded-2xl bg-gray-50 px-4 py-3 dark:bg-slate-800">
                      <span className="font-bold text-gray-500 dark:text-slate-400">
                        {paymentCopy.accountNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyValue(bankAccountNo || "")}
                        className="inline-flex items-center gap-2 font-black text-gray-900 dark:text-slate-100"
                      >
                        {bankAccountNo || "N/A"}
                        <Copy size={14} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-4 rounded-2xl bg-gray-50 px-4 py-3 dark:bg-slate-800">
                      <span className="font-bold text-gray-500 dark:text-slate-400">
                        {paymentCopy.accountName}
                      </span>
                      <span className="font-black text-gray-900 dark:text-slate-100">
                        {bankAccountName || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 rounded-2xl bg-gray-50 px-4 py-3 dark:bg-slate-800">
                      <span className="font-bold text-gray-500 dark:text-slate-400">
                        {paymentCopy.accountCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyValue(accountCode)}
                        className="inline-flex items-center gap-2 font-black text-gray-900 dark:text-slate-100"
                      >
                        {accountCode}
                        <Copy size={14} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-4 rounded-2xl bg-gray-50 px-4 py-3 dark:bg-slate-800">
                      <span className="font-bold text-gray-500 dark:text-slate-400">
                        {paymentCopy.amount}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          copyValue(selectedAmount.toLocaleString("vi-VN"))
                        }
                        className="inline-flex items-center gap-2 font-black text-gray-900 dark:text-slate-100"
                      >
                        {selectedAmount.toLocaleString("vi-VN")} VND
                        <Copy size={14} />
                      </button>
                    </div>
                    <div className="rounded-2xl bg-gray-50 px-4 py-3 dark:bg-slate-800">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="font-bold text-gray-500 dark:text-slate-400">
                          {paymentCopy.transferContent}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyValue(selectedTransferContent)}
                          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-orange-600"
                        >
                          <Copy size={14} />
                          {paymentCopy.copy}
                        </button>
                      </div>
                      <p className="break-all text-base font-black text-gray-900 dark:text-slate-100">
                        {selectedTransferContent}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-4xl border border-orange-100 bg-orange-50/80 p-6 dark:border-orange-500/20 dark:bg-orange-500/10">
                  <p className="text-sm font-medium leading-relaxed text-orange-700 dark:text-orange-200">
                    {paymentCopy.note}
                  </p>
                  {selectedRequest?.status === "pending" && (
                    <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm font-black text-sky-700 dark:bg-slate-900 dark:text-sky-200">
                      {paymentCopy.pendingHint}
                    </p>
                  )}
                  {selectedRequest?.status === "confirmed" && (
                    <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm font-black text-green-700 dark:bg-slate-900 dark:text-green-200">
                      {paymentCopy.confirmedHint}
                    </p>
                  )}

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={submitManualPayment}
                      disabled={
                        submittingPayment ||
                        paymentRequestsLoading ||
                        selectedRequest?.status === "pending"
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-orange-700 disabled:opacity-60"
                    >
                      {submittingPayment && (
                        <Loader2 size={16} className="animate-spin" />
                      )}
                      {selectedRequest?.status === "pending"
                        ? paymentCopy.pendingAction
                        : paymentCopy.paidAction}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPlan(null)}
                      className="rounded-2xl bg-white px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-700 shadow-sm transition-all hover:bg-gray-100 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                    >
                      {paymentCopy.close}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
