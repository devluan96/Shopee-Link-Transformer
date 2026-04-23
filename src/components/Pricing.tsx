import React, { useEffect, useRef } from "react";
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
  const expiryDate = userProfile?.subscription_expiry
    ? new Date(userProfile.subscription_expiry).toLocaleDateString("vi-VN")
    : null;
  const handledReturnRef = useRef(false);

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

  const plans = [
    {
      id: "monthly" as const,
      name: "Goi thang",
      price: "299.000d",
      period: "/ THANG",
      description: "Phu hop de chay thu hoac van hanh ngan han.",
      features: [
        "Tao landing page khong gioi han",
        "Upload video va thumbnail",
        "Quan ly link va theo doi thong ke",
        "Thanh toan qua ZaloPay Gateway va VietQR",
      ],
      highlight: true,
      buttonText: "THANH TOAN NGAY",
      badge: "LINH HOAT",
    },
    {
      id: "yearly" as const,
      name: "Goi nam",
      price: "2.490.000d",
      period: "/ NAM",
      description: "Toi uu chi phi va phu hop cho tai khoan van hanh lau dai.",
      features: [
        "Tao landing page khong gioi han",
        "Upload video va thumbnail",
        "Quan ly link va theo doi thong ke",
        "Thanh toan qua ZaloPay Gateway va VietQR",
      ],
      highlight: false,
      buttonText: "THANH TOAN NGAY",
      badge: "TIET KIEM HON",
    },
  ];

  const handleCheckout = async (plan: "monthly" | "yearly") => {
    try {
      await onCheckout(plan);
    } catch (error: any) {
      toast.error(error?.message || "Khong the chuyen sang cong thanh toan.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-12">
        <h2 className="text-3xl font-black text-gray-900 mb-2">
          Bang gia dich vu
        </h2>
        <p className="text-gray-500 font-medium italic">
          Nang cap tai khoan de mo khoa toan bo tinh nang chuyen doi link.
        </p>
      </header>

      <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6 text-center md:text-left">
          <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center">
            <Crown className="text-orange-600 w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
              TRANG THAI HIEN TAI
            </p>
            <h3 className="text-2xl font-black text-gray-900">
              {currentPlan === "free"
                ? "Goi mien phi"
                : currentPlan === "monthly"
                  ? "Goi thang"
                  : "Goi nam"}
            </h3>
            {expiryDate && (
              <p className="text-sm text-gray-500 font-medium">
                Goi dang hoat dong den {expiryDate}.
              </p>
            )}
          </div>
        </div>
        <div className="bg-green-50 text-green-600 px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest border border-green-100">
          Dang hoat dong
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              "relative bg-white rounded-[3rem] p-10 border shadow-sm flex flex-col h-full transition-all hover:shadow-xl hover:-translate-y-1",
              plan.highlight
                ? "border-orange-500 ring-4 ring-orange-50"
                : "border-gray-100",
            )}
          >
            <div className="absolute top-10 right-10">
              {plan.highlight ? (
                <Sparkles className="text-orange-500 w-6 h-6" />
              ) : (
                <Zap className="text-orange-500 w-6 h-6" />
              )}
            </div>

            <div className="mb-8">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 block">
                {plan.badge}
              </span>
              <h4 className="text-3xl font-black text-gray-900 mb-4">
                {plan.name}
              </h4>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-black text-gray-900">
                  {plan.price}
                </span>
                <span className="text-sm font-bold text-gray-400">
                  {plan.period}
                </span>
              </div>
              <p className="text-gray-500 font-medium text-sm leading-relaxed">
                {plan.description}
              </p>
            </div>

            <div className="space-y-4 mb-10 flex-1">
              {plan.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 bg-green-50 rounded-full flex items-center justify-center border border-green-100">
                    <Check size={12} className="text-green-600" />
                  </div>
                  <span className="text-sm font-bold text-gray-600 leading-tight">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleCheckout(plan.id)}
              disabled={checkoutLoadingPlan !== null}
              className={cn(
                "w-full py-5 rounded-3xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed",
                plan.highlight
                  ? "bg-orange-600 text-white shadow-lg shadow-orange-200 hover:bg-orange-700"
                  : "bg-gray-900 text-white hover:bg-black",
              )}
            >
              {checkoutLoadingPlan === plan.id ? (
                <>
                  <LoaderCircle size={16} className="animate-spin" />
                  DANG CHUYEN DEN ZALOPAY
                </>
              ) : (
                <>
                  {currentPlan === plan.id ? "GIA HAN NGAY" : plan.buttonText}
                  <span>{"->"}</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      <footer className="mt-12 text-center">
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
          (c) 2026 HOTSNEW.CLICK INFRASTRUCTURE
        </p>
      </footer>
    </div>
  );
};
