import React from "react";
import {
  MousePointer2,
  Activity,
  TrendingUp,
  PieChart as PieChartIcon,
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

interface AnalyticsProps {
  analyticsData: AnalyticsData;
  linksCount: number;
}

const TRAFFIC_COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];

export const Analytics = ({ analyticsData, linksCount }: AnalyticsProps) => {
  const history = analyticsData?.history || [];
  const topLinks = analyticsData?.topLinks || [];
  const trafficSources = analyticsData?.trafficSources || [];
  const growthPercentage = Number.isFinite(analyticsData?.growthPercentage)
    ? analyticsData.growthPercentage
    : 0;

  const totalClicks = history.reduce((a, b) => a + (b.clicks || 0), 0);
  const growthDisplay = `${growthPercentage >= 0 ? "+" : ""}${growthPercentage.toFixed(1)}%`;

  return (
    <div className="space-y-8 pb-12">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          {
            label: "Tổng lượt click",
            value: totalClicks.toLocaleString(),
            icon: MousePointer2,
            color: "text-orange-500",
            bg: "bg-orange-50",
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
        ].map((stat, idx) => (
          <div
            key={idx}
            className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm"
          >
            <div
              className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl ${stat.bg} ${stat.color}`}
            >
              <stat.icon size={24} />
            </div>
            <div className="mb-1 font-mono text-3xl font-black text-gray-900">
              {stat.value}
            </div>
            <div className="text-[11px] font-black uppercase tracking-widest text-gray-400">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-black text-gray-900">
              Biểu đồ lượt click
            </h3>
            <p className="text-xs font-medium text-gray-400">
              Thống kê dữ liệu trong 30 ngày gần nhất
            </p>
          </div>
          <div className="flex gap-2">
            <span className="flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-orange-500">
              <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
              Live Data
            </span>
          </div>
        </div>

        <div className="h-[350px] min-h-[350px] w-full">
          {history.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" minHeight={350}>
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FB923C" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FB923C" stopOpacity={0} />
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
                Không có dữ liệu click nào trong 30 ngày qua.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm">
          <div className="mb-8 flex items-center gap-3">
            <TrendingUp size={20} className="text-orange-500" />
            <h3 className="text-xl font-black text-gray-900">
              Top Link Hiệu Quả
            </h3>
          </div>
          <div className="space-y-4">
            {topLinks.length > 0 ? (
              topLinks.map((item, idx) => (
                <div
                  key={idx}
                  className="group flex items-center gap-4 rounded-2xl p-4 transition-all hover:bg-gray-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 font-mono font-black text-gray-400 transition-all group-hover:bg-orange-500 group-hover:text-white">
                    0{idx + 1}
                  </div>
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="truncate font-bold text-gray-900">
                      {item.title}
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-orange-500">
                      {item.clicks} CLICKS
                    </div>
                  </div>
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100">
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
              <div className="py-12 text-center text-sm font-medium italic text-gray-400">
                Chưa có dữ liệu thống kê link
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm">
          <div className="mb-8 flex items-center gap-3">
            <PieChartIcon size={20} className="text-blue-500" />
            <h3 className="text-xl font-black text-gray-900">
              Nguồn Lưu Lượng
            </h3>
          </div>
          <div className="mb-6 h-[220px] min-h-[220px]">
            {trafficSources.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={220}>
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
                    tick={{ fontSize: 10, fontWeight: 700, fill: "#9CA3AF" }}
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
              <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-gray-100 bg-gray-50 text-center text-sm font-medium italic text-gray-400">
                Chưa có dữ liệu nguồn lưu lượng.
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {trafficSources.map((source, index) => (
              <span
                key={source.name}
                className="inline-flex items-center gap-2 rounded-full border border-gray-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-600"
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
    </div>
  );
};
