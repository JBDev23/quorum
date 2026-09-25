import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { AppState, View, type AppStateStatus } from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { alert } from "@/components/Alert";
import { MeetingExitButton } from "@/components/MeetingExitButton";
import { useAuth } from "@/lib/auth";
import { usePreferences } from "@/lib/preferences";
import { authenticateForVote } from "@/lib/biometrics";
import {
  isNetworkError,
  NETWORK_VOTE_MESSAGE,
  toNetworkAwareMessage,
} from "@/lib/errors";
import { notificationHaptic } from "@/lib/haptics";
import { loadVotingContext, castVote, type VotingContext } from "@/services/votes";
import { supabase } from "@/lib/supabase";
import type { MeetingStatus } from "@/types/meeting";
import {
  VotingLoadingState,
  VotingErrorState,
  VotingWaitingState,
  VotingSuccessState,
  VotingDelegatedAwayState,
} from "@/components/voting/VotingStatusViews";
import { MeetingClosedResults } from "@/components/voting/MeetingClosedResults";
import { ActiveUrn } from "@/components/voting/ActiveUrn";
import { AvailableVotesList } from "@/components/voting/AvailableVotesList";

type VotingScreenProps = {
  meetingId: string;
  status: MeetingStatus;
  /** Hides member-only CTAs (e.g. show QR) when used from the organizer panel. */
  isOrganizer?: boolean;
  startDate?: string | null;
};

function withMeetingExit(children: ReactNode) {
  return (
    <View className="flex-1">
      <SafeAreaView
        edges={["top"]}
        pointerEvents="box-none"
        className="absolute top-0 left-0 z-20 px-4 pt-2"
      >
        <MeetingExitButton />
      </SafeAreaView>
      {children}
    </View>
  );
}

export function VotingScreen({
  meetingId,
  status,
  isOrganizer = false,
  startDate = null,
}: VotingScreenProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { bioAuthEnabled } = usePreferences();

  const [ctx, setCtx] = useState<VotingContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [votingFor, setVotingFor] = useState<{ id: string; name: string; isMyVote: boolean } | null>(null);

  const loadPollData = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoadError(null);
      const data = await loadVotingContext(meetingId, user.id);
      setCtx(data);
    } catch (error) {
      console.error(error);
      setLoadError(
        toNetworkAwareMessage(error, t("voting.screen.error_load"))
      );
    } finally {
      setLoading(false);
    }
  }, [meetingId, user?.id]);

  const loadPollDataRef = useRef(loadPollData);
  useEffect(() => {
    loadPollDataRef.current = loadPollData;
  }, [loadPollData]);

  useEffect(() => {
    if (!user?.id) return;
    void loadPollDataRef.current();

    const channel = supabase
      .channel(`meeting-${meetingId}-voting`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "polls",
          filter: `meeting_id=eq.${meetingId}`,
        },
        () => {
          void loadPollDataRef.current();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meeting_attendances",
          filter: `meeting_id=eq.${meetingId}`,
        },
        () => {
          void loadPollDataRef.current();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meeting_delegations",
          filter: `meeting_id=eq.${meetingId}`,
        },
        () => {
          void loadPollDataRef.current();
        }
      )
      .subscribe((channelStatus) => {
        if (channelStatus === "SUBSCRIBED") void loadPollDataRef.current();
      });

    const onAppState = (next: AppStateStatus) => {
      if (next === "active") void loadPollDataRef.current();
    };
    const appSub = AppState.addEventListener("change", onAppState);

    return () => {
      appSub.remove();
      void supabase.removeChannel(channel);
    };
  }, [meetingId, user?.id]);

  const handleVote = async (optionId: string, isBlank: boolean) => {
    if (!ctx?.poll || !user?.id) return;

    if (bioAuthEnabled) {
      const ok = await authenticateForVote();
      if (!ok) {
        throw new Error("BIO_CANCELLED");
      }
    }

    try {
      const isDelegation = votingFor && !votingFor.isMyVote;
      const hash = await castVote({
        pollId: ctx.poll.id,
        optionId: isBlank ? null : optionId,
        isBlank,
        delegatorId: isDelegation ? votingFor.id : null,
      });

      void notificationHaptic(Haptics.NotificationFeedbackType.Success);
      setCtx((prev) => {
        if (!prev) return prev;
        if (prev.availableVotes) {
          const updatedVotes = prev.availableVotes.map((v) =>
            v.id === (votingFor?.id || user.id) ? { ...v, hasVoted: true } : v
          );
          return { ...prev, availableVotes: updatedVotes, receipt: hash };
        }
        return { ...prev, alreadyVoted: true, receipt: hash };
      });
      setVotingFor(null);
    } catch (error) {
      if (error instanceof Error && error.message === "BIO_CANCELLED") {
        throw error;
      }
      void notificationHaptic(Haptics.NotificationFeedbackType.Error);

      const network = isNetworkError(error);
      const message = network
        ? t("common.no_connection")
        : error instanceof Error
          ? error.message
          : t("voting.screen.error_cast");

      alert(network ? t("common.no_connection") : t("common.error"), message, [
        { text: t("common.understood"), style: "cancel" },
        ...(network
          ? [
            {
              text: t("common.retry"),
              onPress: () => {
                void handleVote(optionId, isBlank).catch(() => {
                  // ActiveUrn resets submitting on reject; alert already shown.
                });
              },
            },
          ]
          : []),
      ]);

      await loadPollData();
      throw error;
    }
  };

  if (loading) return withMeetingExit(<VotingLoadingState />);

  if (loadError) {
    return withMeetingExit(
      <VotingErrorState error={loadError} onRetry={loadPollData} />
    );
  }

  if (status === "closed") {
    // MeetingClosedResults already includes the exit control.
    return <MeetingClosedResults meetingId={meetingId} status={status} />;
  }

  if (status !== "active" || !ctx?.accredited || !ctx?.poll) {
    return withMeetingExit(
      <VotingWaitingState
        status={status}
        accredited={ctx?.accredited || false}
        hasPoll={!!ctx?.poll}
        meetingId={meetingId}
        isOrganizer={isOrganizer}
        startDate={startDate}
      />
    );
  }

  const isDelegationsFlow = !!(ctx.availableVotes && ctx.availableVotes.length > 0);

  // Delegated own vote and nothing to cast on behalf of others.
  if (ctx.delegatedToName && !isDelegationsFlow) {
    return withMeetingExit(
      <VotingDelegatedAwayState
        delegateName={ctx.delegatedToName}
        pollTitle={ctx.poll.title}
      />
    );
  }

  const allVoted = isDelegationsFlow
    ? ctx.availableVotes!.every((v) => v.hasVoted)
    : ctx.alreadyVoted;

  if (allVoted && !votingFor) {
    return withMeetingExit(
      <VotingSuccessState receipt={ctx.receipt} pollTitle={ctx.poll.title} />
    );
  }

  if (isDelegationsFlow && !votingFor) {
    return withMeetingExit(
      <AvailableVotesList
        votes={ctx.availableVotes!}
        onSelect={(id, isMyVote, name) => setVotingFor({ id, isMyVote, name })}
      />
    );
  }

  return withMeetingExit(
    <ActiveUrn
      poll={ctx.poll}
      allowBlankVotes={ctx.allowBlankVotes}
      groupName={ctx.groupName}
      onVote={handleVote}
      votingForName={votingFor ? votingFor.name : undefined}
    />
  );
}
