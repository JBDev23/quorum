import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { router } from "expo-router";
import { Play, ListTodo, QrCode } from "lucide-react-native";

import { AttendanceStat } from "@/components/organizer/AttendanceStat";
import { BlankVotesToggle } from "@/components/organizer/BlankVotesToggle";
import { PanelActionRow } from "@/components/organizer/PanelActionRow";
import { PhasePrimaryButton } from "@/components/organizer/PhasePrimaryButton";
import { useMeetingStatusChange } from "@/hooks/useMeetingStatusChange";
import { useAuth } from "@/lib/auth";
import { accreditParticipant } from "@/services/meetings";
import type { MeetingStatus } from "@/types/meeting";
import { useThemeColors } from "@/theme/useThemeColors";

type AccreditationPhaseProps = {
  meetingId: string;
  groupId: string;
  onStatusUpdated: (status: MeetingStatus) => void;
};

export function AccreditationPhase({
  meetingId,
  groupId,
  onStatusUpdated,
}: AccreditationPhaseProps) {
  const colors = useThemeColors();
  const { user } = useAuth();
  const { isUpdating, confirmAndApply } = useMeetingStatusChange(
    meetingId,
    onStatusUpdated
  );
  const [attendanceRefreshKey, setAttendanceRefreshKey] = useState(0);

  // Organizer is auto-accredited so they can vote without scanning themselves.
  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;
    void accreditParticipant(meetingId, user.id)
      .then(() => {
        if (!cancelled) setAttendanceRefreshKey((k) => k + 1);
      })
      .catch((error) => {
        console.error("Auto-acreditación del organizador:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [meetingId, user?.id]);

  const handleStartMeeting = () => {
    confirmAndApply("active", {
      title: "Iniciar reunión",
      message:
        "Los participantes acreditados podrán votar. ¿Empezar la reunión?",
      confirmLabel: "Sí, iniciar",
    });
  };

  return (
    <View>
      <View className="gap-4 mb-8">
        <Text className="text-muted-foreground mb-2">
          Las puertas están abiertas. Usa el escáner para acreditar a quien
          llegue con su QR. Tú ya estás acreditado automáticamente.
        </Text>

        <AttendanceStat
          meetingId={meetingId}
          groupId={groupId}
          refreshKey={attendanceRefreshKey}
        />

        <PanelActionRow
          title="Escáner QR"
          subtitle="Acreditar participantes"
          icon={<QrCode size={24} color={colors.secondary} />}
          onPress={() =>
            router.push(`/meeting/${meetingId}/organizer/scanner`)
          }
        />

        <PanelActionRow
          title="Preguntas y Encuestas"
          subtitle="Aún puedes editar el orden del día"
          icon={<ListTodo size={24} color={colors.secondary} />}
          onPress={() =>
            router.push(`/meeting/${meetingId}/organizer/surveys`)
          }
        />

        <BlankVotesToggle meetingId={meetingId} editable />
      </View>

      <PhasePrimaryButton
        label="Iniciar reunión"
        onPress={handleStartMeeting}
        loading={isUpdating}
        icon={<Play color="white" size={20} fill="white" />}
        hint="Al iniciar, se abren las urnas de votación para los acreditados."
      />
    </View>
  );
}
