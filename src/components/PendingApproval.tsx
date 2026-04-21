import React from 'react';
import { Clock } from 'lucide-react';

interface PendingApprovalProps {
  handleLogout: () => void;
}

export const PendingApproval = ({ handleLogout }: PendingApprovalProps) => {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center font-sans">
      <div className="w-20 h-20 bg-orange-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-orange-900/20 animate-pulse">
        <Clock size={40} className="text-white" />
      </div>
      <h2 className="text-4xl font-black text-white mb-4 tracking-tight">Đang Chờ Duyệt</h2>
      <p className="text-slate-400 mb-12 max-w-sm font-medium leading-relaxed">
        Chào mừng bạn gia nhập cộng đồng <span className="text-orange-500 font-bold">hotsnew.click</span>.<br/>
        Tài khoản của bạn đang chờ quản trị viên phê duyệt để đảm bảo an toàn hệ thống.
      </p>
      <button 
        onClick={handleLogout} 
        className="px-12 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange-500 hover:text-white transition-all active:scale-95 shadow-xl"
      >
        Đăng xuất tài khoản
      </button>
      <p className="mt-8 text-slate-500 text-[10px] uppercase font-black tracking-[0.2em]">HotsNew Click Premium</p>
    </div>
  );
};
