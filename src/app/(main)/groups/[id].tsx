import { useCallback, useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  BackHandler,
} from "react-native";
import { useLocalSearchParams, router, Stack, useFocusEffect } from "expo-router";
import {
  Plus,
  Users,
  ArrowLeft,
  PlayCircle,
  CalendarClock,
  Archive,
  ChevronDown,
  ChevronUp,
  Package,
  MessageCircle,
  ChevronLeft,
  QrCode,
  Trash,
  LogOut
} from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/lib/auth";
import { getGroupDetails, type GroupListItem } from "@/services/groups";
import { MeetingCard } from "@/components/MeetingCard";
import { useMeetings } from "@/hooks/useMeetings";
import { CreateMeetingModal } from "@/components/CreateMeetingModal";
import { ShareGroupModal } from "@/components/ShareGroupModal";
import { useThemeColors } from "@/theme/useThemeColors";
import { useGroups } from "@/hooks/useGroups";
import { alert } from "@/components/Alert";
import { GroupDetailSkeleton } from "@/components/skeletons/GroupDetailSkeleton";
import { MeetingsSkeleton } from "@/components/skeletons/MeetingsSkeleton";

function goToGroupsTab() {
  router.replace("/groups");
}

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = typeof id === "string" ? id : id?.[0];
  const { t } = useTranslation();
  const { user } = useAuth();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const [group, setGroup] = useState<GroupListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [shareGroupVisible, setShareGroupVisible] = useState(false);

  // Estado para el historial colapsable
  const [showHistory, setShowHistory] = useState(false);

  const { meetings, createNewMeeting, isCreating, loading: meetingsLoading } =
    useMeetings({ groupId: groupId ?? undefined });

  const { quitGroup } = useGroups();

  // Categorizamos las reuniones
  const activeMeetings = meetings.filter(
    (m) => m.status === "active" || m.status === "accreditation"
  );
  const upcomingMeetings = meetings.filter((m) => {
    if (m.status === "scheduled") return true;
    return m.status === "draft" && m.role === "organizer";
  });
  const closedMeetings = meetings.filter((m) => m.status === "closed");

  useFocusEffect(
    useCallback(() => {
      const onHardwareBack = () => {
        goToGroupsTab();
        return true;
      };
      const sub = BackHandler.addEventListener("hardwareBackPress", onHardwareBack);
      return () => sub.remove();
    }, [])
  );

  useEffect(() => {
    if (!groupId || !user?.id) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    getGroupDetails(groupId, user.id)
      .then((data) => {
        if (!cancelled) setGroup(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setGroup(null);
          setError(err instanceof Error ? err.message : t("main.groupDetail.error_not_found"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [groupId, user?.id]);

  if (loading) {
    return <GroupDetailSkeleton />;
  }

  if (error || !group) {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6">
        <Stack.Screen options={{ title: t("main.groupDetail.header_group"), headerShown: true }} />
        <Text className="text-destructive text-xl font-bold mb-2">
          {t("main.groupDetail.error_load")}
        </Text>
        <Text className="text-muted-foreground text-center mb-8">
          {error ?? t("main.groupDetail.error_not_found")}
        </Text>
        <TouchableOpacity
          onPress={goToGroupsTab}
          className="bg-muted px-6 py-3 rounded-full flex-row items-center gap-2"
        >
          <ArrowLeft color="white" size={20} />
          <Text className="text-foreground font-semibold">{t("main.groupDetail.back")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOrganizer = group.role === "organizer";

  const handleCreateMeeting = async (title: string) => {
    const newMeetingId = await createNewMeeting(group.id, title);
    router.push(`/meeting/${newMeetingId}`);
  };

  const handleLeave = () => {
    if (isOrganizer) {
      alert(
        t("main.groupDetail.delete_title"),
        t("main.groupDetail.delete_desc", { name: group.name }),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("main.groupDetail.delete_btn"),
            style: "destructive",
            onPress: () => {
              quitGroup(group.id, true);
              goToGroupsTab();
            },
          },
        ]
      );
    } else {
      alert(
        t("main.groupDetail.leave_title"),
        t("main.groupDetail.leave_desc", { name: group.name }),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("main.groupDetail.leave_btn"),
            style: "destructive",
            onPress: () => {
              quitGroup(group.id, false);
              goToGroupsTab();
            },
          },
        ]
      );
    }
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 pb-4 gap-2" style={{ paddingTop: insets.top + 16 }}>
        <View className="flex-row items-center flex-1">
          <TouchableOpacity
            onPress={goToGroupsTab}
            className="mr-3 bg-primary/10 w-8 h-8 rounded-full items-center justify-center"
          >
            <ChevronLeft color={colors.primary} size={20} />
          </TouchableOpacity>
          <Text className="text-foreground text-lg font-bold flex-1" numberOfLines={1}>
            {group.name}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleLeave}
          className="bg-destructive/10 w-8 h-8 rounded-full items-center justify-center"
        >
          {isOrganizer ? (
            <Trash size={16} color="#ef4444" />
          ) : (
            <LogOut size={16} color="#ef4444" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Cabecera del Grupo */}
        <View className="bg-card p-4 rounded-2xl border border-border mb-6">
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1 pr-3 gap-2">
              <Text className="text-foreground text-xl font-bold">
                {group.name}
              </Text>
              {isOrganizer && (
                <View className="self-start bg-primary px-3 py-1.5 rounded-full flex-row items-center gap-1.5">
                  <MessageCircle size={14} color="white" />
                  <Text className="text-primary-foreground text-xs font-bold">
                    {t("main.groupDetail.role_organizer")}
                  </Text>
                </View>
              )}
            </View>

            {isOrganizer && (
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={() => setShareGroupVisible(true)}
                  className="bg-muted/50 p-2.5 rounded-xl border border-border/50"
                >
                  <QrCode size={20} color="#737373" />
                </TouchableOpacity>
                <View className="bg-muted/50 px-3 py-2 rounded-xl flex-row items-center gap-3">
                  <Users size={14} color="#737373" />
                  <View>
                    <Text className="text-muted-foreground text-xs font-semibold uppercase">
                      {t("main.groupDetail.pin")}
                    </Text>
                    <Text className="text-foreground font-bold text-sm">
                      {group.invitePin}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
          <Text className="text-muted-foreground text-sm">
            {isOrganizer ? t("main.groupDetail.role_msg_organizer") : t("main.groupDetail.role_msg_participant")}
          </Text>
        </View>

        {/* Título de sección y Botón "Nueva" */}
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-foreground text-2xl font-bold">{t("main.groupDetail.meetings_title")}</Text>

          {isOrganizer && (
            <TouchableOpacity
              className="bg-primary flex-row items-center gap-1.5 px-4 py-2 rounded-xl"
              onPress={() => setIsModalVisible(true)}
            >
              <Plus color="white" size={16} />
              <Text className="text-primary-foreground font-bold text-sm">{t("main.groupDetail.btn_new")}</Text>
            </TouchableOpacity>
          )}
        </View>

        {meetingsLoading ? (
          <MeetingsSkeleton />
        ) : meetings.length === 0 ? (
          <View className="items-center justify-center py-12 px-4 mt-4 bg-card rounded-3xl border border-border">
            <View className="w-20 h-20 bg-muted/50 rounded-full items-center justify-center mb-6">
              <CalendarClock size={40} color="#737373" />
            </View>
            <Text className="text-foreground text-xl font-bold mb-3 text-center">
              {t("main.groupDetail.empty_title")}
            </Text>
            <Text className="text-muted-foreground text-center mb-8 text-base px-4">
              {isOrganizer ? t("main.groupDetail.empty_desc_org") : t("main.groupDetail.empty_desc_part")}
            </Text>
            {isOrganizer && (
              <TouchableOpacity
                onPress={() => setIsModalVisible(true)}
                className="bg-primary px-8 py-4 rounded-full flex-row items-center gap-2"
              >
                <Plus color="white" size={20} />
                <Text className="text-primary-foreground font-bold text-base">
                  {t("main.groupDetail.btn_create_first")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View className="gap-8">

            {/* 1. SECCIÓN: EN CURSO / ACREDITACIÓN */}
            {activeMeetings.length > 0 && (
              <View>
                <View className="flex-row items-center gap-2 mb-4">
                  <View className="w-2 h-2 rounded-full bg-emerald-500" />
                  <Text className="text-sm font-bold text-emerald-600 uppercase tracking-wider">
                    {t("main.groupDetail.section_attention")}
                  </Text>
                </View>
                <View className="gap-4">
                  {activeMeetings.map((meeting) => (
                    <MeetingCard key={meeting.id} {...meeting} />
                  ))}
                </View>
              </View>
            )}

            {/* 2. SECCIÓN: BORRADORES Y PRÓXIMAS */}
            {upcomingMeetings.length > 0 && (
              <View>
                <View className="flex-row items-center gap-2 mb-4 mt-6">
                  <View className="w-2 h-2 rounded-full bg-yellow-500" />
                  <Text className="text-sm font-bold text-yellow-600 uppercase tracking-wider">
                    {t("main.groupDetail.section_upcoming")}
                  </Text>
                </View>
                <View className="gap-4">
                  {upcomingMeetings.map((meeting) => (
                    <MeetingCard key={meeting.id} {...meeting} />
                  ))}
                </View>
              </View>
            )}

            {/* 3. SECCIÓN: FINALIZADAS E HISTORIAL (Colapsable) */}
            {closedMeetings.length > 0 && (
              <View className="mt-6">
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowHistory(!showHistory)}
                  className="flex-row items-center justify-between bg-card p-4 rounded-2xl border border-border"
                >
                  <View className="flex-row items-center gap-3">
                    <Package size={20} color="#737373" />
                    <Text className="text-base font-bold text-foreground">{t("main.groupDetail.section_history")}</Text>
                    <View className="bg-primary/10 px-2 py-0.5 rounded-full ml-1">
                      <Text className="text-primary text-xs font-bold">{closedMeetings.length}</Text>
                    </View>
                  </View>

                  {showHistory ? (
                    <ChevronUp size={20} color="#737373" />
                  ) : (
                    <ChevronDown size={20} color="#737373" />
                  )}
                </TouchableOpacity>

                {/* Lista de reuniones cerradas */}
                {showHistory && (
                  <View className="gap-4 opacity-80 mt-2">
                    {closedMeetings.map((meeting) => (
                      <MeetingCard key={meeting.id} {...meeting} />
                    ))}
                  </View>
                )}
              </View>
            )}

          </View>
        )}
      </ScrollView>

      <CreateMeetingModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onCreate={handleCreateMeeting}
        isCreating={isCreating}
        groupName={group.name}
      />

      <ShareGroupModal
        visible={shareGroupVisible}
        group={group}
        onClose={() => setShareGroupVisible(false)}
      />
    </View>
  );
}