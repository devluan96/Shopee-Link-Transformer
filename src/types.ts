export interface ConvertedLink {
  id?: string;
  short_code: string;
  original_url: string;
  workspace_id?: string;
  folder_name?: string;
  tags?: string[];
  secondary_url?: string;
  redirect_delay_ms?: number;
  custom_title?: string;
  custom_description?: string;
  usage_context?: string;
  custom_image_url?: string;
  video_url?: string;
  created_at: string;
  expires_at?: string;
  user_id: string;
  clicks?: number;
  tracked_sources?: Array<{
    label: string;
    count: number;
  }>;
}

export type WorkspaceRole = "owner" | "editor" | "viewer";

export interface Workspace {
  id: string;
  owner_id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  is_personal: boolean;
  role: WorkspaceRole;
}

export interface WorkspaceMember {
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  joined_at?: string | null;
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
  | "install"
  | "pricing"
  | "create"
  | "list"
  | "analytics"
  | "team"
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
  topLinks: Array<{ id: string; short_code: string; title: string; clicks: number }>;
  trafficSources: Array<{ name: string; value: number }>;
  growthPercentage: number;
}
