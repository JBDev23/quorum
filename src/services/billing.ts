import { supabase } from "@/lib/supabase";
import i18n from "@/lib/i18n";

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
    throw new Error(error.message || i18n.t("services.billing.sync_error"));
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return Boolean(data?.is_premium);
}
