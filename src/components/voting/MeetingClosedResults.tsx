import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  AppState,
  type AppStateStatus,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { CheckCircle2, Inbox, Download } from "lucide-react-native";
import { alert } from "@/components/Alert";
import { useAuth } from "@/lib/auth";
import { openPremiumPaywall } from "@/lib/navigation";
import { getUserProfile } from "@/services/profile";

import { ClosedPollResults } from "@/components/ClosedPollResults";
import { MeetingExitButton } from "@/components/MeetingExitButton";
import { ExportResultsModal } from "./ExportResultsModal";
import { fetchClosedPolls, type Poll } from "@/services/polls";
import { supabase } from "@/lib/supabase";
import type { MeetingStatus } from "@/types/meeting";
import { useThemeColors } from "@/theme/useThemeColors";
import { ResultsSkeleton } from "@/components/skeletons/ResultsSkeleton";
import { useMeeting } from "@/app/meeting/[id]/_layout";

type MeetingClosedResultsProps = {
  meetingId: string;
  status?: MeetingStatus;
};

export function MeetingClosedResults({
  meetingId,
  status,
}: MeetingClosedResultsProps) {
  const colors = useThemeColors();
  const { role } = useMeeting();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [isCheckingPremium, setIsCheckingPremium] = useState(false);
  const { user } = useAuth();
  const { t } = useTranslation();

  const handleExportPress = async () => {
    if (!user) return;
    setIsCheckingPremium(true);
    try {
      const profile = await getUserProfile(user.id);
      if (!profile.is_premium) {
        alert(
          t("voting.closed_results.premium_title"),
          t("voting.closed_results.premium_msg"),
          [
            { text: t("common.cancel"), style: "cancel" },
            { text: t("voting.closed_results.premium_upgrade"), onPress: openPremiumPaywall },
          ]
        );
        return;
      }
      setIsExportModalVisible(true);
    } catch (err) {
      alert("Error", t("voting.closed_results.premium_error"));
    } finally {
      setIsCheckingPremium(false);
    }
  };

  const refresh = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) {
        setLoading(true);
        setError(null);
      }
      try {
        const data = await fetchClosedPolls(meetingId);
        setPolls(data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : t("voting.closed_results.load_error")
        );
      } finally {
        if (showSpinner) setLoading(false);
      }
    },
    [meetingId]
  );

  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      void refreshRef.current(false);
    }, [])
  );

  useEffect(() => {
    void refreshRef.current(true);

    const channel = supabase
      .channel(`closed-poll-results-${meetingId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "polls",
          filter: `meeting_id=eq.${meetingId}`,
        },
        () => {
          void refreshRef.current(false);
        }
      )
      .subscribe((subStatus) => {
        if (subStatus === "SUBSCRIBED") void refreshRef.current(false);
      });

    const onAppState = (next: AppStateStatus) => {
      if (next === "active") void refreshRef.current(false);
    };
    const appSub = AppState.addEventListener("change", onAppState);

    return () => {
      appSub.remove();
      void supabase.removeChannel(channel);
    };
  }, [meetingId]);

  if (loading) {
    return <ResultsSkeleton />;
  }

  if (error) {
    return (
      <View className="flex-1 bg-background">
        <SafeAreaView edges={["top"]} className="px-4 pt-2">
          <MeetingExitButton />
        </SafeAreaView>
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-destructive text-center mb-4">{error}</Text>
          <TouchableOpacity
            onPress={() => void refresh(true)}
            className="bg-muted px-6 py-3 rounded-full"
          >
            <Text className="text-foreground font-semibold">{t("common.retry")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-card" edges={["top"]}>
      <ScrollView
        className="flex-1 bg-card"
        contentContainerStyle={{ paddingBottom: 40 }}
        stickyHeaderIndices={[0]}
      >
        <View className="w-full bg-card px-4 pt-4 pb-4 z-10 mb-4 border-b border-black/5">
          <View className="flex-row items-center justify-between mb-4">
            <MeetingExitButton />
            {status === "closed" && polls.length > 0 && role === "organizer" && (
              <TouchableOpacity
                onPress={handleExportPress}
                disabled={isCheckingPremium}
                className={`flex-row items-center px-3 py-2 rounded-full ${isCheckingPremium ? "bg-muted" : "bg-primary/10"}`}
              >
                {isCheckingPremium ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Download size={18} color={colors.primary} />
                )}
                <Text className="text-primary font-medium ml-2">{t("voting.export_modal.title").split(" ")[0]}</Text>
              </TouchableOpacity>
            )}
          </View>
          <View className="items-center">
            <CheckCircle2 size={48} color="#22c55e" className="mb-4" />
            <Text className="text-foreground text-2xl font-bold text-center mb-2">
              {status === "closed" ? t("meeting.organizer.phases.closed.results_title") : t("voting.closed_results.title")}
            </Text>
            <Text className="text-muted-foreground text-center text-base">
              {status === "closed"
                ? t("meeting.organizer.phases.closed.results_subtitle")
                : t("voting.closed_results.subtitle")}
            </Text>
          </View>
        </View>

        <View className="px-4">
          {polls.length === 0 ? (
            <View className="bg-card border border-border rounded-[24px] p-8 items-center mt-4 shadow-sm mx-1">
              <View className="w-16 h-16 bg-muted rounded-full items-center justify-center mb-4">
                <Inbox size={32} color="#a3a3a3" />
              </View>
              <Text className="text-foreground text-[19px] font-bold text-center mb-2">
                {t("voting.closed_results.empty_title")}
              </Text>
              <Text className="text-muted-foreground text-center text-[15px] leading-6 px-4">
                {t("voting.closed_results.empty_desc")}
              </Text>
            </View>
          ) : (
            <View className="gap-6">
              {polls.map((poll) => (
                <View key={poll.id}>
                  <Text className="text-foreground text-lg font-bold mb-1">
                    {poll.title}
                  </Text>
                  <ClosedPollResults poll={poll} />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {status === "closed" && (
        <ExportResultsModal
          visible={isExportModalVisible}
          onClose={() => setIsExportModalVisible(false)}
          meetingId={meetingId}
        />
      )}
    </SafeAreaView>
  );
}
