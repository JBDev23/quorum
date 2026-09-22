import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { router } from "expo-router";
import { Square, ListTodo, QrCode, Vote } from "lucide-react-native";

import { AttendanceStat } from "@/components/organizer/AttendanceStat";
import { PanelActionRow } from "@/components/organizer/PanelActionRow";
import { PhasePrimaryButton } from "@/components/organizer/PhasePrimaryButton";
import { useMeetingStatusChange } from "@/hooks/useMeetingStatusChange";
import { useAuth } from "@/lib/auth";
import { accreditParticipant } from "@/services/meetings";
import type { MeetingStatus } from "@/types/meeting";
import { useThemeColors } from "@/theme/useThemeColors";

type ActivePhaseProps = {
  meetingId: string;
  groupId: string;
  onStatusUpdated: (status: MeetingStatus) => void;
};

export function ActivePhase({
  meetingId,
  groupId,
  onStatusUpdated,
}: ActivePhaseProps) {
  const colors = useThemeColors();
  const { user } = useAuth();
  const { isUpdating, confirmAndApply } = useMeetingStatusChange(
    meetingId,
    onStatusUpdated
  );
  const [attendanceRefreshKey, setAttendanceRefreshKey] = useState(0);

  // Ensure organizer stays accredited if they join mid-meeting.
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

  const handleCloseMeeting = () => {
    confirmAndApply("closed", {
      title: "Finalizar reunión",
      message:
        "Se cerrarán las votaciones y nadie podrá acreditarse más. Esta acción no se puede deshacer fácilmente. ¿Continuar?",
      confirmLabel: "Sí, finalizar",
    });
  };

  return (
    <View>
      <View className="gap-4 mb-8">
        <Text className="text-muted-foreground mb-2">
          La reunión está en curso. Gestiona las encuestas, emite tu voto y, si
          hace falta, sigue acreditando llegadas tardías.
        </Text>

        <AttendanceStat
          meetingId={meetingId}
          groupId={groupId}
          refreshKey={attendanceRefreshKey}
        />

        <PanelActionRow
          title="Urnas"
          subtitle="Emitir tu voto como acreditado"
          icon={<Vote size={24} color={colors.secondary} />}
          onPress={() =>
            router.push(`/meeting/${meetingId}/organizer/votes`)
          }
        />

        <PanelActionRow
          title="Preguntas y Encuestas"
          subtitle="Gestiona las votaciones activas"
          icon={<ListTodo size={24} color={colors.secondary} />}
          onPress={() =>
            router.push(`/meeting/${meetingId}/organizer/surveys`)
          }
        />

        <PanelActionRow
          title="Escáner QR"
          subtitle="Acreditaciones tardías"
          icon={<QrCode size={24} color={colors.secondary} />}
          onPress={() =>
            router.push(`/meeting/${meetingId}/organizer/scanner`)
          }
        />
      </View>

      <PhasePrimaryButton
        label="Finalizar reunión"
        onPress={handleCloseMeeting}
        loading={isUpdating}
        tone="danger"
        icon={<Square color="white" size={18} fill="white" />}
        hint="Al finalizar, la reunión pasa a cerrada y se registra la hora de fin."
      />
    </View>
  );
}
