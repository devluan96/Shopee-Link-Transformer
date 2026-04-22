export interface ConvertedLink {
  id?: string;
  short_code: string;
  original_url: string;
  custom_title?: string;
  custom_description?: string;
  custom_image_url?: string;
  video_url?: string;
  created_at: string;
  user_id: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  status?: string;
  role?: string;
  subscription_plan?: 'monthly' | 'yearly' | null;
  subscription_status?: 'inactive' | 'active' | 'expired' | null;
  subscription_started_at?: string | null;
  subscription_expires_at?: string | null;
  subscription_requested_plan?: 'monthly' | 'yearly' | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
}

export type Tab = 'dashboard' | 'create' | 'list' | 'analytics' | 'pricing' | 'admin' | 'profile';

export interface LinkStats {
  totalLinks: number;
  totalClicks: number;
  recentClicks: Array<{ date: string; clicks: number }>;
  topLinks: Array<{ short_code: string; title: string; clicks: number }>;
}
