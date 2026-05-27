import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Moon,
  Sun,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale } from "@/src/hooks/useLocale";
import { useTheme } from "@/src/hooks/useTheme";
import { cn } from "@/src/lib/utils";
import { AuthShowcase } from "./AuthShowcase";

interface AuthScreenProps {
  isRegistering: boolean;
  setIsRegistering: (val: boolean) => void;
  loginEmail: string;
  setLoginEmail: (val: string) => void;
  loginPassword: string;
  setLoginPassword: (val: string) => void;
  registerEmail: string;
  setRegisterEmail: (val: string) => void;
  registerPassword: string;
  setRegisterPassword: (val: string) => void;
  rememberMe: boolean;
  setRememberMe: (val: boolean) => void;
  passwordRecoveryMode: boolean;
  recoveryPassword: string;
  setRecoveryPassword: (val: string) => void;
  recoveryConfirmPassword: string;
  setRecoveryConfirmPassword: (val: string) => void;
  loading: boolean;
  authError: string | null;
  authNotice: string | null;
  handleEmailAuth: (e: React.FormEvent) => void;
  handleGoogleAuth: () => void | Promise<void>;
  handleForgotPassword: () => void | Promise<void>;
  handlePasswordRecovery: (e: React.FormEvent) => void | Promise<void>;
  resetLoading?: () => void;
}

interface AuthFormProps {
  isRegistering: boolean;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  rememberMe: boolean;
  setRememberMe: (val: boolean) => void;
  passwordRecoveryMode?: boolean;
  recoveryPassword: string;
  setRecoveryPassword: (val: string) => void;
  recoveryConfirmPassword: string;
  setRecoveryConfirmPassword: (val: string) => void;
  loading: boolean;
  authError: string | null;
  authNotice: string | null;
  handleEmailAuth: (e: React.FormEvent) => void;
  handleGoogleAuth: () => void | Promise<void>;
  handleForgotPassword: () => void | Promise<void>;
  handlePasswordRecovery: (e: React.FormEvent) => void | Promise<void>;
  resetLoading?: () => void;
  themeTone: "light" | "dark";
}

const localeLabels = {
  left: "VN",
  right: "EN",
} as const;

function SwipeLanguageSwitch({ tone }: { tone: "dark" | "light" }) {
  const { locale, setLocale, t } = useLocale();

  const isDark = tone === "dark";
  const activeThumbClassName = isDark
    ? "bg-[linear-gradient(135deg,rgba(255,122,0,0.98),rgba(255,90,0,0.98))] shadow-[0_12px_24px_rgba(255,106,0,0.28)]"
    : "bg-[linear-gradient(135deg,rgba(255,122,0,0.18),rgba(251,146,60,0.16))] shadow-[0_10px_18px_rgba(249,115,22,0.12)]";
  const baseClassName = isDark
    ? "border-white/10 bg-white/[0.05] text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
    : "border-slate-200 bg-white/80 text-slate-600 shadow-[0_12px_30px_rgba(15,23,42,0.06)]";
  const labelActiveClassName = isDark ? "text-white" : "text-slate-950";
  const labelInactiveClassName = isDark
    ? "text-slate-500 group-hover:text-slate-300"
    : "text-slate-400 group-hover:text-slate-700";

  return (
    <div
      role="group"
      aria-label={t("common.language.switch")}
      className={cn(
        "group relative inline-flex h-9 w-[5.8rem] items-center rounded-[0.85rem] border p-1 text-[10px] font-black uppercase tracking-[0.16em] transition-colors",
        baseClassName,
      )}
    >
      <motion.span
        aria-hidden="true"
        animate={{ x: locale === "vi" ? 0 : "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className={cn(
          "absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-[0.75rem]",
          activeThumbClassName,
        )}
      />
      <button
        type="button"
        className={cn(
          "relative z-10 flex flex-1 items-center justify-center rounded-[0.7rem] transition-colors",
          locale === "vi" ? labelActiveClassName : labelInactiveClassName,
        )}
        onClick={() => setLocale("vi")}
      >
        {localeLabels.left}
      </button>
      <button
        type="button"
        className={cn(
          "relative z-10 flex flex-1 items-center justify-center rounded-[0.7rem] transition-colors",
          locale === "en" ? labelActiveClassName : labelInactiveClassName,
        )}
        onClick={() => setLocale("en")}
      >
        {localeLabels.right}
      </button>
    </div>
  );
}

