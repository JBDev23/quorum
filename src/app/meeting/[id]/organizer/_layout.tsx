import { Redirect, Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, ScanLine, ClipboardList, Inbox, BarChart, Users } from "lucide-react-native";

import { useMeeting } from "../_layout";
import { organizerTabsForStatus } from "@/types/meeting";
import { useThemeColors } from "@/theme/useThemeColors";

export default function OrganizerMeetingLayout() {
  const { t } = useTranslation();
  const { role, meetingId, status, allowDelegations } = useMeeting();
  const tabs = organizerTabsForStatus(status, allowDelegations);
  const colors = useThemeColors();

  if (role !== "organizer") {
    return <Redirect href={`/meeting/${meetingId}/member`} />;
  }

  return (
    <Tabs
      key={`organizer-tabs-${meetingId}-del-${allowDelegations ? 1 : 0}-st-${status}`}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("meeting.organizer.tabs.panel"),
          tabBarLabel: t("meeting.organizer.tabs.panel"),
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
          href: tabs.panel ? `/meeting/${meetingId}/organizer` : null,
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: t("meeting.organizer.tabs.scanner"),
          tabBarLabel: t("meeting.organizer.tabs.scanner"),
          tabBarIcon: ({ color, size }) => <ScanLine color={color} size={size} />,
          href: tabs.scanner
            ? `/meeting/${meetingId}/organizer/scanner`
            : null,
        }}
      />
      <Tabs.Screen
        name="polls"
        options={{
          title: t("meeting.organizer.tabs.polls"),
          tabBarLabel: t("meeting.organizer.tabs.polls"),
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />,
          href: tabs.polls
            ? `/meeting/${meetingId}/organizer/polls`
            : null,
        }}
      />
      <Tabs.Screen
        name="votes"
        options={{
          title: t("meeting.organizer.tabs.urns"),
          tabBarLabel: t("meeting.organizer.tabs.urns"),
          tabBarIcon: ({ color, size }) => <Inbox color={color} size={size} />,
          href: tabs.votes
            ? `/meeting/${meetingId}/organizer/votes`
            : null,
        }}
      />
      <Tabs.Screen
        name="delegations"
        options={{
          title: t("meeting.organizer.tabs.delegations"),
          tabBarLabel: t("meeting.organizer.tabs.delegations"),
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
          href: tabs.delegations
            ? `/meeting/${meetingId}/organizer/delegations`
            : null,
        }}
      />
      <Tabs.Screen
        name="results"
        options={{
          title: t("meeting.organizer.tabs.results"),
          tabBarLabel: t("meeting.organizer.tabs.results"),
          tabBarIcon: ({ color, size }) => <BarChart color={color} size={size} />,
          href: tabs.results
            ? `/meeting/${meetingId}/organizer/results`
            : null,
        }}
      />
    </Tabs>
  );
}
