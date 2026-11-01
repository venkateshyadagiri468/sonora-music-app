import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra || {}) as Record<string, string>;
const supabaseUrl = extra.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = extra.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  (extra.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL) &&
  (extra.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)
);

if (!isSupabaseConfigured) {
  console.warn("Supabase credentials not configured. Running in offline/demo mode. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.");
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder-sonora.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      storage: undefined,
      autoRefreshToken: isSupabaseConfigured,
      persistSession: isSupabaseConfigured,
      detectSessionInUrl: false,
    },
  }
);