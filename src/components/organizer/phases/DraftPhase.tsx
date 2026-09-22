import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { CalendarClock, ListTodo, Play } from "lucide-react-native";

import { BlankVotesToggle } from "@/components/organizer/BlankVotesToggle";
import { DelegationsToggle } from "@/components/organizer/DelegationsToggle";
import { MeetingDatePicker } from "@/components/organizer/MeetingDatePicker";
import { PanelActionRow } from "@/components/organizer/PanelActionRow";
import { PhasePrimaryButton } from "@/components/organizer/PhasePrimaryButton";
import { useMeetingStatusChange } from "@/hooks/useMeetingStatusChange";
import type { MeetingStatus } from "@/types/meeting";
import { useThemeColors } from "@/theme/useThemeColors";

type DraftPhaseProps = {
  meetingId: string;
  onStatusUpdated: (status: MeetingStatus) => void;
};

export function DraftPhase({ meetingId, onStatusUpdated }: DraftPhaseProps) {
  const colors = useThemeColors();
  const { isUpdating, confirmAndApply } = useMeetingStatusChange(
    meetingId,
    onStatusUpdated
  );

  const handleSchedule = () => {
    confirmAndApply("scheduled", {
      title: "Programar reunión",
      message:
        "Los participantes verán la fecha de la reunión, pero aún no podrán acreditar ni votar. ¿Continuar?",
      confirmLabel: "Sí, programar",
    });
  };

  const handleOpenDoors = () => {
    confirmAndApply("accreditation", {
      title: "Abrir Acreditaciones",
      message:
        "Los participantes podrán ver la reunión y empezar a acreditarse con su código QR. ¿Continuar?",
      confirmLabel: "Sí, abrir puertas",
    });
  };

  return (
    <View>
      <View className="gap-4 mb-8">

        <PanelActionRow
          title="Preguntas y Encuestas"
          subtitle="Redacta lo que se va a votar"
          icon={<ListTodo size={24} color={colors.secondary} />}
          onPress={() =>
            router.push(`/meeting/${meetingId}/organizer/surveys`)
          }
        />

        <MeetingDatePicker meetingId={meetingId} editable />
        <BlankVotesToggle meetingId={meetingId} editable />
        <DelegationsToggle meetingId={meetingId} editable />
      </View>

      <PhasePrimaryButton
        label="Programar reunión"
        onPress={handleSchedule}
        loading={isUpdating}
        icon={<CalendarClock color="white" size={20} />}
        hint="Al programarla, los participantes verán cuándo será, sin poder hacer nada todavía."
      />

      <TouchableOpacity
        onPress={handleOpenDoors}
        disabled={isUpdating}
        className="mt-3 py-3 items-center"
      >
        {isUpdating ? (
          <ActivityIndicator color="#a3a3a3" />
        ) : (
          <View className="flex-row items-center gap-2">
            <Play size={16} color="#a3a3a3" />
            <Text className="text-muted-foreground font-medium">
              Saltar y abrir acreditaciones
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
