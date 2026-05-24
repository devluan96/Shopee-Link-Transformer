import React, { useEffect, useRef, useState, Suspense, lazy } from "react";
import { Menu, Zap } from "lucide-react";
import { useLocale } from "./hooks/useLocale";
import { resolvePublicPage } from "./lib/publicPages";
import { LanguageToggle } from "./components/common/LanguageToggle";
import { ThemeToggle } from "./components/common/ThemeToggle";
import { NotificationBell } from "./components/common/NotificationBell";
import { AccountMenu } from "./components/common/AccountMenu";
import { toast, Toaster } from "sonner";
import {
  AnalyticsFocusContext,
  LinkQuota,
  Tab,
  UserLimits,
} from "./types";

// Hooks
import {
  useAuth,
  useProfile,
  useLinks,
  useAnalytics,
  useCloudinary,
  useVideoUpload,
  useLinkCreator,
  useAdmin,
  useMeta,
  useClipboard,
  useWorkspaces,
  useSecurity,
  useNotifications,
  usePresence,
} from "./hooks";

// Static Components
import { Sidebar } from "./components/layout/Sidebar";
import { AuthScreen } from "./components/auth/AuthScreen";
import { TwoFactorGate } from "./components/auth/TwoFactorGate";
import { PendingApproval } from "./components/PendingApproval";
import { Footer } from "./components/layout/Footer";
import { Overview } from "./components/dashboard/Overview";
import { InstallCenter } from "./components/InstallCenter";
import { PublicPageScreen } from "./components/public/PublicPageScreen";
import { SeoCaptureScreen } from "./components/public/SeoCaptureScreen";
import { AiChatPanel } from "./components/assistant/AiChatPanel";
import { DEFAULT_OUTPUT_DOMAINS } from "./lib/appConfig";

const CHUNK_RELOAD_KEY = "hotsnew.chunk-reload";
const PERSISTED_TABS: Tab[] = [
  "dashboard",
  "guide",
  "install",
  "pricing",
  "create",
  "list",
  "analytics",
  "team",
  "admin",
  "profile",
];

const getActiveTabStorageKey = (userId?: string) =>
  userId ? `hotsnew.active-tab.${userId}` : "hotsnew.active-tab";

const readPersistedTab = (userId?: string) => {
  if (typeof window === "undefined") return null;

  try {
    const storedTab = window.localStorage.getItem(
      getActiveTabStorageKey(userId),
    );
    return storedTab && PERSISTED_TABS.includes(storedTab as Tab)
      ? (storedTab as Tab)
      : null;
  } catch {
    return null;
  }
};

const readPersistedTabForUser = (userId?: string) =>
  readPersistedTab(userId) || readPersistedTab();

const normalizePathname = (pathname: string) =>
  pathname.replace(/\/+$/, "") || "/";

const clearPersistedTab = (userId?: string) => {
  if (typeof window === "undefined") return;

  try {
    if (userId) {
      window.localStorage.removeItem(getActiveTabStorageKey(userId));
    }
    window.localStorage.removeItem(getActiveTabStorageKey());
  } catch {}
};

const lazyWithChunkRetry = <T extends React.ComponentType<any>>(
  importer: () => Promise<{ default: T }>,
) =>
  lazy(async () => {
    try {
      const module = await importer();
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      return module;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error || "");
      const isChunkLoadError =
        /Failed to fetch dynamically imported module/i.test(message) ||
        /Importing a module script failed/i.test(message) ||
        /Loading chunk/i.test(message);

      if (isChunkLoadError && !sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
        window.location.reload();
        return new Promise<never>(() => {});
      }

      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      throw error;
    }
  });

// Lazy Loaded Components
const Pricing = lazyWithChunkRetry(() =>
  import("./components/Pricing").then((m) => ({ default: m.Pricing })),
);
const AdminPanel = lazyWithChunkRetry(() =>
  import("./components/admin/AdminPanel").then((m) => ({
    default: m.AdminPanel,
  })),
);
const Analytics = lazyWithChunkRetry(() =>
  import("./components/dashboard/Analytics").then((m) => ({
    default: m.Analytics,
  })),
);
const CreateLink = lazyWithChunkRetry(() =>
  import("./components/links/CreateLink").then((m) => ({
    default: m.CreateLink,
  })),
);
const LinkList = lazyWithChunkRetry(() =>
  import("./components/links/LinkList").then((m) => ({ default: m.LinkList })),
);
const ProfileSettings = lazyWithChunkRetry(() =>
  import("./components/profile/ProfileSettings").then((m) => ({
    default: m.ProfileSettings,
  })),
);
const WorkspaceManager = lazyWithChunkRetry(() =>
  import("./components/workspaces/WorkspaceManager").then((m) => ({
    default: m.WorkspaceManager,
  })),
);
const TabLoading = () => (
  <div className="flex items-center justify-center min-h-100">
    <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
  </div>
);

