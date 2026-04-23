import React, { useState } from "react";
import {
  Zap,
  Users as UsersIcon,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Mail,
  Lock,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { signInWithGoogle } from "@/src/lib/supabase";
import { motion, AnimatePresence } from "motion/react";

interface AuthScreenProps {
  isRegistering: boolean;
  setIsRegistering: (val: boolean) => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  loading: boolean;
  authError: string | null;
  handleEmailAuth: (e: React.FormEvent) => void;
  resetLoading?: () => void;
}

export const AuthScreen = ({
  isRegistering,
  setIsRegistering,
  email,
  setEmail,
  password,
  setPassword,
  loading,
  authError,
  handleEmailAuth,
  resetLoading,
}: AuthScreenProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const toggleMode = (mode: boolean) => {
    if (mode === isRegistering) return;
    setIsFlipped(!isFlipped);
    setTimeout(() => {
      setIsRegistering(mode);
    }, 150);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 font-sans overflow-hidden">
      {/* Decorative background elements for depth */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-100 rounded-full blur-[120px] opacity-50 select-none pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-30 select-none pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
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
        </motion.div>

        <div className="perspective-1000">
          <motion.div
            initial={false}
            animate={{ rotateY: isRegistering ? 180 : 0 }}
            transition={{
              duration: 0.6,
              type: "spring",
              stiffness: 260,
              damping: 20,
            }}
            style={{ transformStyle: "preserve-3d" }}
            className="relative h-145 w-full"
          >
            {/* Front side (LOGIN) */}
            <div
              style={{ backfaceVisibility: "hidden" }}
              className="absolute inset-0 w-full h-full bg-white p-8 rounded-[3rem] shadow-2xl border border-white/20 backdrop-blur-sm shadow-orange-900/5 flex flex-col"
            >
              <AuthForm
                title="Đăng nhập"
                subtitle="Mừng bạn quay trở lại"
                isRegistering={false}
                setIsRegistering={toggleMode}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                loading={loading}
                authError={authError}
                handleEmailAuth={handleEmailAuth}
                resetLoading={resetLoading}
              />
            </div>

            {/* Back side (REGISTER) */}
            <div
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
              className="absolute inset-0 w-full h-full bg-slate-900 p-8 rounded-[3rem] shadow-2xl border border-slate-800/50 shadow-slate-900/20 flex flex-col"
            >
              <AuthForm
                title="Đăng ký"
                subtitle="Bắt đầu hành trình mới"
                isRegistering={true}
                setIsRegistering={toggleMode}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                loading={loading}
                authError={authError}
                handleEmailAuth={handleEmailAuth}
                resetLoading={resetLoading}
                dark
              />
            </div>
          </motion.div>
        </div>

        <p className="text-center mt-12 text-xs text-gray-400 font-medium italic">
          Bằng cách tiếp tục, bạn đồng ý với các Điều khoản dịch vụ của Hotsnew.
        </p>
      </div>
    </div>
  );
};

const AuthForm = ({
  title,
  subtitle,
  isRegistering,
  setIsRegistering,
  email,
  setEmail,
  password,
  setPassword,
  loading,
  authError,
  handleEmailAuth,
  resetLoading,
  dark = false,
}: any) => {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h2
          className={cn(
            "text-2xl font-black mb-1",
            dark ? "text-white" : "text-gray-900",
          )}
        >
          {title}
        </h2>
        <p
          className={cn(
            "text-xs font-bold uppercase tracking-wider",
            dark ? "text-slate-500" : "text-gray-400",
          )}
        >
          {subtitle}
        </p>
      </div>

      <div
        className={cn(
          "flex p-1 rounded-2xl mb-8",
          dark ? "bg-slate-800/50" : "bg-gray-100",
        )}
      >
        <button
          type="button"
          onClick={() => setIsRegistering(false)}
          className={cn(
            "flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
            !isRegistering
              ? dark
                ? "bg-slate-700 text-white shadow-lg"
                : "bg-white text-gray-900 shadow-lg"
              : dark
                ? "text-slate-500 hover:text-slate-400"
                : "text-gray-400 hover:text-gray-600",
          )}
        >
          Đăng nhập
        </button>
        <button
          type="button"
          onClick={() => setIsRegistering(true)}
          className={cn(
            "flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
            isRegistering
              ? dark
                ? "bg-white text-gray-900 shadow-lg"
                : "bg-white text-gray-900 shadow-lg"
              : dark
                ? "text-slate-500 hover:text-slate-400"
                : "text-gray-400 hover:text-gray-600",
          )}
        >
          Đăng ký
        </button>
      </div>

      <form onSubmit={handleEmailAuth} className="space-y-4 flex-1">
        <div className="space-y-1.5">
          <label
            className={cn(
              "text-[10px] font-black uppercase tracking-widest ml-1",
              dark ? "text-slate-500" : "text-gray-400",
            )}
          >
            Email address
          </label>
          <div className="relative group">
            <span
              className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
                dark
                  ? "text-slate-600 group-focus-within:text-white"
                  : "text-gray-400 group-focus-within:text-orange-500",
              )}
            >
              <Mail size={18} />
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className={cn(
                "w-full pl-12 pr-4 py-3.5 border-2 outline-none transition-all font-medium text-sm rounded-[1.25rem]",
                dark
                  ? "bg-slate-800/50 border-transparent focus:border-white/20 text-white placeholder:text-slate-700"
                  : "bg-gray-50 border-transparent focus:border-orange-500 text-gray-900 placeholder:text-gray-300",
              )}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            className={cn(
              "text-[10px] font-black uppercase tracking-widest ml-1",
              dark ? "text-slate-500" : "text-gray-400",
            )}
          >
            Password
          </label>
          <div className="relative group">
            <span
              className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
                dark
                  ? "text-slate-600 group-focus-within:text-white"
                  : "text-gray-400 group-focus-within:text-orange-500",
              )}
            >
              <Lock size={18} />
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={cn(
                "w-full pl-12 pr-4 py-3.5 border-2 outline-none transition-all font-medium text-sm rounded-[1.25rem]",
                dark
                  ? "bg-slate-800/50 border-transparent focus:border-white/20 text-white placeholder:text-slate-700"
                  : "bg-gray-50 border-transparent focus:border-orange-500 text-gray-900 placeholder:text-gray-300",
              )}
            />
          </div>
        </div>

        {authError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-xs font-bold text-red-500 bg-red-500/10 p-4 rounded-2xl border border-red-500/20 flex items-center gap-2"
          >
            <AlertCircle size={14} className="shrink-0" /> {authError}
          </motion.div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={cn(
            "w-full py-4 mt-2 rounded-[1.25rem] font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-95 flex items-center justify-center gap-2",
            dark
              ? "bg-white text-slate-900 hover:bg-slate-50 shadow-xl shadow-white/5"
              : "bg-orange-600 text-white hover:bg-orange-700 shadow-xl shadow-orange-600/20",
          )}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isRegistering ? (
            "Tạo tài khoản ngay"
          ) : (
            "Truy cập hệ thống"
          )}
          {!loading && <ArrowRight size={14} />}
        </button>

        {loading && resetLoading && (
          <button
            type="button"
            onClick={resetLoading}
            className="w-full text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest hover:text-orange-600 transition-colors mt-2"
          >
            Hủy và thử lại nếu treo
          </button>
        )}
      </form>
    </div>
  );
};

const Loader2 = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
