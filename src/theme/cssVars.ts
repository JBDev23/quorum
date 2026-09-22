import { vars } from "nativewind";

import type { ResolvedColorScheme } from "@/theme/colors";

/** RGB channel triples matching `src/global.css` (for Tailwind alpha support). */
export const cssVarChannels = {
  light: {
    "--color-background": "245 245 247",
    "--color-foreground": "10 35 72",
    "--color-card": "255 255 255",
    "--color-card-foreground": "10 35 72",
    "--color-muted": "229 229 234",
    "--color-muted-foreground": "110 110 115",
    "--color-border": "210 210 215",
    "--color-input": "210 210 215",
    "--color-primary": "11 61 145",
    "--color-primary-foreground": "255 255 255",
    "--color-secondary": "59 167 242",
    "--color-secondary-foreground": "10 35 72",
    "--color-tertiary": "127 231 214",
    "--color-tertiary-foreground": "10 35 72",
    "--color-destructive": "224 62 62",
    "--color-accent": "229 229 234",
    "--color-icon": "134 134 139",
    "--color-overlay": "0 0 0",
    "--color-success": "31 169 122",
    "--color-warning": "232 163 23",
  },
  dark: {
    "--color-background": "11 17 33",
    "--color-foreground": "241 245 249",
    "--color-card": "17 26 46",
    "--color-card-foreground": "241 245 249",
    "--color-muted": "26 38 61",
    "--color-muted-foreground": "130 149 179",
    "--color-border": "39 55 82",
    "--color-input": "26 38 61",
    "--color-primary": "94 161 247",
    "--color-primary-foreground": "11 17 33",
    "--color-secondary": "91 184 247",
    "--color-secondary-foreground": "11 17 33",
    "--color-tertiary": "127 231 214",
    "--color-tertiary-foreground": "11 17 33",
    "--color-destructive": "248 113 113",
    "--color-accent": "26 38 61",
    "--color-icon": "130 149 179",
    "--color-overlay": "0 0 0",
    "--color-success": "52 211 153",
    "--color-warning": "251 191 36",
  }
} as const;

export const themeCssVars = {
  light: vars(cssVarChannels.light),
  dark: vars(cssVarChannels.dark),
} as const;

export function cssVarsFor(scheme: ResolvedColorScheme | null | undefined) {
  return themeCssVars[scheme === "light" ? "light" : "dark"];
}
