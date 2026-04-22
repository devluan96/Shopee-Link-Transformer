import React from 'react';
import { motion } from 'motion/react';
import { Users as UsersIcon, Check, UserCheck, Trash2, CalendarClock } from 'lucide-react';
import { UserProfile } from '@/src/types';
import { getPlanLabel, hasActiveSubscription } from '@/src/lib/subscription';

interface AdminPanelProps {
  allUsers: UserProfile[];
  adminLoading: boolean;
  handleApproveUser: (userId: string) => void;
  handleDeleteUser: (user: UserProfile) => void;
  handleSetSubscription: (userId: string, plan: 'monthly' | 'yearly' | 'none') => void;
  currentUserId?: string;
  deletingUserId?: string | null;
  subscriptionUpdatingUserId?: string | null;
}

export const AdminPanel = ({
  allUsers,
  adminLoading,
  handleApproveUser,
  handleDeleteUser,
  handleSetSubscription,
  currentUserId,
  deletingUserId,
  subscriptionUpdatingUserId,
}: AdminPanelProps) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} key="admin">
      <header className="mb-12">
        <h2 className="mb-2 text-3xl font-black text-gray-900">Quản Lý Người Dùng</h2>
        <p className="font-medium italic text-gray-500">Phê duyệt user và cấp gói tháng hoặc gói năm cho tài khoản.</p>
      </header>

      <div className="overflow-hidden rounded-[3rem] border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-8">
          <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
            <UsersIcon size={18} /> Thành viên hệ thống
          </h3>
          <span className="rounded-full bg-gray-900 px-3 py-1 text-[10px] font-bold text-white">{allUsers.length} Users</span>
        </div>

        <div className="divide-y divide-gray-100">
          {adminLoading ? (
            <div className="p-20 text-center font-bold text-gray-300">Đang tải danh sách user...</div>
          ) : allUsers.length === 0 ? (
            <div className="p-20 text-center font-medium italic text-gray-400">Chưa có người dùng nào khác.</div>
          ) : allUsers.map((u) => (
            <div key={u.id} className="flex flex-col gap-5 p-6 transition-all hover:bg-gray-50 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-4">
                <img src={u.avatar_url || 'https://via.placeholder.com/40'} className="h-12 w-12 rounded-full bg-gray-100 ring-2 ring-white shadow-md" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/40')} />
                <div>
                  <p className="font-bold text-gray-900">{u.full_name || 'Người dùng chưa đặt tên'}</p>
                  <p className="text-xs font-medium text-gray-400">{u.email}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-wider">
                    <span className={`rounded-full px-2.5 py-1 ${hasActiveSubscription(u) ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      {getPlanLabel(u.subscription_plan)}
                    </span>
                    {u.subscription_requested_plan && (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-600">
                        Yêu cầu {getPlanLabel(u.subscription_requested_plan).toLowerCase()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-stretch gap-3 xl:items-end">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleSetSubscription(u.id, 'monthly')}
                    disabled={subscriptionUpdatingUserId === u.id}
                    className="rounded-xl bg-slate-900 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-orange-600 disabled:opacity-50"
                  >
                    <CalendarClock size={12} className="mr-1 inline-block" /> Tháng
                  </button>
                  <button
                    onClick={() => handleSetSubscription(u.id, 'yearly')}
                    disabled={subscriptionUpdatingUserId === u.id}
                    className="rounded-xl bg-orange-500 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-orange-600 disabled:opacity-50"
                  >
                    Năm
                  </button>
                  <button
                    onClick={() => handleSetSubscription(u.id, 'none')}
                    disabled={subscriptionUpdatingUserId === u.id}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Tắt gói
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  {u.status === 'approved' ? (
                    <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-tighter text-green-600">
                      <Check size={10} /> Đã duyệt
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApproveUser(u.id)}
                      className="flex items-center gap-2 rounded-2xl bg-orange-600 px-6 py-3 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:bg-orange-700 active:scale-95"
                    >
                      <UserCheck size={16} /> Duyệt ngay
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteUser(u)}
                    disabled={deletingUserId === u.id || currentUserId === u.id}
                    title={currentUserId === u.id ? 'Không thể xóa tài khoản đang đăng nhập' : 'Xóa người dùng'}
                    className="rounded-xl bg-gray-100 p-3 text-gray-400 transition-all hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
