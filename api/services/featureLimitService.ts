import { SupabaseClient } from "../config/supabase.js";
import { SubscriptionPlan } from "../types/index.js";

const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

export interface FeatureLimits {
  plan: SubscriptionPlan | "admin";
  canUseAbTesting: boolean;
  dailyVideoUploads: number | null;
  maxTeamWorkspaces: number | null;
  maxTeamMembersPerWorkspace: number | null;
}

export const PLAN_FEATURE_LIMITS: Record<SubscriptionPlan, FeatureLimits> = {
  free: {
    plan: "free",
    canUseAbTesting: false,
    dailyVideoUploads: 0,
    maxTeamWorkspaces: 0,
    maxTeamMembersPerWorkspace: 0,
  },
  monthly: {
    plan: "monthly",
    canUseAbTesting: false,
    dailyVideoUploads: 3,
    maxTeamWorkspaces: 1,
    maxTeamMembersPerWorkspace: 3,
  },
  yearly: {
    plan: "yearly",
    canUseAbTesting: true,
    dailyVideoUploads: 20,
    maxTeamWorkspaces: 5,
    maxTeamMembersPerWorkspace: 20,
  },
};

export const ADMIN_FEATURE_LIMITS: FeatureLimits = {
  plan: "admin",
  canUseAbTesting: true,
  dailyVideoUploads: null,
  maxTeamWorkspaces: null,
  maxTeamMembersPerWorkspace: null,
};

export const getFeatureLimitsForProfile = (profile?: {
  role?: string | null;
  subscription_plan?: SubscriptionPlan | null;
}) => {
  if (profile?.role === "admin") {
    return ADMIN_FEATURE_LIMITS;
  }

  const plan = profile?.subscription_plan || "free";
  return PLAN_FEATURE_LIMITS[plan];
};

const getVietnamDayRange = () => {
  const now = new Date();
  const vietnamNow = new Date(now.getTime() + VIETNAM_OFFSET_MS);
  const startUtcMs =
    Date.UTC(
      vietnamNow.getUTCFullYear(),
      vietnamNow.getUTCMonth(),
      vietnamNow.getUTCDate(),
      0,
      0,
      0,
      0,
    ) - VIETNAM_OFFSET_MS;

  return {
    startIso: new Date(startUtcMs).toISOString(),
    endIso: new Date(startUtcMs + 24 * 60 * 60 * 1000).toISOString(),
  };
};

export const getVideoUploadUsageToday = async (
  supabase: SupabaseClient,
  userId: string,
) => {
  const { startIso, endIso } = getVietnamDayRange();
  const { count, error } = await supabase
    .from("feature_usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("feature_key", "video_upload")
    .gte("created_at", startIso)
    .lt("created_at", endIso);

  if (error) throw error;
  return count || 0;
};

export const recordFeatureUsage = async (
  supabase: SupabaseClient,
  userId: string,
  featureKey: string,
  metadata?: Record<string, unknown>,
) => {
  const { error } = await supabase.from("feature_usage_events").insert({
    user_id: userId,
    feature_key: featureKey,
    metadata: metadata || {},
  });

  if (error) throw error;
};

export const getOwnedTeamWorkspaceCount = async (
  supabase: SupabaseClient,
  userId: string,
) => {
  const { count, error } = await supabase
    .from("workspaces")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId)
    .eq("is_personal", false);

  if (error) throw error;
  return count || 0;
};

export const getWorkspaceMemberCount = async (
  supabase: SupabaseClient,
  workspaceId: string,
) => {
  const { count, error } = await supabase
    .from("workspace_members")
    .select("user_id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);

  if (error) throw error;
  return count || 0;
};

export const getUserFeatureSnapshot = async (
  supabase: SupabaseClient,
  userId: string,
  profile?: { role?: string | null; subscription_plan?: SubscriptionPlan | null },
) => {
  const limits = getFeatureLimitsForProfile(profile);
  const [videoUploadsUsedToday, ownedTeamWorkspaces] = await Promise.all([
    limits.dailyVideoUploads === null
      ? Promise.resolve(0)
      : getVideoUploadUsageToday(supabase, userId),
    limits.maxTeamWorkspaces === null
      ? Promise.resolve(0)
      : getOwnedTeamWorkspaceCount(supabase, userId),
  ]);

  return {
    ...limits,
    videoUploadsUsedToday,
    videoUploadsRemainingToday:
      limits.dailyVideoUploads === null
        ? null
        : Math.max(0, limits.dailyVideoUploads - videoUploadsUsedToday),
    ownedTeamWorkspaces,
    teamWorkspacesRemaining:
      limits.maxTeamWorkspaces === null
        ? null
        : Math.max(0, limits.maxTeamWorkspaces - ownedTeamWorkspaces),
  };
};
