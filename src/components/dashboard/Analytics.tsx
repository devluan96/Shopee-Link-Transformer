import React, { useState } from "react";
import {
  MousePointer2,
  Activity,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  Filter,
  Map,
  ShoppingBag,
  PlaySquare,
  X,
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
import { buildPrettyLinkPath } from "@/src/lib/linkPaths";
import { AnalyticsData, AnalyticsFocusContext } from "@/src/types";
import { AdvancedAnalytics } from "./AdvancedAnalytics";
import { useLocale } from "@/src/hooks/useLocale";

interface AnalyticsProps {
  analyticsData: AnalyticsData;
  linksCount: number;
  fetchWithAuth?: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>;
  currentWorkspaceId?: string;
  focusContext?: AnalyticsFocusContext | null;
  lastUpdatedAt?: string | null;
  onClearFocus?: () => void;
}

const TRAFFIC_COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];

const formatUpdatedAt = (value: string, locale: "vi" | "en") => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(parsed);
};

const getFocusLabel = (
  focus: AnalyticsFocusContext,
  t: (path: string) => string,
) => {
  if (focus.source === "shopee" && focus.period === "today") {
    return t("analytics.focusContext.shopeeToday");
  }
  if (focus.source === "tiktok" && focus.period === "today") {
    return t("analytics.focusContext.tiktokToday");
  }
  if (focus.source === "all" && focus.period === "today") {
    return t("analytics.focusContext.allToday");
  }
  if (focus.source === "all" && focus.period === "30d") {
    return t("analytics.focusContext.all30d");
  }
  if (focus.source === "shopee" && focus.period === "7d") {
    return t("analytics.focusContext.shopee7d");
  }

  return t("analytics.focusContext.default");
};

export const Analytics = ({
  analyticsData,
  linksCount,
  fetchWithAuth,
  currentWorkspaceId,
  focusContext = null,
  lastUpdatedAt = null,
  onClearFocus,
}: AnalyticsProps) => {
  const { locale, messages, t } = useLocale();
  const [activeView, setActiveView] = useState<"basic" | "advanced">("basic");
  const history = analyticsData?.history || [];
  const topLinks = analyticsData?.topLinks || [];
  const trafficSources = analyticsData?.trafficSources || [];
  const growthPercentage = Number.isFinite(analyticsData?.growthPercentage)
    ? analyticsData.growthPercentage
    : 0;
  const content = messages.analytics;

  const totalClicks = history.reduce((a, b) => a + (b.clicks || 0), 0);
  const totalShopeeClicks = analyticsData?.totalShopeeClicks || 0;
  const totalTiktokClicks = analyticsData?.totalTiktokClicks || 0;
  const growthDisplay = `${growthPercentage >= 0 ? "+" : ""}${growthPercentage.toFixed(1)}%`;
  const filteredGrowthLabel = focusContext
    ? t("analytics.filteredGrowthLabel")
    : content.stats.growth;
  const chartDescription = focusContext
    ? t("analytics.filteredChartDescription")
    : content.chart.description;

  const formatChartDate = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;

    return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
      day: "2-digit",
      month: "2-digit",
    }).format(parsed);
  };

  const stats = [
    {
      label: content.stats.redirects,
      value: totalClicks.toLocaleString(),
      icon: MousePointer2,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
    {
      label: content.stats.shopee,
      value: totalShopeeClicks.toLocaleString(),
      icon: ShoppingBag,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: content.stats.tiktok,
      value: totalTiktokClicks.toLocaleString(),
      icon: PlaySquare,
      color: "text-cyan-700",
      bg: "bg-cyan-50",
    },
    {
      label: content.stats.activeLinks,
      value: linksCount || 0,
      icon: Activity,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: filteredGrowthLabel,
      value: growthDisplay,
      icon: TrendingUp,
      color: growthPercentage >= 0 ? "text-green-500" : "text-red-500",
      bg: growthPercentage >= 0 ? "bg-green-50" : "bg-red-50",
    },
  ];

  return (
    <div className="space-y-8 pb-12 dark:bg-slate-900">
      {focusContext && (
        <div className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,rgba(249,250,251,0.96),rgba(255,247,237,0.92))] p-5 shadow-sm dark:border-slate-700 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.96))]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-orange-600 dark:border-orange-400/20 dark:bg-slate-900/50 dark:text-orange-200">
                <Filter size={12} />
                {t("analytics.focusContext.title")}
              </div>
              {focusContext && (
                <>
                  <div className="mt-3 text-base font-black text-slate-900 dark:text-slate-100">
                    {getFocusLabel(focusContext, t)}
                  </div>
                  <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                    {t("analytics.focusContext.note")}
                  </p>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {lastUpdatedAt && (
                <div className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
                  {t("analytics.updatedAtMeta", {
                    time: formatUpdatedAt(lastUpdatedAt, locale),
                  })}
                </div>
              )}
              {focusContext && onClearFocus && (
                <button
                  type="button"
                  onClick={onClearFocus}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100"
                >
                  <X size={12} />
                  {t("analytics.focusContext.clear")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {!focusContext && lastUpdatedAt && (
        <div className="flex justify-end">
          <div className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
            {t("analytics.updatedAtMeta", {
              time: formatUpdatedAt(lastUpdatedAt, locale),
            })}
          </div>
        </div>
      )}

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
            {content.views.basic}
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
            {content.views.advanced}
          </button>
        </div>
      )}

      {activeView === "advanced" && fetchWithAuth ? (
        <AdvancedAnalytics
          fetchWithAuth={fetchWithAuth}
          currentWorkspaceId={currentWorkspaceId}
          focusContext={focusContext}
        />
      ) : (
        <>
          <div className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">
                  {content.chart.title}
                </h3>
                <p className="text-xs font-medium text-gray-400 dark:text-slate-400">
                  {chartDescription}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-orange-500">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500" />
                  {content.chart.liveData}
                </span>
                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600">
                  {t("analytics.chart.shopee", { count: totalShopeeClicks })}
                </span>
                <span className="rounded-full bg-cyan-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-cyan-700">
                  {t("analytics.chart.tiktok", { count: totalTiktokClicks })}
                </span>
              </div>
            </div>

            <div className="h-[350px] min-h-[350px] w-full min-w-0">
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
                      tickFormatter={formatChartDate}
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
                      labelFormatter={(label) => formatChartDate(String(label))}
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
                    {content.chart.empty}
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
                  {content.topLinks.title}
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
                          {locale === "vi"
                            ? `${item.clicks ?? 0} lượt chuyển hướng · ${buildPrettyLinkPath({
                                slug: item.slug,
                                shortCode: item.short_code,
                                title: item.title,
                              })}`
                            : `${item.clicks ?? 0} redirects · ${buildPrettyLinkPath({
                                slug: item.slug,
                                shortCode: item.short_code,
                                title: item.title,
                              })}`}
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
                    {content.topLinks.empty}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-8 flex items-center gap-3">
                <PieChartIcon size={20} className="text-blue-500" />
                <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">
                  {content.traffic.title}
                </h3>
              </div>
              <div className="mb-6 h-[220px] min-h-[220px] min-w-0">
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
                    {content.traffic.empty}
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
