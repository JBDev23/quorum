import { supabase } from "@/lib/supabase";
import type { DelegateCandidate } from "@/services/groups";

function mapUserRow(user: any): DelegateCandidate | null {
  if (!user?.id) return null;
  return {
    id: user.id,
    first_name: user.first_name || "Desconocido",
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
  if (!user) throw new Error("No autenticado.");

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

  if (error) throw new Error("No se pudo cargar tu delegación.");

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
  if (!user) throw new Error("No autenticado.");

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

  if (error) throw new Error("No se pudieron cargar las delegaciones recibidas.");

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
    return "Los organizadores no pueden delegar su voto.";
  }
  if (msg.includes("ERR_ALREADY_DELEGATED")) {
    return "Ya tienes una delegación. Revócala antes de crear otra.";
  }
  if (msg.includes("ERR_REVOKE_LOCKED")) {
    return "No se puede revocar la delegación mientras la reunión está en curso.";
  }
  if (msg.includes("ERR_DELEGATIONS_DISABLED")) {
    return "Las delegaciones no están activadas en esta reunión.";
  }
  if (msg.includes("ERR_MEETING_CLOSED")) {
    return "La reunión está cerrada.";
  }
  if (msg.includes("ERR_SELF_DELEGATION")) {
    return "No puedes delegar en ti mismo.";
  }
  if (msg.includes("ERR_DELEGATE_NOT_MEMBER") || msg.includes("ERR_NOT_MEMBER")) {
    return "El delegado no es miembro de este grupo.";
  }
  if (msg.includes("ERR_NOT_AUTHENTICATED")) {
    return "Sesión expirada. Vuelve a iniciar sesión.";
  }
  if (msg.includes("ERR_NOT_FOUND")) {
    return "Reunión no encontrada.";
  }
  if (msg.includes("ERR_DELEGATE_REQUIRED")) {
    return "Selecciona a quién delegar.";
  }
  return "No se pudo completar la operación.";
}
