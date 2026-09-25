import { supabase } from "@/lib/supabase";
import i18n from "@/lib/i18n";

type DeleteAccountResponse = {
  ok?: boolean;
  error?: string;
};

/** Deletes the authenticated user via the delete-account edge function. */
export async function deleteAccount(): Promise<void> {
  const { data, error } = await supabase.functions.invoke<DeleteAccountResponse>(
    "delete-account",
    { method: "POST", body: {} }
  );

  if (error) {
    throw new Error(error.message || i18n.t("services.account.delete_error"));
  }

  if (data?.error) {
    throw new Error(data.error);
  }
}
