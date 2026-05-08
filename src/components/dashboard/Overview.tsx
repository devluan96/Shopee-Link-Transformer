import React from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CircleDot,
  List,
  MousePointer2,
  PlaySquare,
  PlusCircle,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Tab } from "@/src/types";

interface OverviewProps {
  stats: {
    totalLinks: number;
    totalClicks: number;
    totalShopeeClicks?: number;
    totalTiktokClicks?: number;
    recentClicks: Array<{ date: string; clicks: number }>;
    topLinks: Array<{ short_code: string; title: string; clicks: number }>;
    growthPercentage: number;
  } | null;
  setActiveTab: (tab: Tab) => void;
  canAccessCreate: boolean;
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: value >= 100 ? 0 : 1,
  }).format(value);

const formatSignedPercent = (value: number) =>
  `${value >= 0 ? "+" : ""}${formatNumber(value)}%`;

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Chào buổi sáng";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
};

const getEfficiencyMeta = (avgClicksPerLink: number, totalClicks: number) => {
  if (avgClicksPerLink >= 10) {
    return {
      label: "Rất cao",
      tone: "text-emerald-300",
      note: "Mỗi link đang tạo lực kéo rất tốt.",
    };
  }

  if (avgClicksPerLink >= 5) {
    return {
      label: "Cao",
      tone: "text-sky-300",
      note: "Chỉ số outbound đang vượt mức an toàn.",
    };
  }

  if (avgClicksPerLink >= 2) {
    return {
      label: "Trung bình",
      tone: "text-amber-300",
      note: "Có nền ổn định, vẫn còn dư địa để tối ưu.",
    };
  }

  if (totalClicks > 0) {
    return {
      label: "Đang tăng",
      tone: "text-orange-300",
      note: "Đã có tín hiệu, nên đẩy thêm CTA và phân phối.",
    };
  }

  return {
    label: "Chưa có",
    tone: "text-slate-300",
    note: "Cần tạo thêm link hoặc đẩy traffic đầu vào.",
  };
};

const getGrowthLabel = (value: number) => {
  if (value >= 25) return "Bứt tốc";
  if (value >= 0) return "Ổn định";
  return "Cần tối ưu";
};

const getMetricDescription = (
  label: string,
  value: number,
  totalClicks: number,
  totalLinks: number,
) => {
  switch (label) {
    case "Tổng link":
      return totalLinks > 0
        ? `${formatNumber(totalClicks / Math.max(totalLinks, 1))} click trung bình mỗi link`
        : "Bắt đầu tạo link đầu tiên để mở dữ liệu";
    case "Click outbound":
      return totalClicks > 0
        ? "Tổng lượng click điều hướng ra đích"
        : "Chưa có phiên outbound nào được ghi nhận";
    case "Ra Shopee":
      return totalClicks > 0
        ? `${formatNumber((value / totalClicks) * 100)}% tổng outbound`
        : "Chưa ghi nhận traffic đi Shopee";
    case "Ra TikTok":
      return totalClicks > 0
        ? `${formatNumber((value / totalClicks) * 100)}% tổng outbound`
        : "Chưa ghi nhận traffic đi TikTok";
    default:
      return "";
  }
};

