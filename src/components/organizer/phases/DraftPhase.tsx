import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { isUpdating, confirmAndApply } = useMeetingStatusChange(
    meetingId,
    onStatusUpdated
  );

  const handleSchedule = () => {
    confirmAndApply("scheduled", {
      title: t("meeting.organizer.phases.draft.schedule_title"),
      message: t("meeting.organizer.phases.draft.schedule_msg"),
      confirmLabel: t("meeting.organizer.phases.draft.schedule_confirm"),
    });
  };

  const handleOpenDoors = () => {
    confirmAndApply("accreditation", {
      title: t("meeting.organizer.phases.draft.open_doors_title"),
      message: t("meeting.organizer.phases.draft.open_doors_msg"),
      confirmLabel: t("meeting.organizer.phases.draft.open_doors_confirm"),
    });
  };

  return (
    <View>
      <View className="gap-4 mb-8">

        <PanelActionRow
          title={t("meeting.organizer.phases.draft.polls_title")}
          subtitle={t("meeting.organizer.phases.draft.polls_subtitle")}
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
        label={t("meeting.organizer.phases.draft.schedule_btn")}
        onPress={handleSchedule}
        loading={isUpdating}
        icon={<CalendarClock color="white" size={20} />}
        hint={t("meeting.organizer.phases.draft.schedule_hint")}
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
              {t("meeting.organizer.phases.draft.skip_to_accreditation")}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
