import { Tabs } from "expo-router";
import { Home, Users, User, Settings } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { useThemeColors } from "@/theme/useThemeColors";

export default function MainLayout() {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("main.layout.tab_home"),
          tabBarLabel: t("main.layout.tab_home"),
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: t("main.layout.tab_groups"),
          tabBarLabel: t("main.layout.tab_groups"),
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("main.layout.tab_profile"),
          tabBarLabel: t("main.layout.tab_profile"),
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("main.layout.tab_settings"),
          tabBarLabel: t("main.layout.tab_settings"),
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="groups/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile/receipts"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
