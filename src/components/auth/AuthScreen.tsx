import React from 'react';
import { motion } from 'motion/react';
import { Zap, Users as UsersIcon, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { signInWithGoogle } from '@/src/lib/supabase';

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
  handleEmailAuth
}: AuthScreenProps) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-8 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-600 shadow-2xl shadow-orange-200">
            <Zap className="h-8 w-8 fill-current text-white" />
          </div>
          <h1 className="mb-2 text-4xl font-black tracking-tight text-gray-900">
            HotsNew <span className="uppercase italic text-orange-600">click</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tiếp thị liên kết thông minh</p>
        </div>

        <div className="relative overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-xl">
          <div className="mb-8 flex rounded-2xl bg-gray-50 p-1">
            <button
              onClick={() => setIsRegistering(false)}
              className={cn(
                'flex-1 rounded-xl py-3 text-xs font-black uppercase tracking-widest transition-all',
                !isRegistering ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              Đăng nhập
            </button>
            <button
              onClick={() => setIsRegistering(true)}
              className={cn(
                'flex-1 rounded-xl py-3 text-xs font-black uppercase tracking-widest transition-all',
                isRegistering ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              Đăng ký
            </button>
          </div>

          <form onSubmit={handleEmailAuth} className="mb-6 space-y-4">
            <div className="space-y-1">
              <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Email address</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><UsersIcon size={16} /></span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border-2 border-transparent bg-gray-50 py-3 pl-12 pr-4 text-sm font-medium outline-none transition-all focus:border-orange-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Password</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><ShieldCheck size={16} /></span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border-2 border-transparent bg-gray-50 py-3 pl-12 pr-4 text-sm font-medium outline-none transition-all focus:border-orange-500"
                />
              </div>
            </div>

            {authError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-bold text-red-500">
                <AlertCircle size={14} /> {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-orange-100 transition-all hover:bg-orange-700 active:scale-95 disabled:opacity-50"
            >
              {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : (
                isRegistering ? 'Tạo tài khoản' : 'Vào hệ thống'
              )}
              {!loading && <ArrowRight size={14} />}
            </button>
          </form>

          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="mx-4 flex-shrink text-[10px] font-black uppercase tracking-widest text-gray-300">Hoặc</span>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>

          <button
            onClick={signInWithGoogle}
            className="group flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-gray-100 bg-white py-4 font-bold text-gray-700 transition-all hover:border-orange-200 hover:bg-gray-50 active:scale-95"
          >
            <img src="https://lh3.googleusercontent.com/COxitqzZInE1pNp_PsSUsUou9YI-BgeRR_Y8ynNAtXFAn8AuvmS7sc0p76WpWqqi9In0lg" alt="Google" className="h-5 w-5" />
            Sử dụng Google
          </button>
        </div>

        <p className="mt-8 text-center text-xs font-medium italic text-gray-400">
          Bằng cách tiếp tục, bạn đồng ý với các Điều khoản dịch vụ của Hotsnew.
        </p>
      </motion.div>
    </div>
  );
};
