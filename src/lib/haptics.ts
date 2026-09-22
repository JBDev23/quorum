import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { PREFS_STORAGE_KEY } from "@/lib/preferences-storage";

let cachedHapticEnabled: boolean | null = null;

export function setHapticEnabledCache(enabled: boolean) {
  cachedHapticEnabled = enabled;
}

async function isHapticEnabled(): Promise<boolean> {
  if (cachedHapticEnabled !== null) return cachedHapticEnabled;
  try {
    const raw = await AsyncStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) {
      cachedHapticEnabled = true;
      return true;
    }
    const parsed = JSON.parse(raw) as { hapticEnabled?: boolean };
    cachedHapticEnabled = parsed.hapticEnabled !== false;
    return cachedHapticEnabled;
  } catch {
    return true;
  }
}

export async function selectionHaptic() {
  if (!(await isHapticEnabled())) return;
  await Haptics.selectionAsync();
}

export async function impactHaptic(
  style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium
) {
  if (!(await isHapticEnabled())) return;
  await Haptics.impactAsync(style);
}

export async function notificationHaptic(
  type: Haptics.NotificationFeedbackType
) {
  if (!(await isHapticEnabled())) return;
  await Haptics.notificationAsync(type);
}
