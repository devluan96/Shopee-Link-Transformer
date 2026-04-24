import React, { useState, useEffect, useRef, Suspense, lazy } from "react";
import { Zap, Clock, Menu } from "lucide-react";
import {
  supabase,
  logout,
  registerWithEmail,
  loginWithEmail,
  clearStoredSession,
} from "./lib/supabase";
import { Session, User } from "@supabase/supabase-js";

// --- Types ---
import { Toaster, toast } from "sonner";
import {
  AnalyticsData,
  ConvertedLink,
  UserProfile,
  Tab,
  LinkStats,
} from "./types";
import { normalizeVietnameseSlug } from "./lib/utils";

// --- Static Components ---
import { Sidebar } from "./components/layout/Sidebar";
import { AuthScreen } from "./components/auth/AuthScreen";
import { PendingApproval } from "./components/PendingApproval";
import { Footer } from "./components/layout/Footer";

// --- Lazy Loaded Components ---
const Pricing = lazy(() =>
  import("./components/Pricing").then((m) => ({ default: m.Pricing })),
);
const AdminPanel = lazy(() =>
  import("./components/admin/AdminPanel").then((m) => ({
    default: m.AdminPanel,
  })),
);
const Overview = lazy(() =>
  import("./components/dashboard/Overview").then((m) => ({
    default: m.Overview,
  })),
);
const Analytics = lazy(() =>
  import("./components/dashboard/Analytics").then((m) => ({
    default: m.Analytics,
  })),
);
const CreateLink = lazy(() =>
  import("./components/links/CreateLink").then((m) => ({
    default: m.CreateLink,
  })),
);
const LinkList = lazy(() =>
  import("./components/links/LinkList").then((m) => ({ default: m.LinkList })),
);
const ProfileSettings = lazy(() =>
  import("./components/profile/ProfileSettings").then((m) => ({
    default: m.ProfileSettings,
  })),
);

// Loading Component for Lazy Loading
const TabLoading = () => (
  <div className="flex items-center justify-center min-h-100">
    <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
  </div>
);

const MAX_SHORT_CODE_LENGTH = 50;

interface CloudinarySignedUpload {
  cloudName: string;
  apiKey: string;
  folder: string;
  timestamp: number;
  signature: string;
}

const SITE_URL = "https://hotsnew.click";
const DEFAULT_APP_TITLE =
  "HotsNew Click - Tạo Landing Page Rút Gọn Link Shopee";
const DEFAULT_APP_DESCRIPTION =
  "HotsNew Click giúp tạo landing page trung gian cho link Shopee với tiêu đề, mô tả, ảnh, video và thống kê click tối ưu cho chia sẻ mạng xã hội.";

const upsertMetaTag = (
  selector: string,
  attributeName: "name" | "property",
  attributeValue: string,
  content: string,
) => {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attributeName, attributeValue);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
};

