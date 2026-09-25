import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
      title: t("meeting.organizer.phases.active.close_title"),
      message: t("meeting.organizer.phases.active.close_msg"),
      confirmLabel: t("meeting.organizer.phases.active.close_confirm"),
    });
  };

  return (
    <View>
      <View className="gap-4 mb-8">
        <Text className="text-muted-foreground mb-2">
          {t("meeting.organizer.dashboard.desc_active")}
        </Text>

        <AttendanceStat
          meetingId={meetingId}
          groupId={groupId}
          refreshKey={attendanceRefreshKey}
        />

        <PanelActionRow
          title={t("meeting.organizer.tabs.urns")}
          subtitle={t("meeting.organizer.dashboard.desc_active")}
          icon={<Vote size={24} color={colors.secondary} />}
          onPress={() =>
            router.push(`/meeting/${meetingId}/organizer/votes`)
          }
        />

        <PanelActionRow
          title={t("meeting.organizer.phases.active.polls_title")}
          subtitle={t("meeting.organizer.phases.active.polls_subtitle")}
          icon={<ListTodo size={24} color={colors.secondary} />}
          onPress={() =>
            router.push(`/meeting/${meetingId}/organizer/polls`)
          }
        />

        <PanelActionRow
          title={t("meeting.organizer.tabs.scanner")}
          subtitle={t("meeting.organizer.phases.accreditation.scanner_subtitle")}
          icon={<QrCode size={24} color={colors.secondary} />}
          onPress={() =>
            router.push(`/meeting/${meetingId}/organizer/scanner`)
          }
        />
      </View>

      <PhasePrimaryButton
        label={t("meeting.organizer.phases.active.close_btn")}
        onPress={handleCloseMeeting}
        loading={isUpdating}
        tone="danger"
        icon={<Square color="white" size={18} fill="white" />}
        hint={t("meeting.organizer.phases.active.close_hint")}
      />
    </View>
  );
}
