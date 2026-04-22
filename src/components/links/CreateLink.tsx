import React from 'react';
import { motion } from 'motion/react';
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
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

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
  canUseCreateFeatures: boolean;
  onOpenPlans: () => void;
}

export const CreateLink = ({
  url, setUrl,
  customTitle, setCustomTitle,
  customDescription, setCustomDescription,
  customImageUrl, setCustomImageUrl,
  videoUrl, setVideoUrl,
  uploadingVideo,
  videoUploadSuccess,
  videoInputRef,
  handleVideoUpload,
  handleConvert,
  loading,
  error, setError,
  result,
  copyToClipboard,
  copiedId,
  canUseCreateFeatures,
  onOpenPlans
}: CreateLinkProps) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} key="create">
      <header className="mb-12">
        <h2 className="mb-2 text-3xl font-black text-gray-900">Tạo Landing Page Mới</h2>
        <p className="font-medium italic text-gray-500">Tự động lấy dữ liệu và tối ưu hiển thị trên Facebook.</p>
      </header>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <div className="space-y-8">
          {!canUseCreateFeatures && (
            <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-5 text-amber-700">
              <p className="text-[11px] font-black uppercase tracking-[0.24em]">Cần gói dịch vụ</p>
              <p className="mt-2 text-sm font-medium">
                Tài khoản chưa có gói tháng hoặc gói năm đang hoạt động. Bạn vẫn xem được giao diện, nhưng chưa thể tạo link.
              </p>
              <button
                type="button"
                onClick={onOpenPlans}
                className="mt-4 rounded-2xl bg-amber-600 px-5 py-3 text-[11px] font-black uppercase tracking-widest text-white transition hover:bg-amber-700"
              >
                Mở bảng giá để thanh toán
              </button>
            </div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 flex items-start gap-3 rounded-2xl border-2 border-red-100 bg-red-50 p-4 text-red-600"
            >
              <AlertCircle className="mt-0.5 shrink-0" size={18} />
              <div className="text-sm font-bold">
                {error}
                <button type="button" onClick={() => setError(null)} className="mt-1 block text-[10px] uppercase underline">
                  Đóng thông báo
                </button>
              </div>
            </motion.div>
          )}
          <form onSubmit={handleConvert} className="space-y-6 rounded-[3rem] border border-gray-100 bg-white p-10 shadow-sm">
            <div>
              <label className="mb-3 flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-widest text-gray-400">
                <Globe size={14} /> Link Shopee gốc
              </label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={!canUseCreateFeatures}
                placeholder="Dán link sản phẩm Shopee..."
                className="w-full rounded-2xl border-2 border-transparent bg-gray-50 px-6 py-4 font-medium outline-none transition-all focus:border-orange-500/20 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div className="grid grid-cols-1 gap-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-3 flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-widest text-gray-400">
                    <Type size={14} /> Tiêu đề tùy chỉnh
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    disabled={!canUseCreateFeatures}
                    placeholder="Tiêu đề hiển thị..."
                    className="w-full rounded-2xl border-2 border-transparent bg-gray-50 px-6 py-4 font-medium outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="mb-3 flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-widest text-gray-400">
                    <Type size={14} /> Mô tả bài viết
                  </label>
                  <input
                    type="text"
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    disabled={!canUseCreateFeatures}
                    placeholder="Mô tả thu hút lượt click..."
                    className="w-full rounded-2xl border-2 border-transparent bg-gray-50 px-6 py-4 font-medium outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="mb-3 flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-widest text-gray-400">
                  <VideoIcon size={14} /> Đính kèm video
                </label>
                <input
                  type="file"
                  accept="video/*"
                  ref={(el) => { if (videoInputRef) (videoInputRef as any).current = el; }}
                  onChange={handleVideoUpload}
                  className="hidden"
                />
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => videoInputRef?.current?.click()}
                    disabled={!canUseCreateFeatures}
                    className="group flex w-full items-center justify-between rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-4 transition-all hover:border-orange-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <div className="flex items-center gap-3 font-bold text-gray-400 group-hover:text-orange-600">
                      <UploadCloud size={20} />
                      {uploadingVideo ? 'Đang tải video...' : videoUrl ? 'Thay đổi video' : 'Chọn video bài viết'}
                    </div>
                    {videoUrl && <Check className="text-green-500" />}
                  </button>

                  {videoUploadSuccess && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-green-600"
                    >
                      <ShieldCheck size={14} /> Tải video thành công
                    </motion.div>
                  )}

                  {videoUrl && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative aspect-video overflow-hidden rounded-2xl bg-black shadow-lg"
                    >
                      <video src={videoUrl} controls className="h-full w-full" />
                      <button
                        type="button"
                        onClick={() => setVideoUrl('')}
                        className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white transition-all hover:bg-black"
                      >
                        <X size={16} />
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>

              {!videoUrl && (
                <div>
                  <label className="mb-3 flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-widest text-gray-400">
                    <ImageIcon size={14} /> Thumbnail URL
                  </label>
                  <input
                    type="url"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    disabled={!canUseCreateFeatures}
                    placeholder="Link ảnh cover..."
                    className="w-full rounded-2xl border-2 border-transparent bg-gray-50 px-6 py-4 font-medium outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !url || uploadingVideo || !canUseCreateFeatures}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-orange-600 py-5 font-black uppercase tracking-widest text-white shadow-xl shadow-orange-100 transition-all hover:bg-orange-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <>Tạo link landing <ArrowRight size={20} /></>}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <h3 className="px-1 text-[11px] font-black uppercase tracking-widest text-gray-400">Facebook Share Preview</h3>
          <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl">
            {!result && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 p-6 text-center backdrop-blur-[2px]">
                <p className="rounded-full bg-gray-900 px-4 py-2 text-[10px] font-bold uppercase text-white">Review mode</p>
              </div>
            )}
            <div className="relative flex aspect-[12/6.3] items-center justify-center bg-gray-100">
              {videoUrl ? (
                <video src={videoUrl} muted autoPlay loop className="h-full w-full object-cover" />
              ) : customImageUrl ? (
                <img src={customImageUrl} className="h-full w-full object-cover" />
              ) : (
                <ImageIcon size={48} className="text-gray-200" />
              )}
            </div>
            <div className="bg-[#F2F3F5] p-6">
              <p className="mb-1 text-[11px] font-bold uppercase text-gray-500">HOTSNEW.CLICK</p>
              <h4 className="mb-2 line-clamp-2 text-lg font-bold leading-tight text-gray-900">
                {customTitle || 'Tiêu đề của bạn sẽ xuất hiện tại đây...'}
              </h4>
              <p className="line-clamp-2 text-sm leading-relaxed text-gray-500 opacity-60">
                {customDescription || 'Hệ thống sẽ tạo landing page chứa video và tiêu đề hiển thị chuyên nghiệp.'}
              </p>
            </div>
          </div>

          <div
            className={cn(
              'rounded-[2.5rem] border-2 p-8 transition-all duration-500',
              result ? 'border-orange-100 bg-white shadow-xl' : 'pointer-events-none border-gray-100 bg-gray-50 opacity-50 grayscale'
            )}
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">Short Link ID: {result?.short_code || '########'}</span>
              <button type="button" onClick={() => copyToClipboard(result ? `https://hotsnew.click/s/${result.short_code}` : '', 'res')} className="rounded-lg p-2 text-orange-600 transition-all hover:bg-orange-50">
                {copiedId === 'res' ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
            <div className="mb-8 truncate rounded-2xl bg-gray-50 p-5 text-xs font-bold text-gray-500">
              {result ? `https://hotsnew.click/s/${result.short_code}` : 'https://hotsnew.click/s/########'}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => copyToClipboard(result ? `https://hotsnew.click/s/${result.short_code}` : '', 'res')}
                disabled={!result}
                className="flex items-center justify-center gap-2 rounded-2xl bg-orange-600 py-4 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-orange-700"
              >
                <Copy size={16} /> Copy link
              </button>
              <button
                type="button"
                disabled={!result}
                className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-4 text-[10px] font-black uppercase tracking-widest text-gray-900 transition-all hover:bg-gray-50"
              >
                <QrCode size={16} /> QR code
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
