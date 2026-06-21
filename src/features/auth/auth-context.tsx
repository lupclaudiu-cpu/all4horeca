"use client";

import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { publishDataFlowDebug } from "@/lib/debug/data-flow-debug";
import type { UserProfile } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<UserProfile>;
  signUp: (
    fullName: string,
    email: string,
    password: string,
  ) => Promise<{ requiresEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    publishDataFlowDebug({
      provider: "AuthProvider",
      providerMounted: true,
      authStatus: "mounted",
      lastStep: "AuthProvider mounted",
    });
  }, []);

  const loadProfile = useCallback(async (userId: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, restaurant_id, created_at")
      .eq("id", userId)
      .single();
    if (profileError) throw new Error(profileError.message);
    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      role: data.role,
      restaurantId: data.restaurant_id,
      createdAt: data.created_at,
    } as UserProfile;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return null;
    const nextProfile = await loadProfile(session.user.id);
    setProfile(nextProfile);
    return nextProfile;
  }, [loadProfile, session]);

  useEffect(() => {
    publishDataFlowDebug({
      provider: "AuthProvider",
      providerMounted: true,
      loading,
      restaurantId: profile?.restaurantId ?? null,
      user: session?.user?.email ?? session?.user?.id ?? null,
      authStatus:
        loading ? "loading" : session?.user ? "authenticated" : "anonymous",
      error,
    });
  }, [error, loading, profile?.restaurantId, session?.user]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      const timer = window.setTimeout(() => {
        setLoading(false);
        setError("Supabase nu este configurat.");
      }, 0);
      return () => window.clearTimeout(timer);
    }

    let active = true;
    const loadingTimeout = window.setTimeout(() => {
      if (!active) return;
      console.warn("[ANTORIA data-flow] Supabase auth session timed out.");
      setLoading(false);
    }, 8000);

    void supabase.auth.getSession()
      .then(async ({ data }) => {
        if (!active) return;
        window.clearTimeout(loadingTimeout);
        setSession(data.session);
        if (data.session?.user) {
          try {
            setProfile(await loadProfile(data.session.user.id));
          } catch (reason) {
            setError(
              reason instanceof Error ? reason.message : "Profil indisponibil.",
            );
          }
        }
        setLoading(false);
      })
      .catch((reason) => {
        if (!active) return;
        window.clearTimeout(loadingTimeout);
        console.warn("[ANTORIA data-flow] Supabase auth session failed.", reason);
        setError(
          reason instanceof Error ?
             reason.message
            : "Sesiunea nu a putut fi citită.",
        );
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setError(null);
      if (!nextSession?.user) {
        setProfile(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      window.setTimeout(() => {
        void loadProfile(nextSession.user.id)
          .then(setProfile)
          .catch((reason) =>
            setError(
              reason instanceof Error ? reason.message : "Profil indisponibil.",
            ),
          )
          .finally(() => setLoading(false));
      }, 0);
    });

    return () => {
      active = false;
      window.clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Supabase nu este configurat.");
      setError(null);
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw new Error(signInError.message);
      const nextProfile = await loadProfile(data.user.id);
      if (!nextProfile) throw new Error("Profilul utilizatorului nu există.");
      setSession(data.session);
      setProfile(nextProfile);
      return nextProfile;
    },
    [loadProfile],
  );

  const signUp = useCallback(
    async (fullName: string, email: string, password: string) => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Supabase nu este configurat.");
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (signUpError) throw new Error(signUpError.message);
      return { requiresEmailConfirmation: !data.session };
    },
    [],
  );

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      session,
      profile,
      loading,
      error,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [
      session,
      profile,
      loading,
      error,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
