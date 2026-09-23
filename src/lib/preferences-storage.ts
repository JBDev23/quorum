export const PREFS_STORAGE_KEY = "app-preferences:v1";

export type ThemePreference = "dark" | "light" | "system";

export type DevicePreferences = {
  hapticEnabled: boolean;
  theme: ThemePreference;
  bioAuthEnabled: boolean;
};

export const DEFAULT_DEVICE_PREFERENCES: DevicePreferences = {
  hapticEnabled: true,
  theme: "light",
  bioAuthEnabled: false,
};
