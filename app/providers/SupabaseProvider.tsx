import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { Profile } from "../../lib/types";

type AuthContext = {
  session: Session | null;
  loading: boolean;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  googleLogin: () => Promise<void>;
  emailLogin: (email: string, password: string) => Promise<{ error?: string }>;
  emailSignup: (email: string, password: string, displayName: string) => Promise<{ error?: string }>;
  microsoftLogin: () => Promise<void>;
  linkedinLogin: () => Promise<void>;
  phoneOtp: (phone: string) => Promise<{ error?: string }>;
  verifyOtp: (phone: string, token: string) => Promise<{ error?: string }>;
};

const AuthContext = createContext<AuthContext | undefined>(undefined);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  async function refreshProfile() {
    if (!isSupabaseConfigured || !session?.user) return;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      setProfile(data);
    } catch (e) {
      console.warn("refreshProfile error:", e);
    }
  }

  async function ensureProfile(displayName?: string | null) {
    if (!isSupabaseConfigured) return;
    const user = session?.user;
    if (!user) return;
    try {
      const { data: existing } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (!existing) {
        await supabase.from("profiles").insert({
          id: user.id,
          display_name: displayName || user.user_metadata?.full_name || user.email?.split("@")[0] || null,
          avatar_url: user.user_metadata?.avatar_url || null,
        });
      }
      await refreshProfile();
    } catch (e) {
      console.warn("ensureProfile error:", e);
    }
  }

  async function googleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) console.warn("Google login error:", error.message);
  }

  async function emailLogin(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  }

  async function emailSignup(email: string, password: string, displayName: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (data.user) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        display_name: displayName,
      });
    }
    return {};
  }

  async function microsoftLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: { scopes: "openid profile email" },
    });
    if (error) console.warn("Microsoft login error:", error.message);
  }

  async function linkedinLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "linkedin",
      options: { scopes: "openid profile email" },
    });
    if (error) console.warn("LinkedIn login error:", error.message);
  }

  async function phoneOtp(phone: string) {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) return { error: error.message };
    return {};
  }

  async function verifyOtp(phone: string, token: string) {
    const { error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
    if (error) return { error: error.message };
    return {};
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        if (mounted) setSession(s);
      } catch (e) {
        console.warn("getSession error:", e);
      }
    })();

    const { data } = supabase.auth.onAuthStateChange(
      (_event: any, s: any) => {
        if (mounted) setSession(s);
      }
    );

    return () => {
      mounted = false;
      data?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session) {
      ensureProfile();
    } else {
      setProfile(null);
    }
    setLoading(false);
  }, [session]);

  return (
    <AuthContext.Provider
      value={{
        session, loading, profile, refreshProfile, signOut,
        googleLogin, emailLogin, emailSignup, microsoftLogin, linkedinLogin, phoneOtp, verifyOtp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within SupabaseProvider");
  return ctx;
}