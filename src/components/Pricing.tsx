import React, { useEffect, useState } from "react";
import { Check, Crown, Sparkles, Zap } from "lucide-react";
import { useLocale } from "@/src/hooks/useLocale";
import { cn } from "@/src/lib/utils";
import { LinkQuota, UserLimits, UserProfile } from "@/src/types";

interface PricingProps {
  userProfile: UserProfile | null;
  linkQuota: LinkQuota | null;
  userLimits: UserLimits | null;
}

export const Pricing = ({
  userProfile,
  linkQuota,
  userLimits,
}: PricingProps) => {
  const { locale, messages, t } = useLocale();
  const copy = messages.pricing;
  const zaloContactUrl = "https://zalo.me/0969361607";
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
      name: copy.plans.monthly.name,
      price: copy.plans.monthly.price,
      period: copy.plans.monthly.period,
      description: copy.plans.monthly.description,
      features: copy.plans.monthly.features,
      highlight: true,
      badge: copy.plans.monthly.badge,
    },
    {
      id: "yearly" as const,
      name: copy.plans.yearly.name,
      price: copy.plans.yearly.price,
      period: copy.plans.yearly.period,
      description: copy.plans.yearly.description,
      features: copy.plans.yearly.features,
      highlight: false,
      badge: copy.plans.yearly.badge,
    },
  ];

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

  const handleContactAdmin = () => {
    window.open(zaloContactUrl, "_blank", "noopener,noreferrer");
  };

  const getCurrentPlanLabel = () => {
    if (currentPlan === "monthly") return copy.status.monthly;
    if (currentPlan === "yearly") return copy.status.yearly;
    return copy.status.free;
  };

  const getButtonState = (planId: "monthly" | "yearly") => {
    const isCurrentPlan = currentPlan === planId;
    const disableByActiveYearly = isYearlyPlanActive && planId !== "yearly";
    const disableRenew = isCurrentPlan && !canRenewCurrentPlan;
    const disabled = disableByActiveYearly || disableRenew;

    const buttonText = isCurrentPlan
      ? copy.actions.renew
      : copy.actions.activate;

    let helperText = "";
    if (disableByActiveYearly) {
      helperText = copy.actions.disabledYearly;
    } else if (disableRenew) {
      helperText = copy.actions.disabledRenew;
    }

    return { disabled, buttonText, helperText };
  };

  const getPlanDailyLimit = (planId: "monthly" | "yearly") =>
    planId === "monthly" ? 5 : 50;
  const getPlanVideoLimit = (planId: "monthly" | "yearly") =>
    planId === "monthly" ? 3 : 20;
  const getPlanWorkspaceLimit = (planId: "monthly" | "yearly") =>
    planId === "monthly" ? 1 : 5;
  const getPlanMemberLimit = (planId: "monthly" | "yearly") =>
    planId === "monthly" ? 3 : 20;

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
          {linkQuota && (
            <p className="rounded-full border border-sky-100 bg-sky-50 px-4 py-1.5 text-center text-[10px] font-black uppercase tracking-widest text-sky-600 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300">
              {linkQuota.dailyLimit === null
                ? copy.status.linksUnlimited
                : t("pricing.status.linksDaily", {
                    used: linkQuota.usedToday,
                    limit: linkQuota.dailyLimit,
                  })}
            </p>
          )}
          {userLimits && (
            <p className="text-center text-sm font-bold text-violet-600 dark:text-violet-300">
              {userLimits.dailyVideoUploads === null
                ? copy.status.videosUnlimited
                : t("pricing.status.videosDaily", {
                    used: userLimits.videoUploadsUsedToday,
                    limit: userLimits.dailyVideoUploads,
                  })}
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
                "relative flex h-full flex-col rounded-[3rem] border bg-white p-10 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800",
                plan.highlight
                  ? "border-orange-500 ring-4 ring-orange-50 dark:ring-orange-500/10"
                  : "border-gray-100 dark:border-slate-700",
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
                <span className="mb-4 block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">
                  {plan.badge}
                </span>
                <h4 className="mb-4 text-3xl font-black text-gray-900 dark:text-slate-100">
                  {plan.name}
                </h4>
                <div className="mb-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-gray-900 dark:text-slate-100">
                    {plan.price}
                  </span>
                  <span className="text-sm font-bold text-gray-400 dark:text-slate-500">
                    {plan.period}
                  </span>
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
                onClick={handleContactAdmin}
                disabled={buttonState.disabled}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-3xl py-5 text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60",
                  plan.highlight
                    ? "bg-orange-600 text-white shadow-lg shadow-orange-200 hover:bg-orange-700"
                    : "bg-gray-900 text-white hover:bg-black dark:bg-slate-700 dark:hover:bg-slate-600",
                )}
              >
                <span>{buttonState.buttonText}</span>
                <span>{"->"}</span>
              </button>

              {buttonState.helperText && (
                <p className="mt-3 text-center text-[11px] font-medium text-gray-400 dark:text-slate-500">
                  {buttonState.helperText}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
