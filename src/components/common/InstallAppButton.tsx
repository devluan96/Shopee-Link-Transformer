import { ArrowUpRight, CheckCircle2, Download, Smartphone } from "lucide-react";
import { usePWAInstall } from "@/src/hooks/usePWAInstall";

export function InstallAppButton() {
  const { canInstall, isInstalled, isInstalling, install } = usePWAInstall();

  if (isInstalled) {
    return (
      <div className="flex w-full items-center justify-between gap-3 rounded-[1.45rem] border border-emerald-200 bg-emerald-50 px-4 py-4 text-left dark:border-emerald-500/20 dark:bg-emerald-500/10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm dark:bg-slate-950 dark:text-emerald-300">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p className="text-sm font-black text-emerald-800 dark:text-emerald-300">
              App đã được cài đặt
            </p>
            <p className="text-xs font-medium text-emerald-700/80 dark:text-emerald-300/80">
              User có thể mở HotsNew như app riêng từ thiết bị này.
            </p>
          </div>
        </div>
        <Smartphone
          size={18}
          className="shrink-0 text-emerald-600 dark:text-emerald-300"
        />
      </div>
    );
  }

  if (!canInstall) {
    return (
      <div className="flex w-full items-center justify-between gap-3 rounded-[1.45rem] border border-slate-200 bg-white px-4 py-4 text-left dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            <Smartphone size={18} />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900 dark:text-slate-100">
              Cài từ menu trình duyệt
            </p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Nếu chưa hiện prompt, hãy mở menu browser và chọn cài ứng dụng.
            </p>
          </div>
        </div>
        <ArrowUpRight
          size={18}
          className="shrink-0 text-slate-400 dark:text-slate-500"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void install()}
      disabled={isInstalling}
      className="flex w-full items-center justify-between gap-3 rounded-[1.45rem] bg-[linear-gradient(135deg,#f97316,#ea580c)] px-4 py-4 text-left text-white shadow-[0_18px_40px_-20px_rgba(249,115,22,0.85)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_46px_-22px_rgba(249,115,22,0.95)] disabled:cursor-not-allowed disabled:opacity-70"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
          <Download size={18} />
        </div>
        <div>
          <p className="text-sm font-black">
            {isInstalling ? "Đang cài app..." : "Cài app HotsNew ngay"}
          </p>
          <p className="text-xs font-medium text-orange-50/90">
            Đưa workspace lên desktop hoặc màn hình chính chỉ với một bước.
          </p>
        </div>
      </div>
      <ArrowUpRight size={18} className="shrink-0 text-white" />
    </button>
  );
}
