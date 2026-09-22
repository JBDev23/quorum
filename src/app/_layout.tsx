import "../global.css";

import { useEffect } from "react";
import { ActivityIndicator, View, Text, TouchableOpacity } from "react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Poppins_900Black,
} from "@expo-google-fonts/poppins";
import {
  WorkSans_400Regular,
  WorkSans_500Medium,
  WorkSans_600SemiBold,
} from "@expo-google-fonts/work-sans";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AlertTriangle } from "lucide-react-native";

import { AlertProvider } from "@/components/Alert";
import { AuthProvider, useAuth } from "@/lib/auth";
import { PreferencesProvider } from "@/lib/preferences";
import { configurePurchases } from "@/lib/purchases";
import { useThemeColors } from "@/theme/useThemeColors";

// Evita que el splash screen se oculte automáticamente
SplashScreen.preventAutoHideAsync();

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <View className="flex-1 bg-background items-center justify-center p-6">
      <View className="bg-destructive/10 p-4 rounded-full mb-6">
        <AlertTriangle size={48} color="#ef4444" />
      </View>
      <Text className="text-2xl font-bold text-foreground mb-3 text-center">
        ¡Vaya! Algo salió mal
      </Text>
      <Text className="text-muted-foreground text-center mb-8">
        Ha ocurrido un error inesperado. Por favor, intenta de nuevo o reinicia la aplicación.
      </Text>
      <TouchableOpacity
        className="bg-primary px-8 py-4 rounded-xl shadow-sm"
        onPress={retry}
        accessibilityRole="button"
        accessibilityLabel="Reintentar cargar la aplicación"
      >
        <Text className="text-primary-foreground font-bold text-lg">Reintentar</Text>
      </TouchableOpacity>
    </View>
  );
}

function RootNavigator() {
  const { session, isLoading } = useAuth();
  const colors = useThemeColors();

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color={colors.foreground} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(main)" options={{ headerShown: false }} />
        <Stack.Screen name="meeting" options={{ headerShown: false }} />
        <Stack.Screen
          name="premium"
          options={{
            headerShown: false,
            presentation: "transparentModal",
            animation: "slide_from_bottom",
          }}
        />
      </Stack.Protected>

      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>

      {/* Always available for OAuth / magic-link deep links */}
      <Stack.Screen
        name="auth/callback"
        options={{ headerShown: false, animation: "none" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    WorkSans_400Regular,
    WorkSans_500Medium,
    WorkSans_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Poppins_900Black,
  });

  useEffect(() => {
    configurePurchases();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <PreferencesProvider>
            <AlertProvider>
              <RootNavigator />
            </AlertProvider>
          </PreferencesProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
