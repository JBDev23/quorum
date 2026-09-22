import * as Crypto from "expo-crypto";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  isNetworkError,
  NETWORK_LOAD_MESSAGE,
  NETWORK_VOTE_MESSAGE,
} from "@/lib/errors";
import { supabase } from "@/lib/supabase";
import type { Poll } from "./polls";
import { fetchDelegationsToMe, fetchMyDelegation } from "./delegations";

const receiptKey = (pollId: string) => `vote-receipt:${pollId}`;

export type AvailableVote = {
  id: string;
  name: string;
  hasVoted: boolean;
};

export type VotingContext = {
  poll: Poll | null;
  alreadyVoted: boolean;
  receipt: string | null;
  accredited: boolean;
  allowBlankVotes: boolean;
  groupName?: string;
  availableVotes?: AvailableVote[];
  /** Set when the user delegated their own vote away. */
  delegatedToName?: string | null;
};

/** Latest active poll for a meeting (at most one should be active). */
export async function getActivePoll(meetingId: string): Promise<Poll | null> {
  const { data, error } = await supabase
    .from("polls")
    .select("*, poll_options(*)")
    .eq("meeting_id", meetingId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) mapLoadError(error, "Error al buscar votaciones activas");
  return data as Poll | null;
}

export async function hasUserVoted(
  pollId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("poll_participations")
    .select("voted_at")
    .eq("poll_id", pollId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) mapLoadError(error, "No se pudo comprobar si ya has votado");
  return !!data;
}

export async function isUserAccredited(
  meetingId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("meeting_attendances")
    .select("user_id")
    .eq("meeting_id", meetingId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) mapLoadError(error, "No se pudo verificar la acreditación");
  return !!data;
}

export async function getMeetingSettings(meetingId: string) {
  const { data, error } = await supabase
    .from("meetings")
    .select("allow_blank_votes, groups(name)")
    .eq("id", meetingId)
    .single();

  if (error) {
    mapLoadError(error, "No se pudo cargar la configuración de la reunión");
  }
  return {
    allowBlankVotes: !!data.allow_blank_votes,
    groupName: Array.isArray(data.groups) 
      ? data.groups[0]?.name 
      : (data.groups as { name?: string })?.name,
  };
}

export async function getStoredReceipt(pollId: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(receiptKey(pollId));
  } catch {
    return null;
  }
}

async function storeReceipt(pollId: string, receipt: string): Promise<void> {
  try {
    await AsyncStorage.setItem(receiptKey(pollId), receipt);
  } catch {
    // Non-fatal: vote already counted; receipt may only show this session.
  }
}

async function createReceiptHash(): Promise<string> {
  const entropy = `${Crypto.randomUUID()}:${Date.now()}`;
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, entropy);
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return String(error ?? "");
}

function mapCastBallotError(error: unknown): string {
  if (isNetworkError(error)) {
    return NETWORK_VOTE_MESSAGE;
  }

  const message = errorMessage(error);

  if (message.includes("ERR_ALREADY_VOTED")) {
    return "Ya has votado en esta encuesta.";
  }
  if (message.includes("ERR_NOT_ACCREDITED")) {
    return "Debes estar acreditado para votar.";
  }
  if (message.includes("ERR_POLL_CLOSED")) {
    return "Esta votación ya no está abierta.";
  }
  if (message.includes("ERR_MEETING_INACTIVE")) {
    return "La reunión no está en fase activa.";
  }
  if (message.includes("ERR_BLANK_NOT_ALLOWED")) {
    return "Los votos en blanco no están permitidos en esta reunión.";
  }
  if (message.includes("ERR_INVALID_OPTION")) {
    return "La opción seleccionada no es válida.";
  }
  if (message.includes("ERR_NOT_AUTHORIZED_DELEGATE")) {
    return "No estás autorizado a votar en nombre de esa persona.";
  }
  if (message.includes("ERR_VOTE_DELEGATED")) {
    return "Has delegado tu voto. No puedes votar en esta urna.";
  }
  if (message.includes("ERR_NOT_AUTHENTICATED")) {
    return "Sesión expirada. Vuelve a iniciar sesión.";
  }
  if (message.includes("ERR_RECEIPT_REQUIRED") || message.includes("ERR_POLL_NOT_FOUND")) {
    return "No se pudo emitir el voto.";
  }
  return "No se pudo emitir el voto.";
}

