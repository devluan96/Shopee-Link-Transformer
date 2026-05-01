import { createClient } from "@supabase/supabase-js";

let _supabaseClient: any = null;

export const getSupabase = () => {
  if (!_supabaseClient) {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
      "";

    if (!url || !key) {
      console.error("❌ Supabase Env Missing");
      throw new Error(
        `Supabase configuration missing on server (${!url ? "URL " : ""}${!key ? "KEY" : ""})`,
      );
    }

    try {
      _supabaseClient = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch (err) {
      console.error("❌ Supabase Init Fail:", err);
      throw err;
    }
  }
  return _supabaseClient;
};

export type SupabaseClient = ReturnType<typeof getSupabase>;
