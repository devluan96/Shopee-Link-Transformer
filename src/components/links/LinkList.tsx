import React, { useState } from "react";
import {
  Search,
  Image as ImageIcon,
  Video as VideoIcon,
  ExternalLink,
  MousePointer2,
  Trash2,
  Pencil,
  X,
  Save,
  QrCode,
  AlertTriangle,
} from "lucide-react";
import { ConvertedLink } from "@/src/types";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/src/lib/utils";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";

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
    } catch (e) {
      // toast already handled in app
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
    } catch (e) {
      // toast already handled in app
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div key="list">
      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">
            Kho Lưu Trữ Link
          </h2>
          <p className="text-gray-500 font-medium italic">
            Tổng cộng {links.length} tài nguyên liên kết.
          </p>
        </div>
        <div className="relative group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Tìm kiếm tài nguyên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-6 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 min-w-[300px] font-medium"
          />
        </div>
      </header>

      <div className="grid gap-4">
        {listLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 bg-white border border-gray-100 rounded-[2.5rem] animate-pulse"
            />
          ))
        ) : links.length === 0 ? (
          <div className="py-20 text-center text-gray-400 font-medium italic bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
            Chưa có link nào được tạo.
          </div>
        ) : (
          links.map((l) => (
            <div
              key={l.id}
              className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-6 group hover:shadow-xl transition-all"
            >
              <div className="w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center relative">
                {l.custom_image_url ? (
                  <img
                    src={l.custom_image_url}
                    className="w-full h-full object-cover"
                  />
                ) : l.video_url ? (
                  <div className="w-full h-full bg-gray-900 flex items-center justify-center text-white">
                    <VideoIcon size={24} />
                  </div>
                ) : (
                  <ImageIcon size={24} className="text-gray-200" />
                )}

                {l.video_url && l.custom_image_url && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                    <VideoIcon
                      size={16}
                      className="text-white drop-shadow-md"
                    />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 pr-4">
                <h4 className="font-bold text-gray-900 truncate mb-1">
                  {l.custom_title || "Untitled link"}
                </h4>
                <p className="text-xs text-gray-400 font-medium truncate mb-2">
                  {l.custom_description || "No description provided"}
                </p>
                {l.usage_context && (
                  <p className="text-[11px] text-orange-600 font-bold truncate mb-2">
                    Được dùng ở: {l.usage_context}
                  </p>
                )}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                    <MousePointer2 size={10} />
                    <span>{l.clicks || 0} CLICKS</span>
                  </div>
                  <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100 uppercase tracking-tighter">
                    {l.short_code}
                  </span>
                  <span className="text-[10px] font-medium text-gray-400 uppercase tracking-tighter">
                    {l.created_at &&
                      formatDistanceToNow(new Date(l.created_at))}{" "}
                    ago
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => startEdit(l)}
                  className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:text-blue-600 hover:bg-blue-50 transition-all"
                  title="Chỉnh sửa"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => setDeletingLink(l)}
                  className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:text-red-600 hover:bg-red-50 transition-all"
                  title="Xóa link"
                >
                  <Trash2 size={18} />
                </button>
                <button
                  onClick={() => setQrLink(l)}
                  className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:text-purple-600 hover:bg-purple-50 transition-all"
                  title="Mã QR"
                >
                  <QrCode size={18} />
                </button>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `https://hotsnew.click/s/${l.short_code}`,
                      l.id || "",
                    )
                  }
                  className="px-6 py-3 bg-gray-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all mx-1 shrink-0"
                >
                  {copiedId === l.id ? "DONE" : "COPY"}
                </button>
                <a
                  href={l.original_url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:text-orange-600 hover:bg-orange-50 transition-all"
                >
                  <ExternalLink size={18} />
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editingLink && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-xl font-black text-gray-900">
                Người dùng Chỉnh sửa Link
              </h3>
              <button
                onClick={() => setEditingLink(null)}
                className="p-2 hover:bg-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  Link Shopee / TikTok ( Đầu vào )
                </label>
                <input
                  type="url"
                  value={editForm.original}
                  onChange={(e) =>
                    setEditForm({ ...editForm, original: e.target.value })
                  }
                  placeholder="https://shopee.vn/..."
                  className="w-full px-6 py-4 bg-orange-50/50 border-2 border-orange-100 focus:border-orange-500 rounded-2xl outline-none transition-all font-bold text-sm text-orange-900"
                />
                <p className="text-[9px] text-gray-400 font-medium px-1">
                  Link thực tế mà người dùng sẽ được chuyển tới.
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  Tiêu đề ( Facebook )
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                  placeholder="Tiêu đề hiển thị..."
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none transition-all font-bold text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  Mô tả ( Facebook )
                </label>
                <textarea
                  value={editForm.desc}
                  onChange={(e) =>
                    setEditForm({ ...editForm, desc: e.target.value })
                  }
                  placeholder="Mô tả nội dung..."
                  rows={3}
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none transition-all font-medium text-sm resize-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  Dùng ở đâu
                </label>
                <input
                  type="text"
                  value={editForm.usage}
                  onChange={(e) =>
                    setEditForm({ ...editForm, usage: e.target.value })
                  }
                  placeholder="Ví dụ: Bài viết Facebook, bio TikTok..."
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none transition-all font-medium text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  Thumbnail URL
                </label>
                <input
                  type="text"
                  value={editForm.img}
                  onChange={(e) =>
                    setEditForm({ ...editForm, img: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none transition-all font-medium text-sm"
                />
              </div>
            </div>
            <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4">
              <button
                onClick={() => setEditingLink(null)}
                className="flex-1 py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 transition-all"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingLink && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm shadow-red-100">
                <AlertTriangle size={40} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">
                Xác nhận xóa link?
              </h3>
              <p className="text-gray-500 font-medium mb-10 leading-relaxed px-4">
                Hành động này sẽ xóa vĩnh viễn link{" "}
                <span className="font-bold text-gray-900 tracking-tight">
                  {deletingLink.short_code}
                </span>{" "}
                và mọi dữ liệu thống kê. Không thể khôi phục sau khi xóa.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-red-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-red-100 active:scale-95"
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Trash2 size={18} />
                  )}
                  Xóa vĩnh viễn
                </button>
                <button
                  onClick={() => setDeletingLink(null)}
                  disabled={isDeleting}
                  className="w-full py-5 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-gray-200 transition-all active:scale-95"
                >
                  Hủy bỏ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrLink && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">
                Mã QR của bạn
              </h3>
              <button
                onClick={() => setQrLink(null)}
                className="p-2 hover:bg-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-10 flex flex-col items-center">
              <div className="p-6 bg-white rounded-[2.5rem] shadow-xl border border-gray-100 mb-8 ring-4 ring-gray-50">
                <QRCodeCanvas
                  value={`https://hotsnew.click/s/${qrLink.short_code}`}
                  size={200}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <div className="text-center mb-10">
                <p className="font-black text-gray-900 text-lg mb-1 tracking-tight">
                  {qrLink.short_code}
                </p>
                <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest bg-purple-50 px-3 py-1 rounded-full border border-purple-100 inline-block">
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
                className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-purple-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-purple-100 active:scale-95"
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
