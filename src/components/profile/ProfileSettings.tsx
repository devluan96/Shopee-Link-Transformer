import React, { useRef } from "react";
import {
  User,
  Camera,
  Save,
  ShieldCheck,
  KeyRound,
  Smartphone,
  Mail,
  UserCircle,
  BadgeCheck,
  Clock,
  Crown,
  Settings,
  History,
  Copy,
  QrCode,
} from "lucide-react";
import { SecurityOverview, UserProfile } from "@/src/types";
import { cn } from "@/src/lib/utils";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";

interface ProfileSettingsProps {
  profile: UserProfile | null;
  updating: boolean;
  securityOverview: SecurityOverview | null;
  securityLoading: boolean;
  twoFactorSetup: { secret: string; otpauthUri: string } | null;
  onBeginTwoFactorSetup: () => Promise<{ secret: string; otpauthUri: string }>;
  onEnableTwoFactor: (code: string) => Promise<void>;
  onDisableTwoFactor: (code: string) => Promise<void>;
  onUpdate: (data: { full_name: string; avatar_url: string }) => void;
  onAvatarUpload: (file: File) => Promise<string | null>;
}

export const ProfileSettings = ({
  profile,
  updating,
  securityOverview,
  securityLoading,
  twoFactorSetup,
  onBeginTwoFactorSetup,
  onEnableTwoFactor,
  onDisableTwoFactor,
  onUpdate,
  onAvatarUpload,
}: ProfileSettingsProps) => {
  const [fullName, setFullName] = React.useState(profile?.full_name || "");
  const [avatarUrl, setAvatarUrl] = React.useState(profile?.avatar_url || "");
  const [uploading, setUploading] = React.useState(false);
  const [selectedAvatarMeta, setSelectedAvatarMeta] = React.useState<{
    name: string;
    size: number;
  } | null>(null);
  const [twoFactorCode, setTwoFactorCode] = React.useState("");
  const [twoFactorBusy, setTwoFactorBusy] = React.useState(false);
  const [otpSecondsLeft, setOtpSecondsLeft] = React.useState(() => {
    const remainder = new Date().getSeconds() % 30;
    return remainder === 0 ? 30 : 30 - remainder;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  React.useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [profile]);

  React.useEffect(() => {
    setTwoFactorCode("");
  }, [twoFactorSetup?.secret, securityOverview?.twoFactorEnabled]);

  React.useEffect(() => {
    const updateSecondsLeft = () => {
      const seconds = new Date().getSeconds();
      const remainder = seconds % 30;
      setOtpSecondsLeft(remainder === 0 ? 30 : 30 - remainder);
    };

    updateSecondsLeft();
    const interval = window.setInterval(updateSecondsLeft, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({ full_name: fullName, avatar_url: avatarUrl });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedAvatarMeta({
      name: file.name,
      size: file.size,
    });
    setUploading(true);
    try {
      const url = await onAvatarUpload(file);
      if (url) {
        setAvatarUrl(url);
      }
    } catch (err) {
      console.error("ProfileSettings handleFileChange error:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const isPremium =
    profile?.subscription_plan && profile.subscription_plan !== "free";

  const handleSetupTwoFactor = async () => {
    setTwoFactorBusy(true);
    try {
      setTwoFactorCode("");
      await onBeginTwoFactorSetup();
    } finally {
      setTwoFactorBusy(false);
    }
  };

  const handleEnableTwoFactor = async () => {
    if (!twoFactorCode.trim()) return;
    setTwoFactorBusy(true);
    try {
      await onEnableTwoFactor(twoFactorCode);
      setTwoFactorCode("");
    } finally {
      setTwoFactorBusy(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    if (!twoFactorCode.trim()) return;
    setTwoFactorBusy(true);
    try {
      await onDisableTwoFactor(twoFactorCode);
      setTwoFactorCode("");
    } finally {
      setTwoFactorBusy(false);
    }
  };

  const handleCopySecret = async () => {
    if (!twoFactorSetup?.secret) return;
    await navigator.clipboard.writeText(twoFactorSetup.secret);
    toast.success("Đã copy secret 2FA.");
  };

  const handleCopyOtpAuthUri = async () => {
    if (!twoFactorSetup?.otpauthUri) return;
    await navigator.clipboard.writeText(twoFactorSetup.otpauthUri);
    toast.success("Đã copy URI setup 2FA.");
  };

  return (
    <div className="max-w-6xl animate-in fade-in duration-700">
      <header className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-lg bg-orange-600 p-2 shadow-lg shadow-orange-200">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-slate-100">
              Hồ Sơ Cá Nhân
            </h2>
          </div>
          <p className="font-medium italic text-gray-500 dark:text-slate-400">
            Quản lý danh tính và các thiết lập tài khoản của bạn.
          </p>
        </div>

        {isPremium && (
          <div className="flex animate-pulse items-center gap-3 rounded-2xl bg-linear-to-r from-amber-400 to-orange-500 px-6 py-3 text-white shadow-xl shadow-orange-100">
            <Crown size={20} className="fill-current" />
            <span className="text-xs font-black uppercase tracking-widest">
              Thành viên Premium
            </span>
          </div>
        )}
      </header>

      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.92fr_1.68fr] lg:items-stretch">
          <div className="h-full">
            <div className="group relative flex h-full flex-col items-center overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white p-10 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="absolute left-0 top-0 h-24 w-full bg-linear-to-br from-orange-500 to-amber-400 opacity-10 transition-opacity group-hover:opacity-20" />

              <div className="relative mt-4">
                <div className="relative z-10 h-36 w-36 overflow-hidden rounded-[2.5rem] bg-white shadow-2xl ring-8 ring-white transition-transform duration-500 group-hover:scale-105 dark:bg-slate-700 dark:ring-slate-700">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-orange-50 text-orange-500">
                      <UserCircle size={64} strokeWidth={1.5} />
                    </div>
                  )}

                  <AnimatePresence>
                    {uploading && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 z-20 rounded-2xl bg-gray-900 p-4 text-white shadow-xl transition-all hover:bg-orange-600 active:scale-90 group-hover:rotate-12 dark:bg-slate-700"
                >
                  <Camera size={20} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
              </div>

              <div className="mt-8 space-y-2 text-center">
                <h3 className="line-clamp-1 text-xl font-black text-gray-900 dark:text-slate-100">
                  {profile?.full_name || "Chưa đặt tên"}
                </h3>
                <p className="text-sm font-medium text-gray-400 dark:text-slate-400">
                  {profile?.email}
                </p>
              </div>

              <div className="mt-5 w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-left dark:border-slate-700 dark:bg-slate-900">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-400">
                  Avatar upload
                </p>
                {selectedAvatarMeta ? (
                  <p className="mt-2 text-xs font-medium text-gray-600 dark:text-slate-300">
                    {selectedAvatarMeta.name} ·{" "}
                    {formatFileSize(selectedAvatarMeta.size)}
                  </p>
                ) : (
                  <p className="mt-2 text-xs font-medium text-gray-400 dark:text-slate-500">
                    Chọn JPG, PNG hoặc WebP để thay avatar.
                  </p>
                )}
                <p className="mt-1 text-[11px] font-medium text-gray-400 dark:text-slate-500">
                  Hệ thống sẽ tự resize về tối đa 512px và nén WebP trước khi
                  tải lên.
                </p>
              </div>

              <div className="my-8 h-px w-full bg-gray-100 dark:bg-slate-700" />

              <div className="w-full space-y-4">
                <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center gap-3">
                    <BadgeCheck size={18} className="text-green-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-400">
                      Trạng thái
                    </span>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest",
                      profile?.status === "approved"
                        ? "bg-green-100 text-green-600"
                        : "bg-amber-100 text-amber-600",
                    )}
                  >
                    {profile?.status === "approved" ? "Hoạt động" : "Chờ duyệt"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="h-full">
            <form
              onSubmit={handleSubmit}
              className="flex h-full flex-col rounded-[2.5rem] border border-gray-100 bg-white p-10 shadow-sm dark:border-slate-700 dark:bg-slate-800 md:p-12"
            >
              <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                <div className="space-y-4">
                  <label className="ml-1 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
                    <Mail size={14} className="text-orange-500" /> Địa chỉ Email
                  </label>
                  <div className="group relative">
                    <input
                      type="text"
                      readOnly
                      value={profile?.email || ""}
                      className="w-full cursor-not-allowed rounded-3xl border-2 border-gray-100 bg-gray-100/50 px-6 py-4.5 text-sm font-bold text-gray-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <ShieldCheck size={16} className="text-gray-300" />
                    </div>
                  </div>
                  <p className="ml-1 text-[10px] font-medium italic text-gray-400 dark:text-slate-500">
                    Định danh tài khoản không thể thay đổi.
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="ml-1 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
                    <User size={14} className="text-orange-500" /> Họ và tên đầy
                    đủ
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Họ tên hiển thị của bạn..."
                    className="w-full rounded-3xl border-2 border-transparent bg-gray-50 px-6 py-4.5 font-bold text-gray-900 outline-none transition-all placeholder:text-gray-300 focus:border-orange-500/20 focus:bg-white dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-3xl border border-blue-100/50 bg-blue-50/50 p-6 dark:border-blue-500/20 dark:bg-blue-500/10">
                <div className="rounded-xl bg-white p-3 text-blue-500 shadow-sm dark:bg-slate-800">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="mb-1 text-sm font-black uppercase tracking-tight text-blue-900 dark:text-blue-200">
                    Dữ liệu cá nhân an toàn
                  </h4>
                  <p className="text-[11px] font-medium uppercase tracking-tighter text-blue-600/80 dark:text-blue-200/80">
                    Thông tin của bạn được mã hóa và chỉ dùng cho mục đích xác
                    thực, quản lý quyền hạn trong hệ thống HotsNew Click.
                  </p>
                </div>
              </div>

              <div className="mt-auto pt-10">
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                      <Clock size={18} className="text-orange-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-400">
                        Gia nhập
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-gray-900 dark:text-slate-100">
                      {profile?.created_at
                        ? new Date(profile.created_at).toLocaleDateString(
                            "vi-VN",
                          )
                        : "---"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                      <BadgeCheck size={18} className="text-green-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-400">
                        Xác minh
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-green-600 dark:text-green-400">
                      Đã kiểm định
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-6 border-t border-gray-100 pt-4 dark:border-slate-700 sm:flex-row">
                  <button
                    type="submit"
                    disabled={updating || uploading}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-linear-to-r from-orange-600 to-amber-500 px-12 py-5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-orange-600/20 transition-all hover:-translate-y-0.5 hover:shadow-orange-600/30 active:scale-[0.98] disabled:opacity-50 sm:w-auto"
                  >
                    {updating ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-3 border-white/30 border-t-white" />
                    ) : (
                      <>
                        <Save size={18} /> Lưu các thay đổi
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">
                    <BadgeCheck size={16} className="text-green-500" />
                    Mọi thông tin đã được kiểm định
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        <section className="space-y-8 overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-8 md:p-12">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="flex items-center gap-3 text-2xl font-black text-gray-900 dark:text-slate-100">
                <ShieldCheck className="text-orange-500" size={22} />
                Bảo mật tài khoản
              </h3>
              <p className="mt-2 text-sm font-medium text-gray-500 dark:text-slate-400">
                Bật 2FA/TOTP và theo dõi lịch sử truy cập gần đây.
              </p>
            </div>
            <span
              className={cn(
                "rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-widest",
                securityOverview?.twoFactorEnabled
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700",
              )}
            >
              {securityOverview?.twoFactorEnabled
                ? "2FA Đang bật"
                : "2FA Chưa bật"}
            </span>
          </div>

          <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="min-w-0 overflow-hidden rounded-3xl border border-gray-100 bg-gray-50 p-5 dark:border-slate-700 dark:bg-slate-900 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-white p-3 text-orange-500 shadow-sm dark:bg-slate-800">
                  <Smartphone size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="wrap-break-word font-black text-gray-900 dark:text-slate-100">
                    Xác thực 2 lớp (TOTP)
                  </h4>
                  <p className="mt-1 wrap-break-word text-sm text-gray-500 dark:text-slate-400">
                    Dùng Google Authenticator, 1Password hoặc Authy để tạo mã 6
                    số.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {twoFactorSetup && (
                  <div className="rounded-2xl border border-orange-100 bg-white p-4 dark:border-orange-500/20 dark:bg-slate-800">
                    <div className="grid gap-5 xl:grid-cols-[220px_1fr] xl:items-start">
                      <div className="min-w-0 rounded-2xl border border-gray-100 bg-gray-50 p-3 text-center dark:border-slate-700 dark:bg-slate-900">
                        <div className="mb-2 flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest text-orange-500">
                          <QrCode size={14} />
                          QR Setup
                        </div>
                        <div className="mx-auto rounded-xl bg-white p-2">
                          <QRCodeCanvas
                            value={twoFactorSetup.otpauthUri}
                            size={220}
                            level="M"
                            includeMargin={false}
                          />
                        </div>
                        <p className="mt-2 text-[11px] font-medium text-gray-500 dark:text-slate-400">
                          Quét mã này bằng Google Authenticator.
                        </p>
                      </div>

                      <div className="min-w-0">
                        <p className="wrap-break-word text-[11px] font-black uppercase tracking-widest text-orange-500">
                          Secret setup
                        </p>
                        <p className="mt-2 wrap-break-word text-sm font-medium text-gray-500 dark:text-slate-400">
                          Nếu không quét QR, bạn có thể nhập secret thủ công vào
                          Google Authenticator.
                        </p>
                        <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-900 sm:flex-row sm:items-start">
                          <p className="flex-1 break-all font-mono text-sm font-black text-gray-900 dark:text-slate-100">
                            {twoFactorSetup.secret}
                          </p>
                          <button
                            type="button"
                            onClick={handleCopySecret}
                            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-[11px] font-black uppercase tracking-widest text-gray-700 transition-all hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto"
                          >
                            <Copy size={14} />
                            Copy
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyOtpAuthUri}
                          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-[11px] font-black uppercase tracking-widest text-gray-700 transition-all hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto"
                        >
                          <Copy size={14} />
                          Copy URI
                        </button>
                        <div className="mt-4 min-w-0 rounded-2xl bg-orange-50 px-4 py-4 text-sm text-orange-800 dark:bg-orange-500/10 dark:text-orange-200">
                          <p className="wrap-break-word text-[11px] font-black uppercase tracking-widest">
                            Cách bật 2FA
                          </p>
                          <p className="mt-2">1. Bấm tạo secret 2FA.</p>
                          <p className="mt-1">
                            2. Quét QR hoặc nhập secret vào Google
                            Authenticator.
                          </p>
                          <p className="mt-1">
                            3. Lấy mã 6 số đang hiển thị trong Google
                            Authenticator rồi nhập vào ô bên dưới.
                          </p>
                          <p className="mt-1">4. Bấm xác minh để bật 2FA.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!twoFactorSetup && !securityOverview?.twoFactorEnabled && (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-4 text-sm text-gray-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                    Bấm{" "}
                    <span className="font-black text-gray-900 dark:text-slate-100">
                      Tạo secret 2FA
                    </span>{" "}
                    trước. Sau đó Google Authenticator mới sinh ra mã 6 số để
                    bạn nhập.
                  </div>
                )}

                <div>
                  <div className="mb-2 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <label className="flex min-w-0 items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
                      <KeyRound size={14} className="text-orange-500" />
                      Mã xác thực 6 số
                    </label>
                    {(twoFactorSetup || securityOverview?.twoFactorEnabled) && (
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
                          otpSecondsLeft <= 5
                            ? "bg-red-100 text-red-600"
                            : "bg-blue-100 text-blue-600",
                        )}
                      >
                        Đổi sau {otpSecondsLeft}s
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={twoFactorCode}
                    onChange={(e) =>
                      setTwoFactorCode(
                        e.target.value.replace(/\D/g, "").slice(0, 6),
                      )
                    }
                    placeholder={
                      securityOverview?.twoFactorEnabled
                        ? "Nhập mã hiện tại để tắt 2FA"
                        : twoFactorSetup
                          ? "Nhập mã đang hiện trên Google Authenticator"
                          : "Tạo secret 2FA trước"
                    }
                    disabled={
                      !twoFactorSetup && !securityOverview?.twoFactorEnabled
                    }
                    className="w-full rounded-2xl border-2 border-transparent bg-white px-4 py-4 font-mono text-base font-black tracking-[0.2em] text-gray-900 outline-none transition-all focus:border-orange-500/20 focus:ring-4 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-900 dark:disabled:text-slate-500 sm:px-5 sm:text-lg sm:tracking-[0.3em]"
                  />
                  <p className="mt-2 wrap-break-word text-xs text-gray-500 dark:text-slate-400">
                    {securityOverview?.twoFactorEnabled
                      ? "Đây là mã 6 số hiện tại trong Google Authenticator để xác nhận thao tác tắt 2FA hoặc để vượt qua bước xác minh khi đăng nhập."
                      : twoFactorSetup
                        ? "Không nhập số bạn tự nghĩ ra. Phải nhập đúng mã 6 số đang chạy trong Google Authenticator sau khi đã quét QR hoặc nhập secret."
                        : "Sau khi tạo secret, Google Authenticator mới tạo ra mã 6 số để nhập ở đây."}
                  </p>
                  {twoFactorCode.length > 0 && twoFactorCode.length < 6 && (
                    <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-300">
                      Cần nhập đủ 6 số OTP từ Google Authenticator.
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  {!securityOverview?.twoFactorEnabled && (
                    <button
                      type="button"
                      onClick={handleSetupTwoFactor}
                      disabled={twoFactorBusy}
                      className="w-full rounded-2xl bg-gray-900 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-black disabled:opacity-60 sm:w-auto"
                    >
                      Tạo secret 2FA
                    </button>
                  )}
                  {!securityOverview?.twoFactorEnabled && twoFactorSetup && (
                    <button
                      type="button"
                      onClick={handleEnableTwoFactor}
                      disabled={twoFactorBusy || twoFactorCode.length !== 6}
                      className="w-full rounded-2xl bg-orange-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-orange-700 disabled:opacity-60 sm:w-auto"
                    >
                      Xác minh và bật 2FA
                    </button>
                  )}
                  {securityOverview?.twoFactorEnabled && (
                    <button
                      type="button"
                      onClick={handleDisableTwoFactor}
                      disabled={twoFactorBusy || twoFactorCode.length !== 6}
                      className="w-full rounded-2xl bg-red-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-red-700 disabled:opacity-60 sm:w-auto"
                    >
                      Tắt 2FA
                    </button>
                  )}
                </div>

                <div className="text-xs font-medium text-gray-500 dark:text-slate-400">
                  {securityOverview?.lastVerifiedAt
                    ? `Xác minh gần nhất: ${new Date(
                        securityOverview.lastVerifiedAt,
                      ).toLocaleString("vi-VN")}`
                    : "Chưa có lần xác minh 2FA nào."}
                </div>
              </div>
            </div>

            <div className="min-w-0 overflow-hidden rounded-3xl border border-gray-100 bg-gray-50 p-5 dark:border-slate-700 dark:bg-slate-900 sm:p-6">
              <div className="mb-4 flex items-start gap-3">
                <History size={20} className="text-blue-500" />
                <div className="min-w-0">
                  <h4 className="wrap-break-word font-black text-gray-900 dark:text-slate-100">
                    Access Logs
                  </h4>
                  <p className="wrap-break-word text-sm text-gray-500 dark:text-slate-400">
                    Truy cập gần đây của chính bạn.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {securityLoading ? (
                  <div className="rounded-2xl bg-white px-4 py-6 text-center text-sm font-medium text-gray-400 dark:bg-slate-800 dark:text-slate-500">
                    Đang tải lịch sử truy cập...
                  </div>
                ) : securityOverview?.recentAccessLogs?.length ? (
                  securityOverview.recentAccessLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-2xl bg-white px-4 py-4 dark:bg-slate-800"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-slate-100">
                            {log.method}
                          </p>
                          <p className="mt-1 break-all font-black text-gray-900 dark:text-slate-100">
                            {log.path}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
                            log.status_code >= 400
                              ? "bg-red-100 text-red-600"
                              : "bg-green-100 text-green-600",
                          )}
                        >
                          {log.status_code}
                        </span>
                      </div>
                      <p className="mt-2 wrap-break-word text-xs text-gray-500 dark:text-slate-400">
                        {log.ip_address || "Unknown IP"} ·{" "}
                        {new Date(log.created_at).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-white px-4 py-6 text-center text-sm font-medium text-gray-400 dark:bg-slate-800 dark:text-slate-500">
                    Chưa có access log nào.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const AnimatePresence = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};
