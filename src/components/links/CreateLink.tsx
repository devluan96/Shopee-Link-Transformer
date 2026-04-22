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
  AlertCircle
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
  copiedId
}: CreateLinkProps) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} key="create">
      <header className="mb-12">
        <h2 className="text-3xl font-black text-gray-900 mb-2">Tạo Landing Page Mới</h2>
        <p className="text-gray-500 font-medium italic">Chúng tôi sẽ tự động lấy dữ liệu và tối ưu hóa hiển thị trên Facebook.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-50 border-2 border-red-100 p-4 rounded-2xl flex items-start gap-3 text-red-600 mb-4"
            >
              <AlertCircle className="shrink-0 mt-0.5" size={18} />
              <div className="text-sm font-bold">
                {error}
                <button onClick={() => setError(null)} className="block mt-1 text-[10px] uppercase underline">Đóng thông báo</button>
              </div>
            </motion.div>
          )}
          <form onSubmit={handleConvert} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
            <div>
              <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3 px-1">
                <Globe size={14} /> Link Shopee Gốc
              </label>
              <input 
                type="url" required value={url} onChange={(e) => setUrl(e.target.value)}
                placeholder="Dán link sản phẩm Shopee..."
                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl transition-all focus:border-orange-500/20 focus:bg-white outline-none font-medium"
              />
            </div>

              <div className="grid grid-cols-1 gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3 px-1">
                      <Type size={14} /> Tiêu đề tùy chỉnh
                    </label>
                    <input 
                      type="text" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="Tiêu đề hiển thị..."
                      className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl transition-all outline-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3 px-1">
                      <Type size={14} /> Mô tả bài viết
                    </label>
                    <input 
                      type="text" value={customDescription} onChange={(e) => setCustomDescription(e.target.value)}
                      placeholder="Mô tả thu hút lượt click..."
                      className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl transition-all outline-none font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3 px-1">
                    <VideoIcon size={14} /> Đính kèm Video (Tùy chọn)
                  </label>
                <input 
                  type="file" accept="video/*" ref={(el) => { if(videoInputRef) (videoInputRef as any).current = el }} onChange={handleVideoUpload} className="hidden"
                />
                <div className="space-y-4">
                  <button 
                    type="button"
                    onClick={() => videoInputRef?.current?.click()}
                    className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl hover:border-orange-200 transition-all group"
                  >
                    <div className="flex items-center gap-3 text-gray-400 font-bold group-hover:text-orange-600">
                       <UploadCloud size={20} />
                       {uploadingVideo ? 'Đang tải video...' : videoUrl ? 'Thay đổi video' : 'Chọn video bài viết'}
                    </div>
                    {videoUrl && <Check className="text-green-500" />}
                  </button>
                  
                  {videoUploadSuccess && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 text-[10px] font-black text-green-600 bg-green-50 px-4 py-2 rounded-xl uppercase tracking-widest"
                    >
                      <ShieldCheck size={14} /> Tải video lên Cloudinary thành công!
                    </motion.div>
                  )}
                  
                  {videoUrl && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative aspect-video rounded-2xl overflow-hidden bg-black shadow-lg"
                    >
                       <video src={videoUrl} controls className="w-full h-full" />
                       <button 
                         type="button"
                         onClick={() => setVideoUrl('')}
                         className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black transition-all"
                       >
                         <X size={16} />
                       </button>
                    </motion.div>
                  )}
                </div>
              </div>

              {!videoUrl && (
                <div>
                  <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3 px-1">
                    <ImageIcon size={14} /> Thumbnail URL
                  </label>
                  <input 
                    type="url" value={customImageUrl} onChange={(e) => setCustomImageUrl(e.target.value)}
                    placeholder="Link ảnh cover..."
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl transition-all outline-none font-medium"
                  />
                </div>
              )}
            </div>

            <button 
              type="submit" disabled={loading || !url || uploadingVideo}
              className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-100 hover:bg-orange-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Tạo Link Landing <ArrowRight size={20} /></>}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 px-1">Facebook Share Preview</h3>
          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-2xl relative">
            {!result && (
               <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10 flex items-center justify-center p-6 text-center">
                  <p className="bg-gray-900 text-white px-4 py-2 rounded-full font-bold text-[10px] uppercase">Review Mode</p>
               </div>
            )}
            <div className="aspect-[12/6.3] bg-gray-100 flex items-center justify-center relative">
              {videoUrl ? (
                 <video src={videoUrl} muted autoPlay loop className="w-full h-full object-cover" />
              ) : customImageUrl ? (
                <img src={customImageUrl} className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={48} className="text-gray-200" />
              )}
            </div>
            <div className="p-6 bg-[#F2F3F5]">
              <p className="text-[11px] text-gray-500 uppercase font-bold mb-1">HOTSNEW.CLICK</p>
              <h4 className="text-lg font-bold text-gray-900 leading-tight mb-2 line-clamp-2">
                {customTitle || "Tiêu đề của bạn sẽ xuất hiện tại đây..."}
              </h4>
              <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed opacity-60">
                {customDescription || "Hệ thống sẽ tự động tạo Landing Page chứa video và tiêu đề chuyên nghiệp như một trang tin tức thực thụ."}
              </p>
            </div>
          </div>
          
          <div className={cn(
            "p-8 rounded-[2.5rem] border-2 transition-all duration-500",
            result ? "bg-white border-orange-100 shadow-xl" : "bg-gray-50 border-gray-100 opacity-50 pointer-events-none grayscale"
          )}>
            <div className="flex items-center justify-between mb-6">
               <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">Short Link ID: {result?.short_code || '########'}</span>
               <button onClick={() => copyToClipboard(result ? `https://hotsnew.click/s/${result.short_code}` : '', 'res')} className="p-2 hover:bg-orange-50 rounded-lg text-orange-600 transition-all">
                  {copiedId === 'res' ? <Check size={18} /> : <Copy size={18} />}
               </button>
            </div>
            <div className="bg-gray-50 p-5 rounded-2xl font-bold text-xs truncate mb-8 text-gray-500">
               {result ? `https://hotsnew.click/s/${result.short_code}` : 'https://hotsnew.click/s/########'}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => copyToClipboard(result ? `https://hotsnew.click/s/${result.short_code}` : '', 'res')}
                disabled={!result}
                className="py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-orange-700 transition-all"
              >
                <Copy size={16} /> Copy Link
              </button>
              <button 
                disabled={!result}
                className="py-4 bg-white border border-gray-200 text-gray-900 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
              >
                <QrCode size={16} /> QR Code
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