export const AuthScreen = ({
  isRegistering,
  setIsRegistering,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  registerEmail,
  setRegisterEmail,
  registerPassword,
  setRegisterPassword,
  rememberMe,
  setRememberMe,
  passwordRecoveryMode,
  recoveryPassword,
  setRecoveryPassword,
  recoveryConfirmPassword,
  setRecoveryConfirmPassword,
  loading,
  authError,
  authNotice,
  handleEmailAuth,
  handleGoogleAuth,
  handleForgotPassword,
  handlePasswordRecovery,
  resetLoading,
}: AuthScreenProps) => {
  const { locale, messages, t } = useLocale();
  const { resolvedTheme, toggleTheme } = useTheme();
  const auth = messages.auth;
  const [showAuthPage, setShowAuthPage] = useState(passwordRecoveryMode);
  const isDarkLanding = resolvedTheme === "dark";
  const isDarkAuth = resolvedTheme === "dark";
  const isVi = locale === "vi";
  const authExperienceCopy = isVi
        ? {
        promptExisting: "Đã có tài khoản?",
        promptNew: "Chưa có tài khoản?",
        authBadge: "Không gian đăng nhập cho team vận hành",
        title:
          passwordRecoveryMode
            ? "Khôi phục truy cập an toàn."
            : "Vào workspace cùng cả team.",
        description: passwordRecoveryMode
          ? "Đặt lại mật khẩu và quay lại dashboard ngay trong cùng một luồng xác thực."
          : "Tạo tài khoản, quản lý link, preview page, QR và analytics trong một không gian thao tác gọn, rõ và đủ nhanh cho vận hành mỗi ngày.",
        testimonial:
          "Một workspace đủ gọn để team chạy link, preview và tracking mà không phải đổi qua lại quá nhiều tab.",
        author: "Đội vận hành HotsNew Click",
        role: "Shopee, TikTok và campaign đa kênh",
        stats: [
          { value: "1 flow", label: "Link, preview và analytics" },
          { value: "Team-ready", label: "Quyền truy cập rõ ràng" },
          { value: "Fast setup", label: "Sẵn sàng trong vài phút" },
        ],
        compliance: "Bảo vệ bởi SOC 2 Type II, quy trình truy cập rõ ràng.",
      }
      : {
        promptExisting: "Already have an account?",
        promptNew: "Need an account?",
        authBadge: "Team authentication workspace",
        title: passwordRecoveryMode
          ? "Recover access safely."
          : "Enter the workspace with your team.",
        description: passwordRecoveryMode
          ? "Reset the password and return to the dashboard in the same authentication flow."
          : "Create an account, manage links, preview pages, QR, and analytics in one compact workspace built for daily operations.",
        testimonial:
          "One workspace is enough for the team to run links, previews, and tracking without bouncing across too many tabs.",
        author: "HotsNew Click operations team",
        role: "Shopee, TikTok, and multi-channel campaigns",
        stats: [
          { value: "1 flow", label: "Links, previews, analytics" },
          { value: "Team-ready", label: "Clear access control" },
          { value: "Fast setup", label: "Ready in a few minutes" },
        ],
        compliance: "Protected by SOC 2 Type II and clear access workflows.",
      };
  const landingCopy = isVi
    ? {
        signIn: "Đăng nhập",
        startFree: "Bắt đầu miễn phí",
        home: "Trang chủ",
        login: "Đăng nhập",
        themeLabel: "Đổi chế độ sáng tối",
        nav: [
          { label: "Tính năng", href: "#showcase-features" },
          { label: "Pipeline", href: "#showcase-story" },
          { label: "AI Hub", href: "#showcase-aihub" },
          { label: "Bảng giá", href: "#showcase-pricing" },
          { label: "Khách hàng", href: "#showcase-customers" },
          { label: "Changelog", href: "#showcase-changelog", hasDot: true },
        ],
      }
    : {
        signIn: "Sign in",
        startFree: "Start free",
        home: "Home",
        login: "Login",
        themeLabel: "Toggle theme",
        nav: [
          { label: "Features", href: "#showcase-features" },
          { label: "Pipeline", href: "#showcase-story" },
          { label: "AI Hub", href: "#showcase-aihub" },
          { label: "Pricing", href: "#showcase-pricing" },
          { label: "Customers", href: "#showcase-customers" },
          { label: "Changelog", href: "#showcase-changelog", hasDot: true },
        ],
      };
  const authHeroCopy = isVi
    ? {
        eyebrow: "The HotsNew workspace",
        titleLead: passwordRecoveryMode
          ? "Khôi phục truy cập"
          : "Vào workspace với",
        titleAccent: passwordRecoveryMode ? "an toàn." : "cả team.",
        description: passwordRecoveryMode
          ? "Đặt lại mật khẩu và quay lại dashboard quản lý link, preview page, QR và analytics trong cùng một luồng xác thực."
          : "Tạo tài khoản để quản lý link, preview page, QR và analytics trong một không gian thao tác gọn, rõ và đủ nhanh cho vận hành mỗi ngày.",
        testimonial:
          "HotsNew Click giúp team gom link, preview và tracking vào cùng một workspace nên thao tác hằng ngày bớt rời rạc hơn.",
        author: "Đội vận hành HotsNew Click",
        role: "Shopee, TikTok và campaign đa kênh",
        stats: [
          { value: "1.4K+", label: "route được quản lý" },
          { value: "92%", label: "thao tác nhanh hơn" },
          { value: "4.9/5", label: "điểm hài lòng nội bộ" },
        ],
      }
    : {
        eyebrow: "The HotsNew workspace",
        titleLead: passwordRecoveryMode
          ? "Recover access"
          : "Enter the workspace with",
        titleAccent: passwordRecoveryMode ? "safely." : "the whole team.",
        description: passwordRecoveryMode
          ? "Reset your password and return to the dashboard that manages links, preview pages, QR, and analytics in the same flow."
          : "Create an account to manage links, preview pages, QR, and analytics in one compact workspace built for daily operations.",
        testimonial:
          "HotsNew Click gives the team one workspace for links, previews, and tracking, so daily operations stop feeling fragmented.",
        author: "HotsNew Click operations team",
        role: "Shopee, TikTok, and multi-channel campaigns",
        stats: [
          { value: "1.4K+", label: "routes managed" },
          { value: "92%", label: "faster execution" },
          { value: "4.9/5", label: "internal satisfaction" },
        ],
      };

  useEffect(() => {
    if (passwordRecoveryMode) {
      setShowAuthPage(true);
    }
  }, [passwordRecoveryMode]);

  const openLoginPage = () => {
    setIsRegistering(false);
    setShowAuthPage(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openRegisterPage = () => {
    setIsRegistering(true);
    setShowAuthPage(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const backToLanding = () => {
    if (passwordRecoveryMode) return;
    setIsRegistering(false);
    setShowAuthPage(false);
    resetLoading?.();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToSection = (href: string) => {
    const target = document.querySelector<HTMLElement>(href);
    if (!target) return;
    const headerOffset = 112;
    const top =
      target.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top, behavior: "smooth" });
  };

  if (!showAuthPage && !passwordRecoveryMode) {
    return (
      <div
        className={cn(
          "relative min-h-screen overflow-x-hidden text-slate-950 transition-colors",
          isDarkLanding ? "bg-[#090b14]" : "bg-[#f4f0ea]",
        )}
        style={{ fontFamily: "Geist, system-ui, sans-serif" }}
      >
        <div
          className={cn(
            "absolute inset-0",
            isDarkLanding
              ? "bg-[radial-gradient(circle_at_top,rgba(255,106,0,0.22),transparent_22%),radial-gradient(circle_at_50%_-8%,rgba(251,191,36,0.08),transparent_30%),linear-gradient(180deg,#0c0f1b_0%,#090b14_52%,#080a12_100%)]"
              : "bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.14),transparent_20%),radial-gradient(circle_at_50%_-8%,rgba(251,191,36,0.08),transparent_26%),linear-gradient(180deg,#faf8f4_0%,#f5f1ea_48%,#f0ebe3_100%)]",
          )}
        />
        <div
          className={cn(
            "absolute inset-0 [background-size:48px_48px]",
            isDarkLanding
              ? "opacity-[0.055] [background-image:linear-gradient(rgba(255,255,255,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.9)_1px,transparent_1px)]"
              : "opacity-[0.06] [background-image:linear-gradient(rgba(15,23,42,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.22)_1px,transparent_1px)]",
          )}
        />
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-40",
            isDarkLanding
              ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent)]"
              : "bg-[linear-gradient(180deg,rgba(255,255,255,0.75),transparent)]",
          )}
        />
        <div
          className={cn(
            "absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full blur-[120px]",
            isDarkLanding ? "bg-orange-500/16" : "bg-orange-300/22",
          )}
        />
        <div
          className={cn(
            "absolute left-0 top-0 h-96 w-96 -translate-x-1/3 -translate-y-1/4 rounded-full blur-[140px]",
            isDarkLanding ? "bg-amber-500/10" : "bg-amber-200/24",
          )}
        />

        <div className="relative z-10 mx-auto max-w-[1240px] px-4 pb-5 pt-[8.75rem] sm:px-6 sm:pt-32 lg:px-8 lg:pt-28">
          <header
            className={cn(
              "fixed left-1/2 top-5 z-50 w-[calc(100vw-2rem)] max-w-[1240px] -translate-x-1/2 rounded-[1.25rem] px-3.5 py-2.5 backdrop-blur-xl sm:w-[calc(100vw-3rem)] sm:px-5 sm:py-3 lg:w-[calc(100vw-4rem)] lg:rounded-[1.45rem]",
              isDarkLanding
                ? "border border-white/8 bg-[rgba(13,16,28,0.82)] shadow-[0_24px_80px_rgba(5,10,28,0.34)]"
                : "border border-slate-200/80 bg-[rgba(255,255,255,0.82)] shadow-[0_24px_70px_rgba(15,23,42,0.12)]",
            )}
          >
            <div className="lg:hidden">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.9rem] bg-[linear-gradient(135deg,#ff7a00_0%,#ff5a00_60%,#ff8f2d_100%)] shadow-[0_0_28px_rgba(255,106,0,0.32)]">
                    <img
                      src="/logo-app-192.png"
                      alt={t("sidebar.logoAlt")}
                      className="h-6 w-6 rounded-md object-cover"
                    />
                  </div>
                  <p
                    className={cn(
                      "truncate text-[0.98rem] font-bold tracking-[-0.03em]",
                      isDarkLanding ? "text-white" : "text-slate-950",
                    )}
                  >
                    HotsNew{" "}
                    <span
                      className={cn(
                        isDarkLanding ? "text-orange-300" : "text-orange-600",
                      )}
                    >
                      Click
                    </span>
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    aria-label={landingCopy.themeLabel}
                    onClick={toggleTheme}
                    className={cn(
                      "inline-flex h-9 w-9 items-center justify-center rounded-[0.82rem] border transition-colors",
                      isDarkLanding
                        ? "border-white/8 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white"
                        : "border-slate-200 bg-white/80 text-slate-600 hover:bg-white hover:text-slate-950",
                    )}
                  >
                    {isDarkLanding ? <Sun size={14} /> : <Moon size={14} />}
                  </button>
                  <SwipeLanguageSwitch tone={isDarkLanding ? "dark" : "light"} />
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={openLoginPage}
                  className={cn(
                    "inline-flex min-w-0 flex-1 items-center justify-center rounded-[0.85rem] px-3 py-2.5 text-[0.82rem] font-medium transition-colors",
                    isDarkLanding
                      ? "border border-white/8 bg-white/[0.03] text-slate-300 hover:text-white"
                      : "border border-slate-200 bg-white/75 text-slate-600 hover:text-slate-950",
                  )}
                >
                  {landingCopy.signIn}
                </button>
                <button
                  type="button"
                  onClick={openRegisterPage}
                  className="inline-flex min-w-0 flex-[1.25] items-center justify-center gap-2 rounded-[0.85rem] bg-[linear-gradient(135deg,#ff7a00_0%,#ff5a00_55%,#ff8f2d_100%)] px-3.5 py-2.5 text-[0.82rem] font-semibold text-white shadow-[0_18px_35px_rgba(255,106,0,0.24)] transition-transform hover:-translate-y-0.5"
                >
                  {landingCopy.startFree}
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>

            <div className="hidden lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-5">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-[0.95rem] bg-[linear-gradient(135deg,#ff7a00_0%,#ff5a00_60%,#ff8f2d_100%)] shadow-[0_0_28px_rgba(255,106,0,0.32)]">
                  <img
                    src="/logo-app-192.png"
                    alt={t("sidebar.logoAlt")}
                    className="h-7 w-7 rounded-md object-cover"
                  />
                </div>
                <div>
                  <p
                    className={cn(
                      "text-[1.05rem] font-bold tracking-[-0.03em]",
                      isDarkLanding ? "text-white" : "text-slate-950",
                    )}
                  >
                    HotsNew{" "}
                    <span
                      className={cn(
                        isDarkLanding ? "text-orange-300" : "text-orange-600",
                      )}
                    >
                      Click
                    </span>
                  </p>
                </div>
              </div>

              <nav className="min-w-0 items-center justify-center gap-0.5 lg:flex lg:justify-self-stretch">
                {landingCopy.nav.map((item) => (
                  <a
                    key={`${item.label}-${item.href}`}
                    href={item.href}
                    onClick={(event) => {
                      event.preventDefault();
                      scrollToSection(item.href);
                    }}
                    className={cn(
                      "flex shrink items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
                      isDarkLanding
                        ? "text-slate-400 hover:bg-white/[0.05] hover:text-white"
                        : "text-slate-500 hover:bg-slate-950/[0.04] hover:text-slate-950",
                    )}
                  >
                    {item.label}
                    {item.hasDot && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    )}
                  </a>
                ))}
              </nav>

              <div className="flex flex-wrap items-center gap-2.5 sm:justify-end lg:justify-self-end lg:flex-nowrap">
                <div className="inline-flex items-center gap-2.5">
                  <button
                    type="button"
                    aria-label={landingCopy.themeLabel}
                    onClick={toggleTheme}
                    className={cn(
                      "inline-flex h-10 w-10 items-center justify-center rounded-[0.9rem] border transition-colors",
                      isDarkLanding
                        ? "border-white/8 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white"
                        : "border-slate-200 bg-white/80 text-slate-600 hover:bg-white hover:text-slate-950",
                    )}
                  >
                    {isDarkLanding ? <Sun size={15} /> : <Moon size={15} />}
                  </button>
                  <SwipeLanguageSwitch tone={isDarkLanding ? "dark" : "light"} />
                </div>
                <button
                  type="button"
                  onClick={openLoginPage}
                  className={cn(
                    "inline-flex min-w-[6.25rem] items-center justify-center rounded-[0.9rem] px-2 py-2.5 text-sm font-medium transition-colors",
                    isDarkLanding
                      ? "text-slate-300 hover:text-white"
                      : "text-slate-600 hover:text-slate-950",
                  )}
                >
                  {landingCopy.signIn}
                </button>
                <button
                  type="button"
                  onClick={openRegisterPage}
                  className="inline-flex min-w-[9.25rem] items-center justify-center gap-2 rounded-[0.9rem] bg-[linear-gradient(135deg,#ff7a00_0%,#ff5a00_55%,#ff8f2d_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(255,106,0,0.24)] transition-transform hover:-translate-y-0.5"
                >
                  {landingCopy.startFree}
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </header>

          <AuthShowcase
            onOpenLogin={openLoginPage}
            onOpenRegister={openRegisterPage}
            tone={isDarkLanding ? "dark" : "light"}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative min-h-screen overflow-hidden lg:h-screen lg:max-h-screen",
        isDarkAuth ? "bg-[#0b0d13] text-white" : "bg-[#f8f6f2] text-slate-950",
      )}
    >
      <div
        className={cn(
          "absolute inset-0",
          isDarkAuth
            ? "bg-[radial-gradient(circle_at_12%_16%,rgba(249,115,22,0.18),transparent_24%),radial-gradient(circle_at_88%_14%,rgba(56,189,248,0.06),transparent_20%),linear-gradient(180deg,#11141c_0%,#0d1017_52%,#0b0d13_100%)]"
            : "bg-[radial-gradient(circle_at_0%_18%,rgba(255,153,72,0.2),transparent_26%),radial-gradient(circle_at_100%_84%,rgba(255,214,170,0.2),transparent_28%),linear-gradient(180deg,#fcfbf8_0%,#f7f3ec_100%)]",
        )}
      />
      <div
        className={cn(
          "absolute inset-0 [background-size:46px_46px]",
          isDarkAuth
            ? "opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.75)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.75)_1px,transparent_1px)]"
            : "opacity-0",
        )}
      />
      <div className={cn("absolute left-0 top-0 h-[32rem] w-[32rem] -translate-x-1/3 -translate-y-1/4 rounded-full blur-[120px]", isDarkAuth ? "bg-orange-500/18" : "bg-orange-200/40")} />
      <div className={cn("absolute bottom-0 right-0 h-[28rem] w-[28rem] translate-x-1/3 translate-y-1/4 rounded-full blur-[140px]", isDarkAuth ? "bg-sky-400/10" : "bg-amber-100/50")} />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1220px] flex-col px-4 py-4 sm:px-6 lg:h-screen lg:max-h-screen lg:px-8">
        <header className={cn("rounded-[1.35rem] border px-4 py-2.5 shadow-[0_14px_34px_rgba(86,60,20,0.08)] backdrop-blur sm:px-5", isDarkAuth ? "border-white/10 bg-[rgba(17,20,28,0.82)] shadow-[0_16px_42px_rgba(2,6,23,0.3)]" : "border-slate-200/80 bg-white/86 shadow-[0_14px_36px_rgba(15,23,42,0.07)]")}>
          <div className="flex flex-col gap-2.5 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4">
            <button
              type="button"
              onClick={backToLanding}
              className="flex items-center gap-3 text-left"
            >
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-[0.9rem] border shadow-[0_8px_18px_rgba(249,115,22,0.14)]", isDarkAuth ? "border-white/10 bg-white/8" : "border-orange-100 bg-white")}>
                <img
                  src="/logo-app-192.png"
                  alt={t("sidebar.logoAlt")}
                  className="h-6 w-6 rounded-md object-cover"
                />
              </div>
              <div>
                <p className={cn("text-[1rem] font-bold tracking-[-0.04em]", isDarkAuth ? "text-white" : "text-slate-950")}>
                  HotsNew <span className="text-orange-600">Click</span>
                </p>
              </div>
            </button>

            <div className="flex flex-wrap items-center justify-end gap-2 sm:flex-nowrap">
              <div className="inline-flex items-center gap-2.5">
                <SwipeLanguageSwitch tone={isDarkAuth ? "dark" : "light"} />
                <button
                  type="button"
                  aria-label={landingCopy.themeLabel}
                  onClick={toggleTheme}
                  className={cn("inline-flex h-8.5 w-8.5 items-center justify-center rounded-[0.85rem] border transition-colors", isDarkAuth ? "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950")}
                >
                  {isDarkAuth ? <Sun size={15} /> : <Moon size={15} />}
                </button>
              </div>
              {!passwordRecoveryMode && (
                <div className={cn("flex items-center gap-2 rounded-[0.9rem] border px-2.5 py-1.5", isDarkAuth ? "border-white/10 bg-white/[0.04]" : "border-slate-200/80 bg-white/82")}>
                  <span className={cn("hidden w-[9.5rem] shrink-0 text-right text-[0.88rem] sm:inline", isDarkAuth ? "text-slate-400" : "text-slate-500")}>
                    {isRegistering
                      ? authExperienceCopy.promptExisting
                      : authExperienceCopy.promptNew}
                  </span>
                  <button
                    type="button"
                    onClick={isRegistering ? openLoginPage : openRegisterPage}
                    className={cn("inline-flex h-8.5 min-w-[8.75rem] items-center justify-center rounded-[0.8rem] border px-3 text-[0.86rem] font-semibold transition-colors", isDarkAuth ? "border-white/10 bg-white/[0.05] text-slate-100 hover:bg-white/[0.1] hover:text-white" : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300 hover:bg-white")}
                  >
                    {isRegistering ? landingCopy.login : landingCopy.startFree}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex flex-1 items-center py-4 lg:min-h-0 lg:py-5 [@media(min-height:900px)]:lg:py-7">
          <section
            id="auth-panel"
            className="grid w-full gap-8 lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(420px,460px)] lg:items-center lg:gap-10 xl:grid-cols-[minmax(0,1.02fr)_minmax(430px,470px)] [@media(max-height:840px)]:gap-6"
          >
            <motion.div
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55 }}
              className="order-2 mx-auto w-full max-w-[33rem] text-center lg:order-1 lg:mx-0 lg:text-left [@media(max-height:860px)]:max-w-[31rem]"
            >
              <div className={cn("inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-700 shadow-[0_12px_30px_rgba(249,115,22,0.08)]", isDarkAuth ? "border-orange-500/20 bg-white/6 text-orange-200 shadow-none" : "border-slate-200 bg-white/90 text-slate-600")}>
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {authHeroCopy.eyebrow}
              </div>

              <h1 className={cn("mx-auto mt-5 max-w-[11ch] text-[clamp(2.1rem,11vw,4.1rem)] font-bold leading-[0.94] tracking-[-0.058em] sm:mt-6 sm:max-w-[12ch] sm:text-[clamp(2.55rem,4.4vw,4.1rem)] lg:mx-0 [@media(max-height:860px)]:mt-4 [@media(max-height:860px)]:text-[clamp(2.05rem,3.7vw,3rem)]", isDarkAuth ? "text-white" : "text-slate-950")}>
                <span className="block">{authHeroCopy.titleLead}</span>
                <span className="block text-orange-500">{authHeroCopy.titleAccent}</span>
              </h1>

              <p className={cn("mx-auto mt-3.5 max-w-[28rem] text-[0.9rem] leading-6 sm:text-[0.92rem] lg:mx-0 [@media(max-height:860px)]:mt-3 [@media(max-height:860px)]:text-[0.88rem] [@media(max-height:860px)]:leading-6", isDarkAuth ? "text-slate-300" : "text-slate-600")}>
                {authHeroCopy.description}
              </p>

              <div className={cn("mt-7 hidden rounded-[1.6rem] border p-5 text-left shadow-[0_20px_50px_rgba(86,60,20,0.07)] sm:block [@media(max-height:860px)]:mt-6 [@media(max-height:700px)]:hidden", isDarkAuth ? "border-white/10 bg-white/6 shadow-[0_22px_60px_rgba(2,6,23,0.24)]" : "border-slate-200/80 bg-white/92")}>
                <div className="flex items-center gap-1 text-orange-500">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <span key={index} className="text-base leading-none">
                      ★
                    </span>
                  ))}
                </div>
                <p className={cn("mt-3 max-w-[28rem] text-[0.9rem] leading-6", isDarkAuth ? "text-slate-200" : "text-slate-700")}>
                  "{authHeroCopy.testimonial}"
                </p>
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ff7a00_0%,#ff5a00_100%)] text-xs font-black text-white shadow-[0_16px_35px_rgba(255,106,0,0.22)]">
                    HC
                  </div>
                  <div>
                    <div className={cn("text-[0.9rem] font-semibold", isDarkAuth ? "text-white" : "text-slate-950")}>
                      {authHeroCopy.author}
                    </div>
                    <div className={cn("text-[13px]", isDarkAuth ? "text-slate-400" : "text-slate-500")}>
                      {authHeroCopy.role}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 hidden gap-5 text-left sm:grid sm:grid-cols-3 [@media(max-height:860px)]:mt-4 [@media(max-height:860px)]:gap-4 [@media(max-height:720px)]:hidden">
                {authHeroCopy.stats.map((item) => (
                  <div key={item.value}>
                    <div className={cn("text-[1.38rem] font-bold tracking-[-0.05em]", isDarkAuth ? "text-white" : "text-slate-950")}>
                      {item.value}
                    </div>
                    <div className={cn("mt-1 text-[13px] leading-5", isDarkAuth ? "text-slate-400" : "text-slate-500")}>
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55 }}
              className="order-1 mx-auto w-full max-w-[27rem] lg:order-2 lg:justify-self-end lg:pt-2 [@media(max-height:860px)]:max-w-[25.75rem]"
            >
              <AnimatePresence mode="wait">
                {passwordRecoveryMode ? (
                  <motion.div
                    key="recovery"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.24 }}
                  >
                    <AuthFormPanel
                      isRegistering={false}
                      email={loginEmail}
                      setEmail={setLoginEmail}
                      password={loginPassword}
                      setPassword={setLoginPassword}
                      rememberMe={rememberMe}
                      setRememberMe={setRememberMe}
                      passwordRecoveryMode
                      recoveryPassword={recoveryPassword}
                      setRecoveryPassword={setRecoveryPassword}
                      recoveryConfirmPassword={recoveryConfirmPassword}
                      setRecoveryConfirmPassword={setRecoveryConfirmPassword}
                      loading={loading}
                      authError={authError}
                      authNotice={authNotice}
                      handleEmailAuth={handleEmailAuth}
                      handleGoogleAuth={handleGoogleAuth}
                      handleForgotPassword={handleForgotPassword}
                      handlePasswordRecovery={handlePasswordRecovery}
                      resetLoading={resetLoading}
                      themeTone={isDarkAuth ? "dark" : "light"}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key={isRegistering ? "register" : "login"}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.24 }}
                  >
                    <AuthFormPanel
                      isRegistering={isRegistering}
                      email={isRegistering ? registerEmail : loginEmail}
                      setEmail={isRegistering ? setRegisterEmail : setLoginEmail}
                      password={isRegistering ? registerPassword : loginPassword}
                      setPassword={
                        isRegistering ? setRegisterPassword : setLoginPassword
                      }
                      rememberMe={rememberMe}
                      setRememberMe={setRememberMe}
                      recoveryPassword={recoveryPassword}
                      setRecoveryPassword={setRecoveryPassword}
                      recoveryConfirmPassword={recoveryConfirmPassword}
                      setRecoveryConfirmPassword={setRecoveryConfirmPassword}
                      loading={loading}
                      authError={authError}
                      authNotice={authNotice}
                      handleEmailAuth={handleEmailAuth}
                      handleGoogleAuth={handleGoogleAuth}
                      handleForgotPassword={handleForgotPassword}
                      handlePasswordRecovery={handlePasswordRecovery}
                      resetLoading={resetLoading}
                      themeTone={isDarkAuth ? "dark" : "light"}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className={cn("mt-4 text-center text-sm [@media(max-height:860px)]:mt-3", isDarkAuth ? "text-slate-400" : "text-slate-500")}>
                <span className={cn("font-medium", isDarkAuth ? "text-slate-200" : "text-slate-700")}>
                  {auth.topbar.security}
                </span>
                {" • "}
                {authExperienceCopy.compliance}
              </div>
            </motion.div>
          </section>
        </main>

        <p className={cn("pb-1 text-center text-[11px] [@media(max-height:860px)]:hidden", isDarkAuth ? "text-slate-500" : "text-slate-400")}>
          {auth.footer}
        </p>
      </div>
    </div>
  );
};

