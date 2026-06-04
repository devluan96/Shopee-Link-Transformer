import React from "react";
import { X } from "lucide-react";

interface MediaAssetEditDialogProps {
  open: boolean;
  title: string;
  subtitle: string;
  folderLabel: string;
  folderPlaceholder: string;
  tagsLabel: string;
  tagsPlaceholder: string;
  cancelLabel: string;
  saveLabel: string;
  currentFileName: string;
  currentFolderName: string;
  currentTagsText: string;
  onCancel: () => void;
  onSave: (data: { folderName: string; tagsText: string }) => Promise<void>;
}

export function MediaAssetEditDialog({
  open,
  title,
  subtitle,
  folderLabel,
  folderPlaceholder,
  tagsLabel,
  tagsPlaceholder,
  cancelLabel,
  saveLabel,
  currentFileName,
  currentFolderName,
  currentTagsText,
  onCancel,
  onSave,
}: MediaAssetEditDialogProps) {
  const [folderName, setFolderName] = React.useState(currentFolderName);
  const [tagsText, setTagsText] = React.useState(currentTagsText);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setFolderName(currentFolderName);
    setTagsText(currentTagsText);
    setSaving(false);
    setError(null);
  }, [currentFileName, currentFolderName, currentTagsText, open]);

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await onSave({
        folderName,
        tagsText,
      });
      setSaving(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to save media metadata",
      );
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        onClick={saving ? undefined : onCancel}
        className="absolute inset-0 bg-black/65 backdrop-blur-md"
      />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-[0_40px_120px_rgba(15,23,42,0.28)] dark:border-slate-700 dark:bg-slate-800"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-slate-700">
          <div>
            <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">
              {title}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              {subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-2xl bg-gray-100 p-3 text-gray-500 transition-all hover:bg-gray-200 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs font-semibold text-gray-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            {currentFileName}
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400 dark:text-slate-500">
              {folderLabel}
            </label>
            <input
              value={folderName}
              onChange={(event) => setFolderName(event.target.value)}
              placeholder={folderPlaceholder}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition-all focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400 dark:text-slate-500">
              {tagsLabel}
            </label>
            <input
              value={tagsText}
              onChange={(event) => setTagsText(event.target.value)}
              placeholder={tagsPlaceholder}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition-all focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          {error && (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 px-6 py-5 sm:flex-row dark:border-slate-700">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="inline-flex flex-1 items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-orange-500/25 transition-all hover:brightness-105 disabled:opacity-60"
          >
            {saving ? "..." : saveLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
