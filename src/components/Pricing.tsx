import React from 'react';
import { motion } from 'motion/react';
import { Check, Crown, Zap, Sparkles } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { UserProfile } from '@/src/types';

interface PricingProps {
  userProfile: UserProfile | null;
}

export const Pricing = ({ userProfile }: PricingProps) => {
  const currentPlan = userProfile?.subscription_plan || 'free';
  const expiryDate = userProfile?.subscription_expiry ? new Date(userProfile.subscription_expiry).toLocaleDateString('vi-VN') : null;

  const plans = [
    {
      id: 'monthly',
      name: 'Gói tháng',
      price: '299.000đ',
      period: '/ THÁNG',
      description: 'Phù hợp để chạy thử hoặc vận hành ngắn hạn.',
      features: [
        'Tạo landing page không giới hạn',
        'Upload video và thumbnail',
        'Quản lý link và theo dõi thống kê',
        'Thanh toán qua ZaloPay Gateway và VietQR'
      ],
      highlight: true,
      buttonText: 'THANH TOÁN NGAY',
      badge: 'LINH HOẠT'
    },
    {
      id: 'yearly',
      name: 'Gói năm',
      price: '2.490.000đ',
      period: '/ NĂM',
      description: 'Tối ưu chi phí và phù hợp cho tài khoản vận hành lâu dài.',
      features: [
        'Tạo landing page không giới hạn',
        'Upload video và thumbnail',
        'Quản lý link và theo dõi thống kê',
        'Thanh toán qua ZaloPay Gateway và VietQR'
      ],
      highlight: false,
      buttonText: 'THANH TOÁN NGAY',
      badge: 'TIẾT KIỆM HƠN'
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto"
    >
      <header className="mb-12">
        <h2 className="text-3xl font-black text-gray-900 mb-2">Bảng giá dịch vụ</h2>
        <p className="text-gray-500 font-medium italic">Nâng cấp tài khoản để mở khóa toàn bộ tính năng chuyển đổi link.</p>
      </header>

      {/* Current Plan Status */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6 text-center md:text-left">
          <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center">
            <Crown className="text-orange-600 w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">TRẠNG THÁI HIỆN TẠI</p>
            <h3 className="text-2xl font-black text-gray-900">
              {currentPlan === 'free' ? 'Gói miễn phí' : currentPlan === 'monthly' ? 'Gói tháng' : 'Gói năm'}
            </h3>
            {expiryDate && (
              <p className="text-sm text-gray-500 font-medium">Gói đang hoạt động đến {expiryDate}.</p>
            )}
          </div>
        </div>
        <div className="bg-green-50 text-green-600 px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest border border-green-100">
          Đang hoạt động
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            className={cn(
              "relative bg-white rounded-[3rem] p-10 border shadow-sm flex flex-col h-full transition-all hover:shadow-xl hover:-translate-y-1",
              plan.highlight ? "border-orange-500 ring-4 ring-orange-50" : "border-gray-100"
            )}
          >
            {plan.highlight && (
              <div className="absolute top-10 right-10">
                <Sparkles className="text-orange-500 w-6 h-6" />
              </div>
            )}
            {!plan.highlight && (
              <div className="absolute top-10 right-10">
                <Zap className="text-orange-500 w-6 h-6" />
              </div>
            )}

            <div className="mb-8">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 block">
                {plan.badge}
              </span>
              <h4 className="text-3xl font-black text-gray-900 mb-4">{plan.name}</h4>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-black text-gray-900">{plan.price}</span>
                <span className="text-sm font-bold text-gray-400">{plan.period}</span>
              </div>
              <p className="text-gray-500 font-medium text-sm leading-relaxed">
                {plan.description}
              </p>
            </div>

            <div className="space-y-4 mb-10 flex-1">
              {plan.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 bg-green-50 rounded-full flex items-center justify-center border border-green-100">
                    <Check size={12} className="text-green-600" />
                  </div>
                  <span className="text-sm font-bold text-gray-600 leading-tight">{feature}</span>
                </div>
              ))}
            </div>

            <button 
              className={cn(
                "w-full py-5 rounded-3xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2",
                plan.highlight 
                  ? "bg-orange-600 text-white shadow-lg shadow-orange-200 hover:bg-orange-700" 
                  : "bg-gray-900 text-white hover:bg-black"
              )}
            >
              {plan.buttonText}
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.span>
            </button>
          </div>
        ))}
      </div>

      <footer className="mt-12 text-center">
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">© 2026 HOTSNEW.CLICK INFRASTRUCTURE</p>
      </footer>
    </motion.div>
  );
};
