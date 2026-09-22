import { supabase } from "@/lib/supabase";

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
    throw new Error(error.message || "No se pudo eliminar la cuenta.");
  }

  if (data?.error) {
    throw new Error(data.error);
  }
}
