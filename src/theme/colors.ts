export type ResolvedColorScheme = "light" | "dark";

/**
 * Brand anchors:
 *   primary    #0B3D91
 *   secondary  #3BA7F2
 *   tertiary   #7FE7D6
 *   background #E8F6FF
 *
 * Neutrals and dark surfaces are derived from the primary hue (~217°)
 * so the whole UI stays in the same blue family.
 */
export const themeColors = {
  light: {
    background: "#F5F5F7",
    foreground: "#0A2348",
    card: "#FFFFFF",
    cardForeground: "#0A2348",
    muted: "#E5E5EA",
    mutedForeground: "#6E6E73",
    border: "#D2D2D7",
    input: "#D2D2D7",
    primary: "#0B3D91",
    primaryForeground: "#FFFFFF",
    secondary: "#3BA7F2",
    secondaryForeground: "#0A2348",
    tertiary: "#7FE7D6",
    tertiaryForeground: "#0A2348",
    destructive: "#E03E3E",
    icon: "#86868B",
    overlay: "#000000",
    success: "#1FA97A",
    warning: "#E8A317",
  },
  dark: {
    background: "#0B1121",
    foreground: "#F1F5F9",
    card: "#111A2E",
    cardForeground: "#F1F5F9",
    muted: "#1A263D",
    mutedForeground: "#8295B3",
    border: "#273752",
    input: "#1A263D",
    primary: "#5EA1F7",
    primaryForeground: "#0B1121",
    secondary: "#5BB8F7",
    secondaryForeground: "#0B1121",
    tertiary: "#7FE7D6",
    tertiaryForeground: "#0B1121",
    destructive: "#F87171",
    icon: "#8295B3",
    overlay: "#000000",
    success: "#34D399",
    warning: "#FBBF24",
  }
} as const;

export type ThemeColors = (typeof themeColors)[ResolvedColorScheme];

export function colorsFor(scheme: ResolvedColorScheme | null | undefined): ThemeColors {
  return themeColors[scheme === "light" ? "light" : "dark"];
}
