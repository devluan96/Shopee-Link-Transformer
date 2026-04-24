import React from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Copy,
  Globe,
  Image as ImageIcon,
  QrCode,
  ShieldCheck,
  Type,
  UploadCloud,
  Video as VideoIcon,
  X,
} from "lucide-react";
import { cn, normalizeVietnameseSlug } from "@/src/lib/utils";

const MAX_SHORT_CODE_LENGTH = 50;

interface CreateLinkProps {
  url: string;
  setUrl: (v: string) => void;
  customTitle: string;
  setCustomTitle: (v: string) => void;
  customDescription: string;
  setCustomDescription: (v: string) => void;
  customShortCode: string;
  setCustomShortCode: (v: string) => void;
  usageContext: string;
  setUsageContext: (v: string) => void;
  customImageUrl: string;
  setCustomImageUrl: (v: string) => void;
  videoUrl: string;
  setVideoUrl: (v: string) => void;
  uploadingVideo: boolean;
  videoUploadProgress: number;
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

export const CreateLink = ({
  url,
  setUrl,
  customTitle,
  setCustomTitle,
  customDescription,
  setCustomDescription,
  customShortCode,
  setCustomShortCode,
  usageContext,
  setUsageContext,
  customImageUrl,
  setCustomImageUrl,
  videoUrl,
  setVideoUrl,
  uploadingVideo,
  videoUploadProgress,
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
  const normalizedShortCodePreview = customShortCode
    ? normalizeVietnameseSlug(customShortCode)
    : "";
  const uploadProgressOffset = 87.96 - (87.96 * videoUploadProgress) / 100;

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
            className="relative space-y-8 overflow-hidden rounded-[3rem] border border-gray-100 bg-white/95 p-10 shadow-2xl backdrop-blur-xl"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 px-1 mb-2">
                  Thiết lập link
                </p>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                  Rút gọn link Shopee
                </h3>
              </div>
              <button
                type="submit"
                disabled={loading || !url || uploadingVideo}
                className="shrink-0 px-7 py-4 bg-linear-to-r from-orange-600 to-amber-500 text-white rounded-[1.25rem] font-black uppercase tracking-[0.18em] shadow-xl shadow-orange-600/30 hover:shadow-2xl hover:shadow-orange-600/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:grayscale disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Rút gọn link <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>

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
                  className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent rounded-3xl transition-all focus:border-orange-500/30 focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none font-medium text-gray-900 placeholder:text-gray-300"
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
                  <Type size={14} className="text-orange-500" /> Mã rút gọn tùy
                  chỉnh
                </label>
                <input
                  type="text"
                  value={customShortCode}
                  onChange={(e) => setCustomShortCode(e.target.value)}
                  maxLength={MAX_SHORT_CODE_LENGTH}
                  placeholder="Ví dụ: tôi yêu em"
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl transition-all outline-none font-medium focus:bg-white focus:border-orange-500/20"
                />
                <p className="text-[11px] text-gray-400 font-medium mt-2 px-1">
                  Link sẽ thành:{" "}
                  <span className="font-black text-orange-600">
                    {normalizedShortCodePreview
                      ? `https://hotsnew.click/s/${normalizedShortCodePreview}`
                      : "https://hotsnew.click/s/ma-rut-gon-cua-ban"}
                  </span>
                </p>
                <p className="text-[11px] text-gray-400 font-medium mt-1 px-1">
                  Tối đa {MAX_SHORT_CODE_LENGTH} ký tự.
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3 px-1">
                  <Type size={14} className="text-orange-500" /> Dùng ở đâu
                </label>
                <select
                  value={usageContext}
                  onChange={(e) => setUsageContext(e.target.value)}
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl transition-all outline-none font-medium focus:bg-white focus:border-orange-500/20 text-gray-900"
                >
                  {usageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                <div className="space-y-4 flex flex-col">
                  <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-400 px-1">
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
                  <button
                    type="button"
                    onClick={() => videoInputRef?.current?.click()}
                    className="w-full min-h-21 flex items-center justify-between px-6 py-5 bg-orange-50/30 border-2 border-dashed border-orange-100 rounded-2xl hover:border-orange-300 hover:bg-orange-50/50 transition-all group"
                  >
                    <div className="flex items-center gap-3 text-orange-400 font-bold group-hover:text-orange-600">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm relative">
                        {uploadingVideo ? (
                          <svg
                            className="w-10 h-10 -rotate-90"
                            viewBox="0 0 36 36"
                            aria-hidden="true"
                          >
                            <circle
                              cx="18"
                              cy="18"
                              r="14"
                              fill="none"
                              stroke="currentColor"
                              strokeOpacity="0.15"
                              strokeWidth="3"
                            />
                            <circle
                              cx="18"
                              cy="18"
                              r="14"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeDasharray="87.96"
                              strokeDashoffset={uploadProgressOffset}
                            />
                          </svg>
                        ) : (
                          <UploadCloud size={20} />
                        )}
                        {uploadingVideo && (
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-orange-600">
                            {videoUploadProgress > 0
                              ? `${videoUploadProgress}%`
                              : "..."}
                          </span>
                        )}
                      </div>
                      <span className="text-xs uppercase tracking-wider">
                        {uploadingVideo
                          ? videoUploadProgress > 0
                            ? "Đang tải video lên..."
                            : "Đang chuẩn bị video..."
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
                    <div className="relative aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl ring-4 ring-white mt-auto">
                      <video
                        src={videoUrl}
                        controls
                        className="w-full h-full object-cover"
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

                <div className="space-y-4 flex flex-col">
                  <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-400 px-1">
                    <ImageIcon size={14} className="text-orange-500" />{" "}
                    Thumbnail URL
                  </label>
                  <input
                    type="url"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    placeholder="Link ảnh cover..."
                    className="w-full min-h-21 px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl transition-all outline-none font-medium focus:bg-white focus:border-orange-500/20"
                  />

                  {customImageUrl && (
                    <div className="relative aspect-video rounded-3xl overflow-hidden bg-gray-100 shadow-xl ring-4 ring-white mt-auto">
                      <img
                        src={customImageUrl}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="space-y-5 max-w-xl">
          <div className="bg-white rounded-[2.25rem] border border-gray-200 overflow-hidden shadow-xl relative">
            {!result && (
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10 flex items-center justify-center p-6 text-center">
                <p className="bg-gray-900 text-white px-4 py-2 rounded-full font-bold text-[10px] uppercase">
                  Review Mode
                </p>
              </div>
            )}
            <div className="aspect-[12/5.4] bg-gray-100 flex items-center justify-center relative">
              {customImageUrl ? (
                <img
                  src={customImageUrl}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 opacity-20">
                  <ImageIcon size={40} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    No Preview Available
                  </span>
                </div>
              )}
            </div>
            <div className="p-6 bg-[#F2F3F5]">
              <p className="text-[10px] text-gray-400 uppercase font-bold mb-2 flex items-center gap-2">
                <Globe size={10} /> HOTSNEW.CLICK
              </p>
              <h4 className="text-lg font-black text-gray-900 leading-tight mb-2 line-clamp-2">
                {customTitle || "Tiêu đề của bạn sẽ xuất hiện tại đây..."}
              </h4>
              <p className="text-[13px] text-gray-600 line-clamp-2 leading-relaxed opacity-70 font-medium">
                {customDescription ||
                  "Hệ thống sẽ tự động tạo Landing Page chứa video và tiêu đề chuyên nghiệp như một trang tin tức thực thụ."}
              </p>
            </div>
          </div>

          <div
            className={cn(
              "p-8 rounded-[2.25rem] border-2 transition-all duration-500 relative overflow-hidden",
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
