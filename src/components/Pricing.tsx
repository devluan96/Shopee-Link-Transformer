import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  Crown,
  Loader2,
  ArrowLeftRight,
  QrCode,
  Sparkles,
  X,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { useLocale } from "@/src/hooks/useLocale";
import { useTheme } from "@/src/hooks/useTheme";
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
  yearly: 1430400,
  business_monthly: 299000,
  business_yearly: 2870400,
};

const BUSINESS_PLAN_MONTHLY_EQUIVALENT = 299000;
const BUSINESS_PLAN_ANNUAL_TOTAL = 2870400;
const ANNUAL_DISCOUNT_RATE = 0.2;
const BILLING_MONTHS_PER_YEAR = 12;

const formatVnd = (value: number, locale: "vi" | "en") =>
  `${new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US").format(value)}đ`;

const getAnnualDiscountedMonthlyPrice = (monthlyPrice: number) =>
  Math.round(monthlyPrice * (1 - ANNUAL_DISCOUNT_RATE));

const getAnnualBilledTotal = (monthlyPrice: number) =>
  getAnnualDiscountedMonthlyPrice(monthlyPrice) * BILLING_MONTHS_PER_YEAR;

const buildAccountPaymentCode = (userId: string) =>
  `HN${userId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;

const buildTransferContent = (accountCode: string, plan: ManualPaymentPlan) =>
  plan === "monthly"
    ? `${accountCode} GOI THANG`
    : plan === "yearly"
      ? `${accountCode} GOI NAM`
      : plan === "business_monthly"
        ? `${accountCode} GOI BUSINESS THANG`
        : `${accountCode} GOI BUSINESS NAM`;

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
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme !== "dark";
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
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly",
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

  const pricingCards = locale === "vi"
    ? [
        {
          id: "free" as const,
          title: "Gói miễn phí",
          badge: "Khởi động",
          price: "0đ",
          previousPrice: null,
          priceLabel: "",
          monthlyPrice: 0,
          annualPrice: 0,
          annualPreviousPrice: null,
          subtitle: "Dành cho người muốn thử flow.",
          meta: "3 link/ngày · 1 video/ngày · 1 workspace",
          buttonLabel: "Dùng miễn phí",
          buttonVariant: "ghost" as const,
          highlighted: false,
          action: "free" as const,
          features: [
            "Tạo link cơ bản để vận hành nhanh",
            "Xem preview page trước khi chèn sang trang đích",
            "Theo dõi click cơ bản cho từng liên kết",
          ],
          metricLinks: 3,
          metricVideos: 1,
          metricWorkspaces: 1,
          metricMembers: 1,
        },
        {
          id: "pro" as const,
          title: "Pro",
          badge: "Phổ biến nhất",
          price: "149.000đ",
          previousPrice: "1.788.000đ",
          priceLabel: "/ tháng",
          monthlyPrice: 149000,
          annualPrice: getAnnualBilledTotal(149000),
          annualPreviousPrice: 149000 * BILLING_MONTHS_PER_YEAR,
          subtitle: "Cho creator và team nhỏ chạy link đều mỗi ngày.",
          meta: "10 link/ngày · 10 video/ngày",
          buttonLabel: "Bắt đầu dùng thử",
          buttonVariant: "primary" as const,
          highlighted: true,
          action: "pro" as const,
          features: [
            "1 workspace với tối đa 3 thành viên",
            "Quản lý link, ảnh/video và preview page trong cùng một flow",
            "QR và analytics cơ bản cho từng link",
            "Phù hợp chiến dịch ngắn hạn và team gọn",
          ],
          metricLinks: 10,
          metricVideos: 10,
          metricWorkspaces: 1,
          metricMembers: 3,
        },
        {
          id: "business" as const,
          title: "Business",
          badge: "Cho đội vận hành",
          price: "299.000đ",
          previousPrice: "3.588.000đ",
          priceLabel: "/ tháng",
          monthlyPrice: BUSINESS_PLAN_MONTHLY_EQUIVALENT,
          annualPrice: BUSINESS_PLAN_ANNUAL_TOTAL,
          annualPreviousPrice: BUSINESS_PLAN_MONTHLY_EQUIVALENT * BILLING_MONTHS_PER_YEAR,
          subtitle: "Phù hợp đội growth và affiliate cần vận hành dài hạn.",
          meta: "30 link/ngày · 30 video/ngày",
          buttonLabel: "Tạo workspace",
          buttonVariant: "secondary" as const,
          highlighted: false,
          action: "business" as const,
          features: [
            "5 workspace với tối đa 20 thành viên",
            "A/B testing và domain đầu ra riêng cho campaign",
            "Theo dõi nhiều route hơn cho team vận hành lớn",
            "Tiết kiệm hơn so với thanh toán 12 tháng rời",
          ],
          metricLinks: 30,
          metricVideos: 30,
          metricWorkspaces: 5,
          metricMembers: 20,
        },
      ]
    : [
        {
          id: "free" as const,
          title: "Free plan",
          badge: "Starter",
          price: "Free",
          previousPrice: null,
          priceLabel: "",
          monthlyPrice: 0,
          annualPrice: 0,
          annualPreviousPrice: null,
          subtitle: "For people who want to try the flow.",
          meta: "3 links/day · 1 video/day · 1 workspace",
          buttonLabel: "Use for free",
          buttonVariant: "ghost" as const,
          highlighted: false,
          action: "free" as const,
          features: [
            "Create a basic link and move fast",
            "Preview pages before sending traffic",
            "Track basic clicks for each link",
          ],
          metricLinks: 3,
          metricVideos: 1,
          metricWorkspaces: 1,
          metricMembers: 1,
        },
        {
          id: "pro" as const,
          title: "Pro",
          badge: "Most popular",
          price: "149,000đ",
          previousPrice: "1,788,000đ",
          priceLabel: "/ month",
          monthlyPrice: 149000,
          annualPrice: getAnnualBilledTotal(149000),
          annualPreviousPrice: 149000 * BILLING_MONTHS_PER_YEAR,
          subtitle: "For creators and small teams building a steady workflow.",
          meta: "10 links/day · 10 videos/day",
          buttonLabel: "Start free trial",
          buttonVariant: "primary" as const,
          highlighted: true,
          action: "pro" as const,
          features: [
            "1 workspace with up to 3 members",
            "Manage links, media, and preview pages in one flow",
            "Basic QR and click analytics for each link",
            "A fit for lean teams and shorter campaigns",
          ],
          metricLinks: 10,
          metricVideos: 10,
          metricWorkspaces: 1,
          metricMembers: 3,
        },
        {
          id: "business" as const,
          title: "Business",
          badge: "For operators",
          price: "299,000đ",
          previousPrice: "3,588,000đ",
          priceLabel: "/ month",
          monthlyPrice: BUSINESS_PLAN_MONTHLY_EQUIVALENT,
          annualPrice: BUSINESS_PLAN_ANNUAL_TOTAL,
          annualPreviousPrice: BUSINESS_PLAN_MONTHLY_EQUIVALENT * BILLING_MONTHS_PER_YEAR,
          subtitle: "Built for operators and affiliate teams running longer.",
          meta: "30 links/day · 30 videos/day",
          buttonLabel: "Create workspace",
          buttonVariant: "secondary" as const,
          highlighted: false,
          action: "business" as const,
          features: [
            "5 workspaces with up to 20 members",
            "A/B testing and custom output domains",
            "More routing headroom for larger operating teams",
            "Lower cost than paying 12 separate monthly cycles",
          ],
          metricLinks: 30,
          metricVideos: 30,
          metricWorkspaces: 5,
          metricMembers: 20,
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

  const latestConfirmedRequest = useMemo(() => {
    return [...paymentRequests]
      .filter((request) => request.status === "confirmed")
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )[0];
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
    if (currentPlan === "monthly") return copy.status.pro;
    if (currentPlan === "yearly") {
      return latestConfirmedRequest?.plan.startsWith("business_")
        ? copy.status.business
        : copy.status.pro;
    }
    return copy.status.free;
  };

  const getCurrentPlanBadgeLabel = () => {
    if (currentPlan === "free") return copy.status.badgeFree;
    return getCurrentPlanLabel();
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

  const handleCardAction = (action: "free" | "pro" | "business") => {
    if (action === "pro") {
      setSelectedPlan(billingCycle === "annual" ? "yearly" : "monthly");
      return;
    }

    if (action === "business") {
      setSelectedPlan(
        billingCycle === "annual" ? "business_yearly" : "business_monthly",
      );
      return;
    }

    if (action === "free") {
      toast.message(
        locale === "vi"
          ? "Gói miễn phí đã sẵn sàng trong tài khoản của bạn."
          : "The free plan is already available in your account.",
      );
      return;
    }

    toast.message(
      locale === "vi"
        ? "Gói Business đã sẵn sàng trong luồng thanh toán."
        : "The Business plan is available in the payment flow.",
    );
  };

  const selectedAmount = selectedPlan ? PLAN_AMOUNTS[selectedPlan] : 0;
  const selectedTransferContent = selectedPlan
    ? buildTransferContent(accountCode, selectedPlan)
    : "";
  const selectedRequest = selectedPlan
    ? latestRequestByPlan.get(selectedPlan)
    : undefined;
  const selectedPlanName = selectedPlan
    ? selectedPlan === "monthly"
      ? copy.plans.monthly.name
      : selectedPlan === "yearly"
        ? copy.plans.yearly.name
        : pricingCards.find((card) => card.id === "business")?.title ||
          "Business"
    : "";
  const shouldShowConfirmedSelectedRequestHint =
    selectedPlan !== null &&
    selectedRequest?.status === "confirmed" &&
    (currentPlan === selectedPlan ||
      (selectedPlan.startsWith("business_") && currentPlan === "yearly"));
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
        <p className="font-medium text-gray-500 dark:text-slate-400">
          {locale === "vi"
            ? "Chọn gói phù hợp với nhu cầu tạo link, preview và theo dõi lượt bấm."
            : "Choose the plan that fits your needs for link creation, previews, and click tracking."}
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
            {getCurrentPlanBadgeLabel()}
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

      <div className="mx-auto mb-12 max-w-fit">
        <div className="relative inline-flex h-14 min-w-[18rem] items-center rounded-full border border-slate-200 bg-white p-1 shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-800">
          <span
            aria-hidden="true"
            className={cn(
              "absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-orange-600 shadow-[0_12px_28px_rgba(249,115,22,0.3)] transition-transform duration-300 ease-out",
              billingCycle === "annual" && "translate-x-full",
            )}
          />
          <button
            type="button"
            aria-pressed={billingCycle === "monthly"}
            onClick={() => setBillingCycle("monthly")}
            className={cn(
              "relative z-10 flex-1 rounded-full px-5 py-3 text-left text-sm font-black transition-colors",
              billingCycle === "monthly"
                ? "text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
            )}
          >
            {locale === "vi" ? "Tháng" : "Monthly"}
          </button>
          <button
            type="button"
            aria-pressed={billingCycle === "annual"}
            onClick={() => setBillingCycle("annual")}
            className={cn(
              "relative z-10 flex-1 rounded-full px-5 py-3 text-right text-sm font-black transition-colors",
              billingCycle === "annual"
                ? "text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
            )}
          >
            <span className="inline-flex items-center gap-2">
              <span>{locale === "vi" ? "Năm" : "Annual"}</span>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                {locale === "vi" ? "Giảm 20%" : "Save 20%"}
              </span>
            </span>
          </button>
          <button
            type="button"
            aria-label={
              locale === "vi"
                ? "Đổi giữa thanh toán theo tháng và theo năm"
                : "Toggle between monthly and annual billing"
            }
            onClick={() =>
              setBillingCycle((current) =>
                current === "monthly" ? "annual" : "monthly",
              )
            }
            className={cn(
              "absolute left-1/2 z-20 inline-flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-white/10 bg-slate-950 text-white shadow-[0_10px_24px_rgba(15,23,42,0.35)] transition-transform duration-300 ease-out",
              billingCycle === "annual" && "translate-x-[calc(-50%+0.25rem)]",
            )}
          >
            <ArrowLeftRight size={15} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        {pricingCards.map((card) => {
          const isHighlighted = card.highlighted;
          const cardPlan =
            card.action === "pro"
              ? billingCycle === "annual"
                ? "yearly"
                : "monthly"
              : null;
          const buttonState =
            cardPlan !== null ? getButtonState(cardPlan) : null;
          const isAnnual = billingCycle === "annual";
          const displayMonthlyPrice = isAnnual
            ? getAnnualDiscountedMonthlyPrice(card.monthlyPrice)
            : card.monthlyPrice;
          const displayPrice =
            card.id === "free"
              ? card.price
              : formatVnd(displayMonthlyPrice, locale);
          const displayLabel = card.id === "free" ? "" : card.priceLabel;
          const annualTotal = card.annualPrice;
          const annualPrevious = card.annualPreviousPrice;
          const cardToneClass =
            card.id === "free"
              ? isLight
                ? "border-orange-200 bg-[linear-gradient(180deg,#ffffff_0%,#fffaf3_100%)]"
                : "border-orange-500/25 bg-[linear-gradient(180deg,rgba(31,22,16,0.96)_0%,rgba(18,16,14,0.96)_100%)]"
              : card.id === "pro"
                ? isLight
                  ? "border-orange-400 bg-[linear-gradient(180deg,#ffffff_0%,#fff7ed_100%)] ring-1 ring-orange-300/50"
                  : "border-orange-500/55 bg-[linear-gradient(180deg,rgba(34,20,12,0.98)_0%,rgba(18,12,8,0.98)_100%)] ring-1 ring-orange-400/35"
                : isLight
                  ? "border-slate-200 bg-white/88"
                  : "border-white/10 bg-[rgba(17,20,31,0.92)]";

          return (
            <div
              key={card.id}
              className={cn(
                "relative flex h-full flex-col rounded-[3rem] border p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 sm:p-10",
                cardToneClass,
                isHighlighted && "ring-4 ring-orange-50 dark:ring-orange-500/10",
              )}
            >
              {isHighlighted && (
                <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,#ff7a00_0%,#ff8f2d_100%)] px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-white shadow-[0_14px_30px_rgba(255,106,0,0.32)]">
                  {card.badge}
                </div>
              )}

              {!isHighlighted && (
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {card.badge}
                </div>
              )}

              <div className={isHighlighted ? "mt-5" : "mt-1"}>
                <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {card.title}
                </div>

                {isAnnual && card.id !== "free" && annualPrevious && (
                  <div className="mt-5 text-[12px] font-semibold tracking-[0.02em] text-slate-500 line-through">
                    {formatVnd(annualPrevious, locale)}
                  </div>
                )}

                <div className="mt-5 flex items-end gap-2">
                  <span
                    className={cn(
                      "text-[3.1rem] font-bold leading-none tracking-[-0.05em]",
                      isLight ? "text-slate-950" : "text-white",
                    )}
                  >
                    {displayPrice}
                  </span>
                  {displayLabel && (
                    <span className="pb-2 text-[0.95rem] font-medium text-slate-400">
                      {displayLabel}
                    </span>
                  )}
                </div>

                {isAnnual && card.id !== "free" && (
                  <p className="mt-2 text-[12px] font-medium text-slate-500">
                    {formatVnd(annualTotal, locale)}{" "}
                    {locale === "vi" ? "thanh toán theo năm" : "billed annually"}
                  </p>
                )}

                <p className="mt-5 min-h-12 text-[14px] leading-7 text-slate-400">
                  {card.subtitle}
                </p>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3 text-[11px] font-black uppercase tracking-widest text-gray-600 dark:text-slate-300">
                <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200">
                  {t("pricing.metrics.linksPerDay", {
                    value: card.metricLinks,
                  })}
                </div>
                <div className="rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-200">
                  {t("pricing.metrics.videosPerDay", {
                    value: card.metricVideos,
                  })}
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                  {t("pricing.metrics.workspaces", {
                    value: card.metricWorkspaces,
                  })}
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                  {t("pricing.metrics.members", {
                    value: card.metricMembers,
                  })}
                </div>
              </div>

              <div className="mb-10 mt-8 flex-1 space-y-4">
                {card.features.map((feature, idx) => (
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
                onClick={() => handleCardAction(card.action)}
                disabled={card.action === "pro" ? !!buttonState?.disabled : false}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-3xl py-5 text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60",
                  card.id === "free"
                    ? "border border-orange-200 bg-orange-50 text-orange-700 hover:border-orange-300 hover:bg-orange-100 dark:border-orange-500/30 dark:bg-[rgba(249,115,22,0.12)] dark:text-white dark:hover:border-orange-400/45 dark:hover:bg-[rgba(249,115,22,0.18)]"
                    : card.id === "pro"
                      ? "bg-orange-600 text-white shadow-lg shadow-orange-200 hover:bg-orange-700"
                      : "bg-gray-900 text-white hover:bg-black dark:bg-slate-700 dark:hover:bg-slate-600",
                )}
              >
                {card.id === "free" ? (
                  <Sparkles size={16} />
                ) : (
                  <QrCode size={16} />
                )}
                <span>
                  {card.id === "pro" && buttonState
                    ? buttonState.buttonText
                    : card.buttonLabel}
                </span>
              </button>

              <p className="mt-3 text-center text-[11px] font-medium text-gray-400 dark:text-slate-500">
                {card.id === "pro" && buttonState?.helperText
                  ? buttonState.helperText
                  : card.id === "business"
                    ? locale === "vi"
                      ? "Phù hợp cho team lớn cần quy trình riêng."
                      : "Best for larger teams that need a separate operating lane."
                    : locale === "vi"
                      ? "Bắt đầu ngay bằng gói miễn phí."
                      : "Start immediately with the free plan."}
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
                  {paymentCopy.modalTitle} {selectedPlanName}
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
                  {shouldShowConfirmedSelectedRequestHint && (
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
