import { supabase } from "@/lib/supabase";
import { decode } from "base64-arraybuffer";
import { getStoredReceipt } from "@/services/votes";
import i18n from "@/lib/i18n";

export type UserProfile = {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    is_premium: boolean;
};

export type UserStats = {
    groups: number;
    meetings: number;
    votes: number;
};

// 1. Obtener los datos del perfil
export async function getUserProfile(userId: string): Promise<UserProfile> {
    const { data, error } = await supabase
        .from("users")
        .select("first_name, last_name, avatar_url, is_premium")
        .eq("id", userId)
        .single();

    if (error) throw new Error(i18n.t("services.profile.load_profile_error"));
    return data;
}

// 2. Obtener las estadísticas del usuario (se ejecutan en paralelo)
export async function getUserStats(userId: string): Promise<UserStats> {
    const [
        { count: groupsCount, error: groupsError },
        { count: meetingsCount, error: meetingsError },
        { count: votesCount, error: votesError },
    ] = await Promise.all([
        supabase
            .from("group_members")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId),
        supabase
            .from("meeting_attendances")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId),
        supabase
            .from("poll_participations")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId),
    ]);

    if (groupsError || meetingsError || votesError) {
        throw new Error(i18n.t("services.profile.stats_error"));
    }

    return {
        groups: groupsCount || 0,
        meetings: meetingsCount || 0,
        votes: votesCount || 0,
    };
}

// 3. Actualizar el perfil
export async function updateUserProfile(
    userId: string,
    firstName: string,
    lastName: string
): Promise<void> {
    const { error } = await supabase
        .from("users")
        .update({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
        })
        .eq("id", userId);

    if (error) throw new Error(i18n.t("services.profile.update_profile_error"));
}

export type VoteReceipt = {
    poll_id: string;
    voted_at: string;
    poll_title: string;
    meeting_title: string;
    /** SHA-256 hash stored on this device after casting; null if lost (e.g. reinstall). */
    receipt_hash: string | null;
};

export type NotificationPrefs = {
    notify_new_meetings: boolean;
    notify_doors_open: boolean;
    notify_polls: boolean;
};

export async function getNotificationPrefs(
    userId: string
): Promise<NotificationPrefs> {
    const { data, error } = await supabase
        .from("users")
        .select("notify_new_meetings, notify_doors_open, notify_polls")
        .eq("id", userId)
        .single();

    if (error) throw new Error(i18n.t("services.profile.load_notifications_error"));

    return {
        notify_new_meetings: data.notify_new_meetings ?? true,
        notify_doors_open: data.notify_doors_open ?? true,
        notify_polls: data.notify_polls ?? true,
    };
}

export async function updateNotificationPrefs(
    userId: string,
    prefs: Partial<NotificationPrefs>
): Promise<void> {
    const { error } = await supabase
        .from("users")
        .update(prefs)
        .eq("id", userId);

    if (error) throw new Error(i18n.t("services.profile.update_notifications_error"));
}

export async function getVoteReceipts(userId: string): Promise<VoteReceipt[]> {
    const { data, error } = await supabase
        .from("poll_participations")
        .select(`
        poll_id,
        voted_at,
        polls (
          title,
          meetings (
            title
          )
        )
      `)
        .eq("user_id", userId)
        .order("voted_at", { ascending: false });

    if (error) throw new Error(i18n.t("services.profile.load_receipts_error"));

    return Promise.all(
        (data || []).map(async (item: any) => {
            const pollId = item.poll_id as string;
            const receipt_hash = await getStoredReceipt(pollId);
            return {
                poll_id: pollId,
                voted_at: item.voted_at as string,
                poll_title: item.polls?.title || i18n.t("services.profile.unknown_poll"),
                meeting_title: item.polls?.meetings?.title || i18n.t("services.profile.unknown_meeting"),
                receipt_hash,
            };
        })
    );
}

export async function uploadAvatar(
    userId: string,
    base64Image: string,
    extension: string = "jpg"
): Promise<string> {
    const filePath = `${userId}/avatar-${Date.now()}.${extension}`;

    // 1. Subimos la imagen a Storage (usamos decode para pasar de base64 a un buffer binario)
    const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, decode(base64Image), {
            contentType: `image/${extension === "png" ? "png" : "jpeg"}`,
            upsert: true,
        });

    if (uploadError) throw new Error(i18n.t("services.profile.upload_avatar_error"));

    // 2. Obtenemos la URL pública
    const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    // 3. Actualizamos la tabla users con la nueva URL
    const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);

    if (updateError) throw new Error(i18n.t("services.profile.update_avatar_error"));

    return publicUrl;
}