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
  slug?: string | null;
  original_url: string;
  custom_domain?: string | null;
  workspace_id?: string | null;
  folder_name?: string | null;
  tags?: string[] | null;
  secondary_url?: string | null;
  redirect_delay_ms?: number | null;
  custom_title?: string | null;
  custom_description?: string | null;
  custom_image_url?: string | null;
  video_url?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  shopee_affiliate_params?: string | null;
  tiktok_affiliate_params?: string | null;
  ab_test_enabled?: boolean | null;
  ab_variant_b_title?: string | null;
  ab_variant_b_description?: string | null;
  ab_variant_b_image_url?: string | null;
  ab_variant_b_video_url?: string | null;
  ab_variant_b_original_url?: string | null;
  ab_variant_b_secondary_url?: string | null;
}

export interface LinkMetaRecord {
  short_code: string;
  slug?: string | null;
  title: string;
}

export interface TrackedSourceSummary {
  label: string;
  count: number;
}

export interface LinkOutboundEvent {
  id?: string | number;
  link_id: string;
  short_code: string;
  stage: "primary" | "secondary";
  destination_url: string;
  user_agent?: string | null;
  ip_address?: string | null;
  source?: string | null;
  source_detail?: string | null;
  referer?: string | null;
  created_at?: string;
}
