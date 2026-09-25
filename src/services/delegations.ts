import { supabase } from "@/lib/supabase";
import type { DelegateCandidate } from "@/services/groups";
import i18n from "@/lib/i18n";

function mapUserRow(user: any): DelegateCandidate | null {
  if (!user?.id) return null;
  return {
    id: user.id,
    first_name: user.first_name || i18n.t("services.groups.unknown_user"),
    last_name: user.last_name || "",
    avatar_url: user.avatar_url || null,
  };
}

export async function fetchMyDelegation(
  meetingId: string
): Promise<DelegateCandidate | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error(i18n.t("services.delegations.unauthenticated"));

  const { data, error } = await supabase
    .from("meeting_delegations")
    .select(
      `
      delegate_id,
      users:delegate_id (
        id,
        first_name,
        last_name,
        avatar_url
      )
    `
    )
    .eq("meeting_id", meetingId)
    .eq("delegator_id", user.id)
    .maybeSingle();

  if (error) throw new Error(i18n.t("services.delegations.load_my_delegation_error"));

  if (!data) return null;

  const userRow = Array.isArray((data as any).users)
    ? (data as any).users[0]
    : (data as any).users;
  return mapUserRow(userRow);
}

export async function fetchDelegationsToMe(
  meetingId: string
): Promise<DelegateCandidate[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error(i18n.t("services.delegations.unauthenticated"));

  const { data, error } = await supabase
    .from("meeting_delegations")
    .select(
      `
      delegator_id,
      users:delegator_id (
        id,
        first_name,
        last_name,
        avatar_url
      )
    `
    )
    .eq("meeting_id", meetingId)
    .eq("delegate_id", user.id);

  if (error) throw new Error(i18n.t("services.delegations.load_received_error"));

  const candidates: DelegateCandidate[] = (data || [])
    .map((row: any) => {
      const userRow = Array.isArray(row.users) ? row.users[0] : row.users;
      return mapUserRow(userRow);
    })
    .filter((c): c is DelegateCandidate => c !== null)
    .sort((a, b) => a.first_name.localeCompare(b.first_name));

  return candidates;
}

export async function createDelegation(
  meetingId: string,
  delegateId: string
): Promise<void> {
  const { error } = await supabase.rpc("create_meeting_delegation", {
    p_meeting_id: meetingId,
    p_delegate_id: delegateId,
  });

  if (error) {
    throw new Error(mapDelegationError(error.message));
  }
}

export async function revokeDelegation(meetingId: string): Promise<void> {
  const { error } = await supabase.rpc("revoke_meeting_delegation", {
    p_meeting_id: meetingId,
  });

  if (error) {
    throw new Error(mapDelegationError(error.message));
  }
}

function mapDelegationError(message: string | undefined): string {
  const msg = message || "";
  if (msg.includes("ERR_ORGANIZER_CANNOT_DELEGATE")) {
    return i18n.t("services.delegations.organizer_cannot_delegate");
  }
  if (msg.includes("ERR_ALREADY_DELEGATED")) {
    return i18n.t("services.delegations.already_delegated");
  }
  if (msg.includes("ERR_REVOKE_LOCKED")) {
    return i18n.t("services.delegations.revoke_locked");
  }
  if (msg.includes("ERR_DELEGATIONS_DISABLED")) {
    return i18n.t("services.delegations.delegations_disabled");
  }
  if (msg.includes("ERR_MEETING_CLOSED")) {
    return i18n.t("services.delegations.meeting_closed");
  }
  if (msg.includes("ERR_SELF_DELEGATION")) {
    return i18n.t("services.delegations.self_delegation");
  }
  if (msg.includes("ERR_DELEGATE_NOT_MEMBER") || msg.includes("ERR_NOT_MEMBER")) {
    return i18n.t("services.delegations.not_member");
  }
  if (msg.includes("ERR_NOT_AUTHENTICATED")) {
    return i18n.t("services.delegations.session_expired");
  }
  if (msg.includes("ERR_NOT_FOUND")) {
    return i18n.t("services.delegations.not_found");
  }
  if (msg.includes("ERR_DELEGATE_REQUIRED")) {
    return i18n.t("services.delegations.delegate_required");
  }
  return i18n.t("services.delegations.operation_error");
}
