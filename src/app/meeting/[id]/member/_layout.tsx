import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Redirect, Tabs } from "expo-router";
import { LayoutDashboard, UserCheck, Inbox, PieChart, Users } from "lucide-react-native";

import { useAuth } from "@/lib/auth";
import { useMeeting } from "../_layout";
import { memberTabsForStatus } from "@/types/meeting";
import { supabase } from "@/lib/supabase";
import { useThemeColors } from "@/theme/useThemeColors";

export default function MemberMeetingLayout() {
  const { t } = useTranslation();
  const { role, meetingId, status, allowDelegations } = useMeeting();
  const { user } = useAuth();
  const colors = useThemeColors();
  const [accredited, setAccredited] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    let mounted = true;

    const load = async () => {
      const { data } = await supabase
        .from("meeting_attendances")
        .select("user_id")
        .eq("meeting_id", meetingId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (mounted) setAccredited(!!data);
    };

    void load();

    const channel = supabase
      .channel(`member-tabs-accreditation-${meetingId}-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "meeting_attendances",
          filter: `meeting_id=eq.${meetingId}`,
        },
        (payload) => {
          if (payload.new.user_id === user.id) {
            setAccredited(true);
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, [meetingId, user?.id]);

  const tabs = memberTabsForStatus(status, accredited, allowDelegations);

  if (role !== "participant") {
    return <Redirect href={`/meeting/${meetingId}/organizer`} />;
  }

  return (
    <Tabs
      key={`member-tabs-${meetingId}-del-${allowDelegations ? 1 : 0}-acc-${accredited ? 1 : 0}-st-${status}`}
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
          title:
            status === "scheduled" || status === "draft" ? t("meeting.member.tabs.meeting") : t("meeting.member.tabs.urns"),
          tabBarLabel:
            status === "scheduled" || status === "draft" ? t("meeting.member.tabs.meeting") : t("meeting.member.tabs.urns"),
          tabBarIcon: ({ color, size }) =>
            status === "scheduled" || status === "draft" ? (
              <LayoutDashboard color={color} size={size} />
            ) : (
              <Inbox color={color} size={size} />
            ),
          href: tabs.votes ? `/meeting/${meetingId}/member` : null,
        }}
      />
      <Tabs.Screen
        name="accreditation"
        options={{
          title: t("meeting.member.tabs.accreditation"),
          tabBarLabel: t("meeting.member.tabs.accreditation"),
          tabBarIcon: ({ color, size }) => <UserCheck color={color} size={size} />,
          href: tabs.accreditation
            ? `/meeting/${meetingId}/member/accreditation`
            : null,
        }}
      />
      <Tabs.Screen
        name="delegations"
        options={{
          title: t("meeting.member.tabs.delegations"),
          tabBarLabel: t("meeting.member.tabs.delegations"),
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
          href: tabs.delegations ? `/meeting/${meetingId}/member/delegations` : null,
        }}
      />
      <Tabs.Screen
        name="results"
        options={{
          title: t("meeting.member.tabs.results"),
          tabBarLabel: t("meeting.member.tabs.results"),
          tabBarIcon: ({ color, size }) => <PieChart color={color} size={size} />,
          href: tabs.results ? `/meeting/${meetingId}/member/results` : null,
        }}
      />
    </Tabs>
  );
}
