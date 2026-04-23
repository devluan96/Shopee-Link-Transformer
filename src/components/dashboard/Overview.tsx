import React from "react";
import {
  Zap,
  PlusCircle,
  List,
  BarChart3,
  TrendingUp,
  MousePointer2,
  Activity,
} from "lucide-react";
import { Tab } from "@/src/types";

interface OverviewProps {
  stats: {
    totalLinks: number;
    totalClicks: number;
    recentClicks: Array<{ date: string; clicks: number }>;
    topLinks: Array<{ short_code: string; title: string; clicks: number }>;
    growthPercentage: number;
  } | null;
  setActiveTab: (tab: Tab) => void;
  canAccessCreate: boolean;
}

export const Overview = ({
  stats,
  setActiveTab,
  canAccessCreate,
}: OverviewProps) => {
  const totalLinks = stats?.totalLinks || 0;
  const totalClicks = stats?.totalClicks || 0;
  const growthPercentage = Number.isFinite(stats?.growthPercentage)
    ? stats?.growthPercentage || 0
    : 0;

  const avgClicksPerLink = totalLinks > 0 ? totalClicks / totalLinks : 0;
  const efficiencyLabel =
    avgClicksPerLink >= 10
      ? "Rất cao"
      : avgClicksPerLink >= 5
        ? "Cao"
        : avgClicksPerLink >= 2
          ? "Trung bình"
          : totalClicks > 0
            ? "Đang tăng"
            : "Chưa có";

  const cards = [
    {
      label: "Tổng Link",
      value: totalLinks,
      icon: List,
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-100",
    },
    {
      label: "Tổng lượt click",
      value: totalClicks,
      icon: MousePointer2,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
    {
      label: "Tăng trưởng (30d)",
      value: `${growthPercentage >= 0 ? "+" : ""}${growthPercentage.toFixed(1)}`,
      icon: TrendingUp,
      color: growthPercentage >= 0 ? "text-green-600" : "text-red-600",
      bg: growthPercentage >= 0 ? "bg-green-50" : "bg-red-50",
      border: growthPercentage >= 0 ? "border-green-100" : "border-red-100",
    },
    {
      label: "Độ hiệu quả",
      value: efficiencyLabel,
      icon: Activity,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-100",
    },
  ];

  return (
    <div key="dashboard">
      <header className="mb-12">
        <h2 className="mb-2 text-4xl font-black tracking-tight text-gray-900">
          Chào buổi sáng!
        </h2>
        <p className="font-medium italic text-gray-500">
          Đây là tóm tắt nhanh hiệu suất chiến dịch hotsnew của bạn.
        </p>
      </header>

      <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <div
            key={i}
            className={`group relative overflow-hidden rounded-[2.5rem] border bg-white/90 p-8 shadow-sm backdrop-blur-sm transition-all hover:shadow-xl ${card.border}`}
          >
            <div
              className={`relative z-10 mb-6 flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm transition-transform group-hover:scale-110 ${card.bg} ${card.color}`}
            >
              <card.icon size={28} />
            </div>
            <div className="relative z-10 mb-1 font-mono text-3xl font-black text-gray-900">
              {card.value}
            </div>
            <div className="relative z-10 text-[11px] font-black uppercase tracking-widest text-gray-400">
              {card.label}
            </div>
            <div
              className={`absolute -bottom-4 -right-4 opacity-[0.03] transition-opacity group-hover:opacity-10 ${card.color}`}
            >
              <card.icon size={120} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-[3rem] bg-linear-to-br from-gray-900 via-gray-800 to-gray-950 p-8 text-white shadow-2xl ring-1 ring-white/10 lg:col-span-2 lg:p-12">
          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-600/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-orange-400">
              <Zap size={12} className="fill-current" /> Premium Business
            </div>
            <h3 className="mb-6 max-w-lg text-3xl font-black leading-tight lg:text-4xl">
              Sẵn sàng bùng nổ doanh số của bạn?
            </h3>
            <p className="mb-10 max-w-md font-medium leading-relaxed text-gray-400">
              Sử dụng công cụ chuyển đổi landing page chuyên nghiệp để tăng tỷ
              lệ click-through lên đến 300% trên Facebook.
            </p>
            {canAccessCreate ? (
              <button
                onClick={() => setActiveTab("create")}
                className="flex items-center gap-3 rounded-2xl bg-linear-to-r from-orange-600 to-amber-500 px-10 py-5 text-xs font-black uppercase tracking-widest shadow-xl shadow-orange-900/40 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-orange-600/40 active:scale-95"
              >
                <PlusCircle size={20} /> Tạo Link Ngay
              </button>
            ) : (
              <button
                onClick={() => setActiveTab("pricing")}
                className="flex items-center gap-3 rounded-2xl bg-linear-to-r from-orange-600 to-amber-500 px-10 py-5 text-xs font-black uppercase tracking-widest shadow-xl shadow-orange-900/40 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-orange-600/40 active:scale-95"
              >
                <Zap size={20} /> Nâng cấp Premium Ngay
              </button>
            )}
          </div>
          <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-linear-to-l from-orange-600/10 to-transparent" />
          <Zap
            size={300}
            className="pointer-events-none absolute -bottom-16 -right-16 fill-current text-white opacity-[0.03]"
          />
        </div>

        <div className="rounded-[3rem] border border-gray-200 bg-white p-8 shadow-sm">
          <h3 className="mb-8 flex items-center gap-2 px-2 text-sm font-black uppercase tracking-[0.2em] text-gray-400">
            <BarChart3 size={16} /> Link Hiệu Quả Nhất
          </h3>
          <div className="space-y-4">
            {stats?.topLinks && stats.topLinks.length > 0 ? (
              stats.topLinks.map((tl, idx) => (
                <div
                  key={idx}
                  className="group flex cursor-pointer items-center gap-4 rounded-2xl p-4 transition-all hover:bg-gray-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 font-mono font-black text-gray-400 transition-all group-hover:bg-orange-600 group-hover:text-white">
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="mb-0.5 truncate font-bold text-gray-900">
                      {tl.title}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">
                      {tl.clicks} Clicks
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center font-medium italic text-gray-400">
                Chưa có dữ liệu.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
