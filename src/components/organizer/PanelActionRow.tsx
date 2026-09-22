import type { ReactNode } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";

type PanelActionRowProps = {
  title: string;
  subtitle: string;
  icon: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export function PanelActionRow({
  title,
  subtitle,
  icon,
  onPress,
  disabled = false,
  loading = false,
}: PanelActionRowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || !onPress || loading}
      className="bg-card border border-border p-4 rounded-2xl flex-row items-center justify-between"
    >
      <View className="flex-row items-center gap-4 flex-1">
        <View className="bg-muted p-3 rounded-full">
          {loading ? <ActivityIndicator size="small" color="#a3a3a3" /> : icon}
        </View>
        <View className="flex-1 pr-2">
          <Text className="text-foreground font-bold text-lg">{title}</Text>
          <Text className="text-muted-foreground text-sm">{subtitle}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
