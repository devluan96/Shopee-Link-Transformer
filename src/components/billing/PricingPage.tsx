import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, Crown, ShieldCheck, Sparkles } from 'lucide-react';
import { UserProfile } from '@/src/types';
import { getPlanLabel, hasActiveSubscription } from '@/src/lib/subscription';

interface PricingPageProps {
  profile: UserProfile | null;
  isAdmin: boolean;
  checkoutLoadingPlan?: 'monthly' | 'yearly' | null;
  onCheckout: (plan: 'monthly' | 'yearly') => void;
}

const plans = [
  {
    plan: 'monthly' as const,
    title: 'Gói tháng',
    price: '299.000đ',
    accent: 'from-orange-500 via-orange-400 to-amber-300',
    note: 'Phù hợp để chạy thử hoặc vận hành ngắn hạn.',
  },
  {
    plan: 'yearly' as const,
    title: 'Gói năm',
    price: '2.490.000đ',
    accent: 'from-slate-900 via-slate-800 to-slate-600',
    note: 'Tối ưu chi phí và phù hợp cho tài khoản vận hành lâu dài.',
  },
];

export const PricingPage = ({ profile, isAdmin, checkoutLoadingPlan, onCheckout }: PricingPageProps) => {
  const active = hasActiveSubscription(profile, isAdmin);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} key="pricing">
      <header className="mb-12 max-w-3xl">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-orange-500">Bảng Giá</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-900">Mở khóa toàn bộ tính năng với gói phù hợp</h2>
        <p className="mt-4 text-slate-500 font-medium leading-7">
          Thanh toán qua ZaloPay Gateway với VietQR và các hình thức ngân hàng nội địa phù hợp. Hệ thống sẽ tự động cấp quyền và tự động hết hạn khi tới ngày.
        </p>
      </header>

      <div className="mb-10 rounded-[2.75rem] border border-slate-200 bg-white/90 p-7 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-[1.5rem] bg-orange-50 p-4 text-orange-500">
              <Crown size={24} />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Trạng thái hiện tại</p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">{isAdmin ? 'Tài khoản admin toàn quyền' : getPlanLabel(profile?.subscription_plan)}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {isAdmin
                  ? 'Admin luôn có toàn quyền và không cần mua gói để sử dụng hệ thống.'
                  : active
                    ? `Gói đang hoạt động đến ${new Date(profile?.subscription_expires_at || '').toLocaleDateString('vi-VN')}.`
                    : 'Tài khoản hiện chưa có gói đang hoạt động. Bạn có thể thanh toán ngay bên dưới.'}
              </p>
            </div>
          </div>
          <div className={`rounded-[1.5rem] px-5 py-4 text-sm font-black ${active || isAdmin ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-500'}`}>
            {active || isAdmin ? 'Đang hoạt động' : 'Chưa kích hoạt'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        {plans.map((item) => (
          <div key={item.plan} className="relative overflow-hidden rounded-[3rem] border border-slate-200 bg-white shadow-xl">
            <div className={`absolute inset-x-0 top-0 h-2 bg-gradient-to-r ${item.accent}`} />
            <div className="p-9">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">{item.plan === 'yearly' ? 'Tiết kiệm hơn' : 'Linh hoạt'}</p>
                  <h3 className="mt-3 text-3xl font-black text-slate-900">{item.title}</h3>
                </div>
                <Sparkles className="text-orange-400" size={24} />
              </div>

              <div className="mt-8 flex items-end gap-2">
                <span className="text-5xl font-black tracking-tight text-slate-900">{item.price}</span>
                <span className="pb-2 text-sm font-bold uppercase tracking-widest text-slate-400">{item.plan === 'monthly' ? '/ tháng' : '/ năm'}</span>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-500">{item.note}</p>

              <div className="mt-8 space-y-4">
                {[
                  'Tạo landing page không giới hạn',
                  'Upload video và thumbnail',
                  'Quản lý link và theo dõi thống kê',
                  'Thanh toán qua ZaloPay Gateway và VietQR',
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3 text-sm font-medium text-slate-600">
                    <CheckCircle2 size={18} className="text-emerald-500" />
                    {feature}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onCheckout(item.plan)}
                disabled={checkoutLoadingPlan === item.plan || isAdmin}
                className={`mt-10 flex w-full items-center justify-center gap-3 rounded-[1.75rem] px-6 py-4 text-sm font-black uppercase tracking-[0.2em] text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${item.plan === 'yearly' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-orange-500 hover:bg-orange-600'}`}
              >
                {checkoutLoadingPlan === item.plan ? 'Đang chuyển hướng...' : isAdmin ? 'Admin không cần mua gói' : 'Thanh toán ngay'}
                {!isAdmin && <ArrowRight size={18} />}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-[2.5rem] border border-sky-100 bg-sky-50 p-6 text-sky-700">
        <div className="flex items-start gap-3">
          <ShieldCheck size={18} className="mt-0.5 shrink-0" />
          <p className="text-sm font-medium leading-6">
            Sau khi thanh toán thành công, ZaloPay sẽ gọi callback/IPN về server để cập nhật ngay gói và thời hạn trên tài khoản. Nếu cần, admin vẫn có thể cấp gói thủ công trong trang Quản lý User.
          </p>
        </div>
      </div>
    </motion.div>
  );
};
