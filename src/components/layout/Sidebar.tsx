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
  isOpen?: boolean;
  onClose?: () => void;
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
  handleLogout,
  isOpen,
  onClose
}: SidebarProps) => {
  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 z-40 transition-opacity lg:hidden",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      <aside className={cn(
        "fixed inset-y-0 left-0 w-72 bg-white border-r border-gray-200 z-50 flex flex-col p-6 transition-transform lg:sticky lg:translate-x-0 lg:h-screen lg:z-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-100">
              <Zap className="text-white w-6 h-6 fill-current" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none">HotsNew</h1>
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mt-1">click <span className="italic opacity-50">&alpha;</span></p>
            </div>
          </div>
          
          {/* Mobile Close Button */}
          <button 
            onClick={onClose}
            className="lg:hidden p-2 text-gray-400 hover:text-gray-900"
          >
            <LogOut size={20} className="rotate-180" />
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto">
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
          {userProfile?.avatar_url ? (
            <img 
              src={userProfile.avatar_url} 
              className="w-10 h-10 rounded-full bg-gray-100 object-cover" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.querySelector('.avatar-placeholder')?.classList.remove('hidden');
              }} 
            />
          ) : null}
          <div className={cn(
            "w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 avatar-placeholder",
            userProfile?.avatar_url ? "hidden" : ""
          )}>
            <User size={20} />
          </div>
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
    </>
  );
};
