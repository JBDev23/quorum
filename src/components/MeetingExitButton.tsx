import { TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Home } from "lucide-react-native";

import { useThemeColors } from "@/theme/useThemeColors";

type MeetingExitButtonProps = {
  /** Optional override for contrast on colored headers. */
  iconColor?: string;
  className?: string;
};

export function MeetingExitButton({
  iconColor,
  className = "bg-primary/10",
}: MeetingExitButtonProps) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      onPress={() => router.replace("/(main)")}
      accessibilityRole="button"
      accessibilityLabel="Salir de la reunión"
      className={`w-8 h-8 rounded-full items-center justify-center ${className}`}
      hitSlop={8}
    >
      <Home color={iconColor ?? colors.primary} size={20} />
    </TouchableOpacity>
  );
}