const AppLoadingScreen = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => (
  <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.85),_transparent_38%),linear-gradient(135deg,_#020617_0%,_#0f172a_55%,_#111827_100%)]" />
    <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl animate-pulse" />
    <div className="absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl animate-pulse [animation-delay:1200ms]" />

    <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-orange-500/20 blur-xl" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-white/10 bg-slate-900/80 shadow-lg">
              <img
                src="/logo-app-192.png"
                alt="HotsNew"
                className="h-12 w-12 rounded-2xl object-cover"
              />
            </div>
            <div className="absolute inset-0 rounded-[1.75rem] border border-orange-500/20 animate-ping" />
          </div>

          <div className="mb-2 text-[11px] font-black uppercase tracking-[0.35em] text-orange-300">
            HotsNew
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            {title}
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-300">
            {subtitle}
          </p>

          <div className="mt-8 w-full">
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 animate-[loading-bar_1.4s_ease-in-out_infinite]" />
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">
              <span className="h-2 w-2 rounded-full bg-orange-400 animate-bounce [animation-delay:0ms]" />
              <span className="h-2 w-2 rounded-full bg-orange-400 animate-bounce [animation-delay:150ms]" />
              <span className="h-2 w-2 rounded-full bg-orange-400 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function App() {
  const { locale, t } = useLocale();
  const [currentPathname, setCurrentPathname] = useState(() =>
    typeof window !== "undefined"
      ? normalizePathname(window.location.pathname)
      : "/",
  );
  const publicPage = resolvePublicPage(locale, currentPathname);
  const isPublicSeoRoute =
    currentPathname.startsWith("/discover/") && publicPage.path !== "/";
  const captureScreen =
    import.meta.env.DEV && currentPathname.startsWith("/__capture/")
      ? currentPathname.replace("/__capture/", "")
      : null;
  // UI State
  const [activeTab, setActiveTab] = useState<Tab>(
    () => readPersistedTab() || "dashboard",
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [linkQuota, setLinkQuota] = useState<LinkQuota | null>(null);
  const [userLimits, setUserLimits] = useState<UserLimits | null>(null);
  const [tabRestoreReady, setTabRestoreReady] = useState(false);
  const [guideDialogOpen, setGuideDialogOpen] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === "undefined" ? 1600 : window.innerWidth,
  );
  const [analyticsFocus, setAnalyticsFocus] =
    useState<AnalyticsFocusContext | null>(null);

  // Auth Hook
  const {
    handleLogout: handleLogoutBase,
    user,
    authLoading,
    authInitialized,
    authError,
    authNotice,
    isRegistering,
    loginEmail,
    loginPassword,
    registerEmail,
    registerPassword,
    registerConfirmPassword,
    rememberMe,
    passwordRecoveryMode,
    recoveryPassword,
    recoveryConfirmPassword,
    setLoginEmail,
    setLoginPassword,
    setRegisterEmail,
    setRegisterPassword,
    setRegisterConfirmPassword,
    setIsRegistering,
    setRememberMe,
    setRecoveryPassword,
    setRecoveryConfirmPassword,
    handleEmailAuth,
    handleForgotPassword,
    handlePasswordRecovery,
    fetchWithAuth,
  } = useAuth();

  // Profile Hook
  const {
    profile,
    profileLoading,
    profileBootstrapLoading,
    setProfile,
    handleUpdateProfile,
    handleAvatarUpload,
  } = useProfile({ user, fetchWithAuth });

  // Meta/SEO Hook
  useMeta({ user, authLoading, activeTab });

  // Cloudinary Hook
  const {
    uploadAssetToCloudinary,
    lastVideoUploadProvider,
    lastImageUploadProvider,
  } = useCloudinary({ fetchWithAuth });

  const {
    workspaces,
    currentWorkspaceId,
    currentWorkspace,
    workspaceLoading,
    workspaceResolved,
    members,
    membersLoading,
    pendingInvitations,
    pendingInvitationsLoading,
    sentInvitations,
    sentInvitationsLoading,
    setCurrentWorkspaceId,
    fetchPendingInvitations,
    createWorkspace,
    inviteMember,
    updateMemberRole,
    removeMember,
    acceptInvitation,
    declineInvitation,
    cancelInvitation,
  } = useWorkspaces({ user, fetchWithAuth });

  const {
    notifications,
    unreadCount,
    notificationsLoading,
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useNotifications({ user, fetchWithAuth });

  const { onlineUserIds } = usePresence({ user });

  // Links Hook
  const {
    links,
    listLoading,
    linksDirty,
    searchTerm,
    setSearchTerm,
    setLinksDirty,
    upsertLink,
    handleDeleteLink,
    handleUpdateLink,
    handleShareLink,
    handleDeleteManyLinks,
    refreshLinks,
  } = useLinks({
    user,
    profile,
    currentWorkspaceId,
    workspaceResolved,
    fetchWithAuth,
    activeTab,
  });

  // Analytics Hook
  const {
    stats,
    analyticsData,
    statsUpdatedAt,
    analyticsUpdatedAt,
    statsDirty,
    analyticsDirty,
    setStatsDirty,
    setAnalyticsDirty,
  } = useAnalytics({
    user,
    profile,
    currentWorkspaceId,
    workspaceResolved,
    fetchWithAuth,
    activeTab,
    linksLength: links.length,
    focusContext: analyticsFocus,
  });

  // Video Upload Hook
  const {
    videoUrl,
    videoPreviewUrl,
    uploadingVideo,
    videoUploadProgress,
    videoUploadSuccess,
    videoInputRef,
    setVideoUrl,
    handleVideoUpload: handleVideoUploadBase,
    handleVideoFileUpload: handleVideoFileUploadBase,
  } = useVideoUpload({
    canAccessCreate:
      !!user &&
      (currentWorkspaceId
        ? currentWorkspace?.role === "owner" ||
          currentWorkspace?.role === "editor"
        : true),
    uploadAssetToCloudinary,
  });
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [thumbnailUploadProgress, setThumbnailUploadProgress] = useState(0);
  const [thumbnailUploadSuccess, setThumbnailUploadSuccess] = useState(false);

  // Wrapper to handle thumbnail auto-set and sync videoUrl to link creator
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const result = await handleVideoUploadBase(e);
    if (result && typeof result === "object") {
      if (result.thumbnailUrl) {
        setCustomImageUrl(result.thumbnailUrl);
      }
      if (result.videoUrl) {
        setLinkCreatorVideoUrl(result.videoUrl);
      }
    }
  };

  const handleVideoFileUpload = async (file: File) => {
    const result = await handleVideoFileUploadBase(file);
    if (result && typeof result === "object") {
      if (result.thumbnailUrl) {
        setCustomImageUrl(result.thumbnailUrl);
      }
      if (result.videoUrl) {
        setLinkCreatorVideoUrl(result.videoUrl);
      }
    }
  };

  const handleThumbnailFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh JPG, PNG hoặc WebP.");
      return;
    }

    setUploadingThumbnail(true);
    setThumbnailUploadProgress(0);
    setThumbnailUploadSuccess(false);

    try {
      const secureUrl = await uploadAssetToCloudinary(
        file,
        "image",
        file.name,
        setThumbnailUploadProgress,
      );
      if (!secureUrl) {
        throw new Error("Không upload được ảnh thumbnail.");
      }
      setCustomImageUrl(secureUrl);
      setThumbnailUploadSuccess(true);
      setTimeout(() => setThumbnailUploadSuccess(false), 5000);
    } catch (error: unknown) {
      toast.error(
        `Lỗi tải ảnh thumbnail: ${
          error instanceof Error ? error.message : "Không xác định"
        }`,
      );
    } finally {
      setUploadingThumbnail(false);
      setTimeout(() => setThumbnailUploadProgress(0), 600);
    }
  };

  const handleThumbnailUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await handleThumbnailFileUpload(file);
    e.target.value = "";
  };

  // Link Creator Hook
  const {
    url,
    customTitle,
    customDescription,
    customShortCode,
    usageContext,
    folderName,
    tagsText,
    customImageUrl,
    customDomain,
    shopeeAffiliateParams,
    tiktokAffiliateParams,
    secondaryUrl,
    secondaryTargetType,
    redirectDelayMs,
    expiresAt,
    abTestEnabled,
    abVariantBTitle,
    abVariantBDescription,
    abVariantBImageUrl,
    abVariantBVideoUrl,
    abVariantBOriginalUrl,
    abVariantBSecondaryUrl,
    loading,
    error,
    result,
    setUrl,
    setMobileDirectMode,
    mobileDirectMode,
    setCustomTitle,
    setCustomDescription,
    setCustomShortCode,
    setUsageContext,
    setFolderName,
    setTagsText,
    setCustomImageUrl,
    setCustomDomain,
    setShopeeAffiliateParams,
    setTiktokAffiliateParams,
    setSecondaryUrl,
    setSecondaryTargetType,
    setRedirectDelayMs,
    setExpiresAt,
    setVideoUrl: setLinkCreatorVideoUrl,
    setAbTestEnabled,
    setAbVariantBTitle,
    setAbVariantBDescription,
    setAbVariantBImageUrl,
    setAbVariantBVideoUrl,
    setAbVariantBOriginalUrl,
    setAbVariantBSecondaryUrl,
    setError,
    handleConvert,
  } = useLinkCreator({
    user,
    profile,
    currentWorkspaceId,
    fetchWithAuth,
    canAccessCreate:
      !!user &&
      (currentWorkspaceId
        ? currentWorkspace?.role === "owner" ||
          currentWorkspace?.role === "editor"
        : true),
    onSuccess: () => {
      setLinksDirty(true);
      setStatsDirty(true);
      setAnalyticsDirty(true);
      void refreshLinkQuota();
      void refreshUserLimits();
    },
  });

  // Sync videoUrl between hooks
  const handleSetVideoUrl = (v: string) => {
    setVideoUrl(v);
    setLinkCreatorVideoUrl(v);
  };

  // Admin Hook
  const {
    allUsers,
    adminLoading,
    fetchAllUsers,
    paymentRequests,
    paymentRequestsLoading,
    fetchPaymentRequests,
    outputDomains,
    outputDomainsLoading,
    handleApproveUser,
    handleUpdateSubscription,
    handleUpdateUserRole,
    handleDeleteUser,
    handleConfirmPaymentRequest,
    handleRejectPaymentRequest,
    updateOutputDomains,
  } = useAdmin({ user, profile, fetchWithAuth, activeTab });

  // Clipboard Hook
  const { copiedId, copyToClipboard } = useClipboard();

  const {
    securityOverview,
    securityLoading,
    twoFactorSetup,
    beginTwoFactorSetup,
    enableTwoFactor,
    disableTwoFactor,
    twoFactorSessionVerified,
    verifyTwoFactorChallenge,
    adminAccessLogs,
    blockedIps,
    adminSecurityLoading,
    refreshAdminSecurity,
    blockIp,
    unblockIp,
  } = useSecurity({
    user,
    profile,
    fetchWithAuth,
    activeTab,
  });

  const refreshLinkQuota = React.useCallback(async () => {
    if (!user?.id) {
      setLinkQuota(null);
      return;
    }

    try {
      const res = await fetchWithAuth("/api/v1/user/link-quota");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load link quota");
      }

      setLinkQuota(data);
    } catch {
      setLinkQuota(null);
    }
  }, [fetchWithAuth, user?.id]);

  const refreshUserLimits = React.useCallback(async () => {
    if (!user?.id) {
      setUserLimits(null);
      return;
    }

    try {
      const res = await fetchWithAuth("/api/v1/user/limits");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load user limits");
      }

      setUserLimits(data);
    } catch {
      setUserLimits(null);
    }
  }, [fetchWithAuth, user?.id]);

  // Derived state
  const isAdminRole =
    profile?.role === "admin";
  const hasSub = !!(
    profile?.subscription_plan && profile.subscription_plan !== "free"
  );
  const canUseCustomDomains =
    isAdminRole ||
    profile?.subscription_plan === "yearly" ||
    profile?.subscription_plan === "monthly";
  const availableOutputDomains = outputDomains.length
    ? outputDomains
    : DEFAULT_OUTPUT_DOMAINS;
  const canEditCurrentWorkspace =
    currentWorkspace?.role === "owner" || currentWorkspace?.role === "editor";
  const canAccessCreate =
    !!user && (currentWorkspaceId ? canEditCurrentWorkspace : true);
  const blockedByWorkspaceRole =
    !!currentWorkspaceId && !canEditCurrentWorkspace;
  const bootstrappingAccess =
    !!user && (authLoading || profileBootstrapLoading);
  const compactDesktop = viewportWidth >= 1024 && viewportWidth < 1520;
  const openAnalyticsFocus = React.useCallback(
    (focus: AnalyticsFocusContext) => {
      setAnalyticsFocus(focus);
      setActiveTab("analytics");
    },
    [],
  );

  const handleLogout = React.useCallback(async () => {
    clearPersistedTab(user?.id);
    setTabRestoreReady(false);
    setGuideDialogOpen(false);
    setActiveTab("dashboard");
    await handleLogoutBase();
  }, [handleLogoutBase, user?.id]);

  React.useLayoutEffect(() => {
    if (!user?.id) {
      setTabRestoreReady(false);
      setIsSidebarOpen(false);
      return;
    }

    const restoredTab = readPersistedTabForUser(user.id) || "dashboard";
    const nextTab = restoredTab === "guide" ? "create" : restoredTab;
    setActiveTab(nextTab);
    setGuideDialogOpen(restoredTab === "guide");

    try {
      window.localStorage.setItem(getActiveTabStorageKey(user.id), nextTab);
    } catch {}

    setTabRestoreReady(true);
    setIsSidebarOpen(false);
  }, [user?.id]);

  useEffect(() => {
    if (!user || !tabRestoreReady) return;

    try {
      window.localStorage.setItem(getActiveTabStorageKey(user.id), activeTab);
    } catch {}
  }, [activeTab, tabRestoreReady, user?.id]);

  useEffect(() => {
    if (!user || !tabRestoreReady || bootstrappingAccess) return;

    const nextAllowedTabs: Tab[] = [
      "dashboard",
      "install",
      "pricing",
      "list",
      "analytics",
      "team",
      "profile",
    ];
    if (canAccessCreate) {
      nextAllowedTabs.push("create");
    }
    if (isAdminRole) {
      nextAllowedTabs.push("admin");
    }

    if (!nextAllowedTabs.includes(activeTab)) {
      setActiveTab(canAccessCreate ? "dashboard" : "pricing");
    }
  }, [activeTab, bootstrappingAccess, canAccessCreate, tabRestoreReady, user]);

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (activeTab !== "analytics" && analyticsFocus) {
      setAnalyticsFocus(null);
    }
  }, [activeTab, analyticsFocus]);

  useEffect(() => {
    setAnalyticsFocus(null);
  }, [user?.id, currentWorkspaceId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncPathname = () => {
      setCurrentPathname(normalizePathname(window.location.pathname));
    };

    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(window.history);

    window.history.pushState = ((...args) => {
      const result = originalPushState(...args);
      syncPathname();
      return result;
    }) as History["pushState"];

    window.history.replaceState = ((...args) => {
      const result = originalReplaceState(...args);
      syncPathname();
      return result;
    }) as History["replaceState"];

    window.addEventListener("popstate", syncPathname);
    window.addEventListener("pageshow", syncPathname);
    syncPathname();

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", syncPathname);
      window.removeEventListener("pageshow", syncPathname);
    };
  }, []);

  useEffect(() => {
    if (activeTab !== "create") {
      setGuideDialogOpen(false);
    }
  }, [activeTab]);

  useEffect(() => {
    void refreshLinkQuota();
    void refreshUserLimits();
  }, [
    refreshLinkQuota,
    refreshUserLimits,
    profile?.subscription_plan,
    profile?.role,
  ]);

  useEffect(() => {
    if (!user || !tabRestoreReady) return;

    const params = new URLSearchParams(window.location.search);
    const prefilledUrl = params.get("url");
    const openCreate = params.get("create") === "1";
    const requestedTab = params.get("tab");
    const tabMap: Record<string, Tab> = {
      dashboard: "dashboard",
      guide: "guide",
      install: "install",
      pricing: "pricing",
      create: "create",
      list: "list",
      analytics: "analytics",
      team: "team",
      profile: "profile",
    };

    if (prefilledUrl) {
      setUrl(prefilledUrl);
    }

    if (requestedTab === "guide") {
      if (canAccessCreate) {
        setActiveTab("create");
        setGuideDialogOpen(true);
      }
      return;
    }

    if (requestedTab && tabMap[requestedTab]) {
      const nextTab = tabMap[requestedTab];
      if (nextTab === "create") {
        if (canAccessCreate) {
          setActiveTab("create");
        }
      } else {
        setActiveTab(nextTab);
      }
      return;
    }

    if (openCreate && canAccessCreate) {
      setActiveTab("create");
    }
  }, [user, canAccessCreate, setUrl, tabRestoreReady]);

  // Loading screen
  if (!authInitialized || bootstrappingAccess) {
    const loadingTitle =
      locale === "vi"
        ? "Đang khởi động trung tâm quản trị"
        : "Loading your workspace";
    const loadingSubtitle =
      locale === "vi"
        ? "Đang đồng bộ phiên đăng nhập, khôi phục tab gần nhất và nạp dữ liệu cần thiết."
        : "Restoring your session, reopening the last tab, and syncing the data you need.";

    return <AppLoadingScreen title={loadingTitle} subtitle={loadingSubtitle} />;
  }

  if (
    captureScreen &&
    (captureScreen === "create" ||
      captureScreen === "create-tiktok" ||
      captureScreen === "pricing" ||
      captureScreen === "install" ||
      captureScreen === "analytics" ||
      captureScreen === "library")
  ) {
    return <SeoCaptureScreen screen={captureScreen} />;
  }

  // Auth screen
  if (authInitialized && (!user || passwordRecoveryMode)) {
    if (!user && !passwordRecoveryMode && isPublicSeoRoute) {
      return <PublicPageScreen key={publicPage.path} page={publicPage} />;
    }

    return (
      <AuthScreen
        isRegistering={isRegistering}
        setIsRegistering={setIsRegistering}
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        registerEmail={registerEmail}
        setRegisterEmail={setRegisterEmail}
        registerPassword={registerPassword}
        setRegisterPassword={setRegisterPassword}
        registerConfirmPassword={registerConfirmPassword}
        setRegisterConfirmPassword={setRegisterConfirmPassword}
        rememberMe={rememberMe}
        setRememberMe={setRememberMe}
        passwordRecoveryMode={passwordRecoveryMode}
        recoveryPassword={recoveryPassword}
        setRecoveryPassword={setRecoveryPassword}
        recoveryConfirmPassword={recoveryConfirmPassword}
        setRecoveryConfirmPassword={setRecoveryConfirmPassword}
        loading={authLoading}
        authError={authError}
        authNotice={authNotice}
        handleEmailAuth={handleEmailAuth}
        handleForgotPassword={handleForgotPassword}
        handlePasswordRecovery={handlePasswordRecovery}
        resetLoading={() => {}}
      />
    );
  }

  // Pending approval
  if (profile && profile.status !== "approved" && !isAdminRole) {
    return <PendingApproval handleLogout={handleLogout} />;
  }

  const requiresTwoFactorChallenge =
    !!user &&
    !!profile &&
    profile.status === "approved" &&
    !!securityOverview?.twoFactorEnabled &&
    !twoFactorSessionVerified;

  if (requiresTwoFactorChallenge) {
    return (
      <TwoFactorGate
        email={user.email}
        loading={securityLoading}
        onVerify={verifyTwoFactorChallenge}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:flex font-sans relative dark:bg-slate-900">
      <Toaster position="top-right" richColors />
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsSidebarOpen(false);
        }}
        isActuallyAdmin={isAdminRole}
        userProfile={profile}
        workspaces={workspaces}
        currentWorkspaceId={currentWorkspaceId}
        onWorkspaceChange={setCurrentWorkspaceId}
        userEmail={user?.email}
        handleLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        compactDesktop={compactDesktop}
      />

      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-30 border-b border-gray-100 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex flex-1 items-center gap-2">
            <img
              src="/logo-app-192.png"
              alt={t("sidebar.logoAlt")}
              className="h-7 w-7 rounded-lg object-cover"
            />
            <span className="truncate font-black tracking-tight text-gray-900 dark:text-white">
              HotsNew
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              loading={notificationsLoading}
              onRefresh={() => fetchNotifications(true)}
              onMarkRead={markNotificationRead}
              onMarkAllRead={markAllNotificationsRead}
              onOpenTeamWorkspace={() => {
                setActiveTab("team");
                void fetchPendingInvitations(true);
              }}
              onOpenLinks={() => {
                setActiveTab("list");
              }}
              onOpenPricing={() => {
                setActiveTab("pricing");
              }}
              className="lg:hidden"
            />
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-gray-500 transition-colors hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end gap-2">
          <LanguageToggle compact />
          <ThemeToggle compact />
        </div>
      </div>

      <main
        className={`min-w-0 flex-1 overflow-x-hidden p-6 pb-32 dark:bg-slate-900 ${
          compactDesktop
            ? "lg:px-8 lg:pb-24 lg:pt-6"
            : "lg:px-12 lg:pb-32 lg:pt-8"
        }`}
      >
        {user && (
          <>
            <div
              className={`hidden lg:block ${compactDesktop ? "h-16" : "h-18"}`}
            />
            <div
              className={`pointer-events-none fixed right-0 top-0 z-40 hidden lg:block ${
                compactDesktop ? "left-60" : "left-72"
              }`}
            >
              <div className="border-b border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                <div
                  className={`flex items-center justify-end ${
                    compactDesktop ? "h-14 px-6" : "h-16 px-10"
                  }`}
                >
                  <div
                    className={`pointer-events-auto flex items-center ${
                      compactDesktop ? "gap-2" : "gap-2.5"
                    }`}
                  >
                    <LanguageToggle compact={compactDesktop} />
                    <ThemeToggle compact={compactDesktop} />
                    <NotificationBell
                      notifications={notifications}
                      unreadCount={unreadCount}
                      loading={notificationsLoading}
                      onRefresh={() => fetchNotifications(true)}
                      onMarkRead={markNotificationRead}
                      onMarkAllRead={markAllNotificationsRead}
                      onOpenTeamWorkspace={() => {
                        setActiveTab("team");
                        void fetchPendingInvitations(true);
                      }}
                      onOpenLinks={() => {
                        setActiveTab("list");
                      }}
                      onOpenPricing={() => {
                        setActiveTab("pricing");
                      }}
                    />
                    <AccountMenu
                      activeTab={activeTab}
                      onSelectTab={setActiveTab}
                      isActuallyAdmin={isAdminRole}
                      userProfile={profile}
                      userEmail={user?.email}
                      handleLogout={handleLogout}
                      compact={compactDesktop}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        <Suspense fallback={<TabLoading />}>
          {activeTab === "dashboard" && (
            <Overview
              stats={stats}
              lastUpdatedAt={statsUpdatedAt}
              setActiveTab={setActiveTab}
              onOpenAnalyticsFocus={openAnalyticsFocus}
              canAccessCreate={canAccessCreate}
              compactDesktop={compactDesktop}
            />
          )}

          {activeTab === "install" && <InstallCenter />}

          {activeTab === "team" && (
            <WorkspaceManager
              workspaces={workspaces}
              currentWorkspace={currentWorkspace}
              workspaceLoading={workspaceLoading}
              members={members}
              membersLoading={membersLoading}
              pendingInvitations={pendingInvitations}
              pendingInvitationsLoading={pendingInvitationsLoading}
              sentInvitations={sentInvitations}
              sentInvitationsLoading={sentInvitationsLoading}
              userLimits={userLimits}
              onSelectWorkspace={setCurrentWorkspaceId}
              onCreateWorkspace={createWorkspace}
              onInviteMember={inviteMember}
              onUpdateMemberRole={updateMemberRole}
              onRemoveMember={removeMember}
              onAcceptInvitation={acceptInvitation}
              onDeclineInvitation={declineInvitation}
              onCancelInvitation={cancelInvitation}
            />
          )}

          {activeTab === "pricing" && (
            <Pricing
              userProfile={profile}
              linkQuota={linkQuota}
              userLimits={userLimits}
              fetchWithAuth={fetchWithAuth}
            />
          )}

          {activeTab === "create" &&
            (canAccessCreate ? (
              <CreateLink
                url={url}
                setUrl={setUrl}
                mobileDirectMode={mobileDirectMode}
                setMobileDirectMode={setMobileDirectMode}
                customTitle={customTitle}
                setCustomTitle={setCustomTitle}
                customDescription={customDescription}
                setCustomDescription={setCustomDescription}
                customShortCode={customShortCode}
                setCustomShortCode={setCustomShortCode}
                usageContext={usageContext}
                setUsageContext={setUsageContext}
                folderName={folderName}
                setFolderName={setFolderName}
                tagsText={tagsText}
                setTagsText={setTagsText}
                customImageUrl={customImageUrl}
                setCustomImageUrl={setCustomImageUrl}
                customDomain={customDomain}
                setCustomDomain={setCustomDomain}
                availableOutputDomains={availableOutputDomains}
                canUseCustomDomains={canUseCustomDomains}
                linkQuota={linkQuota}
                userLimits={userLimits}
                shopeeAffiliateParams={shopeeAffiliateParams}
                setShopeeAffiliateParams={setShopeeAffiliateParams}
                tiktokAffiliateParams={tiktokAffiliateParams}
                setTiktokAffiliateParams={setTiktokAffiliateParams}
                secondaryUrl={secondaryUrl}
                setSecondaryUrl={setSecondaryUrl}
                secondaryTargetType={secondaryTargetType}
                setSecondaryTargetType={setSecondaryTargetType}
                redirectDelayMs={redirectDelayMs}
                setRedirectDelayMs={setRedirectDelayMs}
                expiresAt={expiresAt}
                setExpiresAt={setExpiresAt}
                videoUrl={videoUrl}
                videoPreviewUrl={videoPreviewUrl}
                setVideoUrl={handleSetVideoUrl}
                abTestEnabled={abTestEnabled}
                setAbTestEnabled={setAbTestEnabled}
                abVariantBTitle={abVariantBTitle}
                setAbVariantBTitle={setAbVariantBTitle}
                abVariantBDescription={abVariantBDescription}
                setAbVariantBDescription={setAbVariantBDescription}
                abVariantBImageUrl={abVariantBImageUrl}
                setAbVariantBImageUrl={setAbVariantBImageUrl}
                abVariantBVideoUrl={abVariantBVideoUrl}
                setAbVariantBVideoUrl={setAbVariantBVideoUrl}
                abVariantBOriginalUrl={abVariantBOriginalUrl}
                setAbVariantBOriginalUrl={setAbVariantBOriginalUrl}
                abVariantBSecondaryUrl={abVariantBSecondaryUrl}
                setAbVariantBSecondaryUrl={setAbVariantBSecondaryUrl}
                uploadingVideo={uploadingVideo}
                videoUploadProgress={videoUploadProgress}
                videoUploadSuccess={videoUploadSuccess}
                videoUploadProvider={lastVideoUploadProvider}
                videoInputRef={videoInputRef}
                handleVideoUpload={handleVideoUpload}
                handleVideoFileUpload={handleVideoFileUpload}
                thumbnailInputRef={thumbnailInputRef}
                uploadingThumbnail={uploadingThumbnail}
                thumbnailUploadProgress={thumbnailUploadProgress}
                thumbnailUploadSuccess={thumbnailUploadSuccess}
                thumbnailUploadProvider={lastImageUploadProvider}
                handleThumbnailUpload={handleThumbnailUpload}
                handleThumbnailFileUpload={handleThumbnailFileUpload}
                handleConvert={handleConvert}
                loading={loading}
                error={error}
                setError={setError}
                result={result}
                copyToClipboard={copyToClipboard}
                copiedId={copiedId || ""}
                setActiveTab={setActiveTab}
                guideDialogOpen={guideDialogOpen}
                onOpenGuide={() => setGuideDialogOpen(true)}
                onCloseGuide={() => setGuideDialogOpen(false)}
              />
            ) : (
              <div className="p-12 text-center bg-white rounded-[3rem] border border-gray-100 shadow-sm max-w-2xl mx-auto mt-12">
                <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="text-orange-600 w-10 h-10 fill-current" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4">
                  {blockedByWorkspaceRole
                    ? t("app.createLocked.titleViewer")
                    : t("app.createLocked.titleUpgrade")}
                </h3>
                <p className="text-gray-500 font-medium mb-8">
                  {blockedByWorkspaceRole
                    ? t("app.createLocked.descriptionViewer")
                    : t("app.createLocked.descriptionUpgrade")}
                </p>
                <button
                  onClick={() =>
                    setActiveTab(blockedByWorkspaceRole ? "team" : "dashboard")
                  }
                  className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs"
                >
                  {blockedByWorkspaceRole
                    ? t("app.createLocked.actionViewer")
                    : t("app.createLocked.actionUpgrade")}
                </button>
              </div>
            ))}

          {activeTab === "admin" && isAdminRole && (
          <AdminPanel
            allUsers={allUsers.filter(
              (u) => u.id !== user?.id,
            )}
            adminLoading={adminLoading}
            onRefreshUsers={fetchAllUsers}
            onRefreshPayments={fetchPaymentRequests}
            onRefreshSecurity={refreshAdminSecurity}
            onUpdateUserRole={handleUpdateUserRole}
            paymentRequests={paymentRequests}
            paymentRequestsLoading={paymentRequestsLoading}
            adminAccessLogs={adminAccessLogs}
              blockedIps={blockedIps}
              adminSecurityLoading={adminSecurityLoading}
              outputDomains={outputDomains}
              outputDomainsLoading={outputDomainsLoading}
              onBlockIp={blockIp}
              onUnblockIp={unblockIp}
              onlineUserIds={onlineUserIds}
              handleApproveUser={handleApproveUser}
              handleUpdateSubscription={handleUpdateSubscription}
              handleDeleteUser={handleDeleteUser}
              onConfirmPaymentRequest={handleConfirmPaymentRequest}
              onRejectPaymentRequest={handleRejectPaymentRequest}
              onUpdateOutputDomains={updateOutputDomains}
              fetchWithAuth={fetchWithAuth}
            />
          )}

          {activeTab === "list" && (
            <LinkList
              links={links}
              listLoading={listLoading}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              workspaces={workspaces}
              currentWorkspaceId={currentWorkspaceId}
              canShareToWorkspace={currentWorkspace?.role === "owner"}
              showChoiceModeActions={isAdminRole}
              copyToClipboard={copyToClipboard}
              copiedId={copiedId || ""}
              onDeleteLink={handleDeleteLink}
              onUpdateLink={handleUpdateLink}
              onShareLink={handleShareLink}
              onDeleteManyLinks={handleDeleteManyLinks}
            />
          )}

          {activeTab === "analytics" && (
            <Analytics
              analyticsData={analyticsData}
              linksCount={stats.totalLinks}
              fetchWithAuth={fetchWithAuth}
              currentWorkspaceId={currentWorkspaceId}
              focusContext={analyticsFocus}
              lastUpdatedAt={analyticsUpdatedAt}
              onClearFocus={() => setAnalyticsFocus(null)}
            />
          )}

          {activeTab === "profile" && (
            <ProfileSettings
              profile={profile}
              updating={profileLoading}
              securityOverview={securityOverview}
              securityLoading={securityLoading}
              twoFactorSetup={twoFactorSetup}
              onBeginTwoFactorSetup={beginTwoFactorSetup}
              onEnableTwoFactor={enableTwoFactor}
              onDisableTwoFactor={disableTwoFactor}
              onUpdate={handleUpdateProfile}
              onAvatarUpload={handleAvatarUpload}
            />
          )}
        </Suspense>
      </main>

      {user && (
        <AiChatPanel
          fetchWithAuth={fetchWithAuth}
          userName={profile?.full_name || user?.email}
        />
      )}

      <Footer />
    </div>
  );
}
