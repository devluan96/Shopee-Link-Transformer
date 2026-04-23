import React, { useRef } from "react";
import {
  User,
  Camera,
  Save,
  ShieldCheck,
  Mail,
  UserCircle,
  BadgeCheck,
  Clock,
  Crown,
  Settings,
} from "lucide-react";
import { UserProfile } from "@/src/types";
import { cn } from "@/src/lib/utils";

interface ProfileSettingsProps {
  profile: UserProfile | null;
  updating: boolean;
  onUpdate: (data: { full_name: string; avatar_url: string }) => void;
  onAvatarUpload: (file: File) => Promise<string | null>;
}

export const ProfileSettings = ({
  profile,
  updating,
  onUpdate,
  onAvatarUpload,
}: ProfileSettingsProps) => {
  const [fullName, setFullName] = React.useState(profile?.full_name || "");
  const [avatarUrl, setAvatarUrl] = React.useState(profile?.avatar_url || "");
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if profile changes
  React.useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({ full_name: fullName, avatar_url: avatarUrl });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await onAvatarUpload(file);
      if (url) {
        setAvatarUrl(url);
      }
    } catch (err) {
      console.error("❌ ProfileSettings handleFileChange error:", err);
    } finally {
      setUploading(false);
    }
  };

  const isPremium =
    profile?.subscription_plan && profile.subscription_plan !== "free";

  return (
    <div className="max-w-6xl animate-in fade-in duration-700">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-600 rounded-lg shadow-lg shadow-orange-200">
              <Settings className="text-white w-5 h-5" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">
              Hồ Sơ Cá Nhân
            </h2>
          </div>
          <p className="text-gray-500 font-medium italic">
            Quản lý danh tính và các thiết lập tài khoản của bạn.
          </p>
        </div>

        {isPremium && (
          <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl shadow-xl shadow-orange-100 text-white animate-pulse">
            <Crown size={20} className="fill-current" />
            <span className="font-black uppercase tracking-widest text-xs">
              Thành viên Premium
            </span>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Quick Info */}
        <div className="space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10 flex flex-col items-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-orange-500 to-amber-400 opacity-10 group-hover:opacity-20 transition-opacity" />

            <div className="relative mt-4">
              <div className="w-36 h-36 rounded-[2.5rem] overflow-hidden bg-white shadow-2xl ring-8 ring-white relative z-10 transition-transform duration-500 group-hover:scale-105">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-orange-50 flex items-center justify-center text-orange-500">
                    <UserCircle size={64} strokeWidth={1.5} />
                  </div>
                )}

                <AnimatePresence>
                  {uploading && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-20">
                      <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 p-4 bg-gray-900 text-white rounded-2xl shadow-xl hover:bg-orange-600 transition-all active:scale-90 z-20 group-hover:rotate-12"
              >
                <Camera size={20} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="text-center mt-8 space-y-2">
              <h3 className="text-xl font-black text-gray-900 line-clamp-1">
                {profile?.full_name || "Chưa đặt tên"}
              </h3>
              <p className="text-gray-400 text-sm font-medium">
                {profile?.email}
              </p>
            </div>

            <div className="w-full h-px bg-gray-100 my-8" />

            <div className="w-full space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <BadgeCheck size={18} className="text-green-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Trạng thái
                  </span>
                </div>
                <span
                  className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                    profile?.status === "approved"
                      ? "bg-green-100 text-green-600"
                      : "bg-amber-100 text-amber-600",
                  )}
                >
                  {profile?.status === "approved" ? "Hoạt động" : "Chờ duyệt"}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-orange-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Gia nhập
                  </span>
                </div>
                <span className="text-[10px] font-black text-gray-900">
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString("vi-VN")
                    : "---"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Settings */}
        <div className="lg:col-span-2 space-y-8">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10 md:p-12 space-y-10"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  <Mail size={14} className="text-orange-500" /> Địa chỉ Email
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    readOnly
                    value={profile?.email || ""}
                    className="w-full px-6 py-4.5 bg-gray-100/50 border-2 border-gray-100 rounded-[1.5rem] text-gray-400 font-bold text-sm cursor-not-allowed"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <ShieldCheck size={16} className="text-gray-300" />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 font-medium italic ml-1">
                  Định danh tài khoản không thể thay đổi.
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  <User size={14} className="text-orange-500" /> Họ và tên đầy
                  đủ
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Họ tên hiển thị của bạn..."
                  className="w-full px-6 py-4.5 bg-gray-50 border-2 border-transparent rounded-[1.5rem] transition-all focus:border-orange-500/20 focus:bg-white outline-none font-bold text-gray-900 placeholder:text-gray-300"
                />
              </div>
            </div>

            <div className="p-6 bg-blue-50/50 rounded-[1.5rem] border border-blue-100/50 flex items-start gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm text-blue-500">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-blue-900 uppercase tracking-tight mb-1">
                  Dữ liệu cá nhân an toàn
                </h4>
                <p className="text-[11px] font-medium text-blue-600/80 leading-relaxed uppercase tracking-tighter">
                  Thông tin của bạn được mã hóa và chỉ dùng cho mục đích xác
                  thực, quản lý quyền hạn trong hệ thống HotsNew Click.
                </p>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center gap-6 border-t border-gray-100 mt-10">
              <button
                type="submit"
                disabled={updating || uploading}
                className="w-full sm:w-auto px-12 py-5 bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-orange-600/20 hover:shadow-orange-600/30 hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {updating ? (
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={18} /> Lưu các thay đổi
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                <BadgeCheck size={16} className="text-green-500" />
                Mọi thông tin đã được kiểm định
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const AnimatePresence = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>; // Simple wrapper as we are using tailwind for animations here
};
