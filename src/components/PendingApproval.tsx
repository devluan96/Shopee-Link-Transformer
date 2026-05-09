import React from "react";
import { Clock } from "lucide-react";
import { useLocale } from "@/src/hooks/useLocale";

interface PendingApprovalProps {
  handleLogout: () => void;
}

export const PendingApproval = ({ handleLogout }: PendingApprovalProps) => {
  const { t } = useLocale();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 p-8 text-center font-sans">
      <div className="mb-8 flex h-20 w-20 animate-pulse items-center justify-center rounded-3xl bg-orange-600 shadow-2xl shadow-orange-900/20">
        <Clock size={40} className="text-white" />
      </div>
      <h2 className="mb-4 text-4xl font-black tracking-tight text-white">
        {t("pendingApproval.title")}
      </h2>
      <p className="mb-12 max-w-sm font-medium leading-relaxed text-slate-400">
        <span className="font-bold text-orange-500">hotsnew.click</span>.{" "}
        {t("pendingApproval.description")}
      </p>
      <button
        onClick={handleLogout}
        className="rounded-2xl bg-white px-12 py-4 text-xs font-black uppercase tracking-widest text-slate-900 shadow-xl transition-all hover:bg-orange-500 hover:text-white active:scale-95"
      >
        {t("pendingApproval.signOut")}
      </button>
      <p className="mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
        HotsNew Click
      </p>
    </div>
  );
};
