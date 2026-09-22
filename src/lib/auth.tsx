import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import type { Provider, Session, User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import {
  attachNotificationResponseListener,
  getLastRegisteredPushToken,
  registerForPushNotificationsAsync,
  unregisterPushTokenAsync,
} from "@/lib/notifications";
import {
  identifyPurchasesUser,
  resetPurchasesUser,
} from "@/lib/purchases";

/**
 * Deep-link target after OAuth / magic link.
 * Native: always use the app scheme so Expo Go / Metro host (localhost) never
 * becomes the redirect and Supabase falls back to Site URL.
 * Add `quorum://**` (or exact `quorum://auth/callback`) in Supabase → Auth → URL Configuration.
 */
export const authRedirectTo =
  Platform.OS === "web"
    ? Linking.createURL("auth/callback")
    : "quorum://auth/callback";

export type SocialProvider = Extract<Provider, "google" | "apple">;

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (
    email: string,
    password: string,
    meta?: { first_name?: string; last_name?: string }
  ) => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  /** @returns true if a session was established, false if the user cancelled */
  signInWithOAuth: (provider: SocialProvider) => Promise<boolean>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getParamsFromUrl(url: string): Record<string, string> {
  const parsed = Linking.parse(url);
  const params: Record<string, string> = {};

  if (parsed.queryParams) {
    for (const [key, value] of Object.entries(parsed.queryParams)) {
      if (typeof value === "string") params[key] = value;
    }
  }

  const hashIndex = url.indexOf("#");
  if (hashIndex >= 0) {
    const hash = url.slice(hashIndex + 1);
    for (const part of hash.split("&")) {
      const [key, ...rest] = part.split("=");
      if (!key) continue;
      params[decodeURIComponent(key)] = decodeURIComponent(rest.join("="));
    }
  }

  return params;
}

const handledAuthCodes = new Set<string>();

function isBenignOAuthError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();
  return (
    normalized.includes("invalid flow state") ||
    normalized.includes("no valid flow state") ||
    normalized.includes("access_denied") ||
    normalized.includes("user cancelled") ||
    normalized.includes("user canceled") ||
    normalized.includes("flow state not found")
  );
}

/** Complete PKCE / magic-link auth from a deep-link URL. Safe to call twice. */
export async function completeAuthFromUrl(url: string): Promise<Session | null> {
  const params = getParamsFromUrl(url);

  if (params.error || params.error_code) {
    const description = params.error_description ?? params.error ?? params.error_code;
    if (
      params.error === "access_denied" ||
      params.error_code === "access_denied" ||
      description.toLowerCase().includes("access_denied")
    ) {
      return null;
    }
    throw new Error(description);
  }

  if (params.code) {
    if (handledAuthCodes.has(params.code)) {
      const { data } = await supabase.auth.getSession();
      return data.session;
    }
    handledAuthCodes.add(params.code);

    const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) {
      if (isBenignOAuthError(error)) {
        const { data: existing } = await supabase.auth.getSession();
        return existing.session;
      }
      handledAuthCodes.delete(params.code);
      throw error;
    }
    return data.session;
  }

  const access_token = params.access_token;
  const refresh_token = params.refresh_token;
  if (!access_token || !refresh_token) return null;

  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (error) throw error;
  return data.session;
}

async function waitForSession(timeoutMs = 2500): Promise<Session | null> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const { data } = await supabase.auth.getSession();
    if (data.session) return data.session;
    await new Promise((r) => setTimeout(r, 200));
  }
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Load native WebBrowser only when needed so email/password still works
 * on older binaries that do not include ExpoWebBrowser yet.
 */
function loadWebBrowser(): typeof import("expo-web-browser") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("expo-web-browser");
  } catch {
    throw new Error(
      "Falta el módulo nativo ExpoWebBrowser. Haz un nuevo build (expo run:android / EAS) e inténtalo de nuevo."
    );
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pushTokenRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);

      if (nextSession?.user?.id) {
        void identifyPurchasesUser(nextSession.user.id);
        if (Platform.OS !== "web") {
          void registerForPushNotificationsAsync(nextSession.user.id).then(
            (token) => {
              pushTokenRef.current = token;
            }
          );
        }
      } else {
        void resetPurchasesUser();
        const token = pushTokenRef.current;
        pushTokenRef.current = null;
        void unregisterPushTokenAsync(token);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") return;
    const subscription = attachNotificationResponseListener();
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    try {
      loadWebBrowser().maybeCompleteAuthSession();
    } catch {
      // Old native binary — OAuth unavailable until rebuild.
    }
  }, []);

  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url) return;
      try {
        await completeAuthFromUrl(url);
      } catch (error) {
        if (!isBenignOAuthError(error)) {
          console.error("Auth deep link error:", error);
        }
      }
    };

    void Linking.getInitialURL().then(handleUrl);

    const subscription = Linking.addEventListener("url", ({ url }) => {
      void handleUrl(url);
    });

    return () => subscription.remove();
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUpWithPassword = useCallback(
    async (
      email: string,
      password: string,
      meta?: { first_name?: string; last_name?: string }
    ) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: authRedirectTo,
          data: meta,
        },
      });
      if (error) throw error;
    },
    []
  );

  const signInWithMagicLink = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: authRedirectTo,
      },
    });
    if (error) throw error;
  }, []);

  const signInWithOAuth = useCallback(async (provider: SocialProvider) => {
    const WebBrowser = loadWebBrowser();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: authRedirectTo,
        skipBrowserRedirect: true,
        queryParams:
          provider === "google"
            ? {
                access_type: "offline",
                prompt: "select_account",
              }
            : undefined,
      },
    });
    if (error) throw error;
    if (!data.url) throw new Error("No OAuth URL returned by Supabase");

    const result = await WebBrowser.openAuthSessionAsync(data.url, authRedirectTo);

    if (result.type === "success" && "url" in result && result.url) {
      try {
        const nextSession = await completeAuthFromUrl(result.url);
        if (nextSession) return true;
      } catch (err) {
        if (!isBenignOAuthError(err)) throw err;
      }
    }

    // Android often returns dismiss after deep-linking back into the app.
    // The Linking listener /auth/callback may still complete PKCE — wait for it.
    const recovered = await waitForSession(3000);
    return Boolean(recovered);
  }, []);

  const signOut = useCallback(async () => {
    const token =
      pushTokenRef.current ?? (await getLastRegisteredPushToken());
    pushTokenRef.current = null;
    await unregisterPushTokenAsync(token);
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      signInWithPassword,
      signUpWithPassword,
      signInWithMagicLink,
      signInWithOAuth,
      signOut,
    }),
    [
      session,
      isLoading,
      signInWithPassword,
      signUpWithPassword,
      signInWithMagicLink,
      signInWithOAuth,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export const socialProviders: {
  id: SocialProvider;
  label: string;
  /** Hide on platforms where the button is usually not shown (optional UX). */
  platforms?: Array<typeof Platform.OS>;
}[] = [
  { id: "google", label: "Continuar con Google" },
  { id: "apple", label: "Continuar con Apple", platforms: ["ios", "macos"] },
];
