import React, { useState } from "react";
import {
  Search,
  Image as ImageIcon,
  Video as VideoIcon,
  MousePointer2,
  Trash2,
  Pencil,
  X,
  Save,
  QrCode,
  AlertTriangle,
  Link2,
} from "lucide-react";
import { ConvertedLink } from "@/src/types";
import { formatDistanceToNow } from "date-fns";
import { QRCodeCanvas } from "qrcode.react";

const usageOptions = [
  { value: "", label: "Chọn vị trí sử dụng" },
  { value: "Bài viết Facebook", label: "Bài viết Facebook" },
  { value: "Reel Facebook", label: "Reel Facebook" },
  { value: "Bio TikTok", label: "Bio TikTok" },
  { value: "Video TikTok", label: "Video TikTok" },
  { value: "Zalo OA", label: "Zalo OA" },
  { value: "Nhóm seeding", label: "Nhóm seeding" },
  { value: "Livestream", label: "Livestream" },
];

interface LinkListProps {
  links: ConvertedLink[];
  listLoading: boolean;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  copyToClipboard: (text: string, id: string) => void;
  copiedId: string;
  onDeleteLink: (id: string) => Promise<void>;
  onUpdateLink: (id: string, data: Partial<ConvertedLink>) => Promise<void>;
}

