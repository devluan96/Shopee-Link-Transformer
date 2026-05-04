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
  tiktok_clicks?: number;
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

export interface AccessLogEntry {
  id: string;
  user_id?: string | null;
  email?: string | null;
  ip_address?: string | null;
  method: string;
  path: string;
  status_code: number;
  user_agent?: string | null;
  referer?: string | null;
  blocked: boolean;
  block_reason?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface SecurityOverview {
  twoFactorEnabled: boolean;
  maskedSecret: string | null;
  lastVerifiedAt: string | null;
  recentAccessLogs: AccessLogEntry[];
}

export interface BlockedIpEntry {
  id: string;
  ip_address: string;
  reason?: string | null;
  blocked_by?: string | null;
  active: boolean;
  expires_at?: string | null;
  created_at: string;
  updated_at?: string | null;
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
  totalShopeeClicks?: number;
  totalTiktokClicks?: number;
  recentClicks: Array<{ date: string; clicks: number }>;
  topLinks: Array<{ short_code: string; title: string; clicks: number }>;
  growthPercentage: number;
}

export interface AnalyticsData {
  history: Array<{ date: string; clicks: number }>;
  topLinks: Array<{ id: string; short_code: string; title: string; clicks: number }>;
  trafficSources: Array<{ name: string; value: number }>;
  growthPercentage: number;
  totalShopeeClicks?: number;
  totalTiktokClicks?: number;
}
