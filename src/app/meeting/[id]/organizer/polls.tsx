import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Plus, HelpCircle, Trash2, Play, Square } from "lucide-react-native";

import { alert } from "@/components/Alert";
import { useMeeting } from "../_layout";
import { CreatePollModal } from "@/components/CreatePollModal";
import {
  fetchPolls,
  createPoll,
  deletePoll,
  updatePollStatus,
  type Poll,
  type PollType,
} from "@/services/polls";
import { ActivePollStats } from "@/components/ActivePollStats";
import { ClosedPollResults } from "@/components/ClosedPollResults";
import { useThemeColors } from "@/theme/useThemeColors";
import { PollsSkeleton } from "@/components/skeletons/PollsSkeleton";

export default function PollsScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { meetingId, status } = useMeeting();

  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // La creación/borrado de preguntas suele hacerse antes de la asamblea
  const canEdit =
    status === "draft" ||
    status === "scheduled" ||
    status === "accreditation" ||
    status === "active";
  // Solo se pueden lanzar votaciones si la reunión está en curso
  const isMeetingActive = status === "active";

  const loadPolls = useCallback(async () => {
    try {
      const data = await fetchPolls(meetingId);
      setPolls(data);
    } catch {
      alert("Error", t("meeting.organizer.polls.error_load"));
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  const loadPollsRef = useRef(loadPolls);
  useEffect(() => {
    loadPollsRef.current = loadPolls;
  }, [loadPolls]);

  useEffect(() => {
    void loadPollsRef.current();

    if (!meetingId) return;

    const channel = supabase
      .channel(`polls-organizer-${meetingId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "polls",
          filter: `meeting_id=eq.${meetingId}`,
        },
        () => {
          void loadPollsRef.current();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void loadPollsRef.current();
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [meetingId]);

  const handleCreatePoll = async (input: {
    title: string;
    type: PollType;
    options?: string[];
  }) => {
    setIsCreating(true);
    try {
      const newPoll = await createPoll({
        meetingId,
        title: input.title,
        type: input.type,
        options: input.options,
      });
      setPolls((prev) => [...prev, newPoll]);
      setIsModalVisible(false);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = (pollId: string) => {
    alert(
      t("meeting.organizer.polls.delete_title"),
      t("meeting.organizer.polls.delete_warning"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("meeting.organizer.polls.delete_action"),
          style: "destructive",
          onPress: async () => {
            try {
              await deletePoll(pollId);
              setPolls((prev) => prev.filter((p) => p.id !== pollId));
            } catch {
              alert("Error", t("meeting.organizer.polls.error_delete"));
            }
          },
        },
      ],
    );
  };

  const handleUpdatePollStatus = async (
    pollId: string,
    newStatus: "active" | "closed",
  ) => {
    const actionText = newStatus === "active" ? "lanzar" : "cerrar";
    const hasOtherActive =
      newStatus === "active" &&
      polls.some((p) => p.id !== pollId && p.status === "active");

    alert(
      newStatus === "active" ? t("meeting.organizer.polls.launch_title") : t("meeting.organizer.polls.close_title"),
      newStatus === "active"
        ? hasOtherActive
          ? t("meeting.organizer.polls.launch_warning_other")
          : t("meeting.organizer.polls.launch_warning")
        : t("meeting.organizer.polls.close_warning"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: newStatus === "active" ? t("meeting.organizer.polls.launch_action") : t("meeting.organizer.polls.close_action"),
          style: newStatus === "closed" ? "destructive" : "default",
          onPress: async () => {
            try {
              await updatePollStatus(pollId, newStatus);
              setPolls((prev) =>
                prev.map((p) => {
                  if (p.id === pollId) return { ...p, status: newStatus };
                  if (newStatus === "active" && p.status === "active") {
                    return { ...p, status: "closed" };
                  }
                  return p;
                }),
              );
            } catch {
              alert("Error", newStatus === "active" ? t("meeting.organizer.polls.error_action_launch") : t("meeting.organizer.polls.error_action_close"));
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-card" edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} className="flex-1 bg-card" stickyHeaderIndices={[0]}>
        <View className="w-full bg-card px-4 pt-4 pb-4 z-10 flex-row justify-between items-end mb-2">
          <View className="flex-1 pr-3">
            <Text className="text-3xl font-bold text-foreground mb-1">
              {t("meeting.organizer.polls.title")}
            </Text>
            <Text className="text-muted-foreground text-base">
              {t("meeting.organizer.polls.subtitle")}
            </Text>
          </View>

          {canEdit && (
            <TouchableOpacity
              onPress={() => setIsModalVisible(true)}
              className="bg-secondary h-12 w-12 rounded-full justify-center items-center shadow-lg"
            >
              <Plus color="white" size={24} />
            </TouchableOpacity>
          )}
        </View>

        <View className="px-4">

          {!isMeetingActive && polls.length > 0 && (
            <View className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl mb-4">
              <Text className="text-amber-500 text-sm text-center">
                {t("meeting.organizer.polls.cant_launch")}
              </Text>
            </View>
          )}

          {loading ? (
            <PollsSkeleton />
          ) : polls.length === 0 ? (
            <View className="bg-card border border-border rounded-2xl p-8 items-center mt-4">
              <HelpCircle size={48} color="#525252" className="mb-4" />
              <Text className="text-foreground text-lg font-bold text-center mb-2">
                {status === "draft" ? t("meeting.organizer.polls.no_polls") : t("meeting.organizer.polls.no_polls_yet")}
              </Text>
              <Text className="text-muted-foreground text-center">
                {canEdit && status === "draft"
                  ? t("meeting.organizer.polls.add_polls_desc")
                  : ""}
              </Text>
            </View>
          ) : (
            <View className="gap-4 mt-2">
              {polls.map((poll, index) => (
                <View
                  key={poll.id}
                  className={`border p-5 rounded-2xl ${poll.status === "active"
                      ? "bg-[#F4F6FA] border-[#3A33A3]"
                      : "bg-card border-border"
                    }`}
                >
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1 pr-4">
                      <View className="flex-row flex-wrap items-center gap-2 mb-2">
                        <Text className="text-[#6A7398] font-bold text-xs uppercase tracking-widest">
                          {t("meeting.organizer.polls.poll_label")} {index + 1}
                        </Text>
                        <View className="bg-card px-2 py-0.5 rounded-md shadow-sm border border-border">
                          <Text className="text-slate-600 text-xs font-bold">
                            {poll.type === "yes_no" 
                              ? t("services.polls.type_yes_no") 
                              : t("services.polls.type_multiple")}
                          </Text>
                        </View>

                        {poll.status === "active" && (
                          <View className="bg-[#E5F7ED] px-2 py-0.5 rounded-full">
                            <Text className="text-[#00B368] text-[11px] font-bold">
                              {t("meeting.organizer.polls.active_badge")}
                            </Text>
                          </View>
                        )}
                        {poll.status === "closed" && (
                          <View className="bg-muted px-2 py-0.5 rounded-full ml-auto">
                            <Text className="text-muted-foreground text-[11px] font-bold">
                              {t("meeting.organizer.polls.closed_badge")}
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text className="text-[#1C2035] text-[19px] font-extrabold mb-1">
                        {poll.title}
                      </Text>
                    </View>

                    {canEdit && poll.status === "draft" && (
                      <TouchableOpacity
                        onPress={() => handleDelete(poll.id)}
                        className="p-2 bg-destructive/10 rounded-full"
                      >
                        <Trash2 size={18} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {poll.status === "closed" ? (
                    <ClosedPollResults poll={poll} />
                  ) : (
                    <View className="flex-row flex-wrap gap-2 mb-4">
                      {poll.poll_options?.map((option) => (
                        <View
                          key={option.id}
                          className="bg-card px-4 py-2 rounded-xl border border-border shadow-sm"
                        >
                          <Text className="text-[#1C2035] font-bold text-sm">
                            {option.text}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {poll.status === "active" && (
                    <ActivePollStats pollId={poll.id} meetingId={meetingId} />
                  )}

                  {/* BOTONES DE ACCIÓN PARA EL ORGANIZADOR */}
                  {poll.status === "draft" && (
                    <TouchableOpacity
                      onPress={() => handleUpdatePollStatus(poll.id, "active")}
                      disabled={!isMeetingActive}
                      className={`py-3 rounded-xl flex-row justify-center items-center gap-2 ${isMeetingActive ? "bg-secondary" : "bg-muted"
                        }`}
                    >
                      <Play
                        size={18}
                        color={isMeetingActive ? "white" : "#737373"}
                        fill={isMeetingActive ? "white" : "transparent"}
                      />
                      <Text
                        className={`font-bold ${isMeetingActive ? "text-primary-foreground" : "text-muted-foreground"}`}
                      >
                        {t("meeting.organizer.polls.launch_btn")}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {poll.status === "active" && (
                    <TouchableOpacity
                      onPress={() => handleUpdatePollStatus(poll.id, "closed")}
                      className="py-3.5 rounded-xl flex-row justify-center items-center gap-2 bg-[#FCF5F5] border border-[#E92E46]"
                    >
                      <View className="w-2 h-2 bg-[#E92E46] rounded-full" />
                      <Text className="text-[#E92E46] font-bold text-base">
                        {t("meeting.organizer.polls.close_btn")}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <CreatePollModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onCreate={handleCreatePoll}
        isCreating={isCreating}
      />
    </SafeAreaView>
  );
}