export const LinkList = ({
  links,
  listLoading,
  searchTerm,
  setSearchTerm,
  copyToClipboard,
  copiedId,
  onDeleteLink,
  onUpdateLink,
}: LinkListProps) => {
  const [editingLink, setEditingLink] = useState<ConvertedLink | null>(null);
  const [deletingLink, setDeletingLink] = useState<ConvertedLink | null>(null);
  const [qrLink, setQrLink] = useState<ConvertedLink | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    desc: "",
    usage: "",
    img: "",
    original: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const buildTrackedLink = (
    shortCode: string,
    source: "facebook" | "tiktok" | "zalo",
  ) => `https://hotsnew.click/s/${shortCode}?src=${source}`;

  const startEdit = (link: ConvertedLink) => {
    setEditingLink(link);
    setEditForm({
      title: link.custom_title || "",
      desc: link.custom_description || "",
      usage: link.usage_context || "",
      img: link.custom_image_url || "",
      original: link.original_url || "",
    });
  };

  const handleUpdate = async () => {
    if (!editingLink?.id) return;
    setIsUpdating(true);
    try {
      await onUpdateLink(editingLink.id, {
        custom_title: editForm.title,
        custom_description: editForm.desc,
        usage_context: editForm.usage,
        custom_image_url: editForm.img,
        original_url: editForm.original,
      });
      setEditingLink(null);
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingLink?.id) return;
    setIsDeleting(true);
    try {
      await onDeleteLink(deletingLink.id);
      setDeletingLink(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div key="list">
      <header className="mb-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="mb-2 text-3xl font-black text-gray-900">
            Kho Lưu Trữ Link
          </h2>
          <p className="font-medium italic text-gray-500">
            Tổng cộng {links.length} tài nguyên liên kết.
          </p>
        </div>
        <div className="group relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Tìm kiếm tài nguyên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="min-w-[300px] rounded-2xl border border-gray-200 bg-white py-4 pl-12 pr-6 font-medium focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/5"
          />
        </div>
      </header>

      <div className="grid gap-4">
        {listLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-[2.5rem] border border-gray-100 bg-white"
            />
          ))
        ) : links.length === 0 ? (
          <div className="rounded-[2.5rem] border border-gray-100 bg-white py-20 text-center font-medium italic text-gray-400 shadow-sm">
            Chưa có link nào được tạo.
          </div>
        ) : (
          links.map((l) => (
            <div
              key={l.id}
              className="group flex flex-col items-center gap-6 rounded-[2.5rem] border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-xl sm:flex-row"
            >
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-50">
                {l.custom_image_url ? (
                  <img
                    src={l.custom_image_url}
                    alt={l.custom_title || l.short_code}
                    className="h-full w-full object-cover"
                  />
                ) : l.video_url ? (
                  <div className="flex h-full w-full items-center justify-center bg-gray-900 text-white">
                    <VideoIcon size={24} />
                  </div>
                ) : (
                  <ImageIcon size={24} className="text-gray-200" />
                )}

                {l.video_url && l.custom_image_url && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
                    <VideoIcon
                      size={16}
                      className="text-white drop-shadow-md"
                    />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 pr-4">
                <h4 className="mb-1 truncate font-bold text-gray-900">
                  {l.custom_title || "Untitled link"}
                </h4>
                <p className="mb-2 truncate text-xs font-medium text-gray-400">
                  {l.custom_description || "No description provided"}
                </p>
                {l.usage_context && (
                  <p className="mb-2 truncate text-[11px] font-bold text-orange-600">
                    Được dùng ở: {l.usage_context}
                  </p>
                )}

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-600">
                    <MousePointer2 size={10} />
                    <span>{l.clicks || 0} CLICKS</span>
                  </div>
                  <span className="rounded-lg border border-gray-100 bg-gray-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter text-gray-400">
                    {l.short_code}
                  </span>
                  <span className="text-[10px] font-medium uppercase tracking-tighter text-gray-400">
                    {l.created_at &&
                      formatDistanceToNow(new Date(l.created_at))}{" "}
                    ago
                  </span>
                </div>

                {l.tracked_sources && l.tracked_sources.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {l.tracked_sources.map((source) => (
                      <span
                        key={`${l.id}-${source.label}`}
                        className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700"
                      >
                        {source.label} · {source.count}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() =>
                      copyToClipboard(
                        buildTrackedLink(l.short_code, "facebook"),
                        `${l.id}-facebook`,
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-blue-700 transition-all hover:bg-blue-100"
                  >
                    <Link2 size={11} /> Facebook
                  </button>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        buildTrackedLink(l.short_code, "tiktok"),
                        `${l.id}-tiktok`,
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-700 transition-all hover:bg-slate-200"
                  >
                    <Link2 size={11} /> TikTok
                  </button>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        buildTrackedLink(l.short_code, "zalo"),
                        `${l.id}-zalo`,
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-cyan-700 transition-all hover:bg-cyan-100"
                  >
                    <Link2 size={11} /> Zalo
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => startEdit(l)}
                  className="rounded-xl bg-gray-50 p-3 text-gray-400 transition-all hover:bg-blue-50 hover:text-blue-600"
                  title="Chỉnh sửa"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => setDeletingLink(l)}
                  className="rounded-xl bg-gray-50 p-3 text-gray-400 transition-all hover:bg-red-50 hover:text-red-600"
                  title="Xóa link"
                >
                  <Trash2 size={18} />
                </button>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `https://hotsnew.click/s/${l.short_code}`,
                      l.id || "",
                    )
                  }
                  className="mx-1 shrink-0 rounded-xl bg-gray-900 px-6 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:scale-105 active:scale-95"
                >
                  {copiedId === l.id ? "DONE" : "COPY"}
                </button>
                <button
                  onClick={() => setQrLink(l)}
                  className="shrink-0 rounded-xl border border-purple-100 bg-white px-6 py-3 text-xs font-black uppercase tracking-widest text-purple-600 transition-all hover:bg-purple-50 active:scale-95"
                  title="Mã QR"
                >
                  <span className="flex items-center justify-center gap-2">
                    <QrCode size={18} />
                    QR CODE
                  </span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {editingLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-[3rem] bg-white shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-8">
              <h3 className="text-xl font-black text-gray-900">
                Người dùng Chỉnh sửa Link
              </h3>
              <button
                onClick={() => setEditingLink(null)}
                className="rounded-full p-2 transition-colors hover:bg-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 p-8">
              <div className="space-y-1">
                <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Link Shopee / TikTok ( đầu vào )
                </label>
                <input
                  type="url"
                  value={editForm.original}
                  onChange={(e) =>
                    setEditForm({ ...editForm, original: e.target.value })
                  }
                  placeholder="https://shopee.vn/..."
                  className="w-full rounded-2xl border-2 border-orange-100 bg-orange-50/50 px-6 py-4 text-sm font-bold text-orange-900 outline-none transition-all focus:border-orange-500"
                />
                <p className="px-1 text-[9px] font-medium text-gray-400">
                  Link thực tế mà người dùng sẽ được chuyển tới.
                </p>
              </div>

              <div className="space-y-1">
                <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Tiêu đề ( Facebook )
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                  placeholder="Tiêu đề hiển thị..."
                  className="w-full rounded-2xl border-2 border-transparent bg-gray-50 px-6 py-4 text-sm font-bold outline-none transition-all focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Mô tả ( Facebook )
                </label>
                <textarea
                  value={editForm.desc}
                  onChange={(e) =>
                    setEditForm({ ...editForm, desc: e.target.value })
                  }
                  placeholder="Mô tả nội dung..."
                  rows={3}
                  className="w-full resize-none rounded-2xl border-2 border-transparent bg-gray-50 px-6 py-4 text-sm font-medium outline-none transition-all focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Dùng ở đâu
                </label>
                <select
                  value={editForm.usage}
                  onChange={(e) =>
                    setEditForm({ ...editForm, usage: e.target.value })
                  }
                  className="w-full rounded-2xl border-2 border-transparent bg-gray-50 px-6 py-4 text-sm font-medium text-gray-900 outline-none transition-all focus:border-orange-500"
                >
                  {usageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Thumbnail URL
                </label>
                <input
                  type="text"
                  value={editForm.img}
                  onChange={(e) =>
                    setEditForm({ ...editForm, img: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full rounded-2xl border-2 border-transparent bg-gray-50 px-6 py-4 text-sm font-medium outline-none transition-all focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex gap-4 border-t border-gray-100 bg-gray-50 p-8">
              <button
                onClick={() => setEditingLink(null)}
                className="flex-1 rounded-2xl border border-gray-200 bg-white py-4 text-[10px] font-black uppercase tracking-widest text-gray-600 transition-all hover:bg-gray-100"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-orange-600 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-orange-100 transition-all hover:bg-orange-700 disabled:opacity-50"
              >
                {isUpdating ? (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <Save size={14} />
                )}
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[3rem] bg-white shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="p-10 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-red-600 shadow-sm shadow-red-100">
                <AlertTriangle size={40} />
              </div>
              <h3 className="mb-4 text-2xl font-black tracking-tight text-gray-900">
                Xác nhận xóa link?
              </h3>
              <p className="mb-10 px-4 font-medium leading-relaxed text-gray-500">
                Hành động này sẽ xóa vĩnh viễn link{" "}
                <span className="font-bold tracking-tight text-gray-900">
                  {deletingLink.short_code}
                </span>{" "}
                và mọi dữ liệu thống kê. Không thể khôi phục sau khi xóa.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-red-600 py-5 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-red-100 transition-all hover:bg-red-700 active:scale-95 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <Trash2 size={18} />
                  )}
                  Xóa vĩnh viễn
                </button>
                <button
                  onClick={() => setDeletingLink(null)}
                  disabled={isDeleting}
                  className="w-full rounded-2xl bg-gray-100 py-5 text-[11px] font-black uppercase tracking-widest text-gray-600 transition-all hover:bg-gray-200 active:scale-95"
                >
                  Hủy bỏ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {qrLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-[3rem] bg-white shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-8">
              <h3 className="text-xl font-black tracking-tight text-gray-900">
                Mã QR của bạn
              </h3>
              <button
                onClick={() => setQrLink(null)}
                className="rounded-full p-2 transition-colors hover:bg-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col items-center p-10">
              <div className="mb-8 rounded-[2.5rem] border border-gray-100 bg-white p-6 shadow-xl ring-4 ring-gray-50">
                <QRCodeCanvas
                  value={`https://hotsnew.click/s/${qrLink.short_code}`}
                  size={200}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <div className="mb-10 text-center">
                <p className="mb-1 text-lg font-black tracking-tight text-gray-900">
                  {qrLink.short_code}
                </p>
                <p className="inline-block rounded-full border border-purple-100 bg-purple-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-purple-600">
                  Quét để truy cập link
                </p>
              </div>
              <button
                onClick={() => {
                  const canvas = document.querySelector("canvas");
                  if (canvas) {
                    const url = canvas.toDataURL("image/png");
                    const link = document.createElement("a");
                    link.download = `qrcode-${qrLink.short_code}.png`;
                    link.href = url;
                    link.click();
                  }
                }}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-purple-600 py-5 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-purple-100 transition-all hover:bg-purple-700 active:scale-95"
              >
                <Save size={18} /> Tải mã QR (.png)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
