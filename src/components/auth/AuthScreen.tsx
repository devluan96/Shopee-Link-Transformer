import React from "react";
import {
  Zap,
  Users as UsersIcon,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { signInWithGoogle } from "@/src/lib/supabase";

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
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 font-sans">
      <div className="max-w-md w-full">
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
              onClick={() => setIsRegistering(false)}
              className={cn(
                "flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                !isRegistering
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-400 hover:text-gray-600",
              )}
            >
              Đăng nhập
            </button>
            <button
              onClick={() => setIsRegistering(true)}
              className={cn(
                "flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                isRegistering
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-xl outline-none transition-all font-medium text-sm"
                />
              </div>
            </div>

            {authError && (
              <div className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-2">
                <AlertCircle size={14} /> {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isRegistering ? (
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
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-gray-100 rounded-2xl hover:bg-gray-50 hover:border-orange-200 transition-all font-bold text-gray-700 active:scale-95 group"
          >
            <img
              src="https://lh3.googleusercontent.com/COxitqzZInE1pNp_PsSUsUou9YI-BgeRR_Y8ynNAtXFAn8AuvmS7sc0p76WpWqqi9In0lg"
              alt="Google"
              className="w-5 h-5"
            />
            Sử dụng Google
          </button>
        </div>

        <p className="text-center mt-8 text-xs text-gray-400 font-medium italic">
          Bằng cách tiếp tục, bạn đồng ý với các Điều khoản dịch vụ của Hotsnew.
        </p>
      </div>
    </div>
  );
};
