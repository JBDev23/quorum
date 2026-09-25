import { useState, useEffect } from "react";
import { ActivityIndicator, View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CalendarClock, ChevronDown, ChevronUp, Settings, Circle, ShieldAlert, User, Box, CalendarX } from "lucide-react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { MeetingCard, type MeetingCardProps } from "@/components/MeetingCard";
import { useMeetings } from "@/hooks/useMeetings";
import { useUserProfile } from "@/hooks/useUserProfile";
import { fetchAttendanceStats } from "@/services/meetings";
import { useThemeColors } from "@/theme/useThemeColors";
import { MeetingsSkeleton } from "@/components/skeletons/MeetingsSkeleton";

function ActiveMeetingCard({ meeting }: { meeting: MeetingCardProps }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [stats, setStats] = useState<{ accredited: number; totalMembers: number } | null>(null);

  useEffect(() => {
    fetchAttendanceStats(meeting.id, meeting.groupId)
      .then(setStats)
      .catch(console.error);
  }, [meeting.id, meeting.groupId]);

  const getStatusConfig = () => {
    switch (meeting.status) {
      case "active":
        return {
          bgClass: "bg-primary",
          dotColor: colors.success,
          statusTextClass: "text-primary-foreground",
          statusLabel: t("components.meetingCard.status_active"),
          dateTextClass: "text-primary-foreground/70",
          groupTextClass: "text-primary-foreground/60",
          titleTextClass: "text-primary-foreground",
          roleBgClass: "bg-primary-foreground/15",
          roleIconColorOrg: colors.primaryForeground,
          roleIconColorPart: colors.primaryForeground,
          roleTextClass: "text-primary-foreground",
          accreditedTextClass: "text-primary-foreground",
          totalTextClass: "text-primary-foreground/60",
          progressBarBgClass: "bg-primary-foreground/20",
          progressBarFillClass: "bg-tertiary",
        };
      case "accreditation":
        return {
          bgClass: "bg-warning/15",
          dotColor: colors.warning,
          statusTextClass: "text-warning",
          statusLabel: t("components.meetingCard.status_accreditation"),
          dateTextClass: "text-warning",
          groupTextClass: "text-warning",
          titleTextClass: "text-foreground",
          roleBgClass: "border border-warning/30 bg-card/50",
          roleIconColorOrg: colors.foreground,
          roleIconColorPart: colors.mutedForeground,
          roleTextClass: "text-muted-foreground",
          accreditedTextClass: "text-foreground",
          totalTextClass: "text-muted-foreground",
          progressBarBgClass: "bg-warning/30",
          progressBarFillClass: "bg-warning",
        };
      default:
        return {
          bgClass: "bg-muted",
          dotColor: colors.mutedForeground,
          statusTextClass: "text-muted-foreground",
          statusLabel: meeting.status,
          dateTextClass: "text-muted-foreground",
          groupTextClass: "text-muted-foreground",
          titleTextClass: "text-foreground",
          roleBgClass: "bg-muted-foreground/15",
          roleIconColorOrg: colors.foreground,
          roleIconColorPart: colors.mutedForeground,
          roleTextClass: "text-muted-foreground",
          accreditedTextClass: "text-foreground",
          totalTextClass: "text-muted-foreground",
          progressBarBgClass: "bg-muted-foreground/30",
          progressBarFillClass: "bg-muted-foreground",
        };
    }
  };

  const config = getStatusConfig();
  const isOrg = meeting.role === "organizer";
  const roleIconColor = isOrg ? config.roleIconColorOrg : config.roleIconColorPart;

  const accredited = stats?.accredited ?? 0;
  const total = stats?.totalMembers ?? 1;
  const progressPercent = Math.min(100, Math.round((accredited / (total || 1)) * 100));

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => router.push(`/meeting/${meeting.id}`)}
      className={`${config.bgClass} px-4 py-6 border-b border-border`}
    >
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center gap-2">
          <Circle
            size={8}
            fill={config.dotColor}
            color={config.dotColor}
          />
          <Text className={`${config.statusTextClass} text-[10px] font-bold uppercase tracking-widest`}>
            {config.statusLabel}
          </Text>
        </View>
        <Text className={`${config.dateTextClass} text-xs font-semibold`}>
          {meeting.dateText}
        </Text>
      </View>

      <Text className={`${config.groupTextClass} text-[10px] font-bold mb-1 uppercase tracking-widest`}>
        {meeting.groupName}
      </Text>
      <Text className={`${config.titleTextClass} text-2xl font-extrabold mb-5`}>
        {meeting.title}
      </Text>

      <View className="flex-row justify-between items-end mb-2">
        <View className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full ${config.roleBgClass}`}>
          {isOrg ? (
            <ShieldAlert size={14} color={roleIconColor} />
          ) : (
            <User size={14} color={roleIconColor} />
          )}
          <Text className={`${config.roleTextClass} text-xs font-bold`}>
            {isOrg ? t("components.meetingCard.role_organizer") : t("components.meetingCard.role_participant")}
          </Text>
        </View>
        <View className="flex-row items-baseline gap-1">
          <Text className={`${config.accreditedTextClass} text-xl font-extrabold`}>
            {accredited}
          </Text>
          <Text className={`${config.totalTextClass} text-xs font-medium`}>
            /{stats?.totalMembers ?? '-'} {t("main.index.accredited_short")}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View className={`h-1.5 rounded-full w-full mt-2 overflow-hidden ${config.progressBarBgClass}`}>
        <View className={`h-full rounded-full ${config.progressBarFillClass}`} style={{ width: `${progressPercent}%` }} />
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { meetings, loading, error } = useMeetings();
  const { profile } = useUserProfile();

  // Estado para controlar si el historial está visible o no
  const [showHistory, setShowHistory] = useState(false);

  // Prioridad de estados para "Requieren atención"
  const statusPriority: Record<string, number> = {
    active: 1,
    accreditation: 2,
  };

  // Categorizamos las reuniones por su estado
  const attentionMeetings = meetings
    .filter((m) => m.status === "active" || m.status === "accreditation")
    .sort((a, b) => statusPriority[a.status] - statusPriority[b.status]);

  const scheduledMeetings = meetings.filter((m) => m.status === "scheduled");

  // Borradores solo visibles para el organizador
  const draftMeetings = meetings.filter(
    (m) => m.status === "draft" && m.role === "organizer"
  );

  // El historial se invierte para ver las más recientes (ya cerradas) arriba
  const closedMeetings = meetings.filter((m) => m.status === "closed").reverse();

  const firstName = profile?.first_name || t("main.index.default_user");

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} className="bg-background" stickyHeaderIndices={[0]}>

        {/* HEADER */}
        <View className="w-full flex-row justify-between items-center bg-background px-4 pt-4 pb-4 z-10">
          <View>
            <Text className="text-xs font-bold text-muted-foreground tracking-wider mb-1 uppercase">
              {t("main.index.greeting", { name: firstName })}
            </Text>
            <Text className="text-3xl font-extrabold text-foreground">
              {t("main.index.title")}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/settings")} className="bg-muted p-2.5 rounded-full border border-border">
            <Settings size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <View className="px-4 flex-1">
          {loading ? (
            <MeetingsSkeleton />
          ) : error ? (
            <Text className="text-destructive text-base">{error}</Text>
          ) : meetings.length === 0 ? (
            <View className="flex-1 items-center justify-center py-10 px-6 my-4 bg-card rounded-3xl border border-border">
              <View className="bg-muted w-20 h-20 rounded-full items-center justify-center mb-6">
                <CalendarX size={36} color={colors.mutedForeground} />
              </View>
              <Text className="text-xl font-bold text-foreground text-center mb-2">
                {t("main.index.empty_title")}
              </Text>
              <Text className="text-sm text-muted-foreground text-center leading-relaxed mb-8">
                {t("main.index.empty_desc")}
              </Text>

              <View className="w-full gap-3">
                <TouchableOpacity
                  className="w-full bg-primary py-4 rounded-xl items-center justify-center"
                  onPress={() => router.push('/groups')}
                >
                  <Text className="text-primary-foreground font-bold text-base">{t("main.index.btn_create_group")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="w-full bg-muted py-4 rounded-xl items-center justify-center border border-border"
                  onPress={() => router.push('/groups')}
                >
                  <Text className="text-foreground font-bold text-base">{t("main.index.btn_join_group")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="gap-8">

              {/* 1. SECCIÓN: EN CURSO / ACREDITACIÓN */}
              {attentionMeetings.length > 0 && (
                <View>
                  <View className="flex-row items-center gap-2 mb-4">
                    <Circle size={8} fill={colors.success} color={colors.success} />
                    <Text className="text-[11px] font-bold text-success tracking-widest uppercase">
                      {t("main.index.section_attention")}
                    </Text>
                  </View>

                  <View className="gap-0 -mx-4 border-t border-border mb-6">
                    {attentionMeetings.map((meeting) => (
                      <ActiveMeetingCard key={meeting.id} meeting={meeting} />
                    ))}
                  </View>
                </View>
              )}

              {/* 2. SECCIÓN: PRÓXIMAS */}
              {scheduledMeetings.length > 0 && (
                <View className="mb-6">
                  <View className="flex-row items-center gap-2 mb-4">
                    <CalendarClock size={20} color={colors.warning} />
                    <Text className="text-sm font-bold text-foreground uppercase tracking-widest">
                      {t("main.index.section_scheduled")}
                    </Text>
                  </View>
                  <View className="gap-4">
                    {scheduledMeetings.map((meeting) => (
                      <MeetingCard key={meeting.id} {...meeting} />
                    ))}
                  </View>
                </View>
              )}

              {/* 3. SECCIÓN: BORRADORES */}
              {draftMeetings.length > 0 && (
                <View className="mb-6">
                  <View className="flex-row items-center gap-2 mb-4">
                    <CalendarClock size={16} color={colors.mutedForeground} />
                    <Text className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      {t("main.index.section_drafts")}
                    </Text>
                  </View>
                  <View className="gap-4">
                    {draftMeetings.map((meeting) => (
                      <MeetingCard key={meeting.id} {...meeting} />
                    ))}
                  </View>
                </View>
              )}

              {/* 4. SECCIÓN: HISTORIAL */}
              <View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowHistory(!showHistory)}
                  className={`flex-row items-center justify-between bg-card border border-border p-4 ${showHistory ? 'rounded-t-xl border-b-0' : 'rounded-xl'}`}
                >
                  <View className="flex-row items-center gap-3">
                    <Box size={20} color={colors.mutedForeground} />
                    <Text className="text-base font-bold text-foreground">{t("main.index.section_history")}</Text>
                    <View className="bg-muted px-2 py-0.5 rounded-full">
                      <Text className="text-muted-foreground text-xs font-bold">{closedMeetings.length || 0}</Text>
                    </View>
                  </View>
                  {showHistory ? (
                    <ChevronUp size={20} color={colors.mutedForeground} />
                  ) : (
                    <ChevronDown size={20} color={colors.mutedForeground} />
                  )}
                </TouchableOpacity>

                {/* Contenedor del historial (simulando el espacio blanco de la imagen cuando está abierto) */}
                {showHistory && (
                  <View className="bg-card border border-t-0 border-border rounded-b-xl p-4 min-h-[150px]">
                    {closedMeetings.length > 0 ? (
                      <View className="gap-4 opacity-80">
                        {closedMeetings.map((meeting) => (
                          <MeetingCard key={meeting.id} {...meeting} />
                        ))}
                      </View>
                    ) : (
                      <Text className="text-muted-foreground text-center mt-4">{t("main.index.history_empty")}</Text>
                    )}
                  </View>
                )}
              </View>

            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}