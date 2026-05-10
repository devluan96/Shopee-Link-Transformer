import React, { useEffect, useRef, useState, Suspense, lazy } from "react";
import { Menu, Zap } from "lucide-react";
import { useLocale } from "./hooks/useLocale";
import { LanguageToggle } from "./components/common/LanguageToggle";
import { ThemeToggle } from "./components/common/ThemeToggle";
import { NotificationBell } from "./components/common/NotificationBell";
import { AccountMenu } from "./components/common/AccountMenu";
import { toast, Toaster } from "sonner";
import { LinkQuota, Tab, UserLimits } from "./types";

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

const CHUNK_RELOAD_KEY = "hotsnew.chunk-reload";

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

export default function App() {
  const { t } = useLocale();
  // UI State
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [linkQuota, setLinkQuota] = useState<LinkQuota | null>(null);
  const [userLimits, setUserLimits] = useState<UserLimits | null>(null);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === "undefined" ? 1600 : window.innerWidth,
  );

  // Auth Hook
  const {
    user,
    authLoading,
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
    handleLogout,
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
  const { uploadAssetToCloudinary } = useCloudinary({ fetchWithAuth });

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
    fetchWithAuth,
    activeTab,
  });

  // Analytics Hook
  const {
    stats,
    analyticsData,
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
  });

  // Video Upload Hook
  const {
    videoUrl,
    uploadingVideo,
    videoUploadProgress,
    videoUploadSuccess,
    videoInputRef,
    setVideoUrl,
    handleVideoUpload: handleVideoUploadBase,
    handleVideoFileUpload: handleVideoFileUploadBase,
  } = useVideoUpload({
    canAccessCreate: !!(
      (profile?.subscription_plan && profile.subscription_plan !== "free") ||
      profile?.role === "admin"
    ),
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
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    utmTerm,
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
    setCustomTitle,
    setCustomDescription,
    setCustomShortCode,
    setUsageContext,
    setFolderName,
    setTagsText,
    setCustomImageUrl,
    setCustomDomain,
    setUtmSource,
    setUtmMedium,
    setUtmCampaign,
    setUtmContent,
    setUtmTerm,
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
    canAccessCreate: !!(
      (profile?.subscription_plan && profile.subscription_plan !== "free") ||
      profile?.role === "admin"
    ),
    onSuccess: async (createdLink) => {
      const belongsToCurrentWorkspace =
        !currentWorkspaceId || createdLink.workspace_id === currentWorkspaceId;

      if (belongsToCurrentWorkspace) {
        upsertLink(createdLink);
      }
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
    outputDomains,
    outputDomainsLoading,
    handleApproveUser,
    handleUpdateSubscription,
    handleDeleteUser,
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
    profile?.role === "admin" || user?.email === "devluan1996@gmail.com";
  const hasSub = !!(
    profile?.subscription_plan && profile.subscription_plan !== "free"
  );
  const canUseCustomDomains =
    isAdminRole || profile?.subscription_plan === "yearly";
  const availableOutputDomains = outputDomains.length
    ? outputDomains
    : ["hotsnew.click"];
  const canEditCurrentWorkspace =
    currentWorkspace?.role === "owner" || currentWorkspace?.role === "editor";
  const canAccessCreate = !!(
    (isAdminRole || hasSub) &&
    (currentWorkspaceId ? canEditCurrentWorkspace : true)
  );
  const blockedByWorkspaceRole =
    !!currentWorkspaceId && !canEditCurrentWorkspace;
  const bootstrappingAccess =
    !!user && (authLoading || profileBootstrapLoading);
  const compactDesktop = viewportWidth >= 1024 && viewportWidth < 1520;

  useEffect(() => {
    setActiveTab("dashboard");
    setIsSidebarOpen(false);
  }, [user?.id]);

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    if (!user) return;

    const params = new URLSearchParams(window.location.search);
    const prefilledUrl = params.get("url");
    const openCreate = params.get("create") === "1";
    const requestedTab = params.get("tab");
    const tabMap: Record<string, Tab> = {
      dashboard: "dashboard",
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
  }, [user, canAccessCreate, setUrl]);

  // Loading screen
  if (bootstrappingAccess) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        <div className="text-gray-400 font-bold uppercase tracking-widest text-[10px] animate-pulse">
          {t("app.loading")}
        </div>
      </div>
    );
  }

  // Auth screen
  if (!user || passwordRecoveryMode) {
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
              setActiveTab={setActiveTab}
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
                utmSource={utmSource}
                setUtmSource={setUtmSource}
                utmMedium={utmMedium}
                setUtmMedium={setUtmMedium}
                utmCampaign={utmCampaign}
                setUtmCampaign={setUtmCampaign}
                utmContent={utmContent}
                setUtmContent={setUtmContent}
                utmTerm={utmTerm}
                setUtmTerm={setUtmTerm}
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
                videoInputRef={videoInputRef}
                handleVideoUpload={handleVideoUpload}
                handleVideoFileUpload={handleVideoFileUpload}
                thumbnailInputRef={thumbnailInputRef}
                uploadingThumbnail={uploadingThumbnail}
                thumbnailUploadProgress={thumbnailUploadProgress}
                thumbnailUploadSuccess={thumbnailUploadSuccess}
                handleThumbnailUpload={handleThumbnailUpload}
                handleThumbnailFileUpload={handleThumbnailFileUpload}
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
                (u) => u.id !== user?.id && u.role !== "admin",
              )}
              adminLoading={adminLoading}
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

      <Footer />
    </div>
  );
}
