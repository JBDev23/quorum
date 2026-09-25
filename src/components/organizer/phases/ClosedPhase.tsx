import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { ListTodo, CheckCircle2 } from "lucide-react-native";

import { AttendanceStat } from "@/components/organizer/AttendanceStat";
import { PanelActionRow } from "@/components/organizer/PanelActionRow";
import { useThemeColors } from "@/theme/useThemeColors";

type ClosedPhaseProps = {
  meetingId: string;
  groupId: string;
};

export function ClosedPhase({ meetingId, groupId }: ClosedPhaseProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <View>
      <View className="gap-4 mb-8">
        <View className="bg-card border border-border p-5 rounded-2xl items-center">
          <View className="bg-destructive/10 p-3 rounded-full mb-3">
            <CheckCircle2 size={28} color="#ef4444" />
          </View>
          <Text className="text-foreground font-bold text-lg text-center mb-1">
            {t("meeting.organizer.phases.closed.results_title")}
          </Text>
          <Text className="text-muted-foreground text-sm text-center">
            {t("meeting.organizer.phases.closed.results_subtitle")}
          </Text>
        </View>

        <AttendanceStat meetingId={meetingId} groupId={groupId} />

        <PanelActionRow
          title={t("meeting.organizer.tabs.polls")}
          subtitle={t("meeting.organizer.phases.closed.results_subtitle")}
          icon={<ListTodo size={24} color={colors.secondary} />}
          onPress={() =>
            router.push(`/meeting/${meetingId}/organizer/polls`)
          }
        />
      </View>
    </View>
  );
}
