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
import i18n from "@/lib/i18n";

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

  if (error) mapLoadError(error, i18n.t("services.votes.load_active_error"));
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

  if (error) mapLoadError(error, i18n.t("services.votes.load_has_voted_error"));
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

  if (error) mapLoadError(error, i18n.t("services.votes.load_accreditation_error"));
  return !!data;
}

export async function getMeetingSettings(meetingId: string) {
  const { data, error } = await supabase
    .from("meetings")
    .select("allow_blank_votes, groups(name)")
    .eq("id", meetingId)
    .single();

  if (error) {
    mapLoadError(error, i18n.t("services.votes.load_settings_error"));
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
    return i18n.t("services.votes.already_voted");
  }
  if (message.includes("ERR_NOT_ACCREDITED")) {
    return i18n.t("services.votes.not_accredited");
  }
  if (message.includes("ERR_POLL_CLOSED")) {
    return i18n.t("services.votes.poll_closed");
  }
  if (message.includes("ERR_MEETING_INACTIVE")) {
    return i18n.t("services.votes.meeting_inactive");
  }
  if (message.includes("ERR_BLANK_NOT_ALLOWED")) {
    return i18n.t("services.votes.blank_not_allowed");
  }
  if (message.includes("ERR_INVALID_OPTION")) {
    return i18n.t("services.votes.invalid_option");
  }
  if (message.includes("ERR_NOT_AUTHORIZED_DELEGATE")) {
    return i18n.t("services.votes.not_authorized_delegate");
  }
  if (message.includes("ERR_VOTE_DELEGATED")) {
    return i18n.t("services.votes.vote_delegated");
  }
  if (message.includes("ERR_NOT_AUTHENTICATED")) {
    return i18n.t("services.votes.session_expired");
  }
  if (message.includes("ERR_RECEIPT_REQUIRED") || message.includes("ERR_POLL_NOT_FOUND")) {
    return i18n.t("services.votes.vote_error");
  }
  return i18n.t("services.votes.vote_error");
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
        error.message === i18n.t("services.votes.already_voted") ||
        error.message === i18n.t("services.votes.not_accredited") ||
        error.message === i18n.t("services.votes.poll_closed") ||
        error.message === i18n.t("services.votes.meeting_inactive") ||
        error.message === i18n.t("services.votes.blank_not_allowed") ||
        error.message === i18n.t("services.votes.invalid_option") ||
        error.message === i18n.t("services.votes.not_authorized_delegate") ||
        error.message === i18n.t("services.delegations.delegate_required") ||
        error.message === i18n.t("services.votes.vote_delegated") ||
        error.message === i18n.t("services.votes.session_expired") ||
        error.message === i18n.t("services.votes.vote_error"))
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
                name: i18n.t("services.votes.my_vote"),
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
