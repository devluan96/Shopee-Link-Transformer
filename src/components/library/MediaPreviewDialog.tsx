import React from "react";
import { Copy, ExternalLink, Folder, Tag, Video, X } from "lucide-react";

export interface MediaPreviewAsset {
  path: string;
  url: string;
  provider: "r2" | "cloudinary" | "supabase";
  resourceType: "image" | "video" | "audio";
  folderName: string;
  tags: string[];
  fileName: string;
  sizeBytes: number;
  modifiedAt: string;
  mimeType: string;
}

interface MediaPreviewDialogProps {
  open: boolean;
  asset: MediaPreviewAsset | null;
  onClose: () => void;
  onCopyUrl: (url: string) => void;
}

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
};

export function MediaPreviewDialog({
  open,
  asset,
  onClose,
  onCopyUrl,
}: MediaPreviewDialogProps) {
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !asset) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close media preview"
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
      />

      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-[0_40px_120px_rgba(15,23,42,0.35)] dark:border-slate-700 dark:bg-slate-900 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="relative bg-slate-950">
          {asset.resourceType === "video" ? (
            <video
              src={asset.url}
              controls
              autoPlay
              muted
              playsInline
              className="h-full max-h-[80vh] w-full object-contain"
            />
          ) : asset.resourceType === "audio" ? (
            <div className="flex min-h-[50vh] items-center justify-center px-8 py-16 text-center text-slate-300">
              <div>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-white/10 text-white">
                  <Video size={34} />
                </div>
                <p className="mt-4 text-sm font-medium uppercase tracking-[0.18em]">
                  Audio preview
                </p>
                <audio src={asset.url} controls className="mt-6 w-full" />
              </div>
            </div>
          ) : (
            <img
              src={asset.url}
              alt={asset.fileName}
              className="max-h-[80vh] w-full object-contain"
            />
          )}
        </div>

        <aside className="flex flex-col gap-5 p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-200">
                {asset.resourceType}
              </div>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {asset.provider}
              </div>
              <h3 className="mt-3 truncate text-2xl font-black text-gray-900 dark:text-white">
                {asset.fileName}
              </h3>
              <p className="mt-1 break-all text-sm text-gray-500 dark:text-slate-400">
                {asset.path}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl bg-gray-100 p-3 text-gray-500 transition hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid gap-3 rounded-[1.5rem] border border-gray-100 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-gray-500 dark:text-slate-400">Folder</span>
              <span className="inline-flex items-center gap-2 font-black text-gray-900 dark:text-white">
                <Folder size={14} />
                {asset.folderName || "root"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-gray-500 dark:text-slate-400">Size</span>
              <span className="font-black text-gray-900 dark:text-white">
                {formatBytes(asset.sizeBytes)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-gray-500 dark:text-slate-400">MIME</span>
              <span className="font-black text-gray-900 dark:text-white">
                {asset.mimeType}
              </span>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 dark:text-slate-500">
              <Tag size={12} />
              Tags
            </div>
            <div className="flex flex-wrap gap-2">
              {asset.tags.length ? (
                asset.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-200"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-400 dark:text-slate-500">
                  No tags yet.
                </span>
              )}
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => onCopyUrl(asset.url)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-gray-600 transition hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Copy size={14} />
              Copy URL
            </button>
            <a
              href={asset.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-orange-600 px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-700"
            >
              <ExternalLink size={14} />
              Open file
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
