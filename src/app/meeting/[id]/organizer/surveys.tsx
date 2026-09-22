import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useCallback } from "react";
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
  POLL_TYPE_LABELS,
  type Poll,
  type PollType,
} from "@/services/polls";
import { ActivePollStats } from "@/components/ActivePollStats";
import { ClosedPollResults } from "@/components/ClosedPollResults";
import { useThemeColors } from "@/theme/useThemeColors";
import { SurveysSkeleton } from "@/components/skeletons/SurveysSkeleton";

export default function SurveysScreen() {
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
      alert("Error", "No se pudieron cargar las preguntas.");
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    loadPolls();
  }, [loadPolls]);

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
      "Eliminar pregunta",
      "¿Estás seguro de que quieres borrar esta pregunta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePoll(pollId);
              setPolls((prev) => prev.filter((p) => p.id !== pollId));
            } catch {
              alert("Error", "No se pudo eliminar.");
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
      newStatus === "active" ? "Lanzar Votación" : "Cerrar Votación",
      newStatus === "active"
        ? hasOtherActive
          ? "Hay otra votación en curso. Se cerrará automáticamente al lanzar esta. ¿Continuar?"
          : "Los participantes acreditados podrán empezar a votar. ¿Continuar?"
        : "¿Seguro que quieres cerrar esta votación? Ya no se admitirán más votos.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: newStatus === "active" ? "Lanzar" : "Cerrar",
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
              alert("Error", `No se pudo ${actionText} la votación.`);
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
              Encuestas
            </Text>
            <Text className="text-muted-foreground text-base">
              Orden del día a votar
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
                Podrás lanzar las votaciones cuando la asamblea pase a fase
                "Activa".
              </Text>
            </View>
          )}

          {loading ? (
            <SurveysSkeleton />
          ) : polls.length === 0 ? (
            <View className="bg-card border border-border rounded-2xl p-8 items-center mt-4">
              <HelpCircle size={48} color="#525252" className="mb-4" />
              <Text className="text-foreground text-lg font-bold text-center mb-2">
                Ninguna pregunta
              </Text>
              <Text className="text-muted-foreground text-center">
                {canEdit
                  ? "Añade los puntos que los participantes deberán votar."
                  : "Esta reunión aún no tiene encuestas."}
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
                          VOTACIÓN {index + 1}
                        </Text>
                        <View className="bg-card px-2 py-0.5 rounded-md shadow-sm border border-border">
                          <Text className="text-slate-600 text-xs font-bold">
                            {POLL_TYPE_LABELS[poll.type]}
                          </Text>
                        </View>

                        {/* Banderas de estado visuales */}
                        {poll.status === "active" && (
                          <View className="bg-[#E5F7ED] px-2 py-0.5 rounded-full">
                            <Text className="text-[#00B368] text-[11px] font-bold">
                              EN CURSO
                            </Text>
                          </View>
                        )}
                        {poll.status === "closed" && (
                          <View className="bg-muted px-2 py-0.5 rounded-full ml-auto">
                            <Text className="text-muted-foreground text-[11px] font-bold">
                              FINALIZADA
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
                        Lanzar Votación
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
                        Cerrar Votación
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
