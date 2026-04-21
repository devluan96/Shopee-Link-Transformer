import React from 'react';
import { 
  Zap, 
  List, 
  LayoutDashboard, 
  BarChart3, 
  Users as UsersIcon, 
  LogOut,
  PlusCircle,
  User
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Tab, UserProfile } from '@/src/types';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  isActuallyAdmin: boolean;
  userProfile: UserProfile | null;
  userEmail: string | undefined;
  handleLogout: () => void;
}

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm text-left",
      active 
        ? "bg-orange-600 text-white shadow-lg shadow-orange-200" 
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
    )}
  >
    <Icon size={18} />
    {label}
  </button>
);

export const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  isActuallyAdmin, 
  userProfile, 
  userEmail,
  handleLogout 
}: SidebarProps) => {
  return (
    <aside className="w-72 bg-white border-r border-gray-200 hidden lg:flex flex-col p-6 sticky top-0 h-screen">
      <div className="flex items-center gap-3 mb-12">
        <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-100">
          <Zap className="text-white w-6 h-6 fill-current" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none">HotsNew</h1>
          <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mt-1">click <span className="italic opacity-50">&alpha;</span></p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        <div className="mb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">Menu chính</div>
        <SidebarItem icon={LayoutDashboard} label="Bảng điều khiển" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <SidebarItem icon={PlusCircle} label="Tạo Link" active={activeTab === 'create'} onClick={() => setActiveTab('create')} />
        <SidebarItem icon={List} label="Danh sách Link" active={activeTab === 'list'} onClick={() => setActiveTab('list')} />
        <SidebarItem icon={BarChart3} label="Phân tích dữ liệu" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
        <SidebarItem icon={User} label="Hồ sơ cá nhân" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
        
        {isActuallyAdmin && (
          <>
            <div className="mt-8 mb-4 text-[10px] font-black text-orange-400 uppercase tracking-widest px-4">Quản trị viên</div>
            <SidebarItem icon={UsersIcon} label="Quản lý User" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />
          </>
        )}
      </nav>

      <div className="mt-auto pt-6 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-6 p-2">
          <img src={userProfile?.avatar_url || null} className="w-10 h-10 rounded-full bg-gray-100" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/40')} />
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{userProfile?.full_name || userEmail}</p>
            <p className="text-[10px] text-green-600 font-bold uppercase">{isActuallyAdmin ? 'Administrator' : 'Premium Member'}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 font-bold text-sm transition-all"
        >
          <LogOut size={18} />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
};
