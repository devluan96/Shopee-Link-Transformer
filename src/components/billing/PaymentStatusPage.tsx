import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, XCircle, ArrowLeft, CreditCard } from 'lucide-react';

interface PaymentStatusPageProps {
  status: 'success' | 'cancel';
  onBackToPricing: () => void;
}

export const PaymentStatusPage = ({ status, onBackToPricing }: PaymentStatusPageProps) => {
  const isSuccess = status === 'success';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      key={`payment-${status}`}
      className="mx-auto max-w-3xl"
    >
      <div className="overflow-hidden rounded-[3rem] border border-slate-200 bg-white shadow-2xl">
        <div className={`h-2 w-full ${isSuccess ? 'bg-emerald-500' : 'bg-rose-500'}`} />
        <div className="p-10 md:p-14">
          <div className="flex flex-col items-center text-center">
            <div className={`flex h-24 w-24 items-center justify-center rounded-[2rem] ${isSuccess ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
              {isSuccess ? <CheckCircle2 size={42} /> : <XCircle size={42} />}
            </div>

            <p className="mt-8 text-[11px] font-black uppercase tracking-[0.32em] text-slate-400">
              Thanh toán ZaloPay
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-900">
              {isSuccess ? 'Thanh toán thành công' : 'Thanh toán chưa hoàn tất'}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-500">
              {isSuccess
                ? 'Giao dịch đã được ghi nhận. Hệ thống sẽ cập nhật gói dịch vụ ngay khi callback từ ZaloPay được xác nhận.'
                : 'Bạn đã hủy thanh toán hoặc giao dịch chưa hoàn tất. Bạn có thể quay lại bảng giá để thử lại bất cứ lúc nào.'}
            </p>

            <div className="mt-8 rounded-[2rem] border border-slate-100 bg-slate-50 px-6 py-5 text-left">
              <div className="flex items-start gap-3">
                <CreditCard size={18} className="mt-1 shrink-0 text-orange-500" />
                <p className="text-sm leading-6 text-slate-600">
                  {isSuccess
                    ? 'Nếu trạng thái gói chưa đổi sau ít phút, hãy kiểm tra callback URL ZaloPay hoặc nhật ký server.'
                    : 'Bạn chưa bị trừ quyền sử dụng. Sau khi thanh toán thành công, gói tháng hoặc gói năm sẽ được kích hoạt tự động.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onBackToPricing}
              className="mt-10 inline-flex items-center gap-3 rounded-[1.75rem] bg-slate-900 px-7 py-4 text-sm font-black uppercase tracking-[0.22em] text-white transition hover:bg-orange-600"
            >
              <ArrowLeft size={18} />
              Quay lại bảng giá
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
