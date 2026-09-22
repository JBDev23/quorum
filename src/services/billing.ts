import { supabase } from "@/lib/supabase";

type SyncPremiumResponse = {
  is_premium: boolean;
  error?: string;
};

/** Confirma el entitlement en RevenueCat (servidor) y actualiza users.is_premium. */
export async function syncPremiumStatus(): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke<SyncPremiumResponse>(
    "sync-premium",
    { method: "POST", body: {} },
  );

  if (error) {
    throw new Error(error.message || "No se pudo sincronizar el estado Premium.");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return Boolean(data?.is_premium);
}
