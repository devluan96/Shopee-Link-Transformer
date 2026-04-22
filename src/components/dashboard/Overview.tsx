import React from 'react';
import { motion } from 'motion/react';
import {
  Zap, PlusCircle, List, BarChart3, TrendingUp, MousePointer2, Activity
} from 'lucide-react';
import { Tab } from '@/src/types';

interface OverviewProps {
  stats: {
    totalLinks: number;
    totalClicks: number;
    recentClicks: Array<{ date: string; clicks: number }>;
    topLinks: Array<{ short_code: string; title: string; clicks: number }>;
  } | null;
  setActiveTab: (tab: Tab) => void;
  canUseCreateFeatures: boolean;
}

export const Overview = ({ stats, setActiveTab, canUseCreateFeatures }: OverviewProps) => {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} key="dashboard">
      <header className="mb-12">
        <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Tổng quan hệ thống</h2>
        <p className="text-gray-500 font-medium italic">Tóm tắt hoạt động tài khoản của bạn trong hệ thống HotsNew Click.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Tổng Link', value: stats?.totalLinks || 0, icon: List, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Tổng lượt click', value: stats?.totalClicks || 0, icon: MousePointer2, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Tăng trưởng %', value: '+12.5', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Độ hiệu quả', value: 'Cao', icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
            <div className={`w-14 h-14 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <s.icon size={28} />
            </div>
            <div className="text-3xl font-black text-gray-900 mb-1 font-mono">{s.value}</div>
            <div className="text-[11px] font-black uppercase tracking-widest text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-gray-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <h3 className="text-3xl font-black mb-4">Sẵn sàng mở khóa tính năng?</h3>
            <p className="text-gray-400 font-medium mb-10 max-w-md">
              Gói tháng và gói năm sẽ mở khóa tạo link landing page, upload video và các thao tác sử dụng chính trong hệ thống.
            </p>
            <button
              onClick={() => setActiveTab(canUseCreateFeatures ? 'create' : 'pricing')}
              className="px-10 py-5 bg-orange-600 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:bg-orange-500 transition-all active:scale-95 shadow-xl shadow-orange-900/40"
            >
              <PlusCircle size={20} /> {canUseCreateFeatures ? 'Tạo Link ngay' : 'Mua gói để sử dụng'}
            </button>
          </div>
          <Zap size={240} className="absolute -bottom-12 -right-12 text-white opacity-[0.03] fill-current pointer-events-none" />
        </div>

        <div className="bg-white rounded-[3rem] border border-gray-200 p-8 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400 mb-8 px-2 flex items-center gap-2">
            <BarChart3 size={16} /> Link hiệu quả nhất
          </h3>
          <div className="space-y-4">
            {stats?.topLinks && stats.topLinks.length > 0 ? stats.topLinks.map((tl, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-all cursor-pointer group">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center font-black text-gray-400 group-hover:bg-orange-600 group-hover:text-white transition-all font-mono">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate mb-0.5">{tl.title}</p>
                  <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{tl.clicks} Clicks</p>
                </div>
              </div>
            )) : (
              <div className="py-20 text-center text-gray-400 font-medium italic">Chưa có dữ liệu.</div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
