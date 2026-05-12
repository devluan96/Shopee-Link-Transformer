export interface ConvertedLink {
  id?: string;
  short_code: string;
  slug?: string;
  original_url: string;
  converted_url?: string;
  custom_domain?: string;
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
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  shopee_affiliate_params?: string;
  tiktok_affiliate_params?: string;
  ab_test_enabled?: boolean;
  ab_variant_b_title?: string;
  ab_variant_b_description?: string;
  ab_variant_b_image_url?: string;
  ab_variant_b_video_url?: string;
  ab_variant_b_original_url?: string;
  ab_variant_b_secondary_url?: string;
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

export type LinkUpdatePayload = Omit<
  Partial<ConvertedLink>,
  "folder_name" | "expires_at"
> & {
  folder_name?: string | null;
  expires_at?: string | null;
};

export type WorkspaceRole = "owner" | "editor" | "viewer";
export type WorkspaceInvitationStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "cancelled";

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

export interface WorkspaceInvitation {
  id: string;
  workspace_id: string;
  workspace_name: string;
  workspace_description?: string | null;
  invited_user_id: string;
  invited_email: string;
  role: Exclude<WorkspaceRole, "owner">;
  status: WorkspaceInvitationStatus;
  invited_by: string;
  invited_by_name?: string | null;
  invited_by_email?: string | null;
  created_at: string;
  responded_at?: string | null;
}

export type AppNotificationType =
  | "workspace_invitation"
  | "workspace_invitation_response"
  | "workspace_membership_updated"
  | "workspace_membership_removed"
  | "link_click_threshold"
  | "link_expiring_soon"
  | "quota_warning"
  | "subscription_expiring";

export interface AppNotification {
  id: string;
  user_id: string;
  type: AppNotificationType;
  title: string;
  message: string;
  link_id?: string | null;
  workspace_id?: string | null;
  metadata?: Record<string, unknown> | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
  updated_at?: string | null;
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
  topLinks: Array<{ short_code: string; slug?: string; title: string; clicks: number }>;
  growthPercentage: number;
}

export interface AnalyticsData {
  history: Array<{ date: string; clicks: number }>;
  topLinks: Array<{ id: string; short_code: string; slug?: string; title: string; clicks: number }>;
  trafficSources: Array<{ name: string; value: number }>;
  growthPercentage: number;
  totalShopeeClicks?: number;
  totalTiktokClicks?: number;
}

export interface LinkQuota {
  plan: "free" | "monthly" | "yearly" | "admin";
  dailyLimit: number | null;
  usedToday: number;
  remainingToday: number | null;
  canCreate: boolean;
}

export interface UserLimits {
  plan: "free" | "monthly" | "yearly" | "admin";
  canUseAbTesting: boolean;
  dailyVideoUploads: number | null;
  videoUploadsUsedToday: number;
  videoUploadsRemainingToday: number | null;
  maxTeamWorkspaces: number | null;
  ownedTeamWorkspaces: number;
  teamWorkspacesRemaining: number | null;
  maxTeamMembersPerWorkspace: number | null;
}