export const Overview = ({
  stats,
  setActiveTab,
  canAccessCreate,
}: OverviewProps) => {
  const greeting = getGreeting();
  const totalLinks = stats?.totalLinks || 0;
  const totalClicks = stats?.totalClicks || 0;
  const totalShopeeClicks = stats?.totalShopeeClicks || 0;
  const totalTiktokClicks = stats?.totalTiktokClicks || 0;
  const recentClicks = stats?.recentClicks || [];
  const topLinks = stats?.topLinks || [];
  const growthPercentage = Number.isFinite(stats?.growthPercentage)
    ? stats?.growthPercentage || 0
    : 0;

  const avgClicksPerLink = totalLinks > 0 ? totalClicks / totalLinks : 0;
  const efficiency = getEfficiencyMeta(avgClicksPerLink, totalClicks);
  const totalMarketplaceClicks = totalShopeeClicks + totalTiktokClicks;
  const otherClicks = Math.max(totalClicks - totalMarketplaceClicks, 0);
  const shopeeShare = totalClicks > 0 ? (totalShopeeClicks / totalClicks) * 100 : 0;
  const tiktokShare = totalClicks > 0 ? (totalTiktokClicks / totalClicks) * 100 : 0;
  const otherShare = totalClicks > 0 ? (otherClicks / totalClicks) * 100 : 0;

  const recentWindow = recentClicks.slice(-7);
  const maxRecentClicks = recentWindow.reduce(
    (max, item) => Math.max(max, item.clicks),
    0,
  );
  const recentTotal = recentWindow.reduce((sum, item) => sum + item.clicks, 0);
  const bestDay = recentWindow.reduce<{ date: string; clicks: number } | null>(
    (best, item) => (!best || item.clicks > best.clicks ? item : best),
    null,
  );

  const primaryCards = [
    {
      label: "Tổng link",
      value: formatNumber(totalLinks),
      detail: getMetricDescription("Tổng link", totalLinks, totalClicks, totalLinks),
      icon: List,
      iconWrap: "bg-orange-500/12 text-orange-300 ring-1 ring-orange-400/20",
      accent: "from-orange-500/18 via-orange-400/6 to-transparent",
    },
    {
      label: "Click outbound",
      value: formatNumber(totalClicks),
      detail: getMetricDescription(
        "Click outbound",
        totalClicks,
        totalClicks,
        totalLinks,
      ),
      icon: MousePointer2,
      iconWrap: "bg-sky-500/12 text-sky-300 ring-1 ring-sky-400/20",
      accent: "from-sky-500/18 via-sky-400/6 to-transparent",
    },
    {
      label: "Ra Shopee",
      value: formatNumber(totalShopeeClicks),
      detail: getMetricDescription("Ra Shopee", totalShopeeClicks, totalClicks, totalLinks),
      icon: ShoppingBag,
      iconWrap: "bg-orange-500/14 text-orange-300 ring-1 ring-orange-400/25",
      accent: "from-orange-500/20 via-amber-400/8 to-transparent",
    },
    {
      label: "Ra TikTok",
      value: formatNumber(totalTiktokClicks),
      detail: getMetricDescription("Ra TikTok", totalTiktokClicks, totalClicks, totalLinks),
      icon: PlaySquare,
      iconWrap: "bg-cyan-400/14 text-cyan-200 ring-1 ring-cyan-300/25",
      accent: "from-cyan-400/20 via-pink-500/8 to-transparent",
    },
  ];

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.16),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.14),_transparent_30%)]" />

      <div className="grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.95fr)]">
        <section className="relative min-w-0 overflow-hidden rounded-[2rem] border border-slate-200/70 bg-[linear-gradient(135deg,#0f172a_0%,#111827_42%,#1e293b_100%)] p-7 text-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.9)] ring-1 ring-white/10 lg:p-9">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.12),_transparent_32%)]" />
          <div className="pointer-events-none absolute -right-24 top-10 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 bottom-0 h-52 w-52 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-8">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_320px] xl:items-start">
              <div className="min-w-0">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-200">
                  <Sparkles size={14} className="text-orange-300" />
                  Dashboard hiệu suất
                </div>
                <h2 className="max-w-3xl text-3xl font-black tracking-tight text-white md:text-4xl xl:text-[3.25rem] xl:leading-[1.02]">
                  {greeting}, đây là nhịp tăng trưởng chiến dịch của bạn.
                </h2>
              </div>

              <div className="grid w-full gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <div className="rounded-2xl border border-white/10 bg-white/7 p-4 backdrop-blur-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Tăng trưởng 30d
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-2xl font-black text-white">
                    {formatSignedPercent(growthPercentage)}
                    <ArrowUpRight
                      size={18}
                      className={
                        growthPercentage >= 0 ? "text-emerald-300" : "text-rose-300"
                      }
                    />
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    {getGrowthLabel(growthPercentage)}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/7 p-4 backdrop-blur-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Hiệu quả
                  </div>
                  <div className={`mt-3 text-2xl font-black ${efficiency.tone}`}>
                    {efficiency.label}
                  </div>
                  <div className="mt-2 text-xs text-slate-400">{efficiency.note}</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/7 p-4 backdrop-blur-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    7 ngày gần đây
                  </div>
                  <div className="mt-3 text-2xl font-black text-white">
                    {formatNumber(recentTotal)}
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    {bestDay
                      ? `${bestDay.clicks} click ở phiên tốt nhất`
                      : "Chưa có dữ liệu lịch sử"}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {primaryCards.map((card) => (
                <div
                  key={card.label}
                  className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/8 p-5 shadow-[0_20px_55px_-45px_rgba(15,23,42,0.65)] backdrop-blur-md"
                >
                  <div
                    className={`pointer-events-none absolute inset-x-0 top-0 h-20 bg-linear-to-br ${card.accent}`}
                  />
                  <div
                    className={`relative flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconWrap}`}
                  >
                    <card.icon size={22} />
                  </div>
                  <div className="relative mt-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                    {card.label}
                  </div>
                  <div className="relative mt-2 text-3xl font-black tracking-tight text-white">
                    {card.value}
                  </div>
                  <div className="relative mt-2 text-sm leading-6 text-slate-300">
                    {card.detail}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(260px,0.9fr)]">
              <div className="min-w-0 rounded-[1.75rem] border border-white/10 bg-white/8 p-5 backdrop-blur-md">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Nhịp click gần đây
                    </div>
                    <div className="mt-2 text-lg font-bold text-white">
                      {recentWindow.length > 0
                        ? "Diễn biến outbound theo ngày"
                        : "Dữ liệu sẽ xuất hiện khi có click mới"}
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("analytics")}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-orange-400/30 hover:bg-white/12"
                  >
                    Mở phân tích
                    <ArrowRight size={14} />
                  </button>
                </div>

                <div className="mt-6">
                  {recentWindow.length > 0 ? (
                    <div className="flex h-48 items-end gap-3">
                      {recentWindow.map((item, index) => {
                        const barHeight =
                          maxRecentClicks > 0
                            ? Math.max((item.clicks / maxRecentClicks) * 100, 12)
                            : 12;

                        return (
                          <div key={`${item.date}-${index}`} className="flex flex-1 flex-col gap-3">
                            <div className="text-center text-xs font-semibold text-slate-300">
                              {item.clicks}
                            </div>
                            <div className="flex h-36 items-end rounded-2xl bg-white/5 p-1">
                              <div
                                className="w-full rounded-[1.15rem] bg-[linear-gradient(180deg,rgba(56,189,248,0.95)_0%,rgba(249,115,22,0.9)_100%)] shadow-[0_20px_30px_-18px_rgba(14,165,233,0.8)]"
                                style={{ height: `${barHeight}%` }}
                              />
                            </div>
                            <div className="text-center text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                              {item.date}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex h-48 items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 bg-white/4 px-6 text-center text-sm text-slate-400">
                      Hệ thống chưa có dữ liệu click gần đây để dựng xu hướng.
                    </div>
                  )}
                </div>
              </div>

              <div className="min-w-0 rounded-[1.75rem] border border-white/10 bg-white/8 p-5 backdrop-blur-md">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  <CircleDot size={14} className="text-orange-300" />
                  Phân bổ traffic
                </div>

                <div className="mt-5 space-y-4">
                  {[
                    {
                      label: "Shopee",
                      value: totalShopeeClicks,
                      share: shopeeShare,
                      color: "from-orange-400 to-amber-300",
                    },
                    {
                      label: "TikTok",
                      value: totalTiktokClicks,
                      share: tiktokShare,
                      color: "from-cyan-400 to-sky-300",
                    },
                    {
                      label: "Khác",
                      value: otherClicks,
                      share: otherShare,
                      color: "from-slate-300 to-slate-100",
                    },
                  ].map((channel) => (
                    <div key={channel.label}>
                      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold text-white">{channel.label}</span>
                        <span className="text-slate-300">
                          {formatNumber(channel.value)} · {formatNumber(channel.share)}%
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-white/8">
                        <div
                          className={`h-full rounded-full bg-linear-to-r ${channel.color}`}
                          style={{ width: `${Math.max(channel.share, channel.value > 0 ? 8 : 0)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Đề xuất nhanh
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {totalClicks === 0
                      ? "Tạo thêm landing link và đẩy traffic đầu vào để hệ thống bắt đầu học hành vi click."
                      : totalShopeeClicks === 0 || totalTiktokClicks === 0
                        ? "Một kênh đang chưa có dữ liệu. Nên bổ sung phân phối chéo để so sánh hiệu quả."
                        : "Bạn đã có dữ liệu đa kênh. Tập trung tối ưu title và thumbnail cho top link để đẩy CTR."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid min-w-0 gap-6">
          <div className="min-w-0 overflow-hidden rounded-[2rem] border border-orange-200/70 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_52%,#eff6ff_100%)] p-6 shadow-[0_25px_70px_-50px_rgba(249,115,22,0.45)] dark:border-slate-700 dark:bg-[linear-gradient(135deg,#1e293b_0%,#111827_55%,#0f172a_100%)]">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-500 dark:text-orange-300">
              <Zap size={14} />
              Hành động ưu tiên
            </div>

            <h3 className="mt-3 max-w-sm text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Tạo thêm link có chủ đích để đẩy hiệu suất rõ ràng hơn.
            </h3>
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-300">
              Khi dữ liệu đã được sắp lớp tốt, bước tiếp theo là tạo link theo từng
              chiến dịch hoặc từng kênh để đo chính xác chất lượng traffic.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-orange-200/70 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                  Click / link
                </div>
                <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                  {formatNumber(avgClicksPerLink)}
                </div>
              </div>
              <div className="rounded-2xl border border-orange-200/70 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                  Kênh có dữ liệu
                </div>
                <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                  {[totalShopeeClicks > 0, totalTiktokClicks > 0].filter(Boolean).length}/2
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setActiveTab(canAccessCreate ? "create" : "pricing")}
                className="inline-flex items-center justify-center gap-3 rounded-2xl bg-[linear-gradient(90deg,#ea580c_0%,#f59e0b_100%)] px-5 py-3 text-sm font-black text-white shadow-[0_20px_35px_-20px_rgba(249,115,22,0.7)] transition hover:-translate-y-0.5"
              >
                {canAccessCreate ? <PlusCircle size={18} /> : <Zap size={18} />}
                {canAccessCreate ? "Tạo link ngay" : "Nâng cấp Premium"}
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className="inline-flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-800"
              >
                <TrendingUp size={18} />
                Xem phân tích sâu
              </button>
            </div>
          </div>

          <div className="min-w-0 rounded-[2rem] border border-slate-200/70 bg-white/90 p-6 shadow-[0_25px_70px_-45px_rgba(15,23,42,0.45)] ring-1 ring-slate-100 backdrop-blur dark:border-slate-700 dark:bg-slate-800/90 dark:ring-slate-700">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                  <BarChart3 size={14} className="text-orange-500" />
                  Link nổi bật
                </div>
                <h3 className="mt-2 text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                  Top link hiệu quả nhất
                </h3>
              </div>
              <button
                onClick={() => setActiveTab("list")}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-orange-400/40 dark:hover:bg-slate-800 dark:hover:text-orange-300"
              >
                Xem danh sách
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="space-y-3">
              {topLinks.length > 0 ? (
                topLinks.slice(0, 5).map((link, index) => {
                  const ratio = topLinks[0]?.clicks
                    ? (link.clicks / topLinks[0].clicks) * 100
                    : 0;

                  return (
                    <div
                      key={`${link.short_code}-${index}`}
                      className="rounded-[1.5rem] border border-slate-200/70 bg-slate-50/80 p-4 transition hover:border-orange-200 hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:hover:border-slate-600 dark:hover:bg-slate-900"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-black text-white shadow-sm dark:bg-slate-100 dark:text-slate-900">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                                {link.title || `/${link.short_code}`}
                              </p>
                              <p className="mt-1 truncate font-mono text-[11px] text-slate-400 dark:text-slate-500">
                                /s/{link.short_code}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-black text-slate-900 dark:text-slate-100">
                                {formatNumber(link.clicks)}
                              </div>
                              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-500">
                                Outbound
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                            <div
                              className="h-full rounded-full bg-[linear-gradient(90deg,#f97316_0%,#fb923c_35%,#38bdf8_100%)]"
                              style={{ width: `${Math.max(ratio, 12)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
                  Chưa có dữ liệu link nổi bật để hiển thị.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