const AuthFormPanel = ({
  isRegistering,
  email,
  setEmail,
  password,
  setPassword,
  rememberMe,
  setRememberMe,
  passwordRecoveryMode = false,
  recoveryPassword,
  setRecoveryPassword,
  recoveryConfirmPassword,
  setRecoveryConfirmPassword,
  loading,
  authError,
  authNotice,
  handleEmailAuth,
  handleGoogleAuth,
  handleForgotPassword,
  handlePasswordRecovery,
  resetLoading,
  themeTone,
}: AuthFormProps) => {
  const { messages } = useLocale();
  const auth = messages.auth;
  const isDark = themeTone === "dark";
  const [showPrimaryPassword, setShowPrimaryPassword] = useState(false);
  const [showRecoveryPassword, setShowRecoveryPassword] = useState(false);
  const [showRecoveryConfirmPassword, setShowRecoveryConfirmPassword] =
    useState(false);

  const title = passwordRecoveryMode
    ? auth.panel.titles.recovery
    : isRegistering
      ? auth.panel.titles.register
      : auth.panel.titles.login;

  const subtitle = passwordRecoveryMode
    ? auth.panel.subtitles.recovery
    : isRegistering
      ? auth.panel.subtitles.register
      : auth.panel.subtitles.login;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-[1.8rem] p-6 sm:p-8",
        isDark
          ? "border border-white/10 bg-[linear-gradient(180deg,rgba(18,22,30,0.98)_0%,rgba(12,15,22,0.98)_100%)] shadow-[0_24px_70px_rgba(2,6,23,0.35)]"
          : "border border-[#d9dcf8] bg-[linear-gradient(180deg,#fffefe_0%,#fffdfa_100%)] shadow-[0_24px_70px_rgba(86,60,20,0.08)]",
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(255,132,0,0.08),transparent_72%)]", isDark && "opacity-80")} />

      <div className="relative flex min-h-full flex-col">
        <div className="mb-6 text-center">
          {passwordRecoveryMode && (
            <div className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em]", isDark ? "border-orange-500/20 bg-orange-500/10 text-orange-200" : "border-orange-100 bg-orange-50/80 text-orange-700")}>
              <BadgeCheck size={13} />
              {auth.panel.badges.recovery}
            </div>
          )}
          <h2 className={cn("mt-2 text-[1.7rem] font-bold tracking-[-0.04em] sm:text-[1.85rem]", isDark ? "text-white" : "text-slate-950")}>
            {title}
          </h2>
          <p className={cn("mt-2 text-[13px] leading-[1.35rem]", isDark ? "text-slate-400" : "text-slate-500")}>
            {subtitle}
          </p>
        </div>

        <form
          onSubmit={
            passwordRecoveryMode ? handlePasswordRecovery : handleEmailAuth
          }
          className="flex flex-1 flex-col space-y-4"
        >
          {!passwordRecoveryMode && (
            <>
              <button
                type="button"
                onClick={() => void handleGoogleAuth()}
                className={cn(
                  "inline-flex items-center justify-center gap-3 rounded-[0.95rem] border px-5 py-3 text-[0.92rem] font-semibold transition-colors",
                  isDark
                    ? "border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                    : "border-slate-200 bg-white text-slate-900 shadow-[0_1px_0_rgba(255,255,255,0.7)] hover:border-slate-300",
                )}
              >
                <GoogleMark />
                {auth.panel.oauth.google}
              </button>
              <div className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
                <span className={cn("h-px flex-1", isDark ? "bg-white/10" : "bg-slate-200")} />
                <span>{auth.panel.oauth.divider}</span>
                <span className={cn("h-px flex-1", isDark ? "bg-white/10" : "bg-slate-200")} />
              </div>
            </>
          )}
          <InputField
            label={auth.panel.fields.email}
            icon={<Mail size={18} />}
            type="email"
            value={email}
            onChange={setEmail}
            placeholder={auth.panel.placeholders.email}
            readOnly={passwordRecoveryMode}
            dark={isDark}
          />

          <AnimatePresence mode="wait">
            {passwordRecoveryMode ? (
              <motion.div
                key="recovery-fields"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22 }}
                className="space-y-3"
              >
                <PasswordField
                  label={auth.panel.fields.newPassword}
                  value={recoveryPassword}
                  onChange={setRecoveryPassword}
                  showValue={showRecoveryPassword}
                  onToggleShow={() => setShowRecoveryPassword((prev) => !prev)}
                  dark={isDark}
                />
                <PasswordField
                  label={auth.panel.fields.confirmPassword}
                  value={recoveryConfirmPassword}
                  onChange={setRecoveryConfirmPassword}
                  showValue={showRecoveryConfirmPassword}
                  onToggleShow={() =>
                    setShowRecoveryConfirmPassword((prev) => !prev)
                  }
                  dark={isDark}
                />
              </motion.div>
            ) : (
              <motion.div
                key="auth-fields"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22 }}
                className="space-y-3"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className={cn("text-[12px] font-semibold", isDark ? "text-slate-100" : "text-slate-800")}>
                      {auth.panel.fields.password}
                    </label>
                    {!isRegistering && (
                      <button
                        type="button"
                        onClick={() => void handleForgotPassword()}
                        className="text-[9px] font-bold uppercase tracking-[0.14em] text-orange-600 transition-colors hover:text-orange-700"
                      >
                        {auth.panel.misc.forgotPassword}
                      </button>
                    )}
                  </div>

                  <div className={cn("group relative overflow-hidden rounded-[1rem] border transition-colors focus-within:border-orange-300 focus-within:shadow-[0_0_0_4px_rgba(249,115,22,0.08)]", isDark ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-white")}>
                    <span className={cn("absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-orange-600", isDark ? "text-slate-500" : "text-slate-400")}>
                      <Lock size={18} />
                    </span>
                    <input
                      type={showPrimaryPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={cn("w-full bg-transparent px-12 py-3 pr-12 text-[14px] font-medium outline-none", isDark ? "text-white placeholder:text-slate-600" : "text-slate-950 placeholder:text-slate-300")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPrimaryPassword((prev) => !prev)}
                      className={cn("absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:text-orange-600", isDark ? "text-slate-500" : "text-slate-400")}
                    >
                      {showPrimaryPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {!isRegistering && (
                  <label className={cn("flex items-center gap-3 text-[13px] font-medium", isDark ? "text-slate-300" : "text-slate-600")}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                    />
                    {auth.panel.misc.rememberMe}
                  </label>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {authError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn("flex items-center gap-3 rounded-[0.95rem] border px-4 py-3 text-sm font-medium", isDark ? "border-rose-500/20 bg-rose-500/10 text-rose-200" : "border-rose-200 bg-rose-50 text-rose-700")}
            >
              <AlertCircle size={16} className="shrink-0" />
              <span>{authError}</span>
            </motion.div>
          )}

          {authNotice && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn("flex items-start gap-3 rounded-[0.95rem] border px-4 py-3 text-sm font-medium leading-6", isDark ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200" : "border-emerald-200 bg-emerald-50 text-emerald-800")}
            >
              <Mail size={16} className="mt-1 shrink-0" />
              <span>{authNotice}</span>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "relative isolate mt-2 group flex w-full items-center justify-center gap-2 overflow-hidden rounded-[1rem] bg-[linear-gradient(135deg,#ff7a00_0%,#ff5a00_55%,#ff8f2d_100%)] px-5 py-3 text-[0.92rem] font-semibold text-white shadow-[0_20px_40px_rgba(255,106,0,0.22)] transition-transform active:scale-[0.99]",
              loading && "cursor-not-allowed opacity-85",
            )}
          >
            <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18),transparent_42%,rgba(255,255,255,0.08))]" />
            <span className="relative z-10 flex items-center gap-2">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : passwordRecoveryMode ? (
                auth.panel.actions.recovery
              ) : isRegistering ? (
                auth.panel.actions.register
              ) : (
                auth.panel.actions.login
              )}
              {!loading && (
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              )}
            </span>
          </button>

          {loading && resetLoading && (
            <button
              type="button"
              onClick={resetLoading}
              className="w-full text-center text-[11px] font-medium text-slate-500 transition-colors hover:text-orange-600"
            >
              {auth.panel.actions.cancelLoading}
            </button>
          )}
        </form>
      </div>
    </motion.div>
  );
};

