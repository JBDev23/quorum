import { useColorScheme } from "nativewind";

import { colorsFor, type ThemeColors } from "@/theme/colors";

export function useThemeColors(): ThemeColors {
  const { colorScheme } = useColorScheme();
  return colorsFor(colorScheme);
}
