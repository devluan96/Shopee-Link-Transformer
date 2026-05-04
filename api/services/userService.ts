import { SupabaseClient } from "../config/supabase.js";

export const getUserProfile = async (supabase: SupabaseClient, userId: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const updateUserProfile = async (
  supabase: SupabaseClient,
  userId: string,
  data: {
    email?: string | null;
    full_name: string;
    avatar_url: string;
  },
) => {
  const existingProfile = await getUserProfile(supabase, userId);
  const resolvedEmail = data.email || existingProfile?.email;

  if (!resolvedEmail) {
    throw new Error("Thiếu email tài khoản để cập nhật hồ sơ");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      email: resolvedEmail,
      full_name: data.full_name,
      avatar_url: data.avatar_url,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" })
    .select()
    .single();

  if (error) throw error;
  return profile;
};

export const getAllUsers = async (supabase: SupabaseClient) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

export const approveUser = async (
  supabase: SupabaseClient,
  targetUid: string,
  isApproved: boolean,
) => {
  const { error } = await supabase
    .from("profiles")
    .update({ status: isApproved ? "approved" : "pending" })
    .eq("id", targetUid);

  if (error) throw error;
};

export const updateUserSubscription = async (
  supabase: SupabaseClient,
  targetUid: string,
  plan: "free" | "monthly" | "yearly",
  expiry: string | null,
) => {
  const { error } = await supabase
    .from("profiles")
    .update({
      subscription_plan: plan,
      subscription_expiry: expiry,
    })
    .eq("id", targetUid);

  if (error) throw error;
};

export const deleteUser = async (supabase: SupabaseClient, targetUid: string) => {
  // Delete associated links first
  await supabase.from("links").delete().eq("user_id", targetUid);

  // Delete profile
  const { error } = await supabase.from("profiles").delete().eq("id", targetUid);

  if (error) throw error;
};
