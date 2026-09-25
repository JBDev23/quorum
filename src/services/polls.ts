import { supabase } from "@/lib/supabase";
import i18n from "@/lib/i18n";

export type PollType = "yes_no" | "multiple_choice";
export type PollStatus = "draft" | "active" | "closed";

export type PollOption = {
    id: string;
    poll_id: string;
    text: string;
};

export type Poll = {
    id: string;
    meeting_id: string;
    title: string;
    type: PollType;
    status: PollStatus;
    poll_options?: PollOption[];
};




export async function fetchPolls(meetingId: string): Promise<Poll[]> {
    const { data, error } = await supabase
        .from("polls")
        .select("*, poll_options(*)")
        .eq("meeting_id", meetingId)
        .order("created_at", { ascending: true });

    if (error) throw new Error(i18n.t("services.polls.load_polls_error"));
    return data as Poll[];
}

/** Closed polls for a meeting, newest first (member/organizer results). */
export async function fetchClosedPolls(meetingId: string): Promise<Poll[]> {
    const { data, error } = await supabase
        .from("polls")
        .select("*, poll_options(*)")
        .eq("meeting_id", meetingId)
        .eq("status", "closed")
        .order("created_at", { ascending: false });

    if (error) throw new Error(i18n.t("services.polls.load_results_error"));
    return data as Poll[];
}

export type CreatePollInput = {
    meetingId: string;
    title: string;
    type: PollType;
    /** Required for multiple_choice; ignored for yes_no. */
    options?: string[];
};

export async function createPoll({
    meetingId,
    title,
    type,
    options,
}: CreatePollInput): Promise<Poll> {
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 5) {
        throw new Error(i18n.t("services.polls.title_length_error"));
    }

    const optionTexts =
        type === "yes_no"
            ? [i18n.t("services.polls.yes"), i18n.t("services.polls.no")]
            : (options ?? [])
                .map((o) => o.trim())
                .filter(Boolean);

    if (type === "multiple_choice" && optionTexts.length < 2) {
        throw new Error(i18n.t("services.polls.min_options_error"));
    }

    const { data: pollData, error: pollError } = await supabase
        .from("polls")
        .insert({
            meeting_id: meetingId,
            title: trimmedTitle,
            type,
            status: "draft",
        })
        .select()
        .single();

    if (pollError || !pollData) {
        throw new Error(
            pollError?.message ?? i18n.t("services.polls.create_poll_error")
        );
    }

    const { data: optionsData, error: optionsError } = await supabase
        .from("poll_options")
        .insert(optionTexts.map((text) => ({ poll_id: pollData.id, text })))
        .select();

    if (optionsError) {
        await supabase.from("polls").delete().eq("id", pollData.id);
        throw new Error(i18n.t("services.polls.create_options_error"));
    }

    return { ...(pollData as Poll), poll_options: optionsData as PollOption[] };
}

export async function deletePoll(pollId: string): Promise<void> {
    const { error } = await supabase.from("polls").delete().eq("id", pollId);
    if (error) throw new Error(i18n.t("services.polls.delete_error"));
}

/** Activate or close a poll. Activating closes any other active poll in the meeting. */
export async function updatePollStatus(
    pollId: string,
    status: "draft" | "active" | "closed"
): Promise<void> {
    if (status === "active") {
        const { data: poll, error: fetchError } = await supabase
            .from("polls")
            .select("meeting_id")
            .eq("id", pollId)
            .single();

        if (fetchError || !poll) {
            throw new Error(i18n.t("services.polls.not_found"));
        }

        const { error: closeError } = await supabase
            .from("polls")
            .update({ status: "closed" })
            .eq("meeting_id", poll.meeting_id)
            .eq("status", "active")
            .neq("id", pollId);

        if (closeError) {
            throw new Error(i18n.t("services.polls.close_previous_error"));
        }
    }

    const { error } = await supabase
        .from("polls")
        .update({ status })
        .eq("id", pollId);

    if (error) throw new Error(i18n.t("services.polls.update_status_error", { status }));
}

export async function getPollRealtimeStats(pollId: string, meetingId: string) {
    const [
        { data: attendances, error: totalError },
        { data: delegations, error: delegationsError },
        { count: totalVotes, error: votesError },
    ] = await Promise.all([
        supabase
            .from("meeting_attendances")
            .select("user_id")
            .eq("meeting_id", meetingId),
        supabase
            .from("meeting_delegations")
            .select("delegator_id, delegate_id")
            .eq("meeting_id", meetingId),
        supabase
            .from("poll_participations")
            .select("*", { count: "exact", head: true })
            .eq("poll_id", pollId),
    ]);

    if (totalError || delegationsError || votesError) {
        throw new Error(i18n.t("services.polls.stats_error"));
    }

    const accreditedIds = new Set(
        (attendances || []).map((row) => row.user_id as string)
    );
    const delegatedAway = new Set(
        (delegations || []).map((row) => row.delegator_id as string)
    );

    // Expected ballots:
    // - each accredited member who has not delegated away
    // - plus each delegation held by an accredited delegate
    let selfVoters = 0;
    for (const userId of accreditedIds) {
        if (!delegatedAway.has(userId)) selfVoters += 1;
    }

    const proxyVotes = (delegations || []).filter((row) =>
        accreditedIds.has(row.delegate_id as string)
    ).length;

    return {
        total: selfVoters + proxyVotes,
        votes: totalVotes || 0,
    };
}

export async function getPollResults(pollId: string) {
  const { data, error } = await supabase
    .from("cast_votes")
    .select("option_id, is_blank")
    .eq("poll_id", pollId);

  if (error) throw new Error(i18n.t("services.polls.load_results_error"));

  const results: Record<string, number> = {};
  let blankVotes = 0;

  for (const vote of data ?? []) {
    if (vote.is_blank || !vote.option_id) {
      blankVotes += 1;
      continue;
    }
    results[vote.option_id] = (results[vote.option_id] || 0) + 1;
  }

  return {
    results,
    blankVotes,
    totalVotes: data?.length ?? 0,
  };
}