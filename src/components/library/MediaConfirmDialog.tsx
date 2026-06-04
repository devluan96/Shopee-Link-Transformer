import React from "react";
import { Trash2, X } from "lucide-react";

interface MediaConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  confirmTone?: "danger" | "warning";
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
}

export function MediaConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  confirmTone = "danger",
  busy = false,
  onCancel,
  onConfirm,
}: MediaConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close confirmation"
        onClick={busy ? undefined : onCancel}
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
      />

      <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-[0_40px_120px_rgba(15,23,42,0.28)] dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-start gap-4 border-b border-gray-100 px-6 py-5 dark:border-slate-700">
          <div
            className={[
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
              confirmTone === "danger"
                ? "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-200"
                : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200",
            ].join(" ")}
          >
            <Trash2 size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">
              {title}
            </h3>
            <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-slate-400">
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-2xl bg-gray-100 p-3 text-gray-500 transition-all hover:bg-gray-200 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="inline-flex flex-1 items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={busy}
            className={[
              "inline-flex flex-1 items-center justify-center rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white shadow-lg transition disabled:opacity-60",
              confirmTone === "danger"
                ? "bg-red-600 shadow-red-500/20 hover:bg-red-700"
                : "bg-amber-600 shadow-amber-500/20 hover:bg-amber-700",
            ].join(" ")}
          >
            {busy ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
