import React, { useEffect, useState, Suspense, lazy } from "react";
import { Menu, Zap } from "lucide-react";
import { ThemeToggle } from "./components/common/ThemeToggle";
import { Toaster } from "sonner";
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
  usePayment,
  useAdmin,
  useMeta,
  useClipboard,
  useWorkspaces,
  useSecurity,
} from "./hooks";

// Static Components
import { Sidebar } from "./components/layout/Sidebar";
import { AuthScreen } from "./components/auth/AuthScreen";
import { TwoFactorGate } from "./components/auth/TwoFactorGate";
import { PendingApproval } from "./components/PendingApproval";
import { Footer } from "./components/layout/Footer";
import { Overview } from "./components/dashboard/Overview";
import { InstallCenter } from "./components/InstallCenter";

// Lazy Loaded Components
const Pricing = lazy(() =>
  import("./components/Pricing").then((m) => ({ default: m.Pricing })),
);
const AdminPanel = lazy(() =>
  import("./components/admin/AdminPanel").then((m) => ({
    default: m.AdminPanel,
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
const WorkspaceManager = lazy(() =>
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
  // UI State
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [linkQuota, setLinkQuota] = useState<LinkQuota | null>(null);
  const [userLimits, setUserLimits] = useState<UserLimits | null>(null);

  // Auth Hook
  const {
    user,
    authLoading,
    authError,
    authNotice,
    isRegistering,
    email,
    password,
    setEmail,
    setPassword,
    setIsRegistering,
    setAuthError,
    setAuthNotice,
    handleEmailAuth,
    handleLogout,
    fetchWithAuth,
  } = useAuth();

  // Profile Hook
  const {
    profile,
    profileLoading,
    profileBootstrapLoading,
    setProfile,
    refreshCurrentProfile,
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
    members,
    membersLoading,
    setCurrentWorkspaceId,
    createWorkspace,
    inviteMember,
    updateMemberRole,
    removeMember,
  } = useWorkspaces({ user, fetchWithAuth });

  // Links Hook
  const {
    links,
    listLoading,
    linksDirty,
    searchTerm,
    setSearchTerm,
    setLinksDirty,
    handleDeleteLink,
    handleUpdateLink,
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

  // Payment Hook
  const {
    checkoutLoadingPlan,
    handleCreateZaloPayOrder,
    handleCheckZaloPayStatus,
  } = usePayment({ user, fetchWithAuth, refreshCurrentProfile });

  // Admin Hook
  const {
    allUsers,
    adminLoading,
    onlineUserIds,
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
    if (!user) {
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
  }, [fetchWithAuth, user]);

  const refreshUserLimits = React.useCallback(async () => {
    if (!user) {
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
  }, [fetchWithAuth, user]);

  // Derived state
  const isAdminRole =
    profile?.role === "admin" || user?.email === "devluan1996@gmail.com";
  const hasSub =
    profile?.subscription_plan && profile.subscription_plan !== "free";
  const canUseCustomDomains =
    isAdminRole || profile?.subscription_plan === "yearly";
  const availableOutputDomains = outputDomains.length
    ? outputDomains
    : ["hotsnew.click"];
  const canEditCurrentWorkspace =
    currentWorkspace?.role === "owner" || currentWorkspace?.role === "editor";
  const canAccessCreate =
    !!(isAdminRole || hasSub) &&
    (!!currentWorkspaceId ? canEditCurrentWorkspace : true);
  const blockedByWorkspaceRole =
    !!currentWorkspaceId && !canEditCurrentWorkspace;
  const bootstrappingAccess =
    !!user && (authLoading || profileBootstrapLoading);

  useEffect(() => {
    setActiveTab("dashboard");
    setIsSidebarOpen(false);
  }, [user?.id]);

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
          Đang khởi tạo hệ thống...
        </div>
      </div>
    );
  }

  // Auth screen
  if (!user) {
    return (
      <AuthScreen
        isRegistering={isRegistering}
        setIsRegistering={setIsRegistering}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        loading={authLoading}
        authError={authError}
        authNotice={authNotice}
        handleEmailAuth={handleEmailAuth}
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
      />

      {/* Mobile Header */}
      <div className="lg:hidden bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <img
            src="/logo-app-192.png"
            alt="HotsNew Click logo"
            className="h-7 w-7 rounded-lg object-cover"
          />
          <span className="font-black text-gray-900 dark:text-white tracking-tight">
            HotsNew
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      <main className="flex-1 p-6 lg:p-12 min-h-screen pb-32 dark:bg-slate-900">
        <Suspense fallback={<TabLoading />}>
          {activeTab === "dashboard" && (
            <Overview
              stats={stats}
              setActiveTab={setActiveTab}
              canAccessCreate={canAccessCreate}
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
              userLimits={userLimits}
              onSelectWorkspace={setCurrentWorkspaceId}
              onCreateWorkspace={createWorkspace}
              onInviteMember={inviteMember}
              onUpdateMemberRole={updateMemberRole}
              onRemoveMember={removeMember}
            />
          )}

          {activeTab === "pricing" && (
            <Pricing
              userProfile={profile}
              linkQuota={linkQuota}
              userLimits={userLimits}
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
                    ? "Workspace chỉ cho xem"
                    : "Nâng cấp tài khoản"}
                </h3>
                <p className="text-gray-500 font-medium mb-8">
                  {blockedByWorkspaceRole
                    ? "Workspace hiện tại của bạn đang ở role viewer nên không thể tạo hoặc chỉnh sửa link. Hãy chuyển sang workspace khác hoặc hỏi owner nâng quyền lên editor."
                    : "Tính năng chuyển đổi link Shopee & TikTok dành riêng cho tài khoản Premium. Vui lòng liên hệ Admin để nâng cấp gói cước!"}
                </p>
                <button
                  onClick={() =>
                    setActiveTab(blockedByWorkspaceRole ? "team" : "dashboard")
                  }
                  className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs"
                >
                  {blockedByWorkspaceRole
                    ? "Mở team Workspace"
                    : "Quay lại Dashboard"}
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
              copyToClipboard={copyToClipboard}
              copiedId={copiedId || ""}
              onDeleteLink={handleDeleteLink}
              onUpdateLink={handleUpdateLink}
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
