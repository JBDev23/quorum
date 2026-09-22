import { Platform } from "react-native";
import Purchases, { LOG_LEVEL } from "react-native-purchases";

let configured = false;
let identifiedUserId: string | null = null;
let identifyInFlight: Promise<void> | null = null;

function resolveApiKey(): string | undefined {
  const shared = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
  if (Platform.OS === "ios") {
    return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? shared;
  }
  if (Platform.OS === "android") {
    return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? shared;
  }
  return shared;
}

/** Inicializa RevenueCat una sola vez. */
export function configurePurchases() {
  if (configured) return;

  const apiKey = resolveApiKey();
  if (!apiKey) {
    console.warn(
      "RevenueCat: falta EXPO_PUBLIC_REVENUECAT_API_KEY (o la key por plataforma).",
    );
    return;
  }

  // WARN: solo avisos/errores (p. ej. Test Store en prod). Sin flood de DEBUG.
  Purchases.setLogLevel(LOG_LEVEL.WARN);
  Purchases.configure({ apiKey });
  configured = true;
}

/** Vincula el App User ID de RevenueCat al UUID de Supabase. */
export async function identifyPurchasesUser(userId: string) {
  if (!configured) configurePurchases();
  if (!configured) return;
  if (identifiedUserId === userId) return;
  if (identifyInFlight) {
    await identifyInFlight;
    if (identifiedUserId === userId) return;
  }

  identifyInFlight = (async () => {
    try {
      await Purchases.logIn(userId);
      identifiedUserId = userId;
    } catch (error) {
      console.error("RevenueCat logIn error:", error);
    } finally {
      identifyInFlight = null;
    }
  })();

  await identifyInFlight;
}

/** Vuelve a un usuario anónimo al cerrar sesión. */
export async function resetPurchasesUser() {
  if (!configured) return;

  try {
    const isAnonymous = await Purchases.isAnonymous();
    if (!isAnonymous) {
      await Purchases.logOut();
    }
    identifiedUserId = null;
  } catch (error) {
    console.error("RevenueCat logOut error:", error);
  }
}
