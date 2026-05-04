import React, { useState } from "react";
import {
  MousePointer2,
  Activity,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  Map,
  ShoppingBag,
  PlaySquare,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { AnalyticsData } from "@/src/types";
import { AdvancedAnalytics } from "./AdvancedAnalytics";

interface AnalyticsProps {
  analyticsData: AnalyticsData;
  linksCount: number;
  fetchWithAuth?: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>;
  currentWorkspaceId?: string;
}

const TRAFFIC_COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];

export const Analytics = ({
  analyticsData,
  linksCount,
  fetchWithAuth,
  currentWorkspaceId,
}: AnalyticsProps) => {
  const [activeView, setActiveView] = useState<"basic" | "advanced">("basic");
  const history = analyticsData?.history || [];
  const topLinks = analyticsData?.topLinks || [];
  const trafficSources = analyticsData?.trafficSources || [];
  const growthPercentage = Number.isFinite(analyticsData?.growthPercentage)
    ? analyticsData.growthPercentage
    : 0;

  const totalClicks = history.reduce((a, b) => a + (b.clicks || 0), 0);
  const totalShopeeClicks = analyticsData?.totalShopeeClicks || 0;
  const totalTiktokClicks = analyticsData?.totalTiktokClicks || 0;
  const growthDisplay = `${growthPercentage >= 0 ? "+" : ""}${growthPercentage.toFixed(1)}%`;

  const stats = [
    {
      label: "Click outbound",
      value: totalClicks.toLocaleString(),
      icon: MousePointer2,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
    {
      label: "Click Shopee",
      value: totalShopeeClicks.toLocaleString(),
      icon: ShoppingBag,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Click TikTok",
      value: totalTiktokClicks.toLocaleString(),
      icon: PlaySquare,
      color: "text-cyan-700",
      bg: "bg-cyan-50",
    },
    {
      label: "Link hoạt động",
      value: linksCount || 0,
      icon: Activity,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: "Tăng trưởng (30d)",
      value: growthDisplay,
      icon: TrendingUp,
      color: growthPercentage >= 0 ? "text-green-500" : "text-red-500",
      bg: growthPercentage >= 0 ? "bg-green-50" : "bg-red-50",
    },
  ];

  return (
    <div className="space-y-8 pb-12 dark:bg-slate-900">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <div
              className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl ${stat.bg} ${stat.color} dark:bg-slate-700`}
            >
              <stat.icon size={24} />
            </div>
            <div className="mb-1 font-mono text-3xl font-black text-gray-900 dark:text-slate-100">
              {stat.value}
            </div>
            <div className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {fetchWithAuth && (
        <div className="flex gap-2 rounded-2xl bg-gray-100 p-1.5 dark:bg-slate-800">
          <button
            onClick={() => setActiveView("basic")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-xs font-black uppercase tracking-widest transition-all ${
              activeView === "basic"
                ? "bg-white text-orange-600 shadow-sm dark:bg-slate-700"
                : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
            }`}
          >
            <BarChart3 size={14} />
            Thống kê cơ bản
          </button>
          <button
            onClick={() => setActiveView("advanced")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-xs font-black uppercase tracking-widest transition-all ${
              activeView === "advanced"
                ? "bg-white text-orange-600 shadow-sm dark:bg-slate-700"
                : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
            }`}
          >
            <Map size={14} />
            Phân tích nâng cao
          </button>
        </div>
      )}

      {activeView === "advanced" && fetchWithAuth ? (
        <AdvancedAnalytics
          fetchWithAuth={fetchWithAuth}
          currentWorkspaceId={currentWorkspaceId}
        />
      ) : (
        <>
          <div className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">
                  Biểu đồ click outbound
                </h3>
                <p className="text-xs font-medium text-gray-400 dark:text-slate-400">
                  Thống kê outbound sang Shopee và TikTok trong 30 ngày gần nhất
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-orange-500">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500" />
                  Live Data
                </span>
                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600">
                  Shopee: {totalShopeeClicks}
                </span>
                <span className="rounded-full bg-cyan-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-cyan-700">
                  TikTok: {totalTiktokClicks}
                </span>
              </div>
            </div>

            <div className="h-87.5 min-h-87.5 w-full">
              {history.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minHeight={350}>
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient
                        id="colorClicks"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#FB923C"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#FB923C"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 700, fill: "#9CA3AF" }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 700, fill: "#9CA3AF" }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "1rem",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      }}
                      labelStyle={{ fontWeight: 900, marginBottom: "4px" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="clicks"
                      stroke="#FB923C"
                      strokeWidth={4}
                      fillOpacity={1}
                      fill="url(#colorClicks)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center py-20 text-gray-300">
                  <Activity size={48} className="mb-4 opacity-20" />
                  <p className="text-sm font-bold italic">
                    Không có dữ liệu outbound trong 30 ngày qua.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-8 flex items-center gap-3">
                <TrendingUp size={20} className="text-orange-500" />
                <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">
                  Top Link Hiệu Quả
                </h3>
              </div>
              <div className="space-y-4">
                {topLinks.length > 0 ? (
                  topLinks.map((item, idx) => (
                    <div
                      key={idx}
                      className="group flex items-center gap-4 rounded-2xl p-4 transition-all hover:bg-gray-50 dark:hover:bg-slate-700"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 font-mono font-black text-gray-400 transition-all group-hover:bg-orange-500 group-hover:text-white dark:bg-slate-700 dark:text-slate-400">
                        0{idx + 1}
                      </div>
                      <div className="min-w-0 flex-1 pr-4">
                        <div className="truncate font-bold text-gray-900 dark:text-slate-200">
                          {item.title}
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-orange-500">
                          {item.clicks} CLICK OUTBOUND · /s/{item.short_code}
                        </div>
                      </div>
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-700">
                        <div
                          className="h-full bg-orange-500"
                          style={{
                            width: `${(item.clicks / Math.max(1, ...topLinks.map((link) => link.clicks || 0))) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-sm font-medium italic text-gray-400 dark:text-slate-500">
                    Chưa có dữ liệu thống kê link
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-8 flex items-center gap-3">
                <PieChartIcon size={20} className="text-blue-500" />
                <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">
                  Nguồn Lưu Lượng
                </h3>
              </div>
              <div className="mb-6 h-55 min-h-55">
                {trafficSources.length > 0 ? (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    minHeight={220}
                  >
                    <BarChart data={trafficSources}>
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 700 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 10,
                          fontWeight: 700,
                          fill: "#9CA3AF",
                        }}
                      />
                      <Tooltip />
                      <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                        {trafficSources.map((source, index) => (
                          <Cell
                            key={source.name}
                            fill={TRAFFIC_COLORS[index % TRAFFIC_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-gray-100 bg-gray-50 text-center text-sm font-medium italic text-gray-400 dark:border-slate-700 dark:bg-slate-700/50 dark:text-slate-400">
                    Chưa có dữ liệu nguồn lưu lượng.
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {trafficSources.map((source, index) => (
                  <span
                    key={source.name}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-600 dark:border-slate-600 dark:text-slate-400"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          TRAFFIC_COLORS[index % TRAFFIC_COLORS.length],
                      }}
                    />
                    {source.name}: {source.value}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
