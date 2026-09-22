import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  FlatList,
  Image,
  AppState,
  type AppStateStatus,
} from "react-native";
import { Users, ChevronRight, X, CheckCircle2, Clock } from "lucide-react-native";

import { supabase } from "@/lib/supabase";
import {
  fetchAttendanceStats,
  fetchAttendanceList,
  type AttendanceStats,
  type MemberAttendance,
} from "@/services/meetings";
import { useThemeColors } from "@/theme/useThemeColors";
import { AttendanceListSkeleton } from "@/components/skeletons/AttendanceListSkeleton";

type AttendanceStatProps = {
  meetingId: string;
  groupId: string;
  refreshKey?: string | number;
};

export function AttendanceStat({
  meetingId,
  groupId,
  refreshKey,
}: AttendanceStatProps) {
  const colors = useThemeColors();
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [list, setList] = useState<MemberAttendance[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const modalOpenRef = useRef(false);

  const refreshStats = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) setLoading(true);
      try {
        const data = await fetchAttendanceStats(meetingId, groupId);
        setStats(data);
      } catch {
        setStats(null);
      } finally {
        if (showSpinner) setLoading(false);
      }
    },
    [meetingId, groupId]
  );

  const refreshList = useCallback(async () => {
    try {
      const data = await fetchAttendanceList(meetingId, groupId);
      data.sort((a, b) =>
        a.isAccredited === b.isAccredited ? 0 : a.isAccredited ? 1 : -1
      );
      setList(data);
    } catch (error) {
      console.error(error);
    }
  }, [meetingId, groupId]);

  const refreshStatsRef = useRef(refreshStats);
  const refreshListRef = useRef(refreshList);
  useEffect(() => {
    refreshStatsRef.current = refreshStats;
  }, [refreshStats]);
  useEffect(() => {
    refreshListRef.current = refreshList;
  }, [refreshList]);

  useEffect(() => {
    void refreshStatsRef.current(true);

    const channel = supabase
      .channel(`attendance-stat-${meetingId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meeting_attendances",
          filter: `meeting_id=eq.${meetingId}`,
        },
        () => {
          void refreshStatsRef.current(false);
          if (modalOpenRef.current) void refreshListRef.current();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void refreshStatsRef.current(false);
      });

    const onAppState = (next: AppStateStatus) => {
      if (next === "active") {
        void refreshStatsRef.current(false);
        if (modalOpenRef.current) void refreshListRef.current();
      }
    };
    const appSub = AppState.addEventListener("change", onAppState);

    return () => {
      appSub.remove();
      void supabase.removeChannel(channel);
    };
  }, [meetingId, groupId, refreshKey]);

  const openModal = async () => {
    modalOpenRef.current = true;
    setIsModalVisible(true);
    setLoadingList(true);
    try {
      await refreshList();
    } finally {
      setLoadingList(false);
    }
  };

  const closeModal = () => {
    modalOpenRef.current = false;
    setIsModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={openModal}
        className="bg-card border border-border p-4 rounded-2xl flex-row items-center gap-4"
      >
        <View className="bg-muted p-3 rounded-full">
          <Users size={24} color={colors.secondary} />
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-bold text-lg">Acreditados</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#a3a3a3" className="mt-1 self-start" />
          ) : stats ? (
            <Text className="text-muted-foreground text-sm">
              {stats.accredited} de {stats.totalMembers} miembros del grupo
            </Text>
          ) : (
            <Text className="text-muted-foreground text-sm">
              No se pudo cargar el contador
            </Text>
          )}
        </View>

        {stats && !loading && (
          <View className="items-end">
            <Text className="text-foreground text-2xl font-bold mb-1">
              {stats.accredited}
              <Text className="text-muted-foreground text-base font-medium">
                /{stats.totalMembers}
              </Text>
            </Text>
            <ChevronRight size={18} color="#737373" />
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-card w-full h-[80%] rounded-t-3xl border-t border-border overflow-hidden">
            <View className="p-6 border-b border-border flex-row justify-between items-center bg-card z-10">
              <View>
                <Text className="text-foreground text-xl font-bold">
                  Control de Asistencia
                </Text>
                <Text className="text-muted-foreground">
                  {stats?.accredited} / {stats?.totalMembers} acreditados
                </Text>
              </View>
              <TouchableOpacity
                onPress={closeModal}
                className="p-2 bg-muted rounded-full"
              >
                <X color="#a3a3a3" size={20} />
              </TouchableOpacity>
            </View>

            {loadingList ? (
              <AttendanceListSkeleton />
            ) : (
              <FlatList
                data={list}
                keyExtractor={(item) => item.user_id}
                contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                renderItem={({ item }) => (
                  <View className="flex-row items-center justify-between bg-background p-4 rounded-2xl mb-3 border border-border/50">
                    <View className="flex-1 flex-row items-center gap-3 pr-4">
                      {item.avatarUrl ? (
                        <Image
                          source={{ uri: item.avatarUrl }}
                          className="w-10 h-10 rounded-full bg-muted"
                        />
                      ) : (
                        <View className="w-10 h-10 rounded-full bg-muted justify-center items-center">
                          <Users size={20} color="#737373" />
                        </View>
                      )}

                      <View className="flex-1">
                        <Text
                          className="text-foreground font-semibold text-base"
                          numberOfLines={1}
                        >
                          {item.fullName}
                        </Text>
                      </View>
                    </View>

                    <View
                      className={`px-3 py-1.5 rounded-full flex-row items-center gap-1.5 border ${
                        item.isAccredited
                          ? "bg-success/10 border-success/20"
                          : "bg-muted border-border"
                      }`}
                    >
                      {item.isAccredited ? (
                        <>
                          <CheckCircle2 size={14} color="#22c55e" />
                          <Text className="text-success text-xs font-bold">
                            PRESENTE
                          </Text>
                        </>
                      ) : (
                        <>
                          <Clock size={14} color="#a3a3a3" />
                          <Text className="text-muted-foreground text-xs font-bold">
                            FALTA
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                )}
                ListEmptyComponent={
                  <View className="bg-background border border-border/50 rounded-[24px] p-8 items-center mt-4 shadow-sm mx-1">
                    <View className="w-16 h-16 bg-muted rounded-full items-center justify-center mb-4">
                      <Users size={32} color="#a3a3a3" />
                    </View>
                    <Text className="text-foreground text-[19px] font-bold text-center mb-2">
                      Sin miembros
                    </Text>
                    <Text className="text-muted-foreground text-center text-[15px] leading-6 px-4">
                      No hay miembros en este grupo.
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
