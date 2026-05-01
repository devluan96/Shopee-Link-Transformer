import React from 'react';
import { Users as UsersIcon, Check, UserCheck, Trash2, User, Search, Filter, BarChart3, Link2, ExternalLink, X, Eye } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { UserProfile } from '@/src/types';

interface UserLink {
  id: string;
  short_code: string;
  custom_title?: string;
  original_url: string;
  clicks?: number;
  created_at: string;
}

interface AdminPanelProps {
  allUsers: UserProfile[];
  adminLoading: boolean;
  onlineUserIds: string[];
  handleApproveUser: (userId: string) => void;
  handleUpdateSubscription: (userId: string, plan: 'free' | 'monthly' | 'yearly') => void;
  handleDeleteUser: (userId: string) => void;
  fetchWithAuth?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

export const AdminPanel = ({ allUsers, adminLoading, onlineUserIds, handleApproveUser, handleUpdateSubscription, handleDeleteUser, fetchWithAuth }: AdminPanelProps) => {
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [planFilter, setPlanFilter] = React.useState<'all' | 'free' | 'monthly' | 'yearly'>('all');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'approved' | 'pending'>('all');
  const [selectedUser, setSelectedUser] = React.useState<UserProfile | null>(null);
  const [userLinks, setUserLinks] = React.useState<UserLink[]>([]);
  const [userLinksLoading, setUserLinksLoading] = React.useState(false);

  const confirmDelete = () => {
    if (deleteId) {
      handleDeleteUser(deleteId);
      setDeleteId(null);
    }
  };

  // Fetch user links with click counts when selected user changes (single API call)
  React.useEffect(() => {
    if (selectedUser && fetchWithAuth) {
      setUserLinksLoading(true);
      fetchWithAuth(`/api/v1/admin/users/${selectedUser.id}/links`)
        .then(res => res.json())
        .then((data) => {
          // Backend now returns links with clicks included
          setUserLinks(data || []);
          setUserLinksLoading(false);
        })
        .catch(() => {
          setUserLinks([]);
          setUserLinksLoading(false);
        });
    }
  }, [selectedUser, fetchWithAuth]);

  // Filter users
  const filteredUsers = React.useMemo(() => {
    return allUsers.filter(user => {
      const matchesSearch = 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        false;
      const matchesPlan = planFilter === 'all' || user.subscription_plan === planFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [allUsers, searchTerm, planFilter, statusFilter]);

  // Calculate stats
  const stats = React.useMemo(() => {
    const totalUsers = allUsers.length;
    const premiumUsers = allUsers.filter(u => u.subscription_plan && u.subscription_plan !== 'free').length;
    const pendingUsers = allUsers.filter(u => u.status !== 'approved').length;
    const revenue = allUsers.reduce((sum, u) => {
      if (u.subscription_plan === 'monthly') return sum + 299000;
      if (u.subscription_plan === 'yearly') return sum + 2490000;
      return sum;
    }, 0);
    return { totalUsers, premiumUsers, pendingUsers, revenue };
  }, [allUsers]);

  return (
    <div key="admin">
      {/* Confirmation Dialog */}
      {deleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            onClick={() => setDeleteId(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
          />
          <div 
            className="relative bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-gray-100"
          >
            <h3 className="text-xl font-black text-gray-900 mb-2">Xác nhận xóa?</h3>
            <p className="text-gray-500 font-medium text-sm leading-relaxed mb-8">
              Bạn có chắc chắn muốn xóa người dùng này? Mọi liên kết và dữ liệu liên quan sẽ bị xóa vĩnh viễn.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setDeleteId(null)}
                className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
              >
                Hủy
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-100"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <UsersIcon size={20} className="text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Tổng Users</span>
          </div>
          <div className="text-2xl font-black text-gray-900">{stats.totalUsers}</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Check size={20} className="text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Premium</span>
          </div>
          <div className="text-2xl font-black text-gray-900">{stats.premiumUsers}</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <UserCheck size={20} className="text-orange-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Chờ Duyệt</span>
          </div>
          <div className="text-2xl font-black text-gray-900">{stats.pendingUsers}</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <BarChart3 size={20} className="text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Doanh Thu</span>
          </div>
          <div className="text-2xl font-black text-gray-900">{stats.revenue.toLocaleString()}đ</div>
        </div>
      </div>

      <header className="mb-8">
        <h2 className="text-3xl font-black text-gray-900 mb-2">Quản Lý Người Dùng</h2>
        <p className="text-gray-500 font-medium">Quản lý, phê duyệt và theo dõi hoạt động thành viên</p>
      </header>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value as any)}
              className="px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none text-sm bg-white"
            >
              <option value="all">Tất cả gói</option>
              <option value="free">Free</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none text-sm bg-white"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="approved">Đã duyệt</option>
              <option value="pending">Chờ duyệt</option>
            </select>
          </div>
        </div>
        <div className="mt-3 text-sm text-gray-500">
          Hiển thị {filteredUsers.length} / {allUsers.length} users
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
           <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
             <UsersIcon size={18} /> Thành viên hệ thống
           </h3>
           <span className="bg-gray-900 text-white px-3 py-1 rounded-full text-[10px] font-bold">{filteredUsers.length} Users</span>
        </div>
        
        <div className="divide-y divide-gray-100">
          {adminLoading ? (
            <div className="p-20 text-center text-gray-300 font-bold">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-20 text-center text-gray-400 font-medium italic">Không tìm thấy người dùng nào.</div>
          ) : filteredUsers.map(u => (
            <div key={u.id} className="p-6 flex items-center justify-between gap-6 hover:bg-gray-50 transition-all cursor-pointer" onClick={() => setSelectedUser(u)}>
               <div className="flex items-center gap-4 flex-1">
                  <div className="relative w-12 h-12">
                    {u.avatar_url ? (
                      <img 
                        src={u.avatar_url} 
                        className="w-12 h-12 rounded-full ring-2 ring-white shadow-md bg-gray-100 object-cover" 
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement?.querySelector('.avatar-placeholder')?.classList.remove('hidden');
                        }} 
                      />
                    ) : null}
                    <div className={cn(
                      "w-12 h-12 rounded-full ring-2 ring-white shadow-md bg-gray-100 flex items-center justify-center text-gray-400 avatar-placeholder",
                      u.avatar_url ? "hidden" : ""
                    )}>
                      <User size={24} />
                    </div>
                    <span
                      className={cn(
                        "absolute right-0 bottom-0 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm",
                        onlineUserIds.includes(u.id) ? "bg-green-500" : "bg-gray-300",
                      )}
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-gray-900">{u.full_name || 'Chưa đặt tên'}</h4>
                    <p className="text-sm text-gray-500">{u.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                        u.status === 'approved' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                      )}>
                        {u.status === 'approved' ? 'ĐÃ DUYỆT' : 'CHỜ DUYỆT'}
                      </span>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                        u.subscription_plan === 'monthly' ? "bg-blue-100 text-blue-700" :
                        u.subscription_plan === 'yearly' ? "bg-purple-100 text-purple-700" :
                        "bg-gray-100 text-gray-700"
                      )}>
                        {u.subscription_plan?.toUpperCase() || 'FREE'}
                      </span>
                      {onlineUserIds.includes(u.id) && (
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          ONLINE
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedUser(u); }}
                    className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all"
                    title="Xem chi tiết"
                  >
                    <Eye size={18} className="text-gray-600" />
                  </button>
               </div>
               
               <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                  <select 
                    className="bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-bold px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer"
                    value={u.subscription_plan || 'free'}
                    onChange={(e) => handleUpdateSubscription(u.id, e.target.value as any)}
                  >
                    <option value="free">FREE</option>
                    <option value="monthly">MONTHLY</option>
                    <option value="yearly">YEARLY</option>
                  </select>

                   {u.status !== 'approved' && (
                     <button 
                       onClick={(e) => { e.stopPropagation(); handleApproveUser(u.id); }}
                       className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-orange-700 transition-all active:scale-95"
                     >
                       <UserCheck size={16} /> Duyệt Ngay
                     </button>
                   )}
                   <button 
                     onClick={(e) => { e.stopPropagation(); setDeleteId(u.id); }}
                     className="p-3 bg-gray-100 text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all active:scale-90"
                   >
                      <Trash2 size={16} />
                   </button>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            onClick={() => setSelectedUser(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
          />
          <div className="relative bg-white rounded-[2rem] w-full max-w-3xl max-h-[90vh] overflow-auto shadow-2xl border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-xl font-black text-gray-900">Chi tiết người dùng</h3>
              <button 
                onClick={() => setSelectedUser(null)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-all"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              {/* User Info */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative w-16 h-16">
                  {selectedUser.avatar_url ? (
                    <img 
                      src={selectedUser.avatar_url} 
                      className="w-16 h-16 rounded-2xl ring-2 ring-white shadow-md bg-gray-100 object-cover" 
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl ring-2 ring-white shadow-md bg-gray-100 flex items-center justify-center text-gray-400">
                      <User size={32} />
                    </div>
                  )}
                  {onlineUserIds.includes(selectedUser.id) && (
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white bg-green-500" />
                  )}
                </div>
                <div>
                  <h4 className="font-black text-xl text-gray-900">{selectedUser.full_name || 'Chưa đặt tên'}</h4>
                  <p className="text-gray-500">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={cn(
                      "text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full",
                      selectedUser.status === 'approved' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                    )}>
                      {selectedUser.status === 'approved' ? 'ĐÃ DUYỆT' : 'CHỜ DUYỆT'}
                    </span>
                    <span className={cn(
                      "text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full",
                      selectedUser.subscription_plan === 'monthly' ? "bg-blue-100 text-blue-700" :
                      selectedUser.subscription_plan === 'yearly' ? "bg-purple-100 text-purple-700" :
                      "bg-gray-100 text-gray-700"
                    )}>
                      {selectedUser.subscription_plan?.toUpperCase() || 'FREE'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 mb-6">
                {selectedUser.status !== 'approved' && (
                  <button
                    onClick={() => { handleApproveUser(selectedUser.id); setSelectedUser({...selectedUser, status: 'approved'}); }}
                    className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-all"
                  >
                    <Check size={18} /> Duyệt User
                  </button>
                )}
                <select
                  value={selectedUser.subscription_plan || 'free'}
                  onChange={(e) => { 
                    const newPlan = e.target.value as 'free' | 'monthly' | 'yearly';
                    handleUpdateSubscription(selectedUser.id, newPlan); 
                    setSelectedUser({...selectedUser, subscription_plan: newPlan}); 
                  }}
                  className="px-4 py-3 border border-gray-200 rounded-xl font-bold text-sm focus:border-gray-900 focus:outline-none"
                >
                  <option value="free">FREE</option>
                  <option value="monthly">MONTHLY</option>
                  <option value="yearly">YEARLY</option>
                </select>
                <button
                  onClick={() => { setDeleteId(selectedUser.id); setSelectedUser(null); }}
                  className="flex items-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all"
                >
                  <Trash2 size={18} /> Xóa User
                </button>
              </div>

              {/* User Links */}
              <div className="border-t border-gray-100 pt-6">
                <h4 className="font-black text-lg text-gray-900 mb-4 flex items-center gap-2">
                  <Link2 size={20} /> Link của user ({userLinks.length})
                </h4>
                {userLinksLoading ? (
                  <div className="text-center py-8 text-gray-400">Đang tải...</div>
                ) : userLinks.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">Chưa có link nào</div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-auto">
                    {userLinks.map((link) => (
                      <div key={link.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-gray-900 truncate">{link.custom_title || link.short_code}</p>
                          <p className="text-xs text-gray-500 truncate">{link.original_url}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs font-black text-orange-600">{link.clicks || 0} CLICKS</span>
                            <span className="text-xs text-gray-400">{new Date(link.created_at).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a 
                            href={`/s/${link.short_code}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 transition-all"
                          >
                            <ExternalLink size={16} className="text-gray-600" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
