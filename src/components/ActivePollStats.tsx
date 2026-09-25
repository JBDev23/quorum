import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  AppState,
  type AppStateStatus,
} from "react-native";
import { Users } from "lucide-react-native";

import { supabase } from "@/lib/supabase";
import { getPollRealtimeStats } from "@/services/polls";
import { useThemeColors } from "@/theme/useThemeColors";
import { useTranslation } from "react-i18next";

interface ActivePollStatsProps {
  pollId: string;
  meetingId: string;
}

export function ActivePollStats({ pollId, meetingId }: ActivePollStatsProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [votes, setVotes] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const stats = await getPollRealtimeStats(pollId, meetingId);
      setVotes(stats.votes);
      setTotal(stats.total);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [pollId, meetingId]);

  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    void refreshRef.current();

    const channel = supabase
      .channel(`poll-stats-${pollId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "poll_participations",
          filter: `poll_id=eq.${pollId}`,
        },
        () => {
          void refreshRef.current();
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
          // Total = acreditados (± delegaciones); si alguien entra tarde, sube el denominador.
          void refreshRef.current();
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
          void refreshRef.current();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void refreshRef.current();
        }
      });

    const onAppState = (next: AppStateStatus) => {
      if (next === "active") void refreshRef.current();
    };
    const appSub = AppState.addEventListener("change", onAppState);

    return () => {
      appSub.remove();
      void supabase.removeChannel(channel);
    };
  }, [pollId, meetingId]);

  if (loading) {
    return (
      <ActivityIndicator size="small" color={colors.secondary} className="my-2" />
    );
  }

  const progressPercent = total > 0 ? Math.round((votes / total) * 100) : 0;

  return (
    <View className="bg-card p-4 rounded-2xl mb-4 mt-2 shadow-sm border border-border">
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center gap-2">
          <Users size={18} color="#6A7398" />
          <Text className="text-[#6A7398] font-medium text-sm">
            {t("voting.hardcoded.live_participation")}
          </Text>
        </View>
        <Text className="text-[#1C2035] font-extrabold text-sm">
          {votes} / {total} {t("voting.hardcoded.votes")}
        </Text>
      </View>

      <View className="h-2.5 bg-muted rounded-full overflow-hidden mb-1.5">
        <View
          className="h-full bg-[#3A33A3] rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </View>
      <Text className="text-right text-[#3A33A3] text-xs font-bold">
        {progressPercent} {t("voting.hardcoded.counted_percentage")}
      </Text>
    </View>
  );
}
