import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

/** Coarse auth status the whole app can branch on. */
export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  /** Convenience accessors for the two most-used fields. */
  userId: string | null;
  email: string | null;
  /** True while the initial session lookup is in flight. */
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Whether the Supabase client is configured at all (env present). */
  isConfigured: boolean;
  /** Real Supabase sign-out. Safe to call even when already signed out. */
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Provides Supabase auth state to the app.
 *
 * A single `onAuthStateChange` listener is registered for the lifetime of the
 * provider and cleaned up on unmount, so there is never a listener-per-render
 * leak. The initial session is read once on mount; after that, every change
 * (sign-in, sign-out, token refresh, recovery) flows through the one listener.
 *
 * When Supabase is not configured, the provider resolves immediately to
 * "unauthenticated" so the UI can render a configuration error rather than
 * hanging on a client that will never exist.
 */
export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>(
    isSupabaseConfigured ? "loading" : "unauthenticated"
  );

  useEffect(() => {
    if (!supabase) {
      // No client: nothing to listen to. Already "unauthenticated" above.
      return;
    }

    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        setStatus(data.session ? "authenticated" : "unauthenticated");
      })
      .catch(() => {
        if (!active) return;
        setSession(null);
        setStatus("unauthenticated");
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setStatus(nextSession ? "authenticated" : "unauthenticated");
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user ?? null;
    return {
      status,
      session,
      user,
      userId: user?.id ?? null,
      email: user?.email ?? null,
      isLoading: status === "loading",
      isAuthenticated: status === "authenticated",
      isConfigured: isSupabaseConfigured,
      signOut: async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
        // State is updated by the onAuthStateChange listener above; no manual
        // "logged out" flag is kept anywhere.
      },
    };
  }, [status, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Access the current auth state. Must be used within an <AuthProvider>. */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>.");
  }
  return ctx;
}
