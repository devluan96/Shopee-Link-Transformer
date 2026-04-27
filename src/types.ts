export interface ConvertedLink {
  id?: string;
  short_code: string;
  original_url: string;
  secondary_url?: string;
  redirect_delay_ms?: number;
  custom_title?: string;
  custom_description?: string;
  usage_context?: string;
  custom_image_url?: string;
  video_url?: string;
  created_at: string;
  user_id: string;
  clicks?: number;
  tracked_sources?: Array<{
    label: string;
    count: number;
  }>;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  status?: string;
  role?: string;
  created_at?: string;
  subscription_plan?: "free" | "monthly" | "yearly";
  subscription_expiry?: string;
}

export type Tab =
  | "dashboard"
  | "pricing"
  | "create"
  | "list"
  | "analytics"
  | "admin"
  | "profile";

export interface LinkStats {
  totalLinks: number;
  totalClicks: number;
  recentClicks: Array<{ date: string; clicks: number }>;
  topLinks: Array<{ short_code: string; title: string; clicks: number }>;
  growthPercentage: number;
}

export interface AnalyticsData {
  history: Array<{ date: string; clicks: number }>;
  topLinks: Array<{ title: string; clicks: number }>;
  trafficSources: Array<{ name: string; value: number }>;
  growthPercentage: number;
}
