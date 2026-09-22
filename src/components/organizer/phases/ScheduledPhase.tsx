import { View, Text } from "react-native";
import { router } from "expo-router";
import { Play, ListTodo } from "lucide-react-native";

import { BlankVotesToggle } from "@/components/organizer/BlankVotesToggle";
import { DelegationsToggle } from "@/components/organizer/DelegationsToggle";
import { MeetingDatePicker } from "@/components/organizer/MeetingDatePicker";
import { PanelActionRow } from "@/components/organizer/PanelActionRow";
import { PhasePrimaryButton } from "@/components/organizer/PhasePrimaryButton";
import { useMeetingStatusChange } from "@/hooks/useMeetingStatusChange";
import type { MeetingStatus } from "@/types/meeting";
import { useThemeColors } from "@/theme/useThemeColors";

type ScheduledPhaseProps = {
  meetingId: string;
  onStatusUpdated: (status: MeetingStatus) => void;
};

export function ScheduledPhase({
  meetingId,
  onStatusUpdated,
}: ScheduledPhaseProps) {
  const colors = useThemeColors();
  const { isUpdating, confirmAndApply } = useMeetingStatusChange(
    meetingId,
    onStatusUpdated
  );

  const handleOpenDoors = () => {
    confirmAndApply("accreditation", {
      title: "Abrir Acreditaciones",
      message:
        "Los participantes podrán acreditarse con su código QR. ¿Continuar?",
      confirmLabel: "Sí, abrir puertas",
    });
  };

  return (
    <View>
      <View className="gap-4 mb-8">
        <Text className="text-muted-foreground mb-2">
          La reunión está publicada. Los participantes ven la fecha pero aún no
          pueden acreditar ni votar. Puedes seguir editando encuestas y ajustes.
        </Text>

        <PanelActionRow
          title="Preguntas y Encuestas"
          subtitle="Redacta o edita lo que se va a votar"
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
        label="Abrir Acreditaciones"
        onPress={handleOpenDoors}
        loading={isUpdating}
        icon={<Play color="white" size={20} fill="white" />}
        hint="Al abrir las puertas, el escáner se activará y los participantes podrán mostrar su código QR."
      />
    </View>
  );
}
