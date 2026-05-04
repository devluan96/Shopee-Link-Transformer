import React from "react";
import { KeyRound, LogOut, ShieldCheck } from "lucide-react";

interface TwoFactorGateProps {
  email?: string;
  loading?: boolean;
  onVerify: (code: string) => Promise<void>;
  onLogout: () => Promise<void>;
}

export const TwoFactorGate = ({
  email,
  loading,
  onVerify,
  onLogout,
}: TwoFactorGateProps) => {
  const [code, setCode] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6 || loading) return;
    await onVerify(code);
    setCode("");
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-[2.5rem] border border-slate-700 bg-slate-800 p-10 shadow-2xl">
        <div className="mb-8 flex items-center gap-4">
          <div className="rounded-2xl bg-orange-600 p-3 text-white shadow-lg shadow-orange-900/30">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">
              Xác thực 2 lớp
            </h2>
            <p className="text-sm text-slate-400">
              {email || "Tài khoản của bạn"} yêu cầu mã TOTP để vào hệ thống.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-500">
              <KeyRound size={14} className="text-orange-500" />
              Mã xác thực 6 số
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="123456"
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-5 py-4 font-mono text-center text-2xl font-black tracking-[0.4em] text-white outline-none transition-all focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/10"
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full rounded-2xl bg-orange-600 px-5 py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-orange-700 disabled:opacity-60"
          >
            {loading ? "Đang xác minh..." : "Xác minh và vào app"}
          </button>
        </form>

        <button
          type="button"
          onClick={onLogout}
          className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-200"
        >
          <LogOut size={14} />
          Đăng xuất
        </button>
      </div>
    </div>
  );
};
