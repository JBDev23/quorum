import { Stack } from "expo-router";

import { useThemeColors } from "@/theme/useThemeColors";

export default function AuthLayout() {
  const colors = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="login" options={{ title: "Acceder", headerBackVisible: false }} />
    </Stack>
  );
}
