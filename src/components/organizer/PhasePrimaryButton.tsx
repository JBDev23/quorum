import type { ReactNode } from "react";
import { TouchableOpacity, Text, ActivityIndicator, View } from "react-native";

type PhasePrimaryButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  hint?: string;
  tone?: "primary" | "danger";
};

export function PhasePrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  icon,
  hint,
  tone = "primary",
}: PhasePrimaryButtonProps) {
  const bg = tone === "danger" ? "bg-destructive" : "bg-secondary";
  const shadow =
    tone === "danger" ? "shadow-red-900/20" : "shadow-blue-900/20";

  return (
    <View className="mt-4">
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        className={`${bg} py-4 rounded-2xl flex-row justify-center items-center gap-2 shadow-xl ${shadow}`}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            {icon}
            <Text className="text-primary-foreground font-bold text-lg">{label}</Text>
          </>
        )}
      </TouchableOpacity>
      {hint ? (
        <Text className="text-muted-foreground text-xs text-center mt-4 px-4">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
