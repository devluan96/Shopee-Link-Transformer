import React, { useState, Suspense, lazy } from "react";
import { Zap, Menu } from "lucide-react";
import { Toaster } from "sonner";
import { Tab } from "./types";

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
} from "./hooks";

// Static Components
import { Sidebar } from "./components/layout/Sidebar";
import { AuthScreen } from "./components/auth/AuthScreen";
import { PendingApproval } from "./components/PendingApproval";
import { Footer } from "./components/layout/Footer";

// Lazy Loaded Components
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

const TabLoading = () => (
  <div className="flex items-center justify-center min-h-100">
    <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
  </div>
);

export default function App() {
  // UI State
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    refreshLinks,
  } = useLinks({ user, profile, fetchWithAuth, activeTab });

  // Analytics Hook
  const {
    stats,
    analyticsData,
    statsDirty,
    analyticsDirty,
    setStatsDirty,
    setAnalyticsDirty,
  } = useAnalytics({ user, profile, fetchWithAuth, activeTab, linksLength: links.length });

  // Video Upload Hook
  const {
    videoUrl,
    uploadingVideo,
    videoUploadProgress,
    videoUploadSuccess,
    videoInputRef,
    setVideoUrl,
    handleVideoUpload: handleVideoUploadBase,
    clearVideo,
  } = useVideoUpload({ canAccessCreate: !!(profile?.subscription_plan && profile.subscription_plan !== "free" || profile?.role === "admin"), uploadAssetToCloudinary });

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

  // Link Creator Hook
  const {
    url,
    customTitle,
    customDescription,
    customShortCode,
    usageContext,
    customImageUrl,
    secondaryUrl,
    secondaryTargetType,
    redirectDelayMs,
    loading,
    error,
    result,
    setUrl,
    setCustomTitle,
    setCustomDescription,
    setCustomShortCode,
    setUsageContext,
    setCustomImageUrl,
    setSecondaryUrl,
    setSecondaryTargetType,
    setRedirectDelayMs,
    setVideoUrl: setLinkCreatorVideoUrl,
    setError,
    handleConvert,
  } = useLinkCreator({
    user,
    profile,
    fetchWithAuth,
    canAccessCreate: !!(profile?.subscription_plan && profile.subscription_plan !== "free" || profile?.role === "admin"),
    onSuccess: () => {
      setLinksDirty(true);
      setStatsDirty(true);
      setAnalyticsDirty(true);
    },
  });

  // Sync videoUrl between hooks
  const handleSetVideoUrl = (v: string) => {
    setVideoUrl(v);
    setLinkCreatorVideoUrl(v);
  };

  // Payment Hook
  const { checkoutLoadingPlan, handleCreateZaloPayOrder, handleCheckZaloPayStatus } =
    usePayment({ user, fetchWithAuth, refreshCurrentProfile });

  // Admin Hook
  const {
    allUsers,
    adminLoading,
    onlineUserIds,
    handleApproveUser,
    handleUpdateSubscription,
    handleDeleteUser,
  } = useAdmin({ user, profile, fetchWithAuth, activeTab });

  // Clipboard Hook
  const { copiedId, copyToClipboard } = useClipboard();

  // Derived state
  const isAdminRole = profile?.role === "admin" || user?.email === "devluan1996@gmail.com";
  const hasSub = profile?.subscription_plan && profile.subscription_plan !== "free";
  const canAccessCreate = !!(isAdminRole || hasSub);
  const bootstrappingAccess = authLoading || (!!user && profileBootstrapLoading);

  // Debug logging
  console.log("[Access Debug]", {
    isAdminRole,
    hasSub,
    canAccessCreate,
    profileRole: profile?.role,
    profilePlan: profile?.subscription_plan,
    userEmail: user?.email,
    bootstrappingAccess,
  });

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
                secondaryUrl={secondaryUrl}
                setSecondaryUrl={setSecondaryUrl}
                secondaryTargetType={secondaryTargetType}
                setSecondaryTargetType={setSecondaryTargetType}
                redirectDelayMs={redirectDelayMs}
                setRedirectDelayMs={setRedirectDelayMs}
                videoUrl={videoUrl}
                setVideoUrl={handleSetVideoUrl}
                uploadingVideo={uploadingVideo}
                videoUploadProgress={videoUploadProgress}
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
              onlineUserIds={onlineUserIds}
              handleApproveUser={handleApproveUser}
              handleUpdateSubscription={handleUpdateSubscription}
              handleDeleteUser={handleDeleteUser}
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
