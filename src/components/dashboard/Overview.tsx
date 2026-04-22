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
  } | null;
  setActiveTab: (tab: Tab) => void;
  canAccessCreate: boolean;
}

export const Overview = ({
  stats,
  setActiveTab,
  canAccessCreate,
}: OverviewProps) => {
  return (
    <div key="dashboard">
      <header className="mb-12">
        <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">
          Chào buổi sáng!
        </h2>
        <p className="text-gray-500 font-medium italic">
          Đây là tóm tắt chiến dịch hotsnew của bạn trong 24h qua.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          {
            label: "Tổng Link",
            value: stats?.totalLinks || 0,
            icon: List,
            color: "text-orange-600",
            bg: "bg-orange-50",
            border: "border-orange-100",
          },
          {
            label: "Tổng Lượt Click",
            value: stats?.totalClicks || 0,
            icon: MousePointer2,
            color: "text-blue-600",
            bg: "bg-blue-50",
            border: "border-blue-100",
          },
          {
            label: "Tăng Trưởng %",
            value: "+12.5",
            icon: TrendingUp,
            color: "text-green-600",
            bg: "bg-green-50",
            border: "border-green-100",
          },
          {
            label: "Độ Hiệu Quả",
            value: "Cao",
            icon: Activity,
            color: "text-purple-600",
            bg: "bg-purple-50",
            border: "border-purple-100",
          },
        ].map((s, i) => (
          <div
            key={i}
            className={`bg-white p-8 rounded-[2.5rem] border ${s.border} shadow-sm hover:shadow-xl transition-all group relative overflow-hidden backdrop-blur-sm bg-white/90`}
          >
            <div
              className={`w-14 h-14 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform relative z-10 shadow-sm`}
            >
              <s.icon size={28} />
            </div>
            <div className="text-3xl font-black text-gray-900 mb-1 font-mono relative z-10">
              {s.value}
            </div>
            <div className="text-[11px] font-black uppercase tracking-widest text-gray-400 relative z-10">
              {s.label}
            </div>
            <div
              className={`absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-10 transition-opacity ${s.color}`}
            >
              <s.icon size={120} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl ring-1 ring-white/10">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-600/20 text-orange-400 border border-orange-500/30 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
              <Zap size={12} className="fill-current" /> Premium Business
            </div>
            <h3 className="text-4xl font-black mb-6 leading-tight max-w-lg">
              Sẵn sàng bùng nổ doanh số của bạn?
            </h3>
            <p className="text-gray-400 font-medium mb-10 max-w-md leading-relaxed">
              Sử dụng công cụ chuyển đổi landing page chuyên nghiệp để tăng tỷ
              lệ click-through lên đến 300% trên Facebook.
            </p>
            {canAccessCreate ? (
              <button
                onClick={() => setActiveTab("create")}
                className="px-10 py-5 bg-gradient-to-r from-orange-600 to-amber-500 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:shadow-2xl hover:shadow-orange-600/40 hover:-translate-y-0.5 transition-all active:scale-95 shadow-xl shadow-orange-900/40"
              >
                <PlusCircle size={20} /> Tạo Link Ngay
              </button>
            ) : (
              <button
                onClick={() => setActiveTab("pricing")}
                className="px-10 py-5 bg-gradient-to-r from-orange-600 to-amber-500 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:shadow-2xl hover:shadow-orange-600/40 hover:-translate-y-0.5 transition-all active:scale-95 shadow-xl shadow-orange-900/40"
              >
                <Zap size={20} /> Nâng cấp Premium Ngay
              </button>
            )}
          </div>
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-600/10 to-transparent pointer-events-none" />
          <Zap
            size={300}
            className="absolute -bottom-16 -right-16 text-white opacity-[0.03] fill-current pointer-events-none"
          />
        </div>

        <div className="bg-white rounded-[3rem] border border-gray-200 p-8 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400 mb-8 px-2 flex items-center gap-2">
            <BarChart3 size={16} /> Link Hiệu Quả Nhất
          </h3>
          <div className="space-y-4">
            {stats?.topLinks && stats.topLinks.length > 0 ? (
              stats.topLinks.map((tl, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center font-black text-gray-400 group-hover:bg-orange-600 group-hover:text-white transition-all font-mono">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate mb-0.5">
                      {tl.title}
                    </p>
                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
                      {tl.clicks} Clicks
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center text-gray-400 font-medium italic">
                Chưa có dữ liệu.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
