import React, { useState, useEffect } from "react";
import {
  Globe,
  Smartphone,
  Clock,
  Download,
  Bell,
  ChevronDown,
  MapPin,
  Monitor,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
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
  LineChart,
  Line,
} from "recharts";
import { toast } from "sonner";

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

interface NotificationSettings {
  webhook_url?: string;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  notify_on_click: boolean;
  notify_threshold: number;
}

interface AdvancedAnalyticsProps {
  fetchWithAuth: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

const COLORS = ["#f97316", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export const AdvancedAnalytics = ({ fetchWithAuth }: AdvancedAnalyticsProps) => {
  const [activeTab, setActiveTab] = useState<"geo" | "device" | "time" | "notifications">("geo");
  const [geoData, setGeoData] = useState<GeographicData | null>(null);
  const [deviceData, setDeviceData] = useState<DeviceData | null>(null);
  const [timeData, setTimeData] = useState<TimeData | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Notification settings
  const [settings, setSettings] = useState<NotificationSettings>({
    notify_on_click: true,
    notify_threshold: 0,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [showTelegramToken, setShowTelegramToken] = useState(false);

  // Fetch geographic data
  const fetchGeoData = async () => {
    try {
      const res = await fetchWithAuth("/api/v1/user/analytics/geographic");
      const data = await res.json();
      setGeoData(data);
    } catch (e) {
      console.error("Failed to fetch geo data:", e);
    }
  };

  // Fetch device data
  const fetchDeviceData = async () => {
    try {
      const res = await fetchWithAuth("/api/v1/user/analytics/devices");
      const data = await res.json();
      setDeviceData(data);
    } catch (e) {
      console.error("Failed to fetch device data:", e);
    }
  };

  // Fetch time data
  const fetchTimeData = async () => {
    try {
      const res = await fetchWithAuth("/api/v1/user/analytics/time?days=30");
      const data = await res.json();
      setTimeData(data);
    } catch (e) {
      console.error("Failed to fetch time data:", e);
    }
  };

  // Fetch notification settings
  const fetchSettings = async () => {
    try {
      const res = await fetchWithAuth("/api/v1/user/notifications/settings");
      const data = await res.json();
      if (data) {
        setSettings(data);
      }
    } catch (e) {
      console.error("Failed to fetch settings:", e);
    }
  };

  // Save notification settings
  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetchWithAuth("/api/v1/user/notifications/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast.success("Đã lưu cài đặt thông báo!");
      } else {
        throw new Error("Failed to save");
      }
    } catch (e) {
      toast.error("Không thể lưu cài đặt. Vui lòng thử lại.");
    } finally {
      setSavingSettings(false);
    }
  };

  // Export CSV
  const exportCSV = async (format: "clicks" | "summary") => {
    try {
      const res = await fetchWithAuth(`/api/v1/user/analytics/export?format=${format}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-${format}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Đã tải xuống file CSV!");
    } catch (e) {
      toast.error("Không thể xuất dữ liệu. Vui lòng thử lại.");
    }
  };

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === "geo" && !geoData) {
      setLoading(true);
      fetchGeoData().finally(() => setLoading(false));
    } else if (activeTab === "device" && !deviceData) {
      setLoading(true);
      fetchDeviceData().finally(() => setLoading(false));
    } else if (activeTab === "time" && !timeData) {
      setLoading(true);
      fetchTimeData().finally(() => setLoading(false));
    } else if (activeTab === "notifications") {
      fetchSettings();
    }
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 rounded-2xl bg-gray-100 p-1.5">
        {[
          { id: "geo", label: "Địa lý", icon: Globe },
          { id: "device", label: "Thiết bị", icon: Smartphone },
          { id: "time", label: "Thời gian", icon: Clock },
          { id: "notifications", label: "Thông báo", icon: Bell },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? "bg-white text-orange-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Export Buttons */}
      {activeTab !== "notifications" && (
        <div className="flex gap-2">
          <button
            onClick={() => exportCSV("clicks")}
            className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-black"
          >
            <Download size={14} />
            Xuất chi tiết (CSV)
          </button>
          <button
            onClick={() => exportCSV("summary")}
            className="flex items-center gap-2 rounded-xl border-2 border-gray-200 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-gray-700 transition-all hover:border-gray-300"
          >
            <Download size={14} />
            Xuất tổng quan
          </button>
        </div>
      )}

      {/* Geographic Data */}
      {activeTab === "geo" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Countries */}
          <div className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <Globe size={20} className="text-orange-500" />
              <h3 className="text-xl font-black text-gray-900">Quốc gia</h3>
              <span className="ml-auto rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600">
                {geoData?.totalCountries || 0} quốc gia
              </span>
            </div>
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
              </div>
            ) : geoData?.countries && geoData.countries.length > 0 ? (
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
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {geoData.countries.slice(0, 5).map((country, idx) => (
                    <div key={country.name} className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="font-bold text-gray-900">{country.name}</span>
                      </div>
                      <span className="text-sm font-bold text-orange-600">{country.clicks} clicks</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center text-gray-400">
                <Globe size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-medium">Chưa có dữ liệu địa lý</p>
              </div>
            )}
          </div>

          {/* Cities */}
          <div className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <MapPin size={20} className="text-blue-500" />
              <h3 className="text-xl font-black text-gray-900">Thành phố</h3>
              <span className="ml-auto rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                {geoData?.totalCities || 0} thành phố
              </span>
            </div>
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-500" />
              </div>
            ) : geoData?.cities && geoData.cities.length > 0 ? (
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {geoData.cities.slice(0, 10).map((city) => (
                  <div key={`${city.name}-${city.country}`} className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                    <div>
                      <span className="font-bold text-gray-900">{city.name}</span>
                      {city.country && (
                        <span className="ml-2 text-xs text-gray-500">{city.country}</span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-blue-600">{city.clicks}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center text-gray-400">
                <MapPin size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-medium">Chưa có dữ liệu thành phố</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Device Data */}
      {activeTab === "device" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Device Types */}
          <div className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <Smartphone size={20} className="text-green-500" />
              <h3 className="text-lg font-black text-gray-900">Loại thiết bị</h3>
            </div>
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-200 border-t-green-500" />
              </div>
            ) : deviceData?.deviceTypes && deviceData.deviceTypes.length > 0 ? (
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
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {deviceData.deviceTypes.map((device, idx) => (
                    <div key={device.type} className="flex items-center justify-between rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="text-sm font-medium capitalize text-gray-700">{device.type}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-sm font-bold text-gray-900">{device.percentage}%</span>
                        <span className="text-xs text-gray-500">{device.clicks} clicks</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-48 flex-col items-center justify-center text-gray-400">
                <Smartphone size={40} className="mb-3 opacity-20" />
                <p className="text-sm">Chưa có dữ liệu</p>
              </div>
            )}
          </div>

          {/* Browsers */}
          <div className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <Monitor size={20} className="text-purple-500" />
              <h3 className="text-lg font-black text-gray-900">Trình duyệt</h3>
            </div>
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-500" />
              </div>
            ) : deviceData?.browsers && deviceData.browsers.length > 0 ? (
              <div className="space-y-3">
                {deviceData.browsers.slice(0, 6).map((browser, idx) => (
                  <div key={browser.name}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{browser.name}</span>
                      <span className="text-sm font-bold text-gray-900">{browser.percentage}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${browser.percentage}%`,
                          backgroundColor: COLORS[idx % COLORS.length],
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{browser.clicks} clicks</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-48 flex-col items-center justify-center text-gray-400">
                <Monitor size={40} className="mb-3 opacity-20" />
                <p className="text-sm">Chưa có dữ liệu</p>
              </div>
            )}
          </div>

          {/* Operating Systems */}
          <div className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <Monitor size={20} className="text-cyan-500" />
              <h3 className="text-lg font-black text-gray-900">Hệ điều hành</h3>
            </div>
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-500" />
              </div>
            ) : deviceData?.operatingSystems && deviceData.operatingSystems.length > 0 ? (
              <div className="space-y-3">
                {deviceData.operatingSystems.slice(0, 6).map((os, idx) => (
                  <div key={os.name}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{os.name}</span>
                      <span className="text-sm font-bold text-gray-900">{os.percentage}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${os.percentage}%`,
                          backgroundColor: COLORS[(idx + 3) % COLORS.length],
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{os.clicks} clicks</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-48 flex-col items-center justify-center text-gray-400">
                <Monitor size={40} className="mb-3 opacity-20" />
                <p className="text-sm">Chưa có dữ liệu</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Time Data */}
      {activeTab === "time" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Hourly Distribution */}
          <div className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-orange-500" />
                <h3 className="text-lg font-black text-gray-900">Phân bố theo giờ</h3>
              </div>
              {timeData?.peakHour !== undefined && (
                <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600">
                  Peak: {timeData.peakHour}:00
                </span>
              )}
            </div>
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
              </div>
            ) : timeData?.hourlyDistribution && timeData.hourlyDistribution.length > 0 ? (
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
                    <Tooltip formatter={(value) => [`${value} clicks`, "Clicks"]} />
                    <Bar dataKey="clicks" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center text-gray-400">
                <Clock size={48} className="mb-4 opacity-20" />
                <p className="text-sm">Chưa có dữ liệu</p>
              </div>
            )}
          </div>

          {/* Daily Distribution */}
          <div className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-blue-500" />
                <h3 className="text-lg font-black text-gray-900">Phân bố theo ngày</h3>
              </div>
              {timeData?.peakDay && (
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                  Peak: {timeData.peakDay}
                </span>
              )}
            </div>
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-500" />
              </div>
            ) : timeData?.dailyDistribution && timeData.dailyDistribution.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeData.dailyDistribution}>
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip formatter={(value) => [`${value} clicks`, "Clicks"]} />
                    <Bar dataKey="clicks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center text-gray-400">
                <Clock size={48} className="mb-4 opacity-20" />
                <p className="text-sm">Chưa có dữ liệu</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notifications Settings */}
      {activeTab === "notifications" && (
        <div className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm">
          <div className="mb-8 flex items-center gap-3">
            <Bell size={20} className="text-orange-500" />
            <h3 className="text-xl font-black text-gray-900">Cài đặt thông báo</h3>
          </div>

          <div className="space-y-6">
            {/* Enable notifications */}
            <div className="flex items-center justify-between rounded-2xl border border-gray-100 p-4">
              <div>
                <h4 className="font-bold text-gray-900">Thông báo khi có click</h4>
                <p className="text-sm text-gray-500">Nhận thông báo qua Webhook hoặc Telegram</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, notify_on_click: !settings.notify_on_click })}
                className={`relative h-7 w-12 rounded-full transition-colors ${
                  settings.notify_on_click ? "bg-orange-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
                    settings.notify_on_click ? "left-[26px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            {/* Threshold */}
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">
                Ngưỡng thông báo (0 = mọi click)
              </label>
              <input
                type="number"
                min={0}
                value={settings.notify_threshold}
                onChange={(e) => setSettings({ ...settings, notify_threshold: parseInt(e.target.value) || 0 })}
                className="w-full rounded-xl border-2 border-gray-100 px-4 py-3 font-medium outline-none transition-all focus:border-orange-500"
                placeholder="Ví dụ: 10 (thông báo mỗi 10 click)"
              />
              <p className="mt-1 text-xs text-gray-500">
                Đặt 0 để nhận thông báo cho mọi click, hoặc N để nhận thông báo mỗi N clicks
              </p>
            </div>

            {/* Webhook URL */}
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">Webhook URL</label>
              <input
                type="url"
                value={settings.webhook_url || ""}
                onChange={(e) => setSettings({ ...settings, webhook_url: e.target.value })}
                className="w-full rounded-xl border-2 border-gray-100 px-4 py-3 font-medium outline-none transition-all focus:border-orange-500"
                placeholder="https://your-webhook-endpoint.com/webhook"
              />
              <p className="mt-1 text-xs text-gray-500">
                URL sẽ nhận POST request khi có click mới
              </p>
            </div>

            {/* Telegram Settings */}
            <div className="rounded-2xl bg-gray-50 p-6">
              <h4 className="mb-4 font-bold text-gray-900">Cài đặt Telegram Bot</h4>
              
              <div className="mb-4">
                <label className="mb-2 block text-sm font-bold text-gray-700">Bot Token</label>
                <div className="relative">
                  <input
                    type={showTelegramToken ? "text" : "password"}
                    value={settings.telegram_bot_token || ""}
                    onChange={(e) => setSettings({ ...settings, telegram_bot_token: e.target.value })}
                    className="w-full rounded-xl border-2 border-gray-100 px-4 py-3 pr-12 font-medium outline-none transition-all focus:border-orange-500"
                    placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTelegramToken(!showTelegramToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showTelegramToken ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">Chat ID</label>
                <input
                  type="text"
                  value={settings.telegram_chat_id || ""}
                  onChange={(e) => setSettings({ ...settings, telegram_chat_id: e.target.value })}
                  className="w-full rounded-xl border-2 border-gray-100 px-4 py-3 font-medium outline-none transition-all focus:border-orange-500"
                  placeholder="123456789 hoặc @channelusername"
                />
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={saveSettings}
              disabled={savingSettings}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-4 font-black uppercase tracking-widest text-white transition-all hover:bg-orange-700 disabled:opacity-50"
            >
              {savingSettings ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Check size={18} />
                  Lưu cài đặt
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
