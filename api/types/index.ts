import { Request } from "express";

export type SubscriptionPlan = "free" | "monthly" | "yearly";
export type PaidSubscriptionPlan = Exclude<SubscriptionPlan, "free">;
export type WorkspaceRole = "owner" | "editor" | "viewer";

export interface AuthenticatedRequest extends Request {
  authUser?: {
    id: string;
    email?: string;
  };
  authProfile?: {
    id: string;
    email?: string;
    role?: string;
    status?: string;
    full_name?: string;
    avatar_url?: string;
    subscription_plan?: SubscriptionPlan;
    subscription_expiry?: string | null;
  } | null;
}

export interface PublicLinkRecord {
  id: string;
  short_code: string;
  original_url: string;
  workspace_id?: string | null;
  folder_name?: string | null;
  tags?: string[] | null;
  secondary_url?: string | null;
  redirect_delay_ms?: number | null;
  custom_title?: string | null;
  custom_description?: string | null;
  custom_image_url?: string | null;
  video_url?: string | null;
}

export interface LinkMetaRecord {
  short_code: string;
  title: string;
}

export interface TrackedSourceSummary {
  label: string;
  count: number;
}

export interface LinkOutboundEvent {
  id?: string;
  link_id: string;
  user_agent?: string | null;
  ip_address?: string | null;
  source?: string | null;
  source_detail?: string | null;
  referer?: string | null;
  created_at?: string;
}