const upsertCanonicalLink = (href: string) => {
  let link = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Email Auth State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // Create Link State
  const [url, setUrl] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customShortCode, setCustomShortCode] = useState("");
  const [usageContext, setUsageContext] = useState("");
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUploadSuccess, setVideoUploadSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // List State
  const [links, setLinks] = useState<ConvertedLink[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    history: [],
    topLinks: [],
    trafficSources: [],
    growthPercentage: 0,
  });
  const [listLoading, setListLoading] = useState(false);
  const [linksDirty, setLinksDirty] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Admin State
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminDirty, setAdminDirty] = useState(true);

  // Global Copied State
  const [profileLoading, setProfileLoading] = useState(false);
  const [checkoutLoadingPlan, setCheckoutLoadingPlan] = useState<
    "monthly" | "yearly" | null
  >(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [stats, setStats] = useState<LinkStats>({
    totalLinks: 0,
    totalClicks: 0,
    recentClicks: [],
    topLinks: [],
    growthPercentage: 0,
  });
  const videoInputRef = useRef<HTMLInputElement>(null);
  const isLoggingOutRef = useRef(false);
  const sessionRef = useRef<Session | null>(null);

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const tabParam = currentUrl.searchParams.get("tab");

    if (
      tabParam === "dashboard" ||
      tabParam === "pricing" ||
      tabParam === "create" ||
      tabParam === "list" ||
      tabParam === "analytics" ||
      tabParam === "admin" ||
      tabParam === "profile"
    ) {
      setActiveTab(tabParam);
    }

    if (currentUrl.searchParams.has("logout")) {
      currentUrl.searchParams.delete("logout");
      window.history.replaceState(
        {},
        document.title,
        `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`,
      );
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    const isAuthenticatedArea = Boolean(user);
    const titleMap: Record<Tab, string> = {
      dashboard: "Bảng điều khiển - HotsNew Click",
      pricing: "Bảng giá - HotsNew Click",
      create: "Tạo link Shopee - HotsNew Click",
      list: "Danh sách link - HotsNew Click",
      analytics: "Phân tích dữ liệu - HotsNew Click",
      admin: "Quản lý user - HotsNew Click",
      profile: "Hồ sơ cá nhân - HotsNew Click",
    };
    const descriptionMap: Record<Tab, string> = {
      dashboard:
        "Theo dõi nhanh hiệu suất link, lượt click và tăng trưởng chiến dịch trên HotsNew Click.",
      pricing:
        "Xem bảng giá và nâng cấp gói dịch vụ để tạo landing page Shopee chuyên nghiệp hơn.",
      create:
        "Tạo landing page rút gọn cho link Shopee với tiêu đề, mô tả, ảnh và video tùy chỉnh.",
      list: "Quản lý toàn bộ link Shopee đã tạo, chỉnh sửa nội dung và theo dõi hiệu quả.",
      analytics:
        "Phân tích lượt click, tăng trưởng và nguồn lưu lượng cho các link Shopee của bạn.",
      admin: "Trang quản trị người dùng và gói dịch vụ trên HotsNew Click.",
      profile:
        "Cập nhật thông tin hồ sơ và trạng thái tài khoản HotsNew Click.",
    };

    const nextTitle = isAuthenticatedArea
      ? titleMap[activeTab]
      : DEFAULT_APP_TITLE;
    const nextDescription = isAuthenticatedArea
      ? descriptionMap[activeTab]
      : DEFAULT_APP_DESCRIPTION;
    const canonicalHref = isAuthenticatedArea
      ? `${SITE_URL}/?tab=${activeTab}`
      : `${SITE_URL}/`;
    const robotsContent = isAuthenticatedArea
      ? "noindex, nofollow"
      : "index, follow";

    document.title = nextTitle;
    upsertMetaTag(
      'meta[name="description"]',
      "name",
      "description",
      nextDescription,
    );
    upsertMetaTag(
      'meta[property="og:title"]',
      "property",
      "og:title",
      nextTitle,
    );
    upsertMetaTag(
      'meta[property="og:description"]',
      "property",
      "og:description",
      nextDescription,
    );
    upsertMetaTag(
      'meta[property="og:url"]',
      "property",
      "og:url",
      canonicalHref,
    );
    upsertMetaTag(
      'meta[name="twitter:title"]',
      "name",
      "twitter:title",
      nextTitle,
    );
    upsertMetaTag(
      'meta[name="twitter:description"]',
      "name",
      "twitter:description",
      nextDescription,
    );
    upsertMetaTag('meta[name="robots"]', "name", "robots", robotsContent);
    upsertMetaTag('meta[name="googlebot"]', "name", "googlebot", robotsContent);
    upsertCanonicalLink(canonicalHref);
  }, [authLoading, user, activeTab]);

  // Check API Accessibility
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const apiBase = "/api";
    console.log("🔍 Diagnostic Info:", {
      href: window.location.href,
      origin: window.location.origin,
      pathname: window.location.pathname,
    });

    fetch(`${apiBase}/health`, {
      headers: { Accept: "application/json" },
    })
      .then(async (r) => {
        const text = await r.text();
        try {
          const json = JSON.parse(text);
          console.log("✅ API Health:", json);
        } catch (e) {
          console.error(
            "❌ API Reachability issue (Not JSON):",
            text.substring(0, 200),
          );
        }
      })
      .catch((e) => console.error("❌ API Reachability issue (Network):", e));
  }, []);

  // Fetch Analytics
  useEffect(() => {
    window.onerror = (message, source, lineno, colno, error) => {
      console.error(
        "🔴 [Global Error]:",
        message,
        "at",
        source,
        ":",
        lineno,
        ":",
        colno,
        error,
      );
    };
    window.onunhandledrejection = (event) => {
      console.error("🟠 [Unhandled Rejection]:", event.reason);
    };
  }, []);

  const getAccessToken = async () => {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const cachedSession = sessionRef.current;

    if (cachedSession?.access_token) {
      const expiresAt = cachedSession.expires_at ?? 0;
      if (expiresAt - nowInSeconds > 60) {
        return cachedSession.access_token;
      }
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    sessionRef.current = session ?? null;
    if (session?.access_token) {
      const expiresAt = session.expires_at ?? 0;
      if (expiresAt - nowInSeconds > 60) {
        return session.access_token;
      }
    }

    const { data: refreshed, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error("[Auth] refreshSession failed:", error);
      return null;
    }

    sessionRef.current = refreshed.session ?? null;
    return refreshed.session?.access_token ?? null;
  };

  const fetchWithAuth = async (
    input: RequestInfo | URL,
    init: RequestInit = {},
  ) => {
    const token = await getAccessToken();
    if (!token) {
      throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }

    const headers = new Headers(init.headers ?? {});
    headers.set("Authorization", `Bearer ${token}`);

    if (
      !(init.body instanceof FormData) &&
      init.body &&
      !headers.has("Content-Type")
    ) {
      headers.set("Content-Type", "application/json");
    }

    let response = await fetch(input, {
      ...init,
      headers,
    });

    if (response.status === 401) {
      const { data: refreshed, error: refreshError } =
        await supabase.auth.refreshSession();
      const refreshedToken = refreshed.session?.access_token;

      if (!refreshError && refreshedToken) {
        headers.set("Authorization", `Bearer ${refreshedToken}`);
        response = await fetch(input, {
          ...init,
          headers,
        });
      }
    }

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      const contentType = response.headers.get("content-type") ?? "";

      if (contentType.includes("application/json")) {
        const errorData = await response.json().catch(() => null);
        errorMessage = errorData?.error || errorData?.message || errorMessage;
      } else {
        const text = await response.text().catch(() => "");
        if (text) errorMessage = text;
      }

      if (response.status === 401) {
        clearStoredSession();
        sessionRef.current = null;
        setUser(null);
        setProfile(null);
        setAuthLoading(false);
      }

      const error = new Error(errorMessage) as Error & { status?: number };
      error.status = response.status;
      throw error;
    }

    return response;
  };

  const fetchAnalytics = async () => {
    if (!user) return;
    try {
      console.log("📡 Fetching analytics for user:", user.id);
      const res = await fetchWithAuth("/api/v1/user/analytics");
      const data = await res.json();
      console.log("📊 Analytics data received:", data);
      setAnalyticsData(data);
    } catch (e: any) {
      console.error("Fetch analytics fail:", e?.message || e);
      toast.error("Không thể tải dữ liệu phân tích. Vui lòng thử lại sau.");
    }
  };

  useEffect(() => {
    if (activeTab === "analytics") {
      console.log("📊 Active tab changed to analytics, fetching...");
      fetchAnalytics();
    }
  }, [activeTab, user]);

  useEffect(() => {
    let profileChannel: any = null;
    const shouldRetryProfileFetch = (err: unknown) => {
      if (!navigator.onLine) return false;
      if (err instanceof TypeError) return true;
      const status =
        typeof err === "object" && err !== null
          ? (err as { status?: number }).status
          : undefined;
      return (
        status === 408 ||
        status === 425 ||
        status === 429 ||
        (typeof status === "number" && status >= 500)
      );
    };

    const checkInitialSession = async () => {
      console.log("🔍 [Listener] Running explicit session check...");
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        sessionRef.current = session ?? null;
        if (session?.user) {
          console.log(
            "✅ [Listener] Initial session found via getSession:",
            session.user.id,
          );
          setUser(session.user);
        }
      } catch (err) {
        console.error("❌ [Listener] Initial session check error:", err);
      }
    };

    // Auth Listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        "🔄 [Listener] Auth State Changed:",
        event,
        "User present:",
        !!session?.user,
      );

      sessionRef.current = session ?? null;
      if (event === "INITIAL_SESSION" && !session) {
        setUser(null);
        setProfile(null);
        setAuthLoading(false);
        return;
        console.log("ℹ️ [Listener] No initial session found.");
      }

      if (event === "SIGNED_OUT") {
        isLoggingOutRef.current = false;
        sessionRef.current = null;
        setUser(null);
        setProfile(null);
        setLinks([]);
        setLinksDirty(true);
        setAllUsers([]);
        setAdminDirty(true);
        setActiveTab("dashboard");
        setIsSidebarOpen(false);
        setAuthLoading(false);
        return;
      }

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        try {
          // 🔍 Fetch existing profile carefully via proxy with retries
          let existingProfile = null;
          const fetchWithRetry = async (
            url: string,
            retries = 3,
            delay = 1000,
          ): Promise<any> => {
            for (let i = 0; i < retries; i++) {
              try {
                const res = await fetchWithAuth(url);
                if (res.ok) return await res.json();
                if (res.status === 404) return null; // No profile yet
              } catch (err) {
                if (i === retries - 1 || !shouldRetryProfileFetch(err))
                  throw err;
                console.warn(
                  `⏳ Fetch failed, retrying in ${delay}ms... (${i + 1}/${retries})`,
                );
                await new Promise((r) => setTimeout(r, delay));
              }
            }
          };

          try {
            const profileUrl = `${window.location.origin}/api/v1/user/profile`;
            console.log("📡 Fetching profile via:", profileUrl);
            existingProfile = await fetchWithRetry(profileUrl);
            if (existingProfile) console.log("✅ Profile fetch success");
          } catch (fetchError: any) {
            console.error("❌ Error fetching profile via proxy:", fetchError);
            // Fallback to client-side fetch if proxy fails (though RLS might be an issue)
            try {
              const { data } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", currentUser.id)
                .maybeSingle();
              if (data) existingProfile = data;
            } catch (fallbackError) {
              console.error("❌ Fallback profile fetch also failed");
            }
          }

          if (!existingProfile) {
            console.log(
              "📝 Profile not found in DB. Creating initial record...",
            );

            // Generate standard defaults
            const defaultName =
              currentUser.user_metadata?.full_name ||
              currentUser.email?.split("@")[0] ||
              "User";
            const defaultAvatar =
              currentUser.user_metadata?.avatar_url ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.id}`;

            // Use server update proxy to insert initial data securely
            const insertRes = await fetchWithAuth(
              "/api/v1/user/profile/update",
              {
                method: "POST",
                body: JSON.stringify({
                  full_name: defaultName,
                  avatar_url: defaultAvatar,
                }),
              },
            );
            const newProfile = await insertRes.json();
            setProfile(newProfile as UserProfile);
          } else {
            console.log(
              "✅ Profile found and loaded:",
              existingProfile.full_name,
            );
            setProfile(existingProfile as UserProfile);
          }

          // Realtime Listener
          if (profileChannel) supabase.removeChannel(profileChannel);
          profileChannel = supabase
            .channel(`profile-${currentUser.id}`)
            .on(
              "postgres_changes",
              {
                event: "UPDATE",
                schema: "public",
                table: "profiles",
                filter: `id=eq.${currentUser.id}`,
              },
              (payload) => {
                console.log("🔔 Profile updated via Realtime:", payload.new);
                setProfile(payload.new as UserProfile);
              },
            )
            .subscribe();
        } catch (e) {
          console.error("Profile sync error:", e);
        } finally {
          setAuthLoading(false);
        }
      } else {
        isLoggingOutRef.current = false;
        setProfile(null);
        setLinks([]);
        setLinksDirty(true);
        setAllUsers([]);
        setAdminDirty(true);
        if (profileChannel) {
          supabase.removeChannel(profileChannel);
          profileChannel = null;
        }
        setAuthLoading(false);
      }
    });

    // Safety timeout: stop loading if no event fired in 5s
    const timer = setTimeout(() => {
      setAuthLoading((prev) => {
        if (prev) console.warn("⚠️ Auth loading safety timeout triggered");
        return false;
      });
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
      if (profileChannel) supabase.removeChannel(profileChannel);
    };
  }, []);

  useEffect(() => {
    if (isLoggingOutRef.current && authLoading) {
      setAuthLoading(false);
    }
  }, [authLoading]);

  // Sync Tabs based on Admin
  useEffect(() => {
    const isAdminRole =
      profile?.role === "admin" || user?.email === "devluan1996@gmail.com";
    if (activeTab === "admin" && !isAdminRole) {
      setActiveTab("dashboard");
    }
  }, [profile, user, activeTab]);

  // Fetch Data
  useEffect(() => {
    const isAdminRole =
      profile?.role === "admin" || user?.email === "devluan1996@gmail.com";
    const isApproved = profile?.status === "approved" || isAdminRole;

    if (user && isApproved) {
      if (activeTab === "list" && (linksDirty || links.length === 0)) {
        fetchLinks();
      }
      if (activeTab === "dashboard") fetchStats();
      if (
        activeTab === "admin" &&
        isAdminRole &&
        (adminDirty || allUsers.length === 0)
      ) {
        fetchAllUsers();
      }
    }
  }, [
    user,
    profile,
    activeTab,
    linksDirty,
    links.length,
    adminDirty,
    allUsers.length,
  ]);

  useEffect(() => {
    const isAdminRole =
      profile?.role === "admin" || user?.email === "devluan1996@gmail.com";
    const isApproved = profile?.status === "approved" || isAdminRole;

    if (!(user && isApproved && activeTab === "list")) {
      return;
    }

    const intervalId = window.setInterval(() => {
      fetchLinks();
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [user, profile, activeTab]);

  const fetchStats = async () => {
    if (!user) return;
    try {
      const response = await fetchWithAuth("/api/v1/user/stats");
      const data = await response.json();
      setStats(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLinks = async () => {
    if (!user) return;
    setListLoading(true);
    try {
      const response = await fetchWithAuth("/api/v1/user/links");
      const data = await response.json();
      setLinks(data);
      setLinksDirty(false);
    } catch (e) {
      console.error(e);
    } finally {
      setListLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    if (!user) return;
    setAdminLoading(true);
    try {
      const response = await fetchWithAuth("/api/v1/admin/users");
      const data = await response.json();
      setAllUsers(data);
      setAdminDirty(false);
    } catch (e) {
      console.error(e);
    } finally {
      setAdminLoading(false);
    }
  };

  const getCloudinarySignedUpload =
    async (): Promise<CloudinarySignedUpload> => {
      const response = await fetchWithAuth("/api/v1/cloudinary/sign-upload", {
        method: "POST",
        body: JSON.stringify({}),
      });

      return response.json();
    };

  const uploadAssetToCloudinary = async (
    file: Blob | File,
    resourceType: "image" | "video" | "auto" = "auto",
    fileName?: string,
  ) => {
    const signedUpload = await getCloudinarySignedUpload();
    const uploadFormData = new FormData();

    uploadFormData.append("file", file, fileName);
    uploadFormData.append("api_key", signedUpload.apiKey);
    uploadFormData.append("timestamp", String(signedUpload.timestamp));
    uploadFormData.append("signature", signedUpload.signature);
    uploadFormData.append("folder", signedUpload.folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${signedUpload.cloudName}/${resourceType}/upload`,
      {
        method: "POST",
        body: uploadFormData,
      },
    );

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.secure_url) {
      throw new Error(
        data?.error?.message ||
          data?.message ||
          `Cloudinary upload failed (${response.status})`,
      );
    }

    return data.secure_url as string;
  };

  const refreshCurrentProfile = async () => {
    if (!user) return null;

    const response = await fetchWithAuth("/api/v1/user/profile");
    const data = await response.json();

    if (data && !data.is_new) {
      setProfile(data as UserProfile);
      return data as UserProfile;
    }

    return null;
  };

  const handleApproveUser = async (
    targetUid: string,
    status: boolean = true,
  ) => {
    if (!user) return;
    try {
      const response = await fetchWithAuth(
        `/api/v1/admin/users/${targetUid}/approve`,
        {
          method: "POST",
          body: JSON.stringify({ isApproved: status }),
        },
      );
      if (response.ok) {
        fetchAllUsers();
        toast.success(
          status ? "Đã duyệt người dùng!" : "Đã hủy duyệt người dùng!",
        );
      } else {
        toast.error("Lỗi khi cập nhật trạng thái duyệt");
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi hệ thống");
    }
  };

  const handleUpdateSubscription = async (
    targetUid: string,
    plan: "free" | "monthly" | "yearly",
  ) => {
    if (!user) return;
    try {
      // Calculate expiry
      let expiry = null;
      if (plan === "monthly") {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        expiry = d.toISOString();
      } else if (plan === "yearly") {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 1);
        expiry = d.toISOString();
      }

      const response = await fetchWithAuth(
        `/api/v1/admin/users/${targetUid}/subscription`,
        {
          method: "POST",
          body: JSON.stringify({ plan, expiry }),
        },
      );
      if (response.ok) {
        fetchAllUsers();
        toast.success(`Đã cập nhật gói ${plan.toUpperCase()} thành công!`);
      } else {
        toast.error("Không thể cập nhật gói cước");
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi hệ thống khi cập nhật gói");
    }
  };

  const handleDeleteUser = async (targetUid: string) => {
    if (!user) return;
    try {
      const response = await fetchWithAuth(`/api/v1/admin/users/${targetUid}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchAllUsers();
        toast.success("Đã xóa người dùng và dữ liệu liên quan thành công!");
      } else {
        toast.error("Lỗi khi xóa người dùng");
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi kết nối máy chủ khi xóa");
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("🎬 Video input change detected:", file?.name, file?.size);
    if (!file) return;

    if (!canAccessCreate) {
      toast.error(
        "Vui lòng nâng cấp tài khoản để sử dụng tính năng upload video!",
      );
      e.target.value = ""; // Reset input
      return;
    }

    setUploadingVideo(true);
    setError(null);

    try {
      let pendingThumbUrl: string | null = null;
      try {
        pendingThumbUrl = await captureVideoThumbnail(file);
      } catch (thumbError) {
        console.error("Local thumbnail capture failed", thumbError);
      }

      const secureUrl = await uploadAssetToCloudinary(file, "video", file.name);
      console.log("✅ Upload Success Data:", secureUrl);
      if (secureUrl) {
        setVideoUrl(secureUrl);
        setVideoUploadSuccess(true);
        setTimeout(() => setVideoUploadSuccess(false), 5000);
        setError(null);

        if (pendingThumbUrl) {
          setCustomImageUrl(pendingThumbUrl);
        }
      }
    } catch (err: any) {
      console.error("Video upload failed", err);
      setError(`Lỗi tải video: ${err.message || "Không xác định"}`);
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOutRef.current) return;

    isLoggingOutRef.current = true;
    setIsSidebarOpen(false);
    setActiveTab("dashboard");
    setAuthError(null);
    setUser(null);
    setProfile(null);
    setLinks([]);
    setAllUsers([]);
    setStats({
      totalLinks: 0,
      totalClicks: 0,
      recentClicks: [],
      topLinks: [],
      growthPercentage: 0,
    });
    setAnalyticsData({
      history: [],
      topLinks: [],
      trafficSources: [],
      growthPercentage: 0,
    });
    setListLoading(false);
    setLinksDirty(true);
    setAdminDirty(true);
    setAdminLoading(false);
    setProfileLoading(false);

    try {
      setAuthLoading(false);
      console.log("🚪 [Auth] Logging out...");

      // Aggressive logout
      await logout();
      clearStoredSession();

      // Clear all local states
      setUser(null);
      setProfile(null);

      // Clear browser storage to ensure no stale tokens

      console.log("🔄 [Auth] Redirecting after logout...");
      console.log("[Auth] Logout completed.");
    } catch (e) {
      console.error("Logout error:", e);
      clearStoredSession();
      setUser(null);
      setProfile(null);
    } finally {
      setAuthLoading(false);
      isLoggingOutRef.current = false;
    }
  };

  const captureVideoThumbnail = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      const objectUrl = URL.createObjectURL(file);
      video.src = objectUrl;
      video.muted = true;
      video.playsInline = true;
      video.preload = "metadata";

      const cleanup = () => {
        URL.revokeObjectURL(objectUrl);
        video.removeAttribute("src");
        video.load();
      };

      video.onloadedmetadata = () => {
        const duration = Number.isFinite(video.duration) ? video.duration : 0;
        const targetTime =
          duration > 0 ? Math.min(Math.max(duration * 0.2, 0.2), 2) : 0.2;
        video.currentTime = targetTime;
      };

      video.onseeked = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          cleanup();
          return reject("No context");
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          async (blob) => {
            if (!blob) {
              cleanup();
              return reject("Blob failed");
            }
            try {
              const data = await uploadAssetToCloudinary(
                blob,
                "image",
                "thumb.jpg",
              );
              cleanup();
              resolve(data);
            } catch (e) {
              cleanup();
              reject(e);
            }
          },
          "image/jpeg",
          0.85,
        );
      };

      video.onerror = (e) => {
        cleanup();
        reject(e);
      };
      video.load();
    });
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !user) return;

    if (!canAccessCreate) {
      toast.error("Vui lòng nâng cấp tài khoản để sử dụng tính năng tạo link!");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const normalizedShortCode = customShortCode
        ? normalizeVietnameseSlug(customShortCode)
        : "";

      if (normalizedShortCode.length > MAX_SHORT_CODE_LENGTH) {
        throw new Error(
          `Mã rút gọn không được vượt quá ${MAX_SHORT_CODE_LENGTH} ký tự.`,
        );
      }

      const response = await fetchWithAuth("/api/v1/convert", {
        method: "POST",
        body: JSON.stringify({
          url: url.trim(),
          customShortCode,
          customTitle,
          customDescription,
          usageContext,
          customImageUrl,
          videoUrl,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Conversion failed");

      const nextResult = {
        ...data,
        short_code: data.short_code ?? data.shortCode,
      };

      setResult(nextResult);
      toast.success(
        `Rút gọn link thành công: https://hotsnew.click/s/${nextResult.short_code}`,
      );
      setLinksDirty(true);
      if (activeTab === "dashboard") fetchStats();
      // Clear inputs
      // setUrl(''); setCustomTitle(''); setCustomDescription(''); setCustomImageUrl(''); setVideoUrl('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLink = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/v1/user/links/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setLinks((prev) => prev.filter((l) => l.id !== id));
      setLinksDirty(false);
      toast.success("Đã xóa link thành công!");
    } catch (e: any) {
      toast.error("Lỗi khi xóa link: " + e.message);
    }
  };

  const handleUpdateLink = async (id: string, data: Partial<ConvertedLink>) => {
    try {
      const res = await fetchWithAuth(`/api/v1/user/links/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Update failed");
      const updated = await res.json();
      // Update links list with click count preserved
      setLinks((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ...updated } : l)),
      );
      setLinksDirty(false);
      toast.success("Đã cập nhật link thành công!");
    } catch (e: any) {
      toast.error("Lỗi khi cập nhật link: " + e.message);
    }
  };

  const handleCreateZaloPayOrder = async (plan: "monthly" | "yearly") => {
    setCheckoutLoadingPlan(plan);
    try {
      const res = await fetchWithAuth("/api/v1/billing/zalopay/create-order", {
        method: "POST",
        body: JSON.stringify({ plan }),
      });
      const resultData = await res.json();

      if (!res.ok) {
        throw new Error(resultData.error || "Khong the tao don thanh toan");
      }

      if (!resultData.order_url) {
        throw new Error("ZaloPay khong tra ve link thanh toan");
      }

      window.location.href = resultData.order_url;
    } catch (e: any) {
      toast.error(e.message || "Loi khi khoi tao thanh toan ZaloPay");
      setCheckoutLoadingPlan(null);
    }
  };

  const handleCheckZaloPayStatus = async (appTransId: string) => {
    try {
      const res = await fetchWithAuth(
        `/api/v1/billing/zalopay/status/${encodeURIComponent(appTransId)}`,
      );
      const resultData = await res.json();

      if (!res.ok) {
        throw new Error(
          resultData.error || "Khong the kiem tra trang thai thanh toan",
        );
      }

      if (resultData.paid) {
        await refreshCurrentProfile();
        toast.success("Thanh toan thanh cong. Goi dich vu da duoc kich hoat.");
        return { paid: true, processing: false };
      }

      if (resultData.processing) {
        toast.message(
          "Giao dich dang duoc xu ly. Vui long doi it phut roi kiem tra lai.",
        );
        return { paid: false, processing: true };
      }

      toast.error("Thanh toan chua hoan tat hoac da that bai.");
      return { paid: false, processing: false };
    } catch (e: any) {
      toast.error(e.message || "Khong the kiem tra giao dich ZaloPay");
      return { paid: false, processing: false };
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) {
      console.error("❌ Avatar upload failed: No authenticated user found");
      return null;
    }

    try {
      console.log("🚀 Starting Server-side Avatar upload proxy...");

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetchWithAuth("/api/v1/upload-avatar", {
        method: "POST",
        body: formData,
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error(
          "❌ Server returned non-JSON response:",
          text.slice(0, 500),
        );
        throw new Error(
          `Server returned ${res.status} ${res.statusText}. Check console for details.`,
        );
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Server upload failed");
      }

      console.log("🔗 Proxy Upload Result:", data.secure_url);
      return data.secure_url;
    } catch (e: any) {
      console.error("❌ Proxy Avatar upload catch:", e);
      alert("Lỗi tải ảnh qua Server: " + (e.message || "Lỗi không xác định"));
      return null;
    }
  };

  const handleUpdateProfile = async (data: {
    full_name: string;
    avatar_url: string;
  }) => {
    if (!user) {
      toast.error("Bạn chưa đăng nhập!");
      return;
    }

    setProfileLoading(true);
    try {
      const res = await fetchWithAuth("/api/v1/user/profile/update", {
        method: "POST",
        body: JSON.stringify({
          full_name: data.full_name,
          avatar_url: data.avatar_url,
        }),
      });

      const resultData = await res.json();

      if (!res.ok) {
        throw new Error(resultData.error || "Lỗi cập nhật hồ sơ");
      }

      setProfile(resultData as UserProfile);
      toast.success("Cập nhật thông tin thành công!");
    } catch (e: any) {
      toast.error(e.message || "Lỗi hệ thống");
    } finally {
      setProfileLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        <div className="text-gray-400 font-bold uppercase tracking-widest text-[10px] animate-pulse">
          Đang khởi tạo hệ thống...
        </div>
      </div>
    );
  }

  if (!user) {
    const handleEmailAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      if (loading) return;

      console.log("🚀 [Auth] Starting login attempt for:", email);
      setAuthError(null);
      setAuthNotice(null);
      setLoading(true);

      // Safety timeout for the spinner
      const safetyTimer = setTimeout(() => {
        setLoading((prev) => {
          if (prev) {
            console.warn("⚠️ [Auth] Login taking too long, resetting spinner");
            return false;
          }
          return prev;
        });
      }, 15000);

      try {
        if (isRegistering) {
          console.log("[Auth] Calling registerWithEmail...");
          const user = await registerWithEmail(email, password);
          console.log("[Auth] Register success:", user?.id);
          const existingAccount = user?.identities?.length === 0;
          if (existingAccount) {
            toast.error(
              "Tài khoản đã tồn tại. Vui lòng đăng nhập hoặc dùng email khác.",
            );
            setAuthError(
              "Email này đã được sử dụng. Hãy đăng nhập hoặc đổi email khác.",
            );
            return;
          }

          const notice =
            "Đăng ký thành công. Supabase đã gửi email xác nhận. Vui lòng mở hộp thư và bấm vào liên kết xác nhận trước khi đăng nhập.";
          toast.success(notice);
          setAuthNotice(notice);
          setIsRegistering(false);
          setPassword("");
        } else {
          console.log("[Auth] Calling loginWithEmail...");
          const user = await loginWithEmail(email, password);
          console.log("[Auth] Login success:", user?.id);
          setAuthNotice(null);
        }
      } catch (err: any) {
        console.error("❌ [Auth] Email auth error:", err);
        setAuthError(err.message || "Authentication failed");
      } finally {
        clearTimeout(safetyTimer);
        console.log("🏁 [Auth] Email auth finished, resetting loading");
        setLoading(false);
      }
    };

    return (
      <AuthScreen
        isRegistering={isRegistering}
        setIsRegistering={setIsRegistering}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        loading={loading}
        authError={authError}
        authNotice={authNotice}
        handleEmailAuth={handleEmailAuth}
        resetLoading={() => setLoading(false)}
      />
    );
  }

  const isAdminRole =
    profile?.role === "admin" || user?.email === "devluan1996@gmail.com";
  const hasSub =
    profile?.subscription_plan && profile.subscription_plan !== "free";
  const canAccessCreate = !!(isAdminRole || hasSub);

  if (profile && profile.status !== "approved" && !isAdminRole) {
    return <PendingApproval handleLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:flex font-sans relative">
      <Toaster position="top-right" richColors />
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsSidebarOpen(false);
        }}
        isActuallyAdmin={isAdminRole}
        userProfile={profile}
        userEmail={user?.email}
        handleLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <img
            src="/logo-app.png"
            alt="HotsNew Click logo"
            className="h-7 w-7 rounded-lg object-cover"
          />
          <span className="font-black text-gray-900 tracking-tight">
            HotsNew
          </span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      <main className="flex-1 p-6 lg:p-12 min-h-screen pb-32">
        <Suspense fallback={<TabLoading />}>
          {activeTab === "dashboard" && (
            <Overview
              stats={stats}
              setActiveTab={setActiveTab}
              canAccessCreate={canAccessCreate}
            />
          )}

          {activeTab === "pricing" && (
            <Pricing
              userProfile={profile}
              checkoutLoadingPlan={checkoutLoadingPlan}
              onCheckout={handleCreateZaloPayOrder}
              onCheckPaymentStatus={handleCheckZaloPayStatus}
            />
          )}

          {activeTab === "create" &&
            (canAccessCreate ? (
              <CreateLink
                url={url}
                setUrl={setUrl}
                customTitle={customTitle}
                setCustomTitle={setCustomTitle}
                customDescription={customDescription}
                setCustomDescription={setCustomDescription}
                customShortCode={customShortCode}
                setCustomShortCode={setCustomShortCode}
                usageContext={usageContext}
                setUsageContext={setUsageContext}
                customImageUrl={customImageUrl}
                setCustomImageUrl={setCustomImageUrl}
                videoUrl={videoUrl}
                setVideoUrl={setVideoUrl}
                uploadingVideo={uploadingVideo}
                videoUploadSuccess={videoUploadSuccess}
                videoInputRef={videoInputRef}
                handleVideoUpload={handleVideoUpload}
                handleConvert={handleConvert}
                loading={loading}
                error={error}
                setError={setError}
                result={result}
                copyToClipboard={copyToClipboard}
                copiedId={copiedId || ""}
              />
            ) : (
              <div className="p-12 text-center bg-white rounded-[3rem] border border-gray-100 shadow-sm max-w-2xl mx-auto mt-12">
                <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="text-orange-600 w-10 h-10 fill-current" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4">
                  Nâng cấp tài khoản
                </h3>
                <p className="text-gray-500 font-medium mb-8">
                  Tính năng chuyển đổi link Shopee & TikTok dành riêng cho tài
                  khoản Premium. Vui lòng liên hệ Admin để nâng cấp gói cước!
                </p>
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs"
                >
                  Quay lại Dashboard
                </button>
              </div>
            ))}

          {activeTab === "admin" && isAdminRole && (
            <AdminPanel
              allUsers={allUsers.filter(
                (u) => u.id !== user?.id && u.role !== "admin",
              )}
              adminLoading={adminLoading}
              handleApproveUser={handleApproveUser}
              handleUpdateSubscription={handleUpdateSubscription}
              handleDeleteUser={handleDeleteUser}
            />
          )}

          {activeTab === "list" && (
            <LinkList
              links={links}
              listLoading={listLoading}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              copyToClipboard={copyToClipboard}
              copiedId={copiedId || ""}
              onDeleteLink={handleDeleteLink}
              onUpdateLink={handleUpdateLink}
            />
          )}

          {activeTab === "analytics" && (
            <Analytics
              analyticsData={analyticsData}
              linksCount={links.length}
            />
          )}

          {activeTab === "profile" && (
            <ProfileSettings
              profile={profile}
              updating={profileLoading}
              onUpdate={handleUpdateProfile}
              onAvatarUpload={handleAvatarUpload}
            />
          )}
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
