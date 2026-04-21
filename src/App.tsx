import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Zap,
  PlusCircle,
  List,
  BarChart3,
  Settings,
  LogOut,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Trash2,
  AlertCircle,
  Clock,
  LayoutDashboard,
  ShieldCheck,
  ChevronRight,
  Globe,
  ArrowRight,
  Image as ImageIcon,
  Type,
  FileText,
  Search,
  Filter,
  Users as UsersIcon,
  Video as VideoIcon,
  UploadCloud,
  UserCheck,
  X,
  TrendingUp,
  MousePointer2,
  Activity,
  PieChart,
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
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/src/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  supabase,
  signInWithEmail,
  signUpWithEmail,
  signOutSupabase,
  uploadAvatarToSupabase,
} from "./lib/supabase";

const DEFAULT_AVATAR_URL =
  "https://ui-avatars.com/api/?name=HotsNew&background=F97316&color=FFFFFF&size=128";

// --- Types ---
interface ConvertedLink {
  id?: string;
  shortCode: string;
  originalUrl: string;
  customTitle?: string;
  customDescription?: string;
  customImageUrl?: string;
  videoUrl?: string;
  createdAt: any;
  userId: string;
}

interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  isApproved: boolean;
  isAdmin: boolean;
}

interface AuthUser {
  id: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

type Tab = "dashboard" | "create" | "list" | "analytics" | "admin" | "profile";

// --- Components ---

const SidebarItem = ({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm",
      active
        ? "bg-orange-600 text-white shadow-lg shadow-orange-200"
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
    )}
  >
    <Icon size={18} />
    {label}
  </button>
);

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  // Create Link State
  const [url, setUrl] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUploadSuccess, setVideoUploadSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // List State
  const [links, setLinks] = useState<ConvertedLink[]>([]);
  const [analyticsData, setAnalyticsData] = useState<{
    history: any[];
    topLinks: any[];
  }>({ history: [], topLinks: [] });
  const [listLoading, setListLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Admin State
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);

  const [profileName, setProfileName] = useState("");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState("");
  const [profileAvatarFile, setProfileAvatarFile] = useState<File | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaveMessage, setProfileSaveMessage] = useState<string | null>(
    null,
  );
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(
    null,
  );

  // Global Copied State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [stats, setStats] = useState({ totalLinks: 0, totalClicks: 0 });
  const statsFetchedRef = useRef(false);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Check API Accessibility
  useEffect(() => {
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
  const fetchAnalytics = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/v1/user/analytics?userId=${user.id}`);
      const data = await res.json();
      setAnalyticsData(data);
    } catch (e) {
      console.error("Fetch analytics fail:", e);
    }
  };

  useEffect(() => {
    if (activeTab === "analytics") {
      fetchAnalytics();
    }
  }, [activeTab, user]);
  useEffect(() => {
    let profileUnsubscribe: (() => void) | null = null;
    let subscription: any = null;

    const handleSession = async (session: any) => {
      if (profileUnsubscribe) {
        profileUnsubscribe();
        profileUnsubscribe = null;
      }

      const supaUser = session?.user;
      if (!supaUser) {
        setUser(null);
        setProfile(null);
        setAuthLoading(false);
        return;
      }

      const authUser: AuthUser = {
        id: supaUser.id,
        email: supaUser.email,
        displayName:
          (supaUser.user_metadata as any)?.full_name ||
          supaUser.email ||
          "User",
        photoURL:
          (supaUser.user_metadata as any)?.avatar_url || DEFAULT_AVATAR_URL,
      };

      setUser(authUser);

      const response = await fetch("/api/v1/user/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: authUser.id,
          email: authUser.email,
          displayName: authUser.displayName,
          photoURL: authUser.photoURL,
        }),
      });

      if (!response.ok) {
        console.error("Failed to load user profile", await response.text());
        const fallbackProfile: UserProfile = {
          uid: authUser.id,
          email: authUser.email || "",
          displayName: authUser.displayName || undefined,
          photoURL: authUser.photoURL || DEFAULT_AVATAR_URL,
          isApproved: false,
          isAdmin: false,
        };
        setProfile(fallbackProfile);
        setProfileName(fallbackProfile.displayName || "");
        setProfileAvatarUrl(fallbackProfile.photoURL || DEFAULT_AVATAR_URL);
        setUser({
          ...authUser,
          photoURL: fallbackProfile.photoURL,
        });
        setAuthLoading(false);
        return;
      }

      const profileData = (await response.json()) as UserProfile;
      const profileAvatar =
        profileData.photoURL || authUser.photoURL || DEFAULT_AVATAR_URL;
      const profileNameValue =
        profileData.displayName || authUser.displayName || "";

      setProfile(profileData);
      setUser({
        ...authUser,
        displayName: profileNameValue,
        photoURL: profileAvatar,
      });
      setProfileName(profileNameValue);
      setProfileAvatarUrl(profileAvatar);
      setAuthLoading(false);
    };

    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();
      await handleSession(data.session);

      const { data: listener } = supabase.auth.onAuthStateChange(
        (_, session) => {
          handleSession(session);
        },
      );
      subscription = listener.subscription;
    };

    initAuth();

    return () => {
      if (subscription) subscription.unsubscribe();
      if (profileUnsubscribe) profileUnsubscribe();
    };
  }, []);

  // Sync Tabs based on Admin
  useEffect(() => {
    if (
      activeTab === "admin" &&
      !profile?.isAdmin &&
      profile?.email !== "hqluan13081996@gmail.com"
    ) {
      setActiveTab("dashboard");
    }
  }, [profile, activeTab]);

  // Fetch Data
  useEffect(() => {
    if (!user || !profile?.isApproved) {
      statsFetchedRef.current = false;
      return;
    }

    if (activeTab === "list") {
      fetchLinks();
    }

    if (activeTab === "dashboard") {
      if (!statsFetchedRef.current) {
        fetchStats();
        statsFetchedRef.current = true;
      }
    } else {
      statsFetchedRef.current = false;
    }

    if (
      activeTab === "admin" &&
      (profile?.isAdmin || profile?.email === "hqluan13081996@gmail.com")
    ) {
      fetchAllUsers();
    }
  }, [user, profile, activeTab]);

  const fetchStats = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/v1/user/stats?userId=${user.id}`);
      const data = await response.json();
      setStats(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleProfileSave = async () => {
    if (!user) return;
    setProfileSaving(true);
    setProfileSaveMessage(null);

    try {
      const response = await fetch("/api/v1/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          displayName: profileName,
          photoURL: profileAvatarUrl,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to save profile");
      }

      const data = await response.json();
      setProfile((current) =>
        current
          ? {
              ...current,
              displayName: profileName,
              photoURL: profileAvatarUrl,
            }
          : {
              uid: user.id,
              email: user.email || "",
              displayName: profileName,
              photoURL: profileAvatarUrl,
              isApproved: true,
              isAdmin: false,
            },
      );
      setUser((current) =>
        current
          ? {
              ...current,
              displayName: profileName,
              photoURL: profileAvatarUrl,
            }
          : current,
      );
      setProfileSaveMessage("Lưu hồ sơ thành công.");
    } catch (err: any) {
      console.error("Profile save failed", err);
      setProfileSaveMessage(err.message || "Lưu hồ sơ thất bại.");
    } finally {
      setProfileSaving(false);
    }
  };

  const fetchLinks = async () => {
    if (!user) return;
    setListLoading(true);
    try {
      const response = await fetch(`/api/v1/user/links?userId=${user.id}`);
      const data = await response.json();
      setLinks(
        data.sort(
          (a: any, b: any) => b.createdAt?._seconds - a.createdAt?._seconds,
        ),
      );
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
      const response = await fetch(`/api/v1/admin/users?adminId=${user.id}`);
      const data = await response.json();
      setAllUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleApproveUser = async (targetUid: string) => {
    if (!user) return;
    try {
      const response = await fetch(`/api/v1/admin/users/${targetUid}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: user.id }),
      });
      if (response.ok) fetchAllUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAvatarFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0] || null;
    setAvatarUploadError(null);
    setProfileAvatarFile(file);

    if (!file || !user) {
      return;
    }

    setProfileSaving(true);
    try {
      const publicUrl = await uploadAvatarToSupabase(file, user.id);
      setProfileAvatarUrl(publicUrl);
      setProfileSaveMessage("Avatar đã được tải lên và sẵn sàng lưu.");
    } catch (err: any) {
      console.error("Avatar upload failed", err);
      setAvatarUploadError(err.message || "Tải avatar thất bại.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("🎬 Video input change detected:", file?.name, file?.size);
    if (!file) return;

    setUploadingVideo(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    const uploadUrl = "/api/v1/upload-video";
    console.log("🚀 Attempting POST to:", uploadUrl);

    try {
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });

      console.log(
        "📡 Response received:",
        response.status,
        response.statusText,
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Server returned error:", errorText);
        throw new Error(
          `Server error (${response.status}): ${errorText.substring(0, 100)}`,
        );
      }

      const data = await response.json();
      console.log("✅ Upload Success Data:", data);
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
            console.error("Auto-thumb capture failed", e);
          }
        }
      } else if (data.error) {
        setError(`Lỗi Cloudinary: ${data.error.message}`);
      }
    } catch (err: any) {
      console.error("Video upload failed", err);
      setError(`Lỗi tải video: ${err.message || "Không xác định"}`);
    } finally {
      setUploadingVideo(false);
    }
  };

  const captureVideoThumbnail = async (vUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.src = vUrl;
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.playsInline = true;
      video.playbackRate = 16; // Skip forward faster

      video.onloadeddata = () => {
        video.currentTime = 1.5; // Capture at 1.5s
      };

      video.onseeked = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("No context");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          async (blob) => {
            if (!blob) return reject("Blob failed");
            const thumbFormData = new FormData();
            thumbFormData.append("file", blob, "thumb.jpg");

            try {
              const res = await fetch(`/api/v1/upload-video`, {
                method: "POST",
                body: thumbFormData,
              });

              if (!res.ok) {
                const text = await res.text();
                throw new Error(
                  `Thumbnail upload failed (${res.status}): ${text.substring(0, 50)}`,
                );
              }

              const data = await res.json();
              resolve(data.secure_url);
            } catch (e) {
              reject(e);
            }
          },
          "image/jpeg",
          0.85,
        );
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
      const response = await fetch("/api/v1/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          userId: user.id,
          email: user.email,
          customTitle,
          customDescription,
          customImageUrl,
          videoUrl,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Conversion failed");

      setResult(data);
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) {
    const handleEmailAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      try {
        if (authMode === "login") {
          await signInWithEmail(authEmail, authPassword);
        } else {
          await signUpWithEmail(authEmail, authPassword);
        }
      } catch (err: any) {
        setError(err.message || "Đã xảy ra lỗi khi đăng nhập");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-orange-200">
              <Zap className="text-white w-8 h-8 fill-current" />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-2">
              HotsNew{" "}
              <span className="text-orange-600 uppercase italic">click</span>
            </h1>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
              Tiếp thị liên kết thông minh
            </p>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden relative">
            <div className="flex bg-gray-50 p-1 rounded-2xl mb-8">
              <button
                onClick={() => setAuthMode("login")}
                className={cn(
                  "flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                  authMode === "login"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-400 hover:text-gray-600",
                )}
              >
                Đăng nhập
              </button>
              <button
                onClick={() => setAuthMode("signup")}
                className={cn(
                  "flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                  authMode === "signup"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-400 hover:text-gray-600",
                )}
              >
                Đăng ký
              </button>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  Email address
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <UsersIcon size={16} />
                  </span>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-xl outline-none transition-all font-medium text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <ShieldCheck size={16} />
                  </span>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-xl outline-none transition-all font-medium text-sm"
                  />
                </div>
              </div>

              {error && (
                <div className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : authMode === "signup" ? (
                  "Tạo tài khoản"
                ) : (
                  "Vào hệ thống"
                )}
                {!loading && <ArrowRight size={14} />}
              </button>
            </form>

            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-gray-100"></div>
              <span className="flex-shrink mx-4 text-[10px] font-black uppercase tracking-widest text-gray-300">
                Hoặc
              </span>
              <div className="flex-grow border-t border-gray-100"></div>
            </div>

            <button
              // onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-gray-100 rounded-2xl hover:bg-gray-50 hover:border-orange-200 transition-all font-bold text-gray-700 active:scale-95 group"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                className="w-5 h-5"
              />
              Sử dụng Google
            </button>
          </div>

          <p className="text-center mt-8 text-xs text-gray-400 font-medium italic">
            Bằng cách tiếp tục, bạn đồng ý với các Điều khoản dịch vụ của
            Hotsnew.
          </p>
        </motion.div>
      </div>
    );
  }
  // if (!user) {
  //   return (
  //     <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-6 font-sans">
  //       <motion.div
  //         initial={{ opacity: 0, y: 20 }}
  //         animate={{ opacity: 1, y: 0 }}
  //         className="max-w-md w-full text-center"
  //       >
  //         <div className="w-20 h-20 bg-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-orange-200">
  //           <Zap className="text-white w-10 h-10 fill-current" />
  //         </div>
  //         <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-4">
  //           HotsNew <span className="text-orange-600">TRANSFORMER</span>
  //         </h1>
  //         <p className="text-gray-500 text-lg mb-10 leading-relaxed">
  //           Hệ thống quản lý link tiếp thị liên kết thông minh trên tên miền{" "}
  //           <span className="text-orange-600 font-bold">hotsnew.click</span>
  //         </p>

  //         <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 mb-8">
  //           <form
  //             onSubmit={async (e) => {
  //               e.preventDefault();
  //               setError(null);
  //               setLoading(true);

  //               try {
  //                 if (authMode === "login") {
  //                   await signInWithEmail(authEmail, authPassword);
  //                 } else {
  //                   await signUpWithEmail(authEmail, authPassword);
  //                 }
  //               } catch (err: any) {
  //                 setError(err.message || "Đã xảy ra lỗi khi đăng nhập");
  //               } finally {
  //                 setLoading(false);
  //               }
  //             }}
  //             className="space-y-6"
  //           >
  //             <div className="text-left">
  //               <label className="block text-sm font-semibold text-gray-700 mb-2">
  //                 Email
  //               </label>
  //               <input
  //                 type="email"
  //                 value={authEmail}
  //                 onChange={(e) => setAuthEmail(e.target.value)}
  //                 required
  //                 className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-200"
  //               />
  //             </div>
  //             <div className="text-left">
  //               <label className="block text-sm font-semibold text-gray-700 mb-2">
  //                 Mật khẩu
  //               </label>
  //               <input
  //                 type="password"
  //                 value={authPassword}
  //                 onChange={(e) => setAuthPassword(e.target.value)}
  //                 required
  //                 className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-200"
  //               />
  //             </div>
  //             {error && (
  //               <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl p-3">
  //                 {error}
  //               </div>
  //             )}
  //             <button
  //               type="submit"
  //               disabled={loading}
  //               className="w-full flex items-center justify-center gap-3 py-4 bg-orange-600 text-white rounded-2xl hover:bg-orange-700 transition-all font-bold disabled:cursor-not-allowed disabled:opacity-60"
  //             >
  //               {loading
  //                 ? authMode === "login"
  //                   ? "Đang đăng nhập..."
  //                   : "Đang đăng ký..."
  //                 : authMode === "login"
  //                   ? "Đăng nhập bằng email"
  //                   : "Đăng ký bằng email"}
  //             </button>
  //             <button
  //               type="button"
  //               onClick={() => {
  //                 setAuthMode(authMode === "login" ? "signup" : "login");
  //                 setError(null);
  //               }}
  //               className="w-full text-sm text-center text-orange-600 font-semibold"
  //             >
  //               {authMode === "login"
  //                 ? "Chưa có tài khoản? Đăng ký"
  //                 : "Đã có tài khoản? Đăng nhập"}
  //             </button>
  //           </form>
  //         </div>
  //       </motion.div>
  //     </div>
  //   );
  // }

  const isActuallyAdmin =
    profile?.isAdmin || profile?.email === "hqluan13081996@gmail.com";
  if (!profile?.isApproved && !isActuallyAdmin) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-6 text-center">
        <Clock size={64} className="text-blue-500 mb-6 animate-pulse" />
        <h2 className="text-3xl font-black text-gray-900 mb-4">
          Đang Chờ Duyệt
        </h2>
        <p className="text-gray-500 mb-8 max-w-sm">
          Chào mừng bạn gia nhập cộng đồng <b>hotsnew.click</b>. Tài khoản đang
          chờ kích hoạt từ Admin.
        </p>
        <button
          onClick={signOutSupabase}
          className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold"
        >
          Đăng xuất
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* --- Sidebar --- */}
      <aside className="w-72 bg-white border-r border-gray-200 hidden lg:flex flex-col p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-100">
            <Zap className="text-white w-6 h-6 fill-current" />
          </div>
          <span className="font-black text-xl tracking-tight">
            HOTSNEW<span className="text-orange-600">.CLICK</span>
          </span>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem
            icon={LayoutDashboard}
            label="Tổng quan"
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
          />
          <SidebarItem
            icon={PlusCircle}
            label="Tạo Link"
            active={activeTab === "create"}
            onClick={() => setActiveTab("create")}
          />
          <SidebarItem
            icon={List}
            label="Quản lý Link"
            active={activeTab === "list"}
            onClick={() => setActiveTab("list")}
          />
          <SidebarItem
            icon={BarChart3}
            label="Hiệu quả"
            active={activeTab === "analytics"}
            onClick={() => setActiveTab("analytics")}
          />
          <SidebarItem
            icon={UserCheck}
            label="Hồ sơ"
            active={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
          />

          {isActuallyAdmin && (
            <SidebarItem
              icon={UsersIcon}
              label="Quản lý User"
              active={activeTab === "admin"}
              onClick={() => setActiveTab("admin")}
            />
          )}
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-6 p-2">
            <img src={user.photoURL || ""} className="w-10 h-10 rounded-full" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                {user.displayName}
              </p>
              <p className="text-[10px] text-green-600 font-bold uppercase">
                {isActuallyAdmin ? "Administrator" : "Premium Member"}
              </p>
            </div>
          </div>
          <button
            onClick={signOutSupabase}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 font-bold text-sm transition-all"
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 p-6 lg:p-12 max-w-7xl mx-auto w-full pb-32 lg:pb-12">
        <AnimatePresence mode="wait">
          {/* --- DASHBOARD TAB --- */}
          {activeTab === "dashboard" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              key="dashboard"
              className="space-y-10"
            >
              {/* Header section with profile summary */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100">
                <div>
                  <h2 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">
                    Xin chào, {user.displayName?.split(" ")[0]}! 👋
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase tracking-wider">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />{" "}
                      System Active
                    </span>
                    <span className="text-xs text-gray-400 font-bold font-mono">
                      domain: hotsnew.click
                    </span>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setActiveTab("create")}
                    className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-lg shadow-orange-100"
                  >
                    <PlusCircle size={16} /> Link Mới
                  </button>
                </div>
              </div>

              {/* Enhanced Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    label: "Tài nguyên Link",
                    value: stats.totalLinks,
                    icon: Zap,
                    color: "text-orange-600",
                    bg: "bg-orange-50",
                    footer: "Cập nhật từ Database",
                  },
                  {
                    label: "Lượt Clicks",
                    value: stats.totalClicks,
                    icon: MousePointer2,
                    color: "text-blue-600",
                    bg: "bg-blue-50",
                    footer: "Xác thực IP thời gian thực",
                  },
                  {
                    label: "Trạng thái",
                    value: "Verified",
                    icon: ShieldCheck,
                    color: "text-green-600",
                    bg: "bg-green-50",
                    footer: "Acc: Premium Access",
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="group bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
                  >
                    <div
                      className={`w-12 h-12 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                    >
                      <s.icon size={24} />
                    </div>
                    <div className="space-y-1 mb-6">
                      <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest leading-none">
                        {s.label}
                      </p>
                      <p className="text-4xl font-black text-gray-900 tracking-tighter">
                        {s.value}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-gray-50 flex items-center gap-2 text-[10px] font-bold text-gray-400 italic">
                      <Activity size={12} className="text-green-500" />{" "}
                      {s.footer}
                    </div>
                  </div>
                ))}
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Promo Card (Left 3 columns) */}
                <div className="lg:col-span-3 bg-gray-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl flex flex-col justify-end min-h-[350px]">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-orange-600/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-600/10 rounded-full blur-[60px] translate-y-1/4 -translate-x-1/4" />

                  <div className="relative z-10 space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                      <VideoIcon size={12} className="text-orange-500" /> Video
                      Landing Page
                    </div>
                    <h3 className="text-3xl font-black leading-tight max-w-sm font-sans tracking-tight">
                      Tối ưu tỷ lệ Click với Landing mờ ảo.
                    </h3>
                    <p className="text-gray-400 max-w-md font-medium text-sm leading-relaxed">
                      Kết hợp Cloudinary Stream và Shopee URLs để tạo ra trải
                      nghiệm chuyển hướng mượt mà, đầy sức hút.
                    </p>
                    <button
                      onClick={() => setActiveTab("create")}
                      className="bg-orange-600 inline-flex items-center gap-2 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-xs hover:bg-orange-500 transition-all active:scale-95 group"
                    >
                      Bắt đầu chiến dịch{" "}
                      <ArrowRight
                        size={16}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </button>
                  </div>
                </div>

                {/* Info Card (Right 2 columns) */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex-1">
                    <div className="flex items-center justify-between mb-8">
                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                        Quy trình Hoạt động
                      </h4>
                      <div className="w-6 h-6 bg-gray-50 rounded-lg flex items-center justify-center text-gray-300">
                        <ChevronRight size={14} />
                      </div>
                    </div>
                    <div className="space-y-6">
                      {[
                        {
                          step: "01",
                          title: "Upload Video",
                          desc: "Lưu trữ trực tiếp trên Cloudinary SDK.",
                          color: "text-orange-500",
                        },
                        {
                          step: "02",
                          title: "Dán Link Shopee",
                          desc: "Xác thực URL tự động từ hệ thống.",
                          color: "text-blue-500",
                        },
                        {
                          step: "03",
                          title: "Tạo Mã Ngắn",
                          desc: "Redirect 302 bảo mật cao.",
                          color: "text-green-500",
                        },
                      ].map((item, idx) => (
                        <div key={idx} className="flex gap-4">
                          <div
                            className={`text-xs font-black ${item.color} font-mono mt-1`}
                          >
                            {item.step}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-gray-400 font-medium leading-tight">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-[2.5rem] text-white shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <Globe size={20} className="text-blue-200" />
                      <h4 className="text-xs font-black uppercase tracking-widest">
                        News & Ops
                      </h4>
                    </div>
                    <p className="text-sm font-bold leading-snug mb-4">
                      Module Phân tích Luồng (Analytics v2.0) đã được kích hoạt
                      thành công trên hệ thống.
                    </p>
                    <button
                      onClick={() => setActiveTab("analytics")}
                      className="text-[10px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all"
                    >
                      Khám phá ngay
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Links Quick Look */}
              {links.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                      Tài nguyên gần đây
                    </h3>
                    <button
                      onClick={() => setActiveTab("list")}
                      className="text-[10px] font-black text-orange-600 uppercase tracking-widest hover:underline"
                    >
                      Xem tất cả
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {links.slice(0, 3).map((l, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all"
                      >
                        <div className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden shrink-0">
                          {l.videoUrl ? (
                            <div className="w-full h-full bg-gray-900 flex items-center justify-center text-white">
                              <VideoIcon size={18} />
                            </div>
                          ) : l.customImageUrl ? (
                            <img
                              src={l.customImageUrl}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon size={20} className="text-gray-200" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-gray-900 truncate">
                            {l.customTitle || "Không tên"}
                          </p>
                          <p className="text-[10px] font-bold text-gray-400 font-mono tracking-tighter truncate">
                            /s/{l.shortCode}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `https://hotsnew.click/s/${l.shortCode}`,
                            );
                            setCopiedId(l.id || null);
                            setTimeout(() => setCopiedId(null), 2000);
                          }}
                          className="p-2 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-all text-gray-300"
                        >
                          {copiedId === l.id ? (
                            <Check size={16} className="text-green-500" />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* --- CREATE LINK TAB --- */}
          {activeTab === "profile" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              key="profile"
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100">
                <div>
                  <h2 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">
                    Quản lý hồ sơ
                  </h2>
                  <p className="text-gray-500 max-w-2xl">
                    Cập nhật tên hiển thị và avatar cá nhân. Avatar sẽ được lưu
                    vào Supabase profiles.
                  </p>
                </div>
                <button
                  onClick={handleProfileSave}
                  disabled={profileSaving}
                  className="bg-orange-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange-500 transition-all disabled:opacity-60"
                >
                  {profileSaving ? "Đang lưu..." : "Lưu hồ sơ"}
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-28 h-28 rounded-full overflow-hidden border border-gray-200 bg-gray-100">
                      {profileAvatarUrl ? (
                        <img
                          src={profileAvatarUrl}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <UserCheck size={34} />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 text-center">
                      Dán URL avatar hoặc dùng ảnh hiện có
                    </p>
                  </div>
                </div>
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tên hiển thị
                    </label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      URL Avatar
                    </label>
                    <input
                      type="url"
                      value={profileAvatarUrl}
                      onChange={(e) => setProfileAvatarUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Hoặc chọn ảnh từ máy tính
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-200"
                    />
                    {avatarUploadError && (
                      <p className="mt-2 text-sm text-red-600">
                        {avatarUploadError}
                      </p>
                    )}
                    {profileAvatarFile && (
                      <p className="mt-2 text-sm text-gray-500">
                        Chọn file: {profileAvatarFile.name}
                      </p>
                    )}
                  </div>
                  {profileSaveMessage && (
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                      {profileSaveMessage}
                    </div>
                  )}
                  <div className="text-sm text-gray-500">
                    Lưu ý:
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>
                        Trên Supabase, tạo bucket Storage tên{" "}
                        <code>avatars</code>.
                      </li>
                      <li>
                        Bucket nên đặt public để có thể lấy URL trực tiếp.
                      </li>
                      <li>
                        App sẽ upload ảnh vào bucket và lưu URL đó vào{" "}
                        <code>profiles.avatar_url</code>.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "create" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              key="create"
            >
              <header className="mb-12">
                <h2 className="text-3xl font-black text-gray-900 mb-2">
                  Tạo Link Transformer
                </h2>
                <p className="text-gray-500 font-medium italic">
                  Tùy chỉnh tiêu đề, hình ảnh và video cho hotsnew.click
                </p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="bg-red-50 border-2 border-red-100 p-4 rounded-2xl flex items-start gap-3 text-red-600 mb-4"
                    >
                      <AlertCircle className="shrink-0 mt-0.5" size={18} />
                      <div className="text-sm font-bold">
                        {error}
                        <button
                          onClick={() => setError(null)}
                          className="block mt-1 text-[10px] uppercase underline"
                        >
                          Đóng thông báo
                        </button>
                      </div>
                    </motion.div>
                  )}
                  <form
                    onSubmit={handleConvert}
                    className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-6"
                  >
                    <div>
                      <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3 px-1">
                        <Globe size={14} /> Link Shopee Gốc
                      </label>
                      <input
                        type="url"
                        required
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Dán link sản phẩm Shopee..."
                        className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl transition-all focus:border-orange-500/20 focus:bg-white outline-none font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3 px-1">
                            <Type size={14} /> Tiêu đề tùy chỉnh
                          </label>
                          <input
                            type="text"
                            value={customTitle}
                            onChange={(e) => setCustomTitle(e.target.value)}
                            placeholder="Tiêu đề hiển thị..."
                            className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl transition-all outline-none font-medium"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3 px-1">
                            <Type size={14} /> Mô tả bài viết
                          </label>
                          <input
                            type="text"
                            value={customDescription}
                            onChange={(e) =>
                              setCustomDescription(e.target.value)
                            }
                            placeholder="Mô tả thu hút lượt click..."
                            className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl transition-all outline-none font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3 px-1">
                          <VideoIcon size={14} /> Đính kèm Video (Tùy chọn)
                        </label>
                        <input
                          type="file"
                          accept="video/*"
                          ref={videoInputRef}
                          onChange={handleVideoUpload}
                          className="hidden"
                        />
                        <div className="space-y-4">
                          <button
                            type="button"
                            onClick={() => videoInputRef.current?.click()}
                            className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl hover:border-orange-200 transition-all group"
                          >
                            <div className="flex items-center gap-3 text-gray-400 font-bold group-hover:text-orange-600">
                              <UploadCloud size={20} />
                              {uploadingVideo
                                ? "Đang tải video..."
                                : videoUrl
                                  ? "Thay đổi video"
                                  : "Chọn video bài viết"}
                            </div>
                            {videoUrl && <Check className="text-green-500" />}
                          </button>

                          {videoUploadSuccess && (
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center gap-2 text-[10px] font-black text-green-600 bg-green-50 px-4 py-2 rounded-xl uppercase tracking-widest"
                            >
                              <ShieldCheck size={14} /> Tải video lên Cloudinary
                              thành công!
                            </motion.div>
                          )}

                          {videoUrl && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="relative aspect-video rounded-2xl overflow-hidden bg-black shadow-lg"
                            >
                              <video
                                src={videoUrl}
                                controls
                                className="w-full h-full"
                              />
                              <button
                                type="button"
                                onClick={() => setVideoUrl("")}
                                className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black transition-all"
                              >
                                <X size={16} />
                              </button>
                            </motion.div>
                          )}
                        </div>
                      </div>

                      {!videoUrl && (
                        <div>
                          <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3 px-1">
                            <ImageIcon size={14} /> Thumbnail URL
                          </label>
                          <input
                            type="url"
                            value={customImageUrl}
                            onChange={(e) => setCustomImageUrl(e.target.value)}
                            placeholder="Link ảnh cover..."
                            className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl transition-all outline-none font-medium"
                          />
                        </div>
                      )}
                    </div>

                    <button
                      disabled={loading || !url || uploadingVideo}
                      className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-100 hover:bg-orange-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    >
                      {loading ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          Tạo Link Landing <ArrowRight size={20} />
                        </>
                      )}
                    </button>
                  </form>
                </div>

                <div className="space-y-6">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 px-1">
                    Facebook Share Preview
                  </h3>
                  <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-2xl relative">
                    {/* Blur Mock for Preview */}
                    {!result && (
                      <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10 flex items-center justify-center p-6 text-center">
                        <p className="bg-gray-900 text-white px-4 py-2 rounded-full font-bold text-[10px] uppercase">
                          Review Mode
                        </p>
                      </div>
                    )}
                    <div className="aspect-[12/6.3] bg-gray-100 flex items-center justify-center relative">
                      {videoUrl ? (
                        <video
                          src={videoUrl}
                          muted
                          autoPlay
                          loop
                          className="w-full h-full object-cover"
                        />
                      ) : customImageUrl ? (
                        <img
                          src={customImageUrl}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon size={48} className="text-gray-200" />
                      )}
                    </div>
                    <div className="p-6 bg-[#F2F3F5]">
                      <p className="text-[11px] text-gray-500 uppercase font-bold mb-1">
                        HOTSNEW.CLICK
                      </p>
                      <h4 className="text-lg font-bold text-gray-900 leading-tight mb-2 line-clamp-2">
                        {customTitle ||
                          "Tiêu đề của bạn sẽ xuất hiện tại đây..."}
                      </h4>
                      <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed opacity-60">
                        {customDescription ||
                          "Hệ thống sẽ tự động tạo Landing Page chứa video và tiêu đề chuyên nghiệp như một trang tin tức thực thụ."}
                      </p>
                    </div>
                  </div>

                  {/* Result Panel */}
                  <div
                    className={cn(
                      "p-8 rounded-[2.5rem] border-2 transition-all duration-500",
                      result
                        ? "bg-white border-orange-100 shadow-xl"
                        : "bg-gray-50 border-gray-100 opacity-50 pointer-events-none grayscale",
                    )}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">
                        Short Link ID: {result?.shortCode || "########"}
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(result?.converted_url, "res")
                        }
                        className="p-2 hover:bg-orange-50 rounded-lg text-orange-600 transition-all"
                      >
                        {copiedId === "res" ? (
                          <Check size={18} />
                        ) : (
                          <Copy size={18} />
                        )}
                      </button>
                    </div>
                    <div className="bg-gray-50 p-5 rounded-2xl font-bold text-xs truncate mb-8 text-gray-500">
                      {result?.converted_url ||
                        "https://hotsnew.click/s/########"}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() =>
                          copyToClipboard(result?.converted_url, "res")
                        }
                        disabled={!result}
                        className="py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-orange-700 transition-all"
                      >
                        <Copy size={16} /> Copy Link
                      </button>
                      <button
                        disabled={!result}
                        className="py-4 bg-white border border-gray-200 text-gray-900 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
                      >
                        <QrCode size={16} /> QR Code
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* --- ADMIN TAB --- */}
          {activeTab === "admin" && isActuallyAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              key="admin"
            >
              <header className="mb-12">
                <h2 className="text-3xl font-black text-gray-900 mb-2">
                  Quản Lý Người Dùng
                </h2>
                <p className="text-gray-500 font-medium italic">
                  Kích hoạt và phê duyệt thành viên mới tham gia hotsnew.click
                </p>
              </header>

              <div className="bg-white rounded-[3rem] border border-gray-100 overflow-hidden shadow-sm">
                <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                    <UsersIcon size={18} /> Thành viên hệ thống
                  </h3>
                  <span className="bg-gray-900 text-white px-3 py-1 rounded-full text-[10px] font-bold">
                    {allUsers.length} Users
                  </span>
                </div>

                <div className="divide-y divide-gray-100">
                  {adminLoading ? (
                    <div className="p-20 text-center text-gray-300 font-bold">
                      Loading users...
                    </div>
                  ) : (
                    allUsers.map((u) => (
                      <div
                        key={u.uid}
                        className="p-6 flex items-center justify-between gap-6 hover:bg-gray-50 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={u.photoURL || "https://via.placeholder.com/40"}
                            className="w-12 h-12 rounded-full ring-2 ring-white shadow-md"
                          />
                          <div>
                            <p className="font-bold text-gray-900">
                              {u.displayName || "Unnamed User"}
                            </p>
                            <p className="text-xs text-gray-400 font-medium">
                              {u.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {u.isApproved ? (
                            <span className="flex items-center gap-1.5 text-[10px] font-black text-green-600 bg-green-50 px-3 py-1.5 rounded-full uppercase tracking-tighter">
                              <Check size={10} /> Đã Duyệt
                            </span>
                          ) : (
                            <button
                              onClick={() => handleApproveUser(u.uid)}
                              className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-orange-700 transition-all active:scale-95"
                            >
                              <UserCheck size={16} /> Duyệt Ngay
                            </button>
                          )}
                          <button className="p-3 bg-gray-100 text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* --- LIST TAB --- */}
          {activeTab === "list" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              key="list"
            >
              <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-black text-gray-900 mb-2">
                    Kho Lưu Trữ Link
                  </h2>
                  <p className="text-gray-500 font-medium italic">
                    Tổng cộng {links.length} tài nguyên liên kết.
                  </p>
                </div>
                <div className="relative group">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Tìm kiếm tài nguyên..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-6 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 min-w-[300px] font-medium"
                  />
                </div>
              </header>

              <div className="grid gap-4">
                {listLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-28 bg-white border border-gray-100 rounded-[2.5rem] animate-pulse"
                      />
                    ))
                  : links.map((l) => (
                      <div
                        key={l.id}
                        className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-6 group hover:shadow-xl transition-all"
                      >
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden shrink-0">
                          {l.videoUrl ? (
                            <div className="w-full h-full bg-gray-900 flex items-center justify-center text-white">
                              <VideoIcon size={24} />
                            </div>
                          ) : l.customImageUrl ? (
                            <img
                              src={l.customImageUrl}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon size={24} className="text-gray-200" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                          <h4 className="font-bold text-gray-900 truncate mb-1">
                            {l.customTitle || "Untitled link"}
                          </h4>
                          <p className="text-xs text-gray-400 font-medium truncate mb-2">
                            {l.customDescription || "No description provided"}
                          </p>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                              {l.shortCode}
                            </span>
                            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-tighter">
                              {l.createdAt &&
                                formatDistanceToNow(
                                  new Date(l.createdAt._seconds * 1000),
                                )}{" "}
                              ago
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              copyToClipboard(
                                `https://hotsnew.click/s/${l.shortCode}`,
                                l.id || "",
                              )
                            }
                            className="px-6 py-3 bg-gray-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                          >
                            {copiedId === l.id ? "DONE" : "COPY"}
                          </button>
                          <a
                            href={l.originalUrl}
                            target="_blank"
                            className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:text-orange-600 hover:bg-orange-50 transition-all"
                          >
                            <ExternalLink size={18} />
                          </a>
                        </div>
                      </div>
                    ))}
              </div>
            </motion.div>
          )}

          {/* --- ANALYTICS TAB --- */}
          {activeTab === "analytics" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              key="analytics"
              className="space-y-8 pb-12"
            >
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    label: "Tổng Lượt Click",
                    value: analyticsData.history
                      .reduce((a, b) => a + b.clicks, 0)
                      .toLocaleString(),
                    icon: MousePointer2,
                    color: "text-orange-500",
                    bg: "bg-orange-50",
                  },
                  {
                    label: "Link Hoạt Động",
                    value: links.length,
                    icon: Activity,
                    color: "text-blue-500",
                    bg: "bg-blue-50",
                  },
                  {
                    label: "Tăng Trưởng (30d)",
                    value: "+12.5%",
                    icon: TrendingUp,
                    color: "text-green-500",
                    bg: "bg-green-50",
                  },
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm"
                  >
                    <div
                      className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6`}
                    >
                      <stat.icon size={24} />
                    </div>
                    <div className="text-3xl font-black text-gray-900 mb-1 font-mono">
                      {stat.value}
                    </div>
                    <div className="text-[11px] font-black uppercase tracking-widest text-gray-400">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Main Chart */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-xl font-black text-gray-900">
                      Biểu đồ lượt click
                    </h3>
                    <p className="text-xs text-gray-400 font-medium">
                      Thống kê dữ liệu trong 30 ngày gần nhất
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="flex items-center gap-2 text-[10px] font-black text-orange-500 bg-orange-50 px-3 py-1.5 rounded-full uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />{" "}
                      Live Data
                    </span>
                  </div>
                </div>

                <div className="h-[350px] w-full">
                  {analyticsData.history.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analyticsData.history}>
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
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fontSize: 10,
                            fontWeight: 700,
                            fill: "#9CA3AF",
                          }}
                          dy={10}
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
                        <Tooltip
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
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                      <Activity size={48} className="mb-4 opacity-20" />
                      <p className="font-bold text-sm italic">
                        Không có dữ liệu click nào trong 30 ngày qua.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Links */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <TrendingUp size={20} className="text-orange-500" />
                    <h3 className="text-xl font-black text-gray-900">
                      Top Link Hiệu Quả
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {analyticsData.topLinks.length > 0 ? (
                      analyticsData.topLinks.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-all group"
                        >
                          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center font-black text-gray-400 group-hover:bg-orange-500 group-hover:text-white transition-all font-mono">
                            0{idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-gray-900 truncate">
                              {item.title}
                            </div>
                            <div className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
                              {item.clicks} CLICKS
                            </div>
                          </div>
                          <div className="w-24 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-500"
                              style={{
                                width: `${(item.clicks / Math.max(...analyticsData.topLinks.map((l) => l.clicks))) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center text-gray-400 text-sm font-medium italic">
                        Nâng cấp chiến dịch để xem BXH
                      </div>
                    )}
                  </div>
                </div>

                {/* Device Distribution Mock/Simplified */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <PieChart size={20} className="text-blue-500" />
                    <h3 className="text-xl font-black text-gray-900">
                      Nguồn Lưu Lượng
                    </h3>
                  </div>
                  <div className="h-[200px] mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: "Facebook", value: 400 },
                          { name: "TikTok", value: 300 },
                          { name: "Google", value: 300 },
                          { name: "Khác", value: 200 },
                        ]}
                      >
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fontWeight: 700 }}
                        />
                        <Tooltip />
                        <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                          {[
                            <Cell key={0} fill="#3b82f6" />,
                            <Cell key={1} fill="#ef4444" />,
                            <Cell key={2} fill="#10b981" />,
                            <Cell key={3} fill="#9ca3af" />,
                          ]}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-center text-xs text-gray-400 font-medium italic">
                    Dữ liệu phân tích dựa trên HTTP Referrer
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* --- Footer --- */}
      <footer className="fixed bottom-0 right-0 w-full lg:w-[calc(100%-288px)] p-6 z-40 lg:block hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            &copy; 2026 hotsnew.click Infrastructure
          </span>
          <div className="flex gap-6">
            <Globe size={16} />
            <ShieldCheck size={16} />
          </div>
        </div>
      </footer>
    </div>
  );
}
