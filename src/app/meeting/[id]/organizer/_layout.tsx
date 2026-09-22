import { Redirect, Tabs } from "expo-router";
import { LayoutDashboard, ScanLine, ClipboardList, Inbox, BarChart, Users } from "lucide-react-native";

import { useMeeting } from "../_layout";
import { organizerTabsForStatus } from "@/types/meeting";
import { useThemeColors } from "@/theme/useThemeColors";

export default function OrganizerMeetingLayout() {
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
          title: "Panel",
          tabBarLabel: "Panel",
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
          href: tabs.panel ? `/meeting/${meetingId}/organizer` : null,
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: "Escáner",
          tabBarLabel: "Escáner",
          tabBarIcon: ({ color, size }) => <ScanLine color={color} size={size} />,
          href: tabs.scanner
            ? `/meeting/${meetingId}/organizer/scanner`
            : null,
        }}
      />
      <Tabs.Screen
        name="surveys"
        options={{
          title: "Encuestas",
          tabBarLabel: "Encuestas",
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />,
          href: tabs.surveys
            ? `/meeting/${meetingId}/organizer/surveys`
            : null,
        }}
      />
      <Tabs.Screen
        name="votes"
        options={{
          title: "Urnas",
          tabBarLabel: "Urnas",
          tabBarIcon: ({ color, size }) => <Inbox color={color} size={size} />,
          href: tabs.votes
            ? `/meeting/${meetingId}/organizer/votes`
            : null,
        }}
      />
      <Tabs.Screen
        name="delegations"
        options={{
          title: "Delegaciones",
          tabBarLabel: "Delegaciones",
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
          href: tabs.delegations
            ? `/meeting/${meetingId}/organizer/delegations`
            : null,
        }}
      />
      <Tabs.Screen
        name="results"
        options={{
          title: "Resultados",
          tabBarLabel: "Resultados",
          tabBarIcon: ({ color, size }) => <BarChart color={color} size={size} />,
          href: tabs.results
            ? `/meeting/${meetingId}/organizer/results`
            : null,
        }}
      />
    </Tabs>
  );
}
