import React from "react";
import {
  Globe,
  Type,
  Video as VideoIcon,
  UploadCloud,
  Check,
  ShieldCheck,
  X,
  ArrowRight,
  Copy,
  QrCode,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/src/lib/utils";

interface CreateLinkProps {
  url: string;
  setUrl: (v: string) => void;
  customTitle: string;
  setCustomTitle: (v: string) => void;
  customDescription: string;
  setCustomDescription: (v: string) => void;
  customImageUrl: string;
  setCustomImageUrl: (v: string) => void;
  videoUrl: string;
  setVideoUrl: (v: string) => void;
  uploadingVideo: boolean;
  videoUploadSuccess: boolean;
  videoInputRef: React.RefObject<HTMLInputElement | null>;
  handleVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleConvert: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
  setError: (v: string | null) => void;
  result: any;
  copyToClipboard: (text: string, id: string) => void;
  copiedId: string;
}

export const CreateLink = ({
  url,
  setUrl,
  customTitle,
  setCustomTitle,
  customDescription,
  setCustomDescription,
  customImageUrl,
  setCustomImageUrl,
  videoUrl,
  setVideoUrl,
  uploadingVideo,
  videoUploadSuccess,
  videoInputRef,
  handleVideoUpload,
  handleConvert,
  loading,
  error,
  setError,
  result,
  copyToClipboard,
  copiedId,
}: CreateLinkProps) => {
  return (
    <div key="create">
      <header className="mb-12">
        <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">
          Tạo Landing Page Mới
        </h2>
        <p className="text-gray-500 font-medium italic">
          Chúng tôi sẽ tự động lấy dữ liệu và tối ưu hóa hiển thị trên Facebook.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          {error && (
            <div className="bg-red-50 border-2 border-red-100 p-4 rounded-2xl flex items-start gap-3 text-red-600 mb-4">
              <AlertCircle className="shrink-0 mt-0.5" size={18} />
              <div className="text-sm font-bold">
                {error}
                <button
                  onClick={() => setError(null)}
                  className="block mt-1 text-[10px] uppercase underline"
                >
                  Đóng thông báo
                </button>
              </div>
            </div>
          )}

          <form
            onSubmit={handleConvert}
            className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-2xl space-y-8 relative overflow-hidden backdrop-blur-xl bg-white/95"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />

            <div>
              <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3 px-1">
                <Globe size={14} className="text-orange-500" /> Link Shopee Gốc
              </label>
              <div className="relative group">
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Dán link sản phẩm Shopee..."
                  className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent rounded-[1.5rem] transition-all focus:border-orange-500/30 focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none font-medium text-gray-900 placeholder:text-gray-300"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                  <ArrowRight size={18} className="text-orange-600" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3 px-1">
                    <Type size={14} className="text-orange-500" /> Tiêu đề tùy
                    chỉnh
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Tiêu đề hiển thị..."
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl transition-all outline-none font-medium focus:bg-white focus:border-orange-500/20"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3 px-1">
                    <Type size={14} className="text-orange-500" /> Mô tả bài
                    viết
                  </label>
                  <input
                    type="text"
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="Mô tả thu hút lượt click..."
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl transition-all outline-none font-medium focus:bg-white focus:border-orange-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3 px-1">
                  <VideoIcon size={14} className="text-orange-500" /> Đính kèm
                  Video (Tùy chọn)
                </label>
                <input
                  type="file"
                  accept="video/*"
                  ref={(el) => {
                    if (videoInputRef) (videoInputRef as any).current = el;
                  }}
                  onChange={handleVideoUpload}
                  className="hidden"
                />
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => videoInputRef?.current?.click()}
                    className="w-full flex items-center justify-between px-6 py-5 bg-orange-50/30 border-2 border-dashed border-orange-100 rounded-2xl hover:border-orange-300 hover:bg-orange-50/50 transition-all group"
                  >
                    <div className="flex items-center gap-3 text-orange-400 font-bold group-hover:text-orange-600">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <UploadCloud size={20} />
                      </div>
                      <span className="text-xs uppercase tracking-wider">
                        {uploadingVideo
                          ? "Đang mã hóa video..."
                          : videoUrl
                            ? "Thay đổi video"
                            : "Tải video lên Cloudinary"}
                      </span>
                    </div>
                    {videoUrl && (
                      <div className="bg-green-100 p-1 rounded-full">
                        <Check className="text-green-600" size={14} />
                      </div>
                    )}
                  </button>

                  {videoUploadSuccess && (
                    <div className="flex items-center gap-2 text-[10px] font-black text-green-600 bg-green-50 px-4 py-2 rounded-xl uppercase tracking-widest border border-green-100">
                      <ShieldCheck size={14} /> Tải dữ liệu lên đám mây thành
                      công!
                    </div>
                  )}

                  {videoUrl && (
                    <div className="relative aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl ring-4 ring-white">
                      <video
                        src={videoUrl}
                        controls
                        className="w-full h-full"
                      />
                      <button
                        type="button"
                        onClick={() => setVideoUrl("")}
                        className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-red-600 transition-all shadow-lg backdrop-blur-sm"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {!videoUrl && (
                <div>
                  <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3 px-1">
                    <ImageIcon size={14} className="text-orange-500" />{" "}
                    Thumbnail URL
                  </label>
                  <input
                    type="url"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    placeholder="Link ảnh cover..."
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl transition-all outline-none font-medium focus:bg-white focus:border-orange-500/20"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !url || uploadingVideo}
              className="w-full py-6 bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-orange-600/30 hover:shadow-2xl hover:shadow-orange-600/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:grayscale disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Tạo Landing Page <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 px-1">
            Facebook Share Preview
          </h3>
          <div className="bg-white rounded-[3rem] border border-gray-200 overflow-hidden shadow-2xl relative">
            {!result && (
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10 flex items-center justify-center p-6 text-center">
                <p className="bg-gray-900 text-white px-4 py-2 rounded-full font-bold text-[10px] uppercase">
                  Review Mode
                </p>
              </div>
            )}
            <div className="aspect-[12/6.3] bg-gray-100 flex items-center justify-center relative">
              {videoUrl ? (
                <video
                  src={videoUrl}
                  muted
                  autoPlay
                  loop
                  className="w-full h-full object-cover"
                />
              ) : customImageUrl ? (
                <img
                  src={customImageUrl}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 opacity-20">
                  <ImageIcon size={48} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    No Preview Available
                  </span>
                </div>
              )}
            </div>
            <div className="p-8 bg-[#F2F3F5]">
              <p className="text-[11px] text-gray-400 uppercase font-bold mb-2 flex items-center gap-2">
                <Globe size={10} /> HOTSNEW.CLICK
              </p>
              <h4 className="text-xl font-black text-gray-900 leading-tight mb-3 line-clamp-2">
                {customTitle || "Tiêu đề của bạn sẽ xuất hiện tại đây..."}
              </h4>
              <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed opacity-70 font-medium">
                {customDescription ||
                  "Hệ thống sẽ tự động tạo Landing Page chứa video và tiêu đề chuyên nghiệp như một trang tin tức thực thụ."}
              </p>
            </div>
          </div>

          <div
            className={cn(
              "p-10 rounded-[3rem] border-2 transition-all duration-500 relative overflow-hidden",
              result
                ? "bg-white border-orange-100 shadow-2xl scale-100"
                : "bg-gray-50 border-gray-100 opacity-50 pointer-events-none grayscale scale-[0.98]",
            )}
          >
            {result && (
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
            )}

            <div className="flex items-center justify-between mb-8 relative z-10">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                Link ID: {result?.short_code || "########"}
              </span>
              <button
                onClick={() =>
                  copyToClipboard(
                    result
                      ? `https://hotsnew.click/s/${result.short_code}`
                      : "",
                    "res",
                  )
                }
                className="p-3 hover:bg-orange-50 rounded-2xl text-orange-600 transition-all shadow-sm bg-white border border-gray-100"
              >
                {copiedId === "res" ? <Check size={20} /> : <Copy size={20} />}
              </button>
            </div>

            <div className="bg-gray-50/50 p-6 rounded-2xl font-black text-xs truncate mb-10 text-gray-400 border border-gray-100 font-mono relative z-10">
              {result
                ? `https://hotsnew.click/s/${result.short_code}`
                : "https://hotsnew.click/s/########"}
            </div>

            <div className="grid grid-cols-2 gap-4 relative z-10">
              <button
                onClick={() =>
                  copyToClipboard(
                    result
                      ? `https://hotsnew.click/s/${result.short_code}`
                      : "",
                    "res",
                  )
                }
                disabled={!result}
                className="py-5 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"
              >
                <Copy size={16} /> Sao chép Link
              </button>
              <button
                disabled={!result}
                className="py-5 bg-white border-2 border-gray-100 text-gray-900 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
              >
                <QrCode size={16} /> QR Code
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
