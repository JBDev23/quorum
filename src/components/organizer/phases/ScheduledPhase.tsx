import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { isUpdating, confirmAndApply } = useMeetingStatusChange(
    meetingId,
    onStatusUpdated
  );

  const handleOpenDoors = () => {
    confirmAndApply("accreditation", {
      title: t("meeting.organizer.phases.scheduled.open_doors_title"),
      message: t("meeting.organizer.phases.scheduled.open_doors_msg"),
      confirmLabel: t("meeting.organizer.phases.scheduled.open_doors_confirm"),
    });
  };

  return (
    <View>
      <View className="gap-4 mb-8">
        <Text className="text-muted-foreground mb-2">
          {t("meeting.organizer.dashboard.desc_scheduled")}
        </Text>

        <PanelActionRow
          title={t("meeting.organizer.phases.scheduled.polls_title")}
          subtitle={t("meeting.organizer.phases.scheduled.polls_subtitle")}
          icon={<ListTodo size={24} color={colors.secondary} />}
          onPress={() =>
            router.push(`/meeting/${meetingId}/organizer/polls`)
          }
        />

        <MeetingDatePicker meetingId={meetingId} editable />
        <BlankVotesToggle meetingId={meetingId} editable />
        <DelegationsToggle meetingId={meetingId} editable />
      </View>

      <PhasePrimaryButton
        label={t("meeting.organizer.phases.scheduled.open_doors_btn")}
        onPress={handleOpenDoors}
        loading={isUpdating}
        icon={<Play color="white" size={20} fill="white" />}
        hint={t("meeting.organizer.phases.scheduled.open_doors_hint")}
      />
    </View>
  );
}
