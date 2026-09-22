import { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";

import { authRedirectTo, completeAuthFromUrl, useAuth } from "@/lib/auth";
import { goHomeAfterAuth } from "@/lib/navigation";
import { useThemeColors } from "@/theme/useThemeColors";

/**
 * Landing route for OAuth / magic-link deep links (`quorum://auth/callback`).
 * On Android the browser often dismisses and Expo Router opens this screen with ?code=.
 */
export default function AuthCallbackScreen() {
  const { session, isLoading } = useAuth();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ code?: string }>();
  const urlFromLinking = Linking.useURL();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const run = async () => {
      try {
        if (params.code) {
          const callbackUrl = `${authRedirectTo}?code=${encodeURIComponent(
            String(params.code)
          )}`;
          await completeAuthFromUrl(callbackUrl);
          return;
        }

        if (urlFromLinking) {
          await completeAuthFromUrl(urlFromLinking);
        }
      } catch (error) {
        console.error("Auth callback error:", error);
      }
    };

    void run();
  }, [params.code, urlFromLinking]);

  useEffect(() => {
    if (isLoading) return;

    const delay = session ? 50 : 1200;
    const timeout = setTimeout(() => {
      if (session) {
        goHomeAfterAuth();
      } else {
        router.replace("/login");
      }
    }, delay);

    return () => clearTimeout(timeout);
  }, [session, isLoading]);

  return (
    <View className="flex-1 bg-background items-center justify-center">
      <ActivityIndicator color={colors.foreground} />
    </View>
  );
}
