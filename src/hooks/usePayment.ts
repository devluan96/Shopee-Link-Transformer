import { useState, useCallback, useRef, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { UserProfile } from "@/src/types";
import { toast } from "sonner";

interface UsePaymentProps {
  user: User | null;
  fetchWithAuth: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  refreshCurrentProfile: () => Promise<UserProfile | null>;
}

export interface PaymentState {
  checkoutLoadingPlan: "monthly" | "yearly" | null;
}

export interface PaymentActions {
  handleCreateZaloPayOrder: (plan: "monthly" | "yearly") => Promise<void>;
  handleCheckZaloPayStatus: (appTransId: string) => Promise<{ paid: boolean; processing: boolean }>;
}

export function usePayment({ user, fetchWithAuth, refreshCurrentProfile }: UsePaymentProps): PaymentState & PaymentActions {
  const [checkoutLoadingPlan, setCheckoutLoadingPlan] = useState<"monthly" | "yearly" | null>(null);
  const handledReturnRef = useRef(false);

  const handleCreateZaloPayOrder = useCallback(async (plan: "monthly" | "yearly") => {
    if (!user) {
      toast.error("Vui lòng đăng nhập trước");
      return;
    }
    
    setCheckoutLoadingPlan(plan);
    try {
      const res = await fetchWithAuth("/api/v1/billing/zalopay/create-order", {
        method: "POST",
        body: JSON.stringify({ plan }),
      });
      const resultData = await res.json();

      if (!res.ok) {
        throw new Error(resultData.error || "Không thể tạo đơn thanh toán");
      }

      if (!resultData.order_url) {
        throw new Error("ZaloPay không trả về link thanh toán");
      }

      window.location.href = resultData.order_url;
    } catch (e: any) {
      toast.error(e.message || "Lỗi khi khởi tạo thanh toán ZaloPay");
      setCheckoutLoadingPlan(null);
    }
  }, [user, fetchWithAuth]);

  const handleCheckZaloPayStatus = useCallback(async (appTransId: string): Promise<{ paid: boolean; processing: boolean }> => {
    try {
      const res = await fetchWithAuth(
        `/api/v1/billing/zalopay/status/${encodeURIComponent(appTransId)}`,
      );
      const resultData = await res.json();

      if (!res.ok) {
        throw new Error(resultData.error || "Không thể kiểm tra trạng thái thanh toán");
      }

      if (resultData.paid) {
        await refreshCurrentProfile();
        toast.success("Thanh toán thành công. Gói dịch vụ đã được kích hoạt.");
        return { paid: true, processing: false };
      }

      if (resultData.processing) {
        toast.message("Giao dịch đang được xử lý. Vui lòng đợi ít phút rồi kiểm tra lại.");
        return { paid: false, processing: true };
      }

      toast.error("Thanh toán chưa hoàn tất hoặc đã thất bại.");
      return { paid: false, processing: false };
    } catch (e: any) {
      toast.error(e.message || "Không thể kiểm tra giao dịch ZaloPay");
      return { paid: false, processing: false };
    }
  }, [fetchWithAuth, refreshCurrentProfile]);

  // Handle payment return
  useEffect(() => {
    if (handledReturnRef.current) return;

    const currentUrl = new URL(window.location.href);
    const payment = currentUrl.searchParams.get("payment");
    const appTransId = currentUrl.searchParams.get("app_trans_id");
    const tab = currentUrl.searchParams.get("tab");

    if (payment !== "return" || !appTransId || tab !== "pricing") {
      return;
    }

    handledReturnRef.current = true;

    void handleCheckZaloPayStatus(appTransId).finally(() => {
      currentUrl.searchParams.delete("payment");
      currentUrl.searchParams.delete("app_trans_id");
      currentUrl.searchParams.delete("plan");
      currentUrl.searchParams.delete("tab");
      window.history.replaceState(
        {},
        document.title,
        `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`,
      );
    });
  }, [handleCheckZaloPayStatus]);

  return {
    checkoutLoadingPlan,
    handleCreateZaloPayOrder,
    handleCheckZaloPayStatus,
  };
}