function mapLoadError(error: unknown, fallback: string): never {
  if (isNetworkError(error)) {
    throw new Error(NETWORK_LOAD_MESSAGE);
  }
  if (error instanceof Error && error.message) {
    throw error;
  }
  throw new Error(fallback);
}

export type CastVoteInput = {
  pollId: string;
  optionId?: string | null;
  isBlank?: boolean;
  delegatorId?: string | null;
};

/** Cast an anonymous ballot via the SECURITY DEFINER RPC. */
export async function castVote({
  pollId,
  optionId = null,
  isBlank = false,
  delegatorId = null,
}: CastVoteInput): Promise<string> {
  const receiptHash = await createReceiptHash();

  try {
    const { data, error } = await supabase.rpc("cast_ballot", {
      p_poll_id: pollId,
      p_receipt_hash: receiptHash,
      p_option_id: isBlank ? undefined : (optionId ?? undefined),
      p_is_blank: isBlank,
      p_delegator_id: delegatorId ?? undefined,
    });

    if (error) {
      throw new Error(mapCastBallotError(error));
    }

    const receipt = (data as string) || receiptHash;
    await storeReceipt(pollId, receipt);
    return receipt;
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === NETWORK_VOTE_MESSAGE ||
        error.message.startsWith("Ya has") ||
        error.message.startsWith("Debes") ||
        error.message.startsWith("Esta") ||
        error.message.startsWith("La reunión") ||
        error.message.startsWith("Los votos") ||
        error.message.startsWith("La opción") ||
        error.message.startsWith("Selecciona") ||
        error.message.startsWith("Sesión") ||
        error.message.startsWith("Has delegado") ||
        error.message.startsWith("No estás autorizado") ||
        error.message === "No se pudo emitir el voto.")
    ) {
      throw error;
    }
    throw new Error(mapCastBallotError(error));
  }
}

/** Load everything the member voting screen needs in one pass. */
export async function loadVotingContext(
  meetingId: string,
  userId: string
): Promise<VotingContext> {
  const [poll, accredited, settings] = await Promise.all([
    getActivePoll(meetingId),
    isUserAccredited(meetingId, userId),
    getMeetingSettings(meetingId),
  ]);

  if (!poll) {
    return {
      poll: null,
      alreadyVoted: false,
      receipt: null,
      accredited,
      allowBlankVotes: settings.allowBlankVotes,
      groupName: settings.groupName,
    };
  }

  let availableVotes: AvailableVote[] | undefined = undefined;
  let delegatedToName: string | null = null;

  if (accredited) {
    const [myDelegation, incoming] = await Promise.all([
      fetchMyDelegation(meetingId),
      fetchDelegationsToMe(meetingId),
    ]);

    if (myDelegation) {
      delegatedToName = `${myDelegation.first_name}${
        myDelegation.last_name ? ` ${myDelegation.last_name}` : ""
      }`;
    }

    const needsMultiBallot = !!myDelegation || incoming.length > 0;

    if (needsMultiBallot) {
      const idsToCheck = [
        ...(myDelegation ? [] : [userId]),
        ...incoming.map((d) => d.id),
      ];

      const votedIds = new Set<string>();
      if (idsToCheck.length > 0) {
        const { data: participations } = await supabase
          .from("poll_participations")
          .select("user_id")
          .eq("poll_id", poll.id)
          .in("user_id", idsToCheck);
        for (const row of participations || []) {
          votedIds.add(row.user_id);
        }
      }

      availableVotes = [
        ...(myDelegation
          ? []
          : [
              {
                id: userId,
                name: "Mi voto",
                hasVoted: votedIds.has(userId),
              },
            ]),
        ...incoming.map((d) => ({
          id: d.id,
          name: d.first_name + (d.last_name ? ` ${d.last_name}` : ""),
          hasVoted: votedIds.has(d.id),
        })),
      ];
    }
  }

  const alreadyVoted = await hasUserVoted(poll.id, userId);
  const receipt = alreadyVoted ? await getStoredReceipt(poll.id) : null;

  return {
    poll,
    alreadyVoted,
    receipt,
    accredited,
    allowBlankVotes: settings.allowBlankVotes,
    groupName: settings.groupName,
    availableVotes,
    delegatedToName,
  };
}
