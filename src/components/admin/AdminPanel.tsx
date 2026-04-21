import React from 'react';
import { motion } from 'motion/react';
import { Users as UsersIcon, Check, UserCheck, Trash2 } from 'lucide-react';
import { UserProfile } from '@/src/types';

interface AdminPanelProps {
  allUsers: UserProfile[];
  adminLoading: boolean;
  handleApproveUser: (userId: string) => void;
}

export const AdminPanel = ({ allUsers, adminLoading, handleApproveUser }: AdminPanelProps) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} key="admin">
      <header className="mb-12">
        <h2 className="text-3xl font-black text-gray-900 mb-2">Quản Lý Người Dùng</h2>
        <p className="text-gray-500 font-medium italic">Kích hoạt và phê duyệt thành viên mới tham gia hotsnew.click</p>
      </header>

      <div className="bg-white rounded-[3rem] border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
           <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
             <UsersIcon size={18} /> Thành viên hệ thống
           </h3>
           <span className="bg-gray-900 text-white px-3 py-1 rounded-full text-[10px] font-bold">{allUsers.length} Users</span>
        </div>
        
        <div className="divide-y divide-gray-100">
          {adminLoading ? (
            <div className="p-20 text-center text-gray-300 font-bold">Loading users...</div>
          ) : allUsers.length === 0 ? (
            <div className="p-20 text-center text-gray-400 font-medium italic">Chưa có người dùng nào khác.</div>
          ) : allUsers.map(u => (
            <div key={u.id} className="p-6 flex items-center justify-between gap-6 hover:bg-gray-50 transition-all">
               <div className="flex items-center gap-4">
                  <img src={u.avatar_url || 'https://via.placeholder.com/40'} className="w-12 h-12 rounded-full ring-2 ring-white shadow-md bg-gray-100" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/40')} />
                  <div>
                     <p className="font-bold text-gray-900">{u.full_name || 'Unnamed User'}</p>
                     <p className="text-xs text-gray-400 font-medium">{u.email}</p>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  {u.status === 'approved' ? (
                     <span className="flex items-center gap-1.5 text-[10px] font-black text-green-600 bg-green-50 px-3 py-1.5 rounded-full uppercase tracking-tighter">
                       <Check size={10} /> Đã Duyệt
                     </span>
                  ) : (
                    <button 
                      onClick={() => handleApproveUser(u.id)}
                      className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-orange-700 transition-all active:scale-95"
                    >
                      <UserCheck size={16} /> Duyệt Ngay
                    </button>
                  )}
                  <button className="p-3 bg-gray-100 text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all">
                     <Trash2 size={16} />
                  </button>
               </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
