import React, { useEffect, useRef, useState } from "react";
import { Check, Crown, LoaderCircle, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/src/lib/utils";
import { UserProfile } from "@/src/types";

interface PricingProps {
  userProfile: UserProfile | null;
  checkoutLoadingPlan: "monthly" | "yearly" | null;
  onCheckout: (plan: "monthly" | "yearly") => Promise<void>;
  onCheckPaymentStatus: (
    appTransId: string,
  ) => Promise<{ paid: boolean; processing: boolean }>;
}

export const Pricing = ({
  userProfile,
  checkoutLoadingPlan,
  onCheckout,
  onCheckPaymentStatus,
}: PricingProps) => {
  const currentPlan = userProfile?.subscription_plan || "free";
  const expiryTimestamp = userProfile?.subscription_expiry
    ? new Date(userProfile.subscription_expiry).getTime()
    : null;
  const expiryDate =
    expiryTimestamp && Number.isFinite(expiryTimestamp)
      ? new Date(expiryTimestamp).toLocaleDateString("vi-VN")
      : null;
  const handledReturnRef = useRef(false);
  const [remainingMs, setRemainingMs] = useState(() =>
    expiryTimestamp ? Math.max(0, expiryTimestamp - Date.now()) : 0,
  );

  useEffect(() => {
    if (handledReturnRef.current) return;

    const currentUrl = new URL(window.location.href);
    const payment = currentUrl.searchParams.get("payment");
    const appTransId = currentUrl.searchParams.get("app_trans_id");
    const tab = currentUrl.searchParams.get("tab");

    if (payment !== "return" || !appTransId || tab !== "pricing") {
      return;
    }

    handledReturnRef.current = true;

    void onCheckPaymentStatus(appTransId).finally(() => {
      currentUrl.searchParams.delete("payment");
      currentUrl.searchParams.delete("app_trans_id");
      currentUrl.searchParams.delete("plan");
      currentUrl.searchParams.delete("tab");
      window.history.replaceState(
        {},
        document.title,
        `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`,
      );
    });
  }, [onCheckPaymentStatus]);

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

  const plans = [
    {
      id: "monthly" as const,
      name: "Gói tháng",
      price: "299.000đ",
      period: "/ THÁNG",
      description: "Phù hợp để chạy thử hoặc vận hành ngắn hạn.",
      features: [
        "Tạo landing page không giới hạn",
        "Upload video và thumbnail",
        "Quản lý link và theo dõi thống kê",
        "Thanh toán qua ZaloPay Gateway và VietQR",
      ],
      highlight: true,
      badge: "LINH HOẠT",
    },
    {
      id: "yearly" as const,
      name: "Gói năm",
      price: "2.490.000đ",
      period: "/ NĂM",
      description: "Tối ưu chi phí và phù hợp cho tài khoản vận hành lâu dài.",
      features: [
        "Tạo landing page không giới hạn",
        "Upload video và thumbnail",
        "Quản lý link và theo dõi thống kê",
        "Thanh toán qua ZaloPay Gateway và VietQR",
      ],
      highlight: false,
      badge: "TIẾT KIỆM HƠN",
    },
  ];

  const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
  const hasValidExpiry =
    expiryTimestamp !== null && Number.isFinite(expiryTimestamp) && remainingMs > 0;
  const canRenewCurrentPlan =
    currentPlan !== "free" && hasValidExpiry && remainingDays <= 7;
  const hasYearlyPlan = currentPlan === "yearly";
  const isYearlyPlanActive = hasYearlyPlan;

  const formatCountdown = (durationMs: number) => {
    const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${days} ngày ${hours} giờ ${minutes} phút ${seconds} giây`;
  };

  const handleCheckout = async (plan: "monthly" | "yearly") => {
    try {
      await onCheckout(plan);
    } catch (error: any) {
      toast.error(
        error?.message || "Không thể chuyển sang cổng thanh toán.",
      );
    }
  };

  const getButtonState = (planId: "monthly" | "yearly") => {
    const isCurrentPlan = currentPlan === planId;
    const disableByActiveYearly = isYearlyPlanActive && planId !== "yearly";
    const disableRenew = isCurrentPlan && !canRenewCurrentPlan;
    const disabled =
      checkoutLoadingPlan !== null || disableByActiveYearly || disableRenew;

    let buttonText = "THANH TOÁN NGAY";
    if (isCurrentPlan) {
      buttonText = "GIA HẠN NGAY";
    }

    let helperText = "";
    if (disableByActiveYearly) {
      helperText = "Gói năm đang hoạt động nên tạm khóa thanh toán mới.";
    } else if (disableRenew) {
      helperText = "Gia hạn chỉ mở khi gói còn 7 ngày hoặc ít hơn.";
    }

    return { disabled, buttonText, helperText };
  };

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-12">
        <h2 className="mb-2 text-3xl font-black text-gray-900">
          Bảng giá dịch vụ
        </h2>
        <p className="font-medium italic text-gray-500">
          Nâng cấp tài khoản để mở khóa toàn bộ tính năng chuyển đổi link.
        </p>
      </header>

      <div className="mb-12 flex flex-col items-center justify-between gap-6 rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm md:flex-row">
        <div className="flex items-center gap-6 text-center md:text-left">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
            <Crown className="h-8 w-8 text-orange-600" />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
              TRẠNG THÁI HIỆN TẠI
            </p>
            <h3 className="text-2xl font-black text-gray-900">
              {currentPlan === "free"
                ? "Gói miễn phí"
                : currentPlan === "monthly"
                  ? "Gói tháng"
                  : "Gói năm"}
            </h3>
            {expiryDate && (
              <p className="text-sm font-medium text-gray-500">
                Gói đang hoạt động đến {expiryDate}.
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-full border border-green-100 bg-green-50 px-6 py-2 text-xs font-black uppercase tracking-widest text-green-600">
            {currentPlan === "free" ? "Miễn phí" : "Đang hoạt động"}
          </div>
          {currentPlan !== "free" && hasValidExpiry && (
            <p className="text-center text-sm font-black text-orange-600">
              Còn lại: {formatCountdown(remainingMs)}
            </p>
          )}
          {currentPlan !== "free" && !hasValidExpiry && (
            <p className="text-center text-sm font-bold text-amber-600">
              Chưa có ngày hết hạn để hiển thị đếm ngược.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {plans.map((plan) => {
          const buttonState = getButtonState(plan.id);

          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex h-full flex-col rounded-[3rem] border bg-white p-10 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl",
                plan.highlight
                  ? "border-orange-500 ring-4 ring-orange-50"
                  : "border-gray-100",
              )}
            >
              <div className="absolute right-10 top-10">
                {plan.highlight ? (
                  <Sparkles className="h-6 w-6 text-orange-500" />
                ) : (
                  <Zap className="h-6 w-6 text-orange-500" />
                )}
              </div>

              <div className="mb-8">
                <span className="mb-4 block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                  {plan.badge}
                </span>
                <h4 className="mb-4 text-3xl font-black text-gray-900">
                  {plan.name}
                </h4>
                <div className="mb-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-sm font-bold text-gray-400">
                    {plan.period}
                  </span>
                </div>
                <p className="text-sm font-medium leading-relaxed text-gray-500">
                  {plan.description}
                </p>
              </div>

              <div className="mb-10 flex-1 space-y-4">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-green-100 bg-green-50">
                      <Check size={12} className="text-green-600" />
                    </div>
                    <span className="text-sm font-bold leading-tight text-gray-600">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleCheckout(plan.id)}
                disabled={buttonState.disabled}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-3xl py-5 text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60",
                  plan.highlight
                    ? "bg-orange-600 text-white shadow-lg shadow-orange-200 hover:bg-orange-700"
                    : "bg-gray-900 text-white hover:bg-black",
                )}
              >
                {checkoutLoadingPlan === plan.id ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    ĐANG CHUYỂN ĐẾN ZALOPAY
                  </>
                ) : (
                  <>
                    {buttonState.buttonText}
                    <span>{"->"}</span>
                  </>
                )}
              </button>

              {buttonState.helperText && (
                <p className="mt-3 text-center text-[11px] font-medium text-gray-400">
                  {buttonState.helperText}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <footer className="mt-12 text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">
          (c) 2026 HOTSNEW.CLICK INFRASTRUCTURE
        </p>
      </footer>
    </div>
  );
};
