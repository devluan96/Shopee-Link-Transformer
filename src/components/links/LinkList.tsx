import React from 'react';
import { motion } from 'motion/react';
import { Search, Image as ImageIcon, Video as VideoIcon, ExternalLink } from 'lucide-react';
import { ConvertedLink } from '@/src/types';
import { formatDistanceToNow } from 'date-fns';

interface LinkListProps {
  links: ConvertedLink[];
  listLoading: boolean;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  copyToClipboard: (text: string, id: string) => void;
  copiedId: string;
}

export const LinkList = ({
  links,
  listLoading,
  searchTerm,
  setSearchTerm,
  copyToClipboard,
  copiedId
}: LinkListProps) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} key="list">
      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Kho Lưu Trữ Link</h2>
          <p className="text-gray-500 font-medium italic">Tổng cộng {links.length} tài nguyên liên kết.</p>
        </div>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" placeholder="Tìm kiếm tài nguyên..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-6 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 min-w-[300px] font-medium"
          />
        </div>
      </header>

      <div className="grid gap-4">
        {listLoading ? (
           Array.from({length: 4}).map((_, i) => <div key={i} className="h-28 bg-white border border-gray-100 rounded-[2.5rem] animate-pulse" />)
        ) : links.length === 0 ? (
          <div className="py-20 text-center text-gray-400 font-medium italic bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
            Chưa có link nào được tạo.
          </div>
        ) : links.map(l => (
           <div key={l.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-6 group hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center relative">
                 {l.custom_image_url ? (
                   <img src={l.custom_image_url} className="w-full h-full object-cover" />
                 ) : l.video_url ? (
                   <div className="w-full h-full bg-gray-900 flex items-center justify-center text-white"><VideoIcon size={24} /></div>
                 ) : <ImageIcon size={24} className="text-gray-200" />}
                 
                 {l.video_url && l.custom_image_url && (
                   <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                     <VideoIcon size={16} className="text-white drop-shadow-md" />
                   </div>
                 )}
              </div>
              <div className="flex-1 min-w-0 pr-4">
                <h4 className="font-bold text-gray-900 truncate mb-1">{l.custom_title || 'Untitled link'}</h4>
                <p className="text-xs text-gray-400 font-medium truncate mb-2">{l.custom_description || 'No description provided'}</p>
                <div className="flex items-center gap-3">
                   <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">{l.short_code}</span>
                   <span className="text-[10px] font-medium text-gray-400 uppercase tracking-tighter">
                     {l.created_at && formatDistanceToNow(new Date(l.created_at))} ago
                   </span>
                </div>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => copyToClipboard(`https://hotsnew.click/s/${l.short_code}`, l.id || '')} className="px-6 py-3 bg-gray-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                   {copiedId === l.id ? 'DONE' : 'COPY'}
                 </button>
                 <a href={l.original_url} target="_blank" rel="noreferrer" className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:text-orange-600 hover:bg-orange-50 transition-all"><ExternalLink size={18} /></a>
              </div>
           </div>
        ))}
      </div>
    </motion.div>
  );
};