const InputField = ({
  label,
  icon,
  type,
  value,
  onChange,
  placeholder,
  readOnly = false,
  dark = false,
}: {
  label: string;
  icon: React.ReactNode;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  readOnly?: boolean;
  dark?: boolean;
}) => (
  <div className="space-y-2.5">
    <label className={cn("text-[12px] font-semibold", dark ? "text-slate-100" : "text-slate-800")}>{label}</label>
    <div className={cn("group relative overflow-hidden rounded-[1rem] border transition-colors focus-within:border-orange-300 focus-within:shadow-[0_0_0_4px_rgba(249,115,22,0.08)]", dark ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-white")}>
      <span className={cn("absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-orange-600", dark ? "text-slate-500" : "text-slate-400")}>
        {icon}
      </span>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={cn(
          "w-full bg-transparent px-12 py-3 pr-4 text-[14px] font-medium outline-none",
          dark ? "text-white placeholder:text-slate-600" : "text-slate-950 placeholder:text-slate-300",
          readOnly && "cursor-not-allowed opacity-70",
        )}
      />
    </div>
  </div>
);

const PasswordField = ({
  label,
  value,
  onChange,
  showValue,
  onToggleShow,
  dark = false,
  invalid = false,
  errorText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  showValue: boolean;
  onToggleShow: () => void;
  dark?: boolean;
  invalid?: boolean;
  errorText?: string;
}) => (
  <div className="space-y-2.5">
    <label className={cn("text-[12px] font-semibold", dark ? "text-slate-100" : "text-slate-800")}>{label}</label>
    <div
      className={cn(
        "group relative overflow-hidden rounded-[1rem] border transition-colors",
        invalid
          ? "border-rose-300 focus-within:border-rose-400 focus-within:shadow-[0_0_0_4px_rgba(244,63,94,0.08)]"
          : dark
            ? "border-white/10 bg-white/[0.04] focus-within:border-orange-300 focus-within:shadow-[0_0_0_4px_rgba(249,115,22,0.08)]"
            : "border-slate-200 bg-white focus-within:border-orange-300 focus-within:shadow-[0_0_0_4px_rgba(249,115,22,0.08)]",
      )}
    >
      <span
        className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
          invalid
            ? "text-rose-400 group-focus-within:text-rose-500"
            : dark
              ? "text-slate-500 group-focus-within:text-orange-600"
              : "text-slate-400 group-focus-within:text-orange-600",
        )}
      >
        <Lock size={18} />
      </span>
      <input
        type={showValue ? "text" : "password"}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="••••••••"
        className={cn("w-full bg-transparent px-12 py-3 pr-12 text-[14px] font-medium outline-none", dark ? "text-white placeholder:text-slate-600" : "text-slate-950 placeholder:text-slate-300")}
      />
      <button
        type="button"
        onClick={onToggleShow}
        className={cn(
          "absolute right-4 top-1/2 -translate-y-1/2 transition-colors",
          invalid
            ? "text-rose-400 hover:text-rose-500"
            : dark
              ? "text-slate-500 hover:text-orange-600"
              : "text-slate-400 hover:text-orange-600",
        )}
      >
        {showValue ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
    {errorText && (
      <p className="pl-1 text-xs font-medium text-rose-600">{errorText}</p>
    )}
  </div>
);

const GoogleMark = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className="h-5 w-5"
    role="img"
  >
    <path
      fill="#EA4335"
      d="M12 10.2v3.88h5.39c-.24 1.25-.95 2.31-2.03 3.02l3.28 2.54c1.91-1.76 3.01-4.35 3.01-7.42 0-.71-.06-1.39-.18-2.04H12z"
    />
    <path
      fill="#34A853"
      d="M12 22c2.73 0 5.02-.9 6.7-2.44l-3.28-2.54c-.91.61-2.08.97-3.42.97-2.63 0-4.86-1.78-5.66-4.18H2.95v2.62A10.12 10.12 0 0 0 12 22z"
    />
    <path
      fill="#4A90E2"
      d="M6.34 13.81A6.08 6.08 0 0 1 6.02 12c0-.63.11-1.24.32-1.81V7.57H2.95A10.02 10.02 0 0 0 1.9 12c0 1.61.38 3.13 1.05 4.43l3.39-2.62z"
    />
    <path
      fill="#FBBC05"
      d="M12 5.99c1.49 0 2.83.51 3.88 1.51l2.91-2.91C17.01 2.94 14.72 2 12 2A10.12 10.12 0 0 0 2.95 7.57l3.39 2.62C7.14 7.78 9.37 5.99 12 5.99z"
    />
  </svg>
);
