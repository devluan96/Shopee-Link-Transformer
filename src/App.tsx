import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { User } from '@supabase/supabase-js';
import { supabase, registerWithEmail, loginWithEmail } from './lib/supabase';
import { ConvertedLink, UserProfile, Tab, LinkStats } from './types';
import { Sidebar } from './components/layout/Sidebar';
import { AuthScreen } from './components/auth/AuthScreen';
import { AdminPanel } from './components/admin/AdminPanel';
import { Overview } from './components/dashboard/Overview';
import { Analytics } from './components/dashboard/Analytics';
import { CreateLink } from './components/links/CreateLink';
import { LinkList } from './components/links/LinkList';
import { ProfileSettings } from './components/profile/ProfileSettings';
import { PendingApproval } from './components/PendingApproval';
import { Footer } from './components/layout/Footer';
import { PricingPage } from './components/billing/PricingPage';
import { PaymentStatusPage } from './components/billing/PaymentStatusPage';
import { getSubscriptionStatusLabel, hasActiveSubscription } from './lib/subscription';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [url, setUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUploadSuccess, setVideoUploadSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const [links, setLinks] = useState<ConvertedLink[]>([]);
  const [analyticsData, setAnalyticsData] = useState<{ history: any[], topLinks: any[] }>({ history: [], topLinks: [] });
  const [listLoading, setListLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [pendingDeleteUser, setPendingDeleteUser] = useState<UserProfile | null>(null);
  const [subscriptionUpdatingUserId, setSubscriptionUpdatingUserId] = useState<string | null>(null);
  const [checkoutLoadingPlan, setCheckoutLoadingPlan] = useState<'monthly' | 'yearly' | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'cancel' | null>(null);

  const [profileLoading, setProfileLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [stats, setStats] = useState<LinkStats>({
    totalLinks: 0,
    totalClicks: 0,
    recentClicks: [],
    topLinks: [],
  });

  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get('checkout');
    if (checkoutStatus === 'success') {
      setPaymentStatus('success');
      setActiveTab('pricing');
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (checkoutStatus === 'cancel') {
      setPaymentStatus('cancel');
      setActiveTab('pricing');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    fetch('/api/health', { headers: { Accept: 'application/json' } }).catch((e) => console.error('API health failed:', e));
  }, []);

  const fetchAnalytics = async (currentUserId: string) => {
    try {
      const res = await fetch(`/api/v1/user/analytics?userId=${currentUserId}&_t=${Date.now()}`);
      const data = await res.json();
      setAnalyticsData(data);
    } catch (e) {
      console.error('Fetch analytics fail:', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'analytics' && user) fetchAnalytics(user.id);
  }, [activeTab, user]);

  useEffect(() => {
    let profileChannel: any = null;

    const fetchProfile = async (currentUser: User) => {
      let existingProfile: any = null;
      try {
        const profileUrl = `${window.location.origin}/api/v1/user/profile?userId=${currentUser.id}&_t=${Date.now()}`;
        const res = await fetch(profileUrl);
        if (res.ok) existingProfile = await res.json();
      } catch (fetchError) {
        console.error('Profile proxy fetch failed:', fetchError);
      }

      if (!existingProfile) {
        try {
          const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).maybeSingle();
          if (data) existingProfile = data;
        } catch (fallbackError) {
          console.error('Profile fallback fetch failed:', fallbackError);
        }
      }

      if (!existingProfile) {
        const defaultName = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User';
        const defaultAvatar = currentUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.id}`;
        const insertRes = await fetch('/api/v1/user/profile/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            email: currentUser.email,
            full_name: defaultName,
            avatar_url: defaultAvatar
          })
        });
        if (insertRes.ok) existingProfile = await insertRes.json();
      }

      setProfile(existingProfile as UserProfile);

      if (profileChannel) supabase.removeChannel(profileChannel);
      profileChannel = supabase
        .channel(`profile-${currentUser.id}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${currentUser.id}`
        }, (payload) => {
          setProfile(payload.new as UserProfile);
        })
        .subscribe();
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setAuthLoading(false);
        return;
      }

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        if (profileChannel) {
          supabase.removeChannel(profileChannel);
          profileChannel = null;
        }
        setAuthLoading(false);
        return;
      }

      try {
        await fetchProfile(currentUser);
      } catch (e) {
        console.error('Profile sync error:', e);
      } finally {
        setAuthLoading(false);
      }
    });

    const timer = setTimeout(() => setAuthLoading(false), 5000);
    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
      if (profileChannel) supabase.removeChannel(profileChannel);
    };
  }, []);

  useEffect(() => {
    const isAdminRole = profile?.role === 'admin';
    if (activeTab === 'admin' && !isAdminRole) setActiveTab('dashboard');
  }, [profile, activeTab]);

  useEffect(() => {
    const isAdminRole = profile?.role === 'admin';
    const isApproved = profile?.status === 'approved' || isAdminRole;
    if (!user || !isApproved) return;
    if (activeTab === 'list') fetchLinks();
    if (activeTab === 'dashboard') fetchStats();
    if (activeTab === 'admin' && isAdminRole) fetchAllUsers();
  }, [user, profile, activeTab]);

  const fetchStats = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/v1/user/stats?userId=${user.id}&_t=${Date.now()}`);
      const data = await response.json();
      setStats({
        totalLinks: data.totalLinks || 0,
        totalClicks: data.totalClicks || 0,
        recentClicks: data.recentClicks || [],
        topLinks: data.topLinks || [],
      });
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLinks = async () => {
    if (!user) return;
    setListLoading(true);
    try {
      const response = await fetch(`/api/v1/user/links?userId=${user.id}&_t=${Date.now()}`);
      const data = await response.json();
      setLinks(data);
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
      const response = await fetch(`/api/v1/admin/users?adminId=${user.id}&_t=${Date.now()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Tải danh sách user thất bại');
      setAllUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleApproveUser = async (targetUid: string, status = true) => {
    if (!user) return;
    try {
      const response = await fetch(`/api/v1/admin/users/${targetUid}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: status, adminId: user.id }),
      });
      if (response.ok) fetchAllUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetSubscription = async (targetUid: string, plan: 'monthly' | 'yearly' | 'none') => {
    if (!user) return;
    setSubscriptionUpdatingUserId(targetUid);
    try {
      const response = await fetch(`/api/v1/admin/users/${targetUid}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: user.id, plan }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Cập nhật gói thất bại');
      setAllUsers((prev) => prev.map((item) => item.id === targetUid ? data as UserProfile : item));
      if (profile?.id === targetUid) setProfile(data as UserProfile);
    } catch (e: any) {
      console.error(e);
      alert(`Không thể cập nhật gói: ${e.message || 'Lỗi không xác định'}`);
    } finally {
      setSubscriptionUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (targetUser: UserProfile) => {
    if (!user) return;
    if (targetUser.id === user.id) {
      alert('Không thể xóa tài khoản đang đăng nhập.');
      return;
    }
    setPendingDeleteUser(targetUser);
  };

  const confirmDeleteUser = async () => {
    if (!user || !pendingDeleteUser) return;
    setDeletingUserId(pendingDeleteUser.id);
    try {
      const response = await fetch(`/api/v1/admin/users/${pendingDeleteUser.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: user.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Xóa người dùng thất bại');
      setAllUsers((prev) => prev.filter((item) => item.id !== pendingDeleteUser.id));
      setPendingDeleteUser(null);
    } catch (e: any) {
      console.error(e);
      alert(`Không thể xóa người dùng: ${e.message || 'Lỗi không xác định'}`);
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleCheckout = async (plan: 'monthly' | 'yearly') => {
    if (!user) return;
    setCheckoutLoadingPlan(plan);
    try {
      const response = await fetch('/api/v1/billing/zalopay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, plan }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Tạo phiên thanh toán ZaloPay thất bại');
      if (data.orderUrl) window.location.href = data.orderUrl;
    } catch (e: any) {
      console.error(e);
      alert(`Không thể tạo phiên thanh toán: ${e.message || 'Lỗi không xác định'}`);
    } finally {
      setCheckoutLoadingPlan(null);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!hasActiveSubscription(profile, profile?.role === 'admin')) {
      setError('Tài khoản chưa có gói đang hoạt động. Vui lòng mua gói để sử dụng tính năng này.');
      return;
    }

    setUploadingVideo(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', user.id);

    try {
      const response = await fetch('/api/v1/upload-video', { method: 'POST', headers: { Accept: 'application/json' }, body: formData });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error (${response.status}): ${errorText.substring(0, 100)}`);
      }
      const data = await response.json();
      if (data.secure_url) {
        setVideoUrl(data.secure_url);
        setVideoUploadSuccess(true);
        setTimeout(() => setVideoUploadSuccess(false), 5000);
        if (!customImageUrl) {
          try {
            const thumbUrl = await captureVideoThumbnail(data.secure_url);
            setCustomImageUrl(thumbUrl);
          } catch (thumbError) {
            console.error('Auto-thumb capture failed', thumbError);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi tải video');
    } finally {
      setUploadingVideo(false);
    }
  };

  const captureVideoThumbnail = async (videoSourceUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = videoSourceUrl;
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;
      video.onloadeddata = () => { video.currentTime = 1.5; };
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No context');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(async (blob) => {
          if (!blob || !user) return reject('Blob failed');
          const thumbFormData = new FormData();
          thumbFormData.append('file', blob, 'thumb.jpg');
          thumbFormData.append('userId', user.id);
          try {
            const res = await fetch('/api/v1/upload-video', { method: 'POST', body: thumbFormData });
            if (!res.ok) {
              const text = await res.text();
              throw new Error(`Thumbnail upload failed (${res.status}): ${text.substring(0, 50)}`);
            }
            const data = await res.json();
            resolve(data.secure_url);
          } catch (uploadError) {
            reject(uploadError);
          }
        }, 'image/jpeg', 0.85);
      };
      video.onerror = (err) => reject(err);
      video.load();
    });
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !user) return;
    if (!hasActiveSubscription(profile, profile?.role === 'admin')) {
      setError('Tài khoản chưa có gói đang hoạt động. Vui lòng mua gói để sử dụng tính năng này.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch('/api/v1/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          userId: user.id,
          email: user.email,
          customTitle,
          customDescription,
          customImageUrl,
          videoUrl
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Tạo link thất bại');
      setResult(data);
      if (activeTab === 'dashboard') fetchStats();
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

  const handleAvatarUpload = async (file: File) => {
    if (!user) return null;
    try {
      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('file', file);
      const res = await fetch('/api/v1/upload-avatar', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tải ảnh đại diện thất bại');
      return data.secure_url;
    } catch (e: any) {
      console.error('Avatar upload error:', e);
      alert(`Lỗi tải ảnh: ${e.message || 'Lỗi không xác định'}`);
      return null;
    }
  };

  const handleUpdateProfile = async (data: { full_name: string; avatar_url: string }) => {
    if (!user) return;
    setProfileLoading(true);
    try {
      const res = await fetch('/api/v1/user/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          full_name: data.full_name,
          avatar_url: data.avatar_url
        })
      });
      const resultData = await res.json();
      if (!res.ok) throw new Error(resultData.error || 'Cập nhật hồ sơ thất bại');
      setProfile(resultData as UserProfile);
      alert('Cập nhật thông tin thành công!');
    } catch (e: any) {
      console.error('Update profile error:', e);
      alert(`Lỗi hệ thống: ${e.message || 'Không thể cập nhật hồ sơ'}`);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setAuthLoading(true);
      await supabase.auth.signOut({ scope: 'global' });
      setUser(null);
      setProfile(null);
      window.location.href = `${window.location.origin}?logout=${Date.now()}`;
    } catch (e) {
      console.error('Logout error:', e);
      window.location.reload();
    } finally {
      setAuthLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    const handleEmailAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthError(null);
      setLoading(true);
      try {
        if (isRegistering) await registerWithEmail(email, password);
        else await loginWithEmail(email, password);
      } catch (err: any) {
        setAuthError(err.message || 'Đăng nhập thất bại');
      } finally {
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
        handleEmailAuth={handleEmailAuth}
      />
    );
  }

  const isAdminRole = profile?.role === 'admin';
  const canUseCreateFeatures = hasActiveSubscription(profile, isAdminRole);

  if (profile && profile.status !== 'approved' && !isAdminRole) {
    return <PendingApproval handleLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isActuallyAdmin={isAdminRole}
        userProfile={profile}
        userEmail={user.email}
        userStatusLabel={getSubscriptionStatusLabel(profile, isAdminRole)}
        handleLogout={handleLogout}
      />

      <main className="flex-1 p-6 lg:p-12 min-h-screen pb-32">
        <AnimatePresence mode="wait">
          {paymentStatus && (
            <PaymentStatusPage
              status={paymentStatus}
              onBackToPricing={() => {
                setPaymentStatus(null);
                setActiveTab('pricing');
              }}
            />
          )}

          {!paymentStatus && activeTab === 'dashboard' && (
            <Overview stats={stats} setActiveTab={setActiveTab} canUseCreateFeatures={canUseCreateFeatures} />
          )}

          {!paymentStatus && activeTab === 'pricing' && (
            <PricingPage
              profile={profile}
              isAdmin={isAdminRole}
              checkoutLoadingPlan={checkoutLoadingPlan}
              onCheckout={handleCheckout}
            />
          )}

          {!paymentStatus && activeTab === 'create' && (
            <CreateLink
              url={url}
              setUrl={setUrl}
              customTitle={customTitle}
              setCustomTitle={setCustomTitle}
              customDescription={customDescription}
              setCustomDescription={setCustomDescription}
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
              copiedId={copiedId || ''}
              canUseCreateFeatures={canUseCreateFeatures}
              onOpenPlans={() => setActiveTab('pricing')}
            />
          )}

          {!paymentStatus && activeTab === 'admin' && isAdminRole && (
            <AdminPanel
              allUsers={allUsers}
              adminLoading={adminLoading}
              handleApproveUser={handleApproveUser}
              handleDeleteUser={handleDeleteUser}
              handleSetSubscription={handleSetSubscription}
              currentUserId={user.id}
              deletingUserId={deletingUserId}
              subscriptionUpdatingUserId={subscriptionUpdatingUserId}
            />
          )}

          {!paymentStatus && activeTab === 'list' && (
            <LinkList
              links={links}
              listLoading={listLoading}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              copyToClipboard={copyToClipboard}
              copiedId={copiedId || ''}
            />
          )}

          {!paymentStatus && activeTab === 'analytics' && (
            <Analytics analyticsData={analyticsData} linksCount={links.length} />
          )}

          {!paymentStatus && activeTab === 'profile' && (
            <ProfileSettings
              profile={profile}
              updating={profileLoading}
              onUpdate={handleUpdateProfile}
              onAvatarUpload={handleAvatarUpload}
              onOpenPricing={() => setActiveTab('pricing')}
              isAdmin={isAdminRole}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {pendingDeleteUser && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
              <motion.div initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }} className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-7 shadow-2xl">
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-red-500">Xác nhận xóa</p>
                <h3 className="mt-3 text-2xl font-black text-slate-900">Xóa người dùng "{pendingDeleteUser.full_name || pendingDeleteUser.email}"?</h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">Thao tác này sẽ xóa profile, link, lịch sử click và tài khoản đăng nhập của user này.</p>
                <div className="mt-7 flex justify-end gap-3">
                  <button type="button" onClick={() => setPendingDeleteUser(null)} disabled={deletingUserId === pendingDeleteUser.id} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
                    Hủy
                  </button>
                  <button type="button" onClick={confirmDeleteUser} disabled={deletingUserId === pendingDeleteUser.id} className="rounded-2xl bg-red-500 px-5 py-3 text-sm font-black text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60">
                    {deletingUserId === pendingDeleteUser.id ? 'Đang xóa...' : 'Xóa người dùng'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
