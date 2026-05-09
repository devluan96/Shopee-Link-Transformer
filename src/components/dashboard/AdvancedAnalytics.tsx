import React, { useEffect, useState } from "react";
import {
  Globe,
  Smartphone,
  Clock,
  Download,
  MapPin,
  Monitor,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { toast } from "sonner";
import { useLocale } from "@/src/hooks/useLocale";

interface GeographicData {
  countries: Array<{ name: string; code?: string; clicks: number }>;
  cities: Array<{ name: string; country?: string; clicks: number }>;
  totalCountries: number;
  totalCities: number;
}

interface DeviceData {
  deviceTypes: Array<{ type: string; clicks: number; percentage: number }>;
  browsers: Array<{ name: string; clicks: number; percentage: number }>;
  operatingSystems: Array<{ name: string; clicks: number; percentage: number }>;
}

interface TimeData {
  hourlyDistribution: Array<{ hour: number; clicks: number }>;
  dailyDistribution: Array<{ day: string; clicks: number }>;
  peakHour: number;
  peakDay: string;
}

interface AdvancedAnalyticsProps {
  fetchWithAuth: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>;
  currentWorkspaceId?: string;
}

const COLORS = [
  "#f97316",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

const cardClassName =
  "rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800";

const labelClassName = "text-gray-900 dark:text-slate-100";
const mutedClassName = "text-gray-500 dark:text-slate-400";

export const AdvancedAnalytics = ({
  fetchWithAuth,
  currentWorkspaceId,
}: AdvancedAnalyticsProps) => {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<"geo" | "device" | "time">(
    "geo",
  );
  const [geoData, setGeoData] = useState<GeographicData | null>(null);
  const [deviceData, setDeviceData] = useState<DeviceData | null>(null);
  const [timeData, setTimeData] = useState<TimeData | null>(null);
  const [loading, setLoading] = useState(false);

  const formatClicks = (count: number) =>
    t("analytics.advanced.common.clicks", { count });

  const tooltipFormatter = (value: number | string) => [
    formatClicks(Number(value)),
    t("analytics.advanced.common.tooltipLabel"),
  ];

  const buildWorkspaceQuery = () =>
    currentWorkspaceId
      ? `workspaceId=${encodeURIComponent(currentWorkspaceId)}`
      : "";

  const fetchGeoData = async () => {
    const query = buildWorkspaceQuery();
    const res = await fetchWithAuth(
      `/api/v1/user/analytics/geographic${query ? `?${query}` : ""}`,
    );
    setGeoData(await res.json());
  };

  const fetchDeviceData = async () => {
    const query = buildWorkspaceQuery();
    const res = await fetchWithAuth(
      `/api/v1/user/analytics/devices${query ? `?${query}` : ""}`,
    );
    setDeviceData(await res.json());
  };

  const fetchTimeData = async () => {
    const query = buildWorkspaceQuery();
    const res = await fetchWithAuth(
      `/api/v1/user/analytics/time?days=30${query ? `&${query}` : ""}`,
    );
    setTimeData(await res.json());
  };

  const exportCSV = async (format: "clicks" | "summary") => {
    try {
      const query = buildWorkspaceQuery();
      const res = await fetchWithAuth(
        `/api/v1/user/analytics/export?format=${format}${query ? `&${query}` : ""}`,
      );
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-${format}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(t("analytics.advanced.toasts.exportSuccess"));
    } catch {
      toast.error(t("analytics.advanced.toasts.exportFailed"));
    }
  };

  useEffect(() => {
    setGeoData(null);
    setDeviceData(null);
    setTimeData(null);
    setLoading(false);
  }, [currentWorkspaceId]);

  useEffect(() => {
    const run = async () => {
      try {
        if (activeTab === "geo" && !geoData) {
          setLoading(true);
          await fetchGeoData();
        } else if (activeTab === "device" && !deviceData) {
          setLoading(true);
          await fetchDeviceData();
        } else if (activeTab === "time" && !timeData) {
          setLoading(true);
          await fetchTimeData();
        }
      } catch (e) {
        console.error("Advanced analytics load failed:", e);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [activeTab, currentWorkspaceId]);

  const renderLoader = (colorClass: string) => (
    <div className="flex h-64 items-center justify-center">
      <div
        className={`h-8 w-8 animate-spin rounded-full border-4 ${colorClass}`}
      />
    </div>
  );

  const renderEmpty = (
    icon: React.ReactNode,
    message: string,
    short = false,
  ) => (
    <div
      className={`flex ${short ? "h-48" : "h-64"} flex-col items-center justify-center text-gray-400 dark:text-slate-500`}
    >
      <div className="mb-4 opacity-20">{icon}</div>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );

  const tabs = [
    { id: "geo", label: t("analytics.advanced.tabs.geo"), icon: Globe },
    {
      id: "device",
      label: t("analytics.advanced.tabs.device"),
      icon: Smartphone,
    },
    { id: "time", label: t("analytics.advanced.tabs.time"), icon: Clock },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 rounded-2xl bg-gray-100 p-1.5 dark:bg-slate-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? "bg-white text-orange-600 shadow-sm dark:bg-slate-700"
                : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => exportCSV("clicks")}
          className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-black dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          <Download size={14} />
          {t("analytics.advanced.actions.exportClicks")}
        </button>
        <button
          onClick={() => exportCSV("summary")}
          className="flex items-center gap-2 rounded-xl border-2 border-gray-200 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-gray-700 transition-all hover:border-gray-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
        >
          <Download size={14} />
          {t("analytics.advanced.actions.exportSummary")}
        </button>
      </div>

      {activeTab === "geo" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className={cardClassName}>
            <div className="mb-6 flex items-center gap-3">
              <Globe size={20} className="text-orange-500" />
              <h3 className={`text-xl font-black ${labelClassName}`}>
                {t("analytics.advanced.geo.countries")}
              </h3>
              <span className="ml-auto rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600">
                {t("analytics.advanced.geo.countriesCount", {
                  count: geoData?.totalCountries || 0,
                })}
              </span>
            </div>
            {loading ? (
              renderLoader("border-orange-200 border-t-orange-500")
            ) : geoData?.countries?.length ? (
              <>
                <div className="mb-6 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={geoData.countries.slice(0, 8)}
                        dataKey="clicks"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                      >
                        {geoData.countries.slice(0, 8).map((_, index) => (
                          <Cell
                            key={`country-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={tooltipFormatter} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {geoData.countries.slice(0, 5).map((country, idx) => (
                    <div
                      key={country.name}
                      className="flex items-center justify-between rounded-xl bg-gray-50 p-3 dark:bg-slate-900"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className={`font-bold ${labelClassName}`}>
                          {country.name}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-orange-600">
                        {formatClicks(country.clicks)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              renderEmpty(
                <Globe size={48} />,
                t("analytics.advanced.geo.countriesEmpty"),
              )
            )}
          </div>

          <div className={cardClassName}>
            <div className="mb-6 flex items-center gap-3">
              <MapPin size={20} className="text-blue-500" />
              <h3 className={`text-xl font-black ${labelClassName}`}>
                {t("analytics.advanced.geo.cities")}
              </h3>
              <span className="ml-auto rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                {t("analytics.advanced.geo.citiesCount", {
                  count: geoData?.totalCities || 0,
                })}
              </span>
            </div>
            {loading ? (
              renderLoader("border-blue-200 border-t-blue-500")
            ) : geoData?.cities?.length ? (
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {geoData.cities.slice(0, 10).map((city) => (
                  <div
                    key={`${city.name}-${city.country}`}
                    className="flex items-center justify-between rounded-xl bg-gray-50 p-3 dark:bg-slate-900"
                  >
                    <div>
                      <span className={`font-bold ${labelClassName}`}>
                        {city.name}
                      </span>
                      {city.country && (
                        <span className={`ml-2 text-xs ${mutedClassName}`}>
                          {city.country}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-blue-600">
                      {city.clicks}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              renderEmpty(
                <MapPin size={48} />,
                t("analytics.advanced.geo.citiesEmpty"),
              )
            )}
          </div>
        </div>
      )}

      {activeTab === "device" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className={cardClassName}>
            <div className="mb-6 flex items-center gap-3">
              <Smartphone size={20} className="text-green-500" />
              <h3 className={`text-lg font-black ${labelClassName}`}>
                {t("analytics.advanced.device.types")}
              </h3>
            </div>
            {loading ? (
              renderLoader("border-green-200 border-t-green-500")
            ) : deviceData?.deviceTypes?.length ? (
              <>
                <div className="mb-4 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deviceData.deviceTypes}
                        dataKey="clicks"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                      >
                        {deviceData.deviceTypes.map((_, index) => (
                          <Cell
                            key={`device-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={tooltipFormatter} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {deviceData.deviceTypes.map((device, idx) => (
                    <div
                      key={device.type}
                      className="flex items-center justify-between rounded-lg p-2"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="text-sm font-medium capitalize text-gray-700 dark:text-slate-300">
                          {device.type}
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          className={`block text-sm font-bold ${labelClassName}`}
                        >
                          {device.percentage}%
                        </span>
                        <span className={`text-xs ${mutedClassName}`}>
                          {formatClicks(device.clicks)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              renderEmpty(
                <Smartphone size={40} />,
                t("analytics.advanced.common.noData"),
                true,
              )
            )}
          </div>

          <div className={cardClassName}>
            <div className="mb-6 flex items-center gap-3">
              <Monitor size={20} className="text-purple-500" />
              <h3 className={`text-lg font-black ${labelClassName}`}>
                {t("analytics.advanced.device.browsers")}
              </h3>
            </div>
            {loading ? (
              renderLoader("border-purple-200 border-t-purple-500")
            ) : deviceData?.browsers?.length ? (
              <div className="space-y-3">
                {deviceData.browsers.slice(0, 6).map((browser, idx) => (
                  <div key={browser.name}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                        {browser.name}
                      </span>
                      <span className={`text-sm font-bold ${labelClassName}`}>
                        {browser.percentage}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-700">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${browser.percentage}%`,
                          backgroundColor: COLORS[idx % COLORS.length],
                        }}
                      />
                    </div>
                    <span className={`text-xs ${mutedClassName}`}>
                      {formatClicks(browser.clicks)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              renderEmpty(
                <Monitor size={40} />,
                t("analytics.advanced.common.noData"),
                true,
              )
            )}
          </div>

          <div className={cardClassName}>
            <div className="mb-6 flex items-center gap-3">
              <Monitor size={20} className="text-cyan-500" />
              <h3 className={`text-lg font-black ${labelClassName}`}>
                {t("analytics.advanced.device.operatingSystems")}
              </h3>
            </div>
            {loading ? (
              renderLoader("border-cyan-200 border-t-cyan-500")
            ) : deviceData?.operatingSystems?.length ? (
              <div className="space-y-3">
                {deviceData.operatingSystems.slice(0, 6).map((os, idx) => (
                  <div key={os.name}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                        {os.name}
                      </span>
                      <span className={`text-sm font-bold ${labelClassName}`}>
                        {os.percentage}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-700">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${os.percentage}%`,
                          backgroundColor: COLORS[(idx + 3) % COLORS.length],
                        }}
                      />
                    </div>
                    <span className={`text-xs ${mutedClassName}`}>
                      {formatClicks(os.clicks)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              renderEmpty(
                <Monitor size={40} />,
                t("analytics.advanced.common.noData"),
                true,
              )
            )}
          </div>
        </div>
      )}

      {activeTab === "time" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className={cardClassName}>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-orange-500" />
                <h3 className={`text-lg font-black ${labelClassName}`}>
                  {t("analytics.advanced.time.byHour")}
                </h3>
              </div>
              {timeData?.peakHour !== undefined && (
                <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600">
                  {t("analytics.advanced.common.peakHour", {
                    hour: timeData.peakHour,
                  })}
                </span>
              )}
            </div>
            {loading ? (
              renderLoader("border-orange-200 border-t-orange-500")
            ) : timeData?.hourlyDistribution?.length ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeData.hourlyDistribution}>
                    <XAxis
                      dataKey="hour"
                      tickFormatter={(hour) => `${hour}h`}
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip formatter={tooltipFormatter} />
                    <Bar dataKey="clicks" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              renderEmpty(
                <Clock size={48} />,
                t("analytics.advanced.common.noData"),
              )
            )}
          </div>

          <div className={cardClassName}>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-blue-500" />
                <h3 className={`text-lg font-black ${labelClassName}`}>
                  {t("analytics.advanced.time.byDay")}
                </h3>
              </div>
              {timeData?.peakDay && (
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                  {t("analytics.advanced.common.peakDay", {
                    day: timeData.peakDay,
                  })}
                </span>
              )}
            </div>
            {loading ? (
              renderLoader("border-blue-200 border-t-blue-500")
            ) : timeData?.dailyDistribution?.length ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeData.dailyDistribution}>
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip formatter={tooltipFormatter} />
                    <Bar dataKey="clicks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              renderEmpty(
                <Clock size={48} />,
                t("analytics.advanced.common.noData"),
              )
            )}
          </div>
        </div>
      )}

    </div>
  );
};
