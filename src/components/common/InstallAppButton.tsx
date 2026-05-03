import { Download, Smartphone } from "lucide-react";
import { usePWAInstall } from "@/src/hooks/usePWAInstall";

export function InstallAppButton() {
  const { canInstall, isInstalled, isInstalling, install } = usePWAInstall();

  if (isInstalled) {
    return (
      <div className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
        <Smartphone size={14} />
        App đã được cài đặt rồi nhé! Mở menu trình duyệt để sử dụng app thôi nào
      </div>
    );
  }

  if (!canInstall) {
    return (
      <div className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-[11px] font-bold text-gray-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        <Smartphone size={14} />
        Mở menu trình duyệt để cài đặt app nhé
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void install()}
      disabled={isInstalling}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 dark:bg-orange-600 dark:hover:bg-orange-500"
    >
      <Download size={14} />
      {isInstalling ? "Đang cài..." : "Cài app"}
    </button>
  );
}
