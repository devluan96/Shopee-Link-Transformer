import { UserProfile } from '@/src/types';

export const getPlanLabel = (plan?: string | null) => {
  if (plan === 'monthly') return 'Gói tháng';
  if (plan === 'yearly') return 'Gói năm';
  return 'Chưa kích hoạt';
};

export const hasActiveSubscription = (profile?: UserProfile | null, isAdmin = false) => {
  if (isAdmin) return true;
  if (!profile || profile.subscription_status !== 'active' || !profile.subscription_expires_at) return false;
  return new Date(profile.subscription_expires_at).getTime() > Date.now();
};

export const getSubscriptionStatusLabel = (profile?: UserProfile | null, isAdmin = false) => {
  if (isAdmin) return 'Quản trị viên';
  if (!profile) return 'Chưa có gói';
  if (hasActiveSubscription(profile)) {
    return `${getPlanLabel(profile.subscription_plan)} đang hoạt động`;
  }
  if (profile.subscription_requested_plan) {
    return `Đang chờ thanh toán ${getPlanLabel(profile.subscription_requested_plan).toLowerCase()}`;
  }
  if (profile.subscription_status === 'expired') {
    return 'Gói đã hết hạn';
  }
  return 'Chưa kích hoạt gói';
};
