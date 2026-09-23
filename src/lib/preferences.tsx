import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { colorScheme, useColorScheme } from "nativewind";

import {
  DEFAULT_DEVICE_PREFERENCES,
  PREFS_STORAGE_KEY,
  type DevicePreferences,
  type ThemePreference,
} from "@/lib/preferences-storage";
import { setHapticEnabledCache } from "@/lib/haptics";
import { colorsFor } from "@/theme/colors";
import { cssVarsFor } from "@/theme/cssVars";

// Apply default before first paint so dark tokens match stored default.
colorScheme.set(DEFAULT_DEVICE_PREFERENCES.theme);

type PreferencesContextValue = DevicePreferences & {
  ready: boolean;
  setHapticEnabled: (enabled: boolean) => Promise<void>;
  setTheme: (theme: ThemePreference) => Promise<void>;
  setBioAuthEnabled: (enabled: boolean) => Promise<void>;
  clearDevicePreferences: () => Promise<void>;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function applyColorScheme(theme: ThemePreference) {
  colorScheme.set(theme);
  const resolved = theme === "system" ? colorScheme.get() : theme;
  void SystemUI.setBackgroundColorAsync(colorsFor(resolved).background);
}

function statusBarStyleFor(theme: ThemePreference): "light" | "dark" | "auto" {
  if (theme === "system") return "auto";
  return theme === "dark" ? "light" : "dark";
}

function ThemeRoot({
  theme,
  children,
}: {
  theme: ThemePreference;
  children: ReactNode;
}) {
  const { colorScheme: resolved } = useColorScheme();
  const colors = colorsFor(resolved);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  return (
    <View
      className="flex-1 bg-background"
      style={[cssVarsFor(resolved), { backgroundColor: colors.background }]}
    >
      <StatusBar style={statusBarStyleFor(theme)} />
      {children}
    </View>
  );
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<DevicePreferences>(DEFAULT_DEVICE_PREFERENCES);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PREFS_STORAGE_KEY);
        if (raw && !cancelled) {
          const parsed = JSON.parse(raw) as Partial<DevicePreferences>;
          const next: DevicePreferences = {
            hapticEnabled: parsed.hapticEnabled ?? true,
            theme: parsed.theme ?? "light",
            bioAuthEnabled: parsed.bioAuthEnabled ?? false,
          };
          setPrefs(next);
          setHapticEnabledCache(next.hapticEnabled);
          applyColorScheme(next.theme);
        } else {
          setHapticEnabledCache(DEFAULT_DEVICE_PREFERENCES.hapticEnabled);
          applyColorScheme(DEFAULT_DEVICE_PREFERENCES.theme);
        }
      } catch {
        setHapticEnabledCache(true);
        applyColorScheme(DEFAULT_DEVICE_PREFERENCES.theme);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (next: DevicePreferences) => {
    setPrefs(next);
    setHapticEnabledCache(next.hapticEnabled);
    applyColorScheme(next.theme);
    await AsyncStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(next));
  }, []);

  const setHapticEnabled = useCallback(
    async (enabled: boolean) => {
      await persist({ ...prefs, hapticEnabled: enabled });
    },
    [persist, prefs]
  );

  const setTheme = useCallback(
    async (theme: ThemePreference) => {
      await persist({ ...prefs, theme });
    },
    [persist, prefs]
  );

  const setBioAuthEnabled = useCallback(
    async (enabled: boolean) => {
      await persist({ ...prefs, bioAuthEnabled: enabled });
    },
    [persist, prefs]
  );

  const clearDevicePreferences = useCallback(async () => {
    await AsyncStorage.removeItem(PREFS_STORAGE_KEY);
    setPrefs(DEFAULT_DEVICE_PREFERENCES);
    setHapticEnabledCache(DEFAULT_DEVICE_PREFERENCES.hapticEnabled);
    applyColorScheme(DEFAULT_DEVICE_PREFERENCES.theme);
  }, []);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      ...prefs,
      ready,
      setHapticEnabled,
      setTheme,
      setBioAuthEnabled,
      clearDevicePreferences,
    }),
    [
      prefs,
      ready,
      setHapticEnabled,
      setTheme,
      setBioAuthEnabled,
      clearDevicePreferences,
    ]
  );

  return (
    <PreferencesContext.Provider value={value}>
      <ThemeRoot theme={prefs.theme}>{children}</ThemeRoot>
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return ctx;
}

export function themeLabel(theme: ThemePreference): string {
  switch (theme) {
    case "light":
      return "Modo Claro";
    case "system":
      return "Según el sistema";
    case "dark":
    default:
      return "Modo Oscuro";
  }
}
