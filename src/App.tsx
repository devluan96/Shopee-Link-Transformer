import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Clock,
  Menu,
} from 'lucide-react';
import { supabase, logout, registerWithEmail, loginWithEmail } from './lib/supabase';
import { User } from '@supabase/supabase-js';

// --- Types & Components ---
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

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Email Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Create Link State
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
  
  // List State
  const [links, setLinks] = useState<ConvertedLink[]>([]);
  const [analyticsData, setAnalyticsData] = useState<{ history: any[], topLinks: any[] }>({ history: [], topLinks: [] });
  const [listLoading, setListLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Admin State
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);

  // Global Copied State
  const [profileLoading, setProfileLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [stats, setStats] = useState({ totalLinks: 0, totalClicks: 0 });
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Check API Accessibility
  useEffect(() => {
    const apiBase = '/api';
    console.log('🔍 Diagnostic Info:', {
      href: window.location.href,
      origin: window.location.origin,
      pathname: window.location.pathname
    });

    fetch(`${apiBase}/health`, {
      headers: { 'Accept': 'application/json' }
    })
      .then(async r => {
        const text = await r.text();
        try {
          const json = JSON.parse(text);
          console.log('✅ API Health:', json);
        } catch (e) {
          console.error('❌ API Reachability issue (Not JSON):', text.substring(0, 200));
        }
      })
      .catch(e => console.error('❌ API Reachability issue (Network):', e));
  }, []);

  // Fetch Analytics
  const fetchAnalytics = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/v1/user/analytics?userId=${user.id}&_t=${Date.now()}`);
      const data = await res.json();
      setAnalyticsData(data);
    } catch (e) {
      console.error('Fetch analytics fail:', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab, user]);

  useEffect(() => {
    let profileChannel: any = null;

    // 1. Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth State Changed:', event, !!session);
      
      // Force logout on specific refresh errors to prevent infinite loops/stuck state
      if (event === 'INITIAL_SESSION' && !session) {
        // Just checking, but if we had an error here it usually appears in console
      }

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setAuthLoading(false);
        return;
      }

      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        try {
          // 🔍 Fetch existing profile carefully via proxy with retries
          let existingProfile = null;
          const fetchWithRetry = async (url: string, retries = 3, delay = 1000): Promise<any> => {
            for (let i = 0; i < retries; i++) {
              try {
                const res = await fetch(url);
                if (res.ok) return await res.json();
                if (res.status === 404) return null; // No profile yet
              } catch (err) {
                if (i === retries - 1) throw err;
                console.warn(`⏳ Fetch failed, retrying in ${delay}ms... (${i + 1}/${retries})`);
                await new Promise(r => setTimeout(r, delay));
              }
            }
          };

          try {
             const profileUrl = `${window.location.origin}/api/v1/user/profile?userId=${currentUser.id}&_t=${Date.now()}`;
             console.log('📡 Fetching profile via:', profileUrl);
             existingProfile = await fetchWithRetry(profileUrl);
             if (existingProfile) console.log('✅ Profile fetch success');
          } catch (fetchError: any) {
            console.error('❌ Error fetching profile via proxy:', fetchError);
            // Fallback to client-side fetch if proxy fails (though RLS might be an issue)
            try {
               const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).maybeSingle();
               if (data) existingProfile = data;
            } catch (fallbackError) {
               console.error('❌ Fallback profile fetch also failed');
            }
          }

          if (!existingProfile) {
            console.log('📝 Profile not found in DB. Creating initial record...');
            
            // Generate standard defaults
            const defaultName = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User';
            const defaultAvatar = currentUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.id}`;
            
            // Use server update proxy to insert initial data securely
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

            if (insertRes.ok) {
               const newProfile = await insertRes.json();
               setProfile(newProfile as UserProfile);
            }
          } else {
            console.log('✅ Profile found and loaded:', existingProfile.full_name);
            setProfile(existingProfile as UserProfile);
          }

          // Realtime Listener
          if (profileChannel) supabase.removeChannel(profileChannel);
          profileChannel = supabase
            .channel(`profile-${currentUser.id}`)
            .on('postgres_changes', { 
              event: 'UPDATE', 
              schema: 'public', 
              table: 'profiles', 
              filter: `id=eq.${currentUser.id}` 
            }, payload => {
              console.log('🔔 Profile updated via Realtime:', payload.new);
              setProfile(payload.new as UserProfile);
            })
            .subscribe();

        } catch (e) {
          console.error('Profile sync error:', e);
        } finally {
          setAuthLoading(false);
        }
      } else {
        setProfile(null);
        if (profileChannel) {
          supabase.removeChannel(profileChannel);
          profileChannel = null;
        }
        setAuthLoading(false);
      }
    });

    // Safety timeout: stop loading if no event fired in 5s
    const timer = setTimeout(() => {
      setAuthLoading(prev => {
        if (prev) console.warn('⚠️ Auth loading safety timeout triggered');
        return false;
      });
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
      if (profileChannel) supabase.removeChannel(profileChannel);
    };
  }, []);

  // Sync Tabs based on Admin
  useEffect(() => {
    const isAdminRole = profile?.role === 'admin' || user?.email === 'hqluan13081996@gmail.com' || user?.email === 'devluan1996@gmail.com';
    if (activeTab === 'admin' && !isAdminRole) {
      setActiveTab('dashboard');
    }
  }, [profile, user, activeTab]);

  // Fetch Data
  useEffect(() => {
    const isAdminRole = profile?.role === 'admin' || user?.email === 'hqluan13081996@gmail.com' || user?.email === 'devluan1996@gmail.com';
    const isApproved = profile?.status === 'approved' || isAdminRole;
    
    if (user && isApproved) {
      if (activeTab === 'list') fetchLinks();
      if (activeTab === 'dashboard') fetchStats();
      if (activeTab === 'admin' && isAdminRole) fetchAllUsers();
    }
  }, [user, profile, activeTab]);

  const fetchStats = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/v1/user/stats?userId=${user.id}&_t=${Date.now()}`);
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
      setAllUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleApproveUser = async (targetUid: string, status: boolean = true) => {
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

  const handleUpdateSubscription = async (targetUid: string, plan: 'free' | 'monthly' | 'yearly') => {
    if (!user) return;
    try {
      // Calculate expiry
      let expiry = null;
      if (plan === 'monthly') {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        expiry = d.toISOString();
      } else if (plan === 'yearly') {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 1);
        expiry = d.toISOString();
      }

      const response = await fetch(`/api/v1/admin/users/${targetUid}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, expiry, adminId: user.id }),
      });
      if (response.ok) {
        fetchAllUsers();
        alert(`Đã cập nhật gói ${plan} cho người dùng!`);
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi cập nhật gói cước');
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('🎬 Video input change detected:', file?.name, file?.size);
    if (!file) return;

    setUploadingVideo(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);

    const uploadUrl = '/api/v1/upload-video';
    console.log('🚀 Attempting POST to:', uploadUrl);

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData,
      });

      console.log('📡 Response received:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server returned error:', errorText);
        throw new Error(`Server error (${response.status}): ${errorText.substring(0, 100)}`);
      }

      const data = await response.json();
      console.log('✅ Upload Success Data:', data);
      if (data.secure_url) {
        setVideoUrl(data.secure_url);
        setVideoUploadSuccess(true);
        setTimeout(() => setVideoUploadSuccess(false), 5000); // Hide success after 5s
        setError(null);
        
        // Auto-generate thumbnail if not present
        if (!customImageUrl) {
          try {
            const thumbUrl = await captureVideoThumbnail(data.secure_url);
            setCustomImageUrl(thumbUrl);
          } catch (e) {
            console.error('Auto-thumb capture failed', e);
          }
        }
      } else if (data.error) {
        setError(`Lỗi Cloudinary: ${data.error.message}`);
      }
    } catch (err: any) {
      console.error('Video upload failed', err);
      setError(`Lỗi tải video: ${err.message || 'Không xác định'}`);
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleLogout = async () => {
    try {
      setAuthLoading(true);
      // Aggressive logout
      await supabase.auth.signOut({ scope: 'global' });
      // Clear all local states
      setUser(null);
      setProfile(null);
      // Force hard refresh to clear any cached sessions/states
      window.location.href = window.location.origin + '?logout=' + Date.now();
    } catch (e) {
      console.error('Logout error:', e);
      window.location.reload();
    } finally {
      setAuthLoading(false);
    }
  };

  const captureVideoThumbnail = async (vUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = vUrl;
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;
      video.playbackRate = 16; // Skip forward faster
      
      video.onloadeddata = () => {
        video.currentTime = 1.5; // Capture at 1.5s
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No context');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(async (blob) => {
          if (!blob) return reject('Blob failed');
          const thumbFormData = new FormData();
          thumbFormData.append('file', blob, 'thumb.jpg');
          
          try {
            const res = await fetch(`/api/v1/upload-video`, {
              method: 'POST',
              body: thumbFormData
            });
            
            if (!res.ok) {
              const text = await res.text();
              throw new Error(`Thumbnail upload failed (${res.status}): ${text.substring(0, 50)}`);
            }

            const data = await res.json();
            resolve(data.secure_url);
          } catch (e) {
            reject(e);
          }
        }, 'image/jpeg', 0.85);
      };

      video.onerror = (e) => reject(e);
      video.load();
    });
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !user) return;

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
      if (!response.ok) throw new Error(data.error || 'Conversion failed');

      setResult(data);
      if (activeTab === 'dashboard') fetchStats();
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

  const handleAvatarUpload = async (file: File) => {
    if (!user) {
      console.error('❌ Avatar upload failed: No authenticated user found');
      return null;
    }
    
    try {
      console.log('🚀 Starting Server-side Avatar upload proxy...');
      
      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('file', file);

      const res = await fetch('/api/v1/upload-avatar', {
        method: 'POST',
        body: formData
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('❌ Server returned non-JSON response:', text.slice(0, 500));
        throw new Error(`Server returned ${res.status} ${res.statusText}. Check console for details.`);
      }

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Server upload failed');
      }

      console.log('🔗 Proxy Upload Result:', data.secure_url);
      return data.secure_url;
    } catch (e: any) {
      console.error('❌ Proxy Avatar upload catch:', e);
      alert('Lỗi tải ảnh qua Server: ' + (e.message || 'Lỗi không xác định'));
      return null;
    }
  };

  const handleUpdateProfile = async (data: { full_name: string; avatar_url: string }) => {
    if (!user) {
      console.error('❌ Update failed: No user authenticated');
      alert('Lỗi: Bạn chưa đăng nhập!');
      return;
    }
    
    console.log('🚀 [App] START handleUpdateProfile (Proxy Mode)');
    console.log('📦 Payload:', data);
    
    setProfileLoading(true);
    try {
      console.log('📡 Fetching /api/v1/user/profile/update...');
      
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

      if (!res.ok) {
        throw new Error(resultData.error || 'Server proxy update failed');
      }
      
      console.log('✅ Proxy profile update Success:', resultData);
      
      // Update local state with the result from server
      setProfile(resultData as UserProfile);
      
      alert('Cập nhật thông tin thành công!');
      console.log('✨ handleUpdateProfile sequence complete');
    } catch (e: any) {
      console.error('❌ Fatal error in handleUpdateProfile (Proxy):', e);
      alert('Lỗi hệ thống: ' + (e.message || 'Không thể cập nhật hồ sơ qua Server'));
    } finally {
      console.log('🔃 Setting profileLoading to false');
      setProfileLoading(false);
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
        if (isRegistering) {
          await registerWithEmail(email, password);
        } else {
          await loginWithEmail(email, password);
        }
      } catch (err: any) {
        setAuthError(err.message || 'Authentication failed');
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

  const isAdminRole = profile?.role === 'admin' || user?.email === 'hqluan13081996@gmail.com' || user?.email === 'devluan1996@gmail.com';
  const hasSub = profile?.subscription_plan && profile.subscription_plan !== 'free';
  const canAccessCreate = isAdminRole || hasSub;

  if (profile && profile.status !== 'approved' && !isAdminRole) {
    return <PendingApproval handleLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:flex font-sans relative">
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
          <Zap className="text-orange-600 w-5 h-5 fill-current" />
          <span className="font-black text-gray-900 tracking-tight">HotsNew</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      <main className="flex-1 p-6 lg:p-12 min-h-screen pb-32">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <Overview 
              stats={stats}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'create' && (
            canAccessCreate ? (
              <CreateLink 
                url={url} setUrl={setUrl}
                customTitle={customTitle} setCustomTitle={setCustomTitle}
                customDescription={customDescription} setCustomDescription={setCustomDescription}
                customImageUrl={customImageUrl} setCustomImageUrl={setCustomImageUrl}
                videoUrl={videoUrl} setVideoUrl={setVideoUrl}
                uploadingVideo={uploadingVideo}
                videoUploadSuccess={videoUploadSuccess}
                videoInputRef={videoInputRef}
                handleVideoUpload={handleVideoUpload}
                handleConvert={handleConvert}
                loading={loading}
                error={error} setError={setError}
                result={result}
                copyToClipboard={copyToClipboard}
                copiedId={copiedId || ''}
              />
            ) : (
              <div className="p-12 text-center bg-white rounded-[3rem] border border-gray-100 shadow-sm max-w-2xl mx-auto mt-12">
                <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="text-orange-600 w-10 h-10 fill-current" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4">Nâng cấp tài khoản</h3>
                <p className="text-gray-500 font-medium mb-8">Tính năng chuyển đổi link Shopee & TikTok dành riêng cho tài khoản Premium. Vui lòng liên hệ Admin để nâng cấp gói cước!</p>
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs"
                >
                  Quay lại Dashboard
                </button>
              </div>
            )
          )}

          {(activeTab === 'admin' && isAdminRole) && (
            <AdminPanel 
              allUsers={allUsers}
              adminLoading={adminLoading}
              handleApproveUser={handleApproveUser}
              handleUpdateSubscription={handleUpdateSubscription}
            />
          )}

          {activeTab === 'list' && (
             <LinkList 
               links={links}
               listLoading={listLoading}
               searchTerm={searchTerm}
               setSearchTerm={setSearchTerm}
               copyToClipboard={copyToClipboard}
               copiedId={copiedId || ''}
             />
          )}

          {activeTab === 'analytics' && (
            <Analytics 
              analyticsData={analyticsData}
              linksCount={links.length}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileSettings 
              profile={profile}
              updating={profileLoading}
              onUpdate={handleUpdateProfile}
              onAvatarUpload={handleAvatarUpload}
            />
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
