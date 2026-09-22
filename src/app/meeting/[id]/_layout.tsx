import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { Stack, router, useGlobalSearchParams, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

import { useAuth } from "@/lib/auth";
import { asParam } from "@/lib/params";
import { supabase } from "@/lib/supabase";
import {
  isMeetingRole,
  isMeetingStatus,
  type MeetingRole,
  type MeetingStatus,
} from "@/types/meeting";
import { useThemeColors } from "@/theme/useThemeColors";
import { MeetingDetailSkeleton } from "@/components/skeletons/MeetingDetailSkeleton";

type MeetingData = {
  meetingId: string;
  groupId: string;
  role: MeetingRole;
  status: MeetingStatus;
  startDate: string | null;
  allowDelegations: boolean;
};

type MeetingContextType = MeetingData & {
  /** Optimistic local update after a successful status change. */
  updateStatus: (status: MeetingStatus) => void;
  /** Optimistic local update after toggling delegations. */
  updateAllowDelegations: (allow: boolean) => void;
};

const MeetingContext = createContext<MeetingContextType | null>(null);

export const useMeeting = () => {
  const context = useContext(MeetingContext);
  if (!context) {
    throw new Error("useMeeting debe usarse dentro del MeetingLayout");
  }
  return context;
};

const isUUID = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

type RouteIdResult =
  | { status: "ready"; id: string }
  | { status: "pending" }
  | { status: "invalid" };

/**
 * Resolve meeting UUID from route params only.
 * Do not use useSegments() here: when a sibling modal (e.g. /premium) is pushed,
 * segments become unstable and can throw while this layout stays mounted.
 * Keep the last valid UUID so overlay navigations do not clear the meeting id.
 */
function useMeetingRouteId(): RouteIdResult {
  const stickyId = useRef<string | undefined>(undefined);

  const localParams = useLocalSearchParams<{ id?: string | string[] }>();
  const localId = asParam(localParams.id);
  if (localId && isUUID(localId)) {
    stickyId.current = localId;
    return { status: "ready", id: localId };
  }

  const globalParams = useGlobalSearchParams<{ id?: string | string[] }>();
  const globalId = asParam(globalParams.id);
  if (globalId && isUUID(globalId)) {
    stickyId.current = globalId;
    return { status: "ready", id: globalId };
  }

  if (stickyId.current) {
    return { status: "ready", id: stickyId.current };
  }

  return { status: "pending" };
}

export default function MeetingLayout() {
  const colors = useThemeColors();
  const routeId = useMeetingRouteId();
  const meetingId =
    routeId.status === "ready" ? routeId.id : undefined;
  const routeStatus = routeId.status;
  const { user } = useAuth();
  const [meetingData, setMeetingData] = useState<MeetingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth — keep spinner, do not treat as access error.
    if (!user?.id) {
      setLoading(true);
      return;
    }

    if (routeStatus === "invalid") {
      setMeetingData(null);
      setError("Reunión no encontrada.");
      setLoading(false);
      return;
    }

    // Path not ready yet (nested nav can briefly omit the UUID).
    if (routeStatus === "pending" || !meetingId) {
      if (!meetingData) setLoading(true);
      return;
    }

    let cancelled = false;

    async function verifyAccess(id: string, userId: string) {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from("meetings")
          .select(
            `
            id,
            group_id,
            status,
            start_date,
            allow_delegations,
            groups!inner(
              group_members!inner(role)
            )
          `
          )
          .eq("id", id)
          .eq("groups.group_members.user_id", userId)
          .single();

        if (fetchError || !data) {
          throw new Error("No tienes acceso a esta reunión o no existe.");
        }

        const rawRole = (data.groups as { group_members?: { role: unknown }[] })
          ?.group_members?.[0]?.role;

        if (!isMeetingRole(rawRole)) {
          throw new Error("No se pudo determinar tu rol en esta reunión.");
        }

        if (!isMeetingStatus(data.status)) {
          throw new Error("Estado de reunión desconocido.");
        }

        if (!cancelled) {
          setMeetingData({
            meetingId: data.id,
            groupId: data.group_id,
            status: data.status,
            role: rawRole,
            startDate: data.start_date ?? null,
            allowDelegations: !!data.allow_delegations,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setMeetingData(null);
          setError(err instanceof Error ? err.message : "Acceso denegado");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    verifyAccess(meetingId, user.id);

    return () => {
      cancelled = true;
    };
    // meetingData intentionally omitted — only re-fetch when route/user change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, meetingId, routeStatus]);

  // Keep status / allow_delegations in sync (organizer updates locally; members need realtime).
  useEffect(() => {
    if (!meetingId) return;

    const channel = supabase
      .channel(`meeting-status-${meetingId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "meetings",
          filter: `id=eq.${meetingId}`,
        },
        (payload) => {
          const row = payload.new as {
            status?: unknown;
            start_date?: string | null;
            allow_delegations?: boolean | null;
          };
          const nextStatus = row.status;
          setMeetingData((prev) => {
            if (!prev) return prev;
            const statusOk = isMeetingStatus(nextStatus);
            const statusChanged = statusOk && prev.status !== nextStatus;
            const nextStart =
              row.start_date !== undefined ? row.start_date : prev.startDate;
            const nextAllow =
              typeof row.allow_delegations === "boolean"
                ? row.allow_delegations
                : prev.allowDelegations;
            if (
              !statusChanged &&
              nextStart === prev.startDate &&
              nextAllow === prev.allowDelegations
            ) {
              return prev;
            }
            return {
              ...prev,
              ...(statusChanged ? { status: nextStatus } : {}),
              startDate: nextStart ?? null,
              allowDelegations: nextAllow,
            };
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [meetingId]);

  if (loading) {
    return <MeetingDetailSkeleton />;
  }

  if (error || !meetingData) {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6">
        <Text className="text-destructive text-xl font-bold mb-2">
          Acceso Denegado
        </Text>
        <Text className="text-muted-foreground text-center mb-8">
          {error ?? "No se pudo cargar la reunión."}
        </Text>
        <TouchableOpacity
          onPress={() => router.replace("/(main)")}
          className="bg-muted px-6 py-3 rounded-full flex-row items-center gap-2"
        >
          <ArrowLeft color="white" size={20} />
          <Text className="text-foreground font-semibold">Volver al Inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const updateStatus = (status: MeetingStatus) => {
    setMeetingData((prev) => (prev ? { ...prev, status } : null));
  };

  const updateAllowDelegations = (allow: boolean) => {
    setMeetingData((prev) =>
      prev ? { ...prev, allowDelegations: allow } : null
    );
  };

  return (
    <MeetingContext.Provider
      value={{ ...meetingData, updateStatus, updateAllowDelegations }}
    >
      <Stack screenOptions={{ headerShown: false }} />
    </MeetingContext.Provider>
  );
}
