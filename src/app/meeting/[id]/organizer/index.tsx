import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, ScrollView } from "react-native";

import { useMeeting } from "../_layout";
import { MeetingExitButton } from "@/components/MeetingExitButton";
import { DraftPhase } from "@/components/organizer/phases/DraftPhase";
import { ScheduledPhase } from "@/components/organizer/phases/ScheduledPhase";
import { AccreditationPhase } from "@/components/organizer/phases/AccreditationPhase";
import { ActivePhase } from "@/components/organizer/phases/ActivePhase";
import { ClosedPhase } from "@/components/organizer/phases/ClosedPhase";
import { MeetingStatus } from "@/types/meeting";

const PHASES_ORDER: MeetingStatus[] = [
  "draft",
  "scheduled",
  "accreditation",
  "active",
  "closed",
];

const HEADER_PROPS: Record<
  MeetingStatus,
  {
    badge: string;
    badgeColor: string;
    dotColor: string;
    bgColor: string;
    description: string;
  }
> = {
  draft: {
    badge: "BORRADOR · CERRADA",
    badgeColor: "text-warning",
    dotColor: "bg-warning",
    bgColor: "bg-warning/10",
    description:
      "Prepara todo antes de publicarla. Mientras esté en borrador, solo tú la ves.",
  },
  scheduled: {
    badge: "PROGRAMADA",
    badgeColor: "text-secondary",
    dotColor: "bg-secondary",
    bgColor: "bg-secondary/10",
    description: "La reunión está programada y los miembros pueden verla.",
  },
  accreditation: {
    badge: "ACREDITACIÓN",
    badgeColor: "text-warning",
    dotColor: "bg-warning",
    bgColor: "bg-warning/10",
    description: "Escanea los códigos QR de los miembros para acreditarlos.",
  },
  active: {
    badge: "EN CURSO",
    badgeColor: "text-success",
    dotColor: "bg-success",
    bgColor: "bg-success/10",
    description:
      "La reunión está activa. Los miembros acreditados pueden votar.",
  },
  closed: {
    badge: "FINALIZADA",
    badgeColor: "text-muted-foreground",
    dotColor: "bg-muted-foreground",
    bgColor: "bg-muted",
    description: "La reunión ha finalizado y los resultados son definitivos.",
  },
};

export default function OrganizerDashboard() {
  const { meetingId, groupId, status, updateStatus } = useMeeting();

  const headerInfo = HEADER_PROPS[status];
  const currentPhaseIndex = PHASES_ORDER.indexOf(status);

  return (
    <SafeAreaView className="flex-1 bg-card" edges={["top"]}>
      <View className={`w-full px-5 pt-6 pb-6 z-10 ${headerInfo.bgColor}`}>
        <View className="flex-row items-center justify-between gap-3 mb-2">
          <View className="flex-row items-center gap-2 flex-1">
            <View className={`w-2 h-2 rounded-full ${headerInfo.dotColor}`} />
            <Text
              className={`font-bold text-xs uppercase tracking-widest ${headerInfo.badgeColor}`}
            >
              {headerInfo.badge}
            </Text>
          </View>
          <MeetingExitButton className="bg-white/80" />
        </View>
        <Text className="text-3xl font-extrabold text-foreground mb-3">
          Panel de Control
        </Text>
        <Text className="text-muted-foreground text-[15px] leading-6">
          {headerInfo.description}
        </Text>

        <View className="flex-row items-center mt-6 pt-5 border-t border-black/5">
          <View className="flex-1 flex-row gap-[6px] mr-5">
            {PHASES_ORDER.map((phase, index) => {
              const isActiveOrPast = index <= currentPhaseIndex;
              const backgroundColor = isActiveOrPast
                ? headerInfo.dotColor
                : "bg-border";
              return (
                <View
                  key={phase}
                  className={`flex-1 h-[3px] rounded-full ${backgroundColor}`}
                />
              );
            })}
          </View>
          <View className="flex-row items-center">
            <View className="w-1.5 h-1.5 rounded-full bg-border mr-2" />
            <Text className="text-foreground font-bold text-xs">
              {currentPhaseIndex + 1}/5
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 bg-card"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-5 pt-4">

          {status === "draft" && (
            <DraftPhase meetingId={meetingId} onStatusUpdated={updateStatus} />
          )}

          {status === "scheduled" && (
            <ScheduledPhase meetingId={meetingId} onStatusUpdated={updateStatus} />
          )}

          {status === "accreditation" && (
            <AccreditationPhase
              meetingId={meetingId}
              groupId={groupId}
              onStatusUpdated={updateStatus}
            />
          )}

          {status === "active" && (
            <ActivePhase
              meetingId={meetingId}
              groupId={groupId}
              onStatusUpdated={updateStatus}
            />
          )}

          {status === "closed" && (
            <ClosedPhase meetingId={meetingId} groupId={groupId} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
