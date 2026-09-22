import { supabase } from "@/lib/supabase";

export async function upsertPushToken(
  userId: string,
  expoPushToken: string,
  platform: "ios" | "android"
): Promise<void> {
  const { error } = await supabase.from("device_push_tokens").upsert(
    {
      user_id: userId,
      expo_push_token: expoPushToken,
      platform,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "expo_push_token" }
  );

  if (error) throw error;
}

export async function removePushToken(expoPushToken: string): Promise<void> {
  const { error } = await supabase
    .from("device_push_tokens")
    .delete()
    .eq("expo_push_token", expoPushToken);

  if (error) throw error;
}
