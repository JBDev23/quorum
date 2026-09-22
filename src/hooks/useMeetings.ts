import { useEffect, useState, useCallback, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useFocusEffect } from "expo-router";

import type { MeetingCardProps } from "@/components/MeetingCard";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  fetchMeetings,
  fetchMeetingsByGroup,
  createMeeting as createMeetingApi,
} from "@/services/meetings";

type UseMeetingsOptions = {
  /** When the options object is passed, only meetings for this group are loaded. */
  groupId?: string;
};

export function useMeetings(options?: UseMeetingsOptions) {
  const scopeToGroup = options != null;
  const groupId = options?.groupId;
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<MeetingCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const refreshMeetings = useCallback(async () => {
    if (!user?.id) return;
    if (scopeToGroup && !groupId) return;
    try {
      const data =
        scopeToGroup && groupId
          ? await fetchMeetingsByGroup(groupId, user.id)
          : await fetchMeetings(user.id);
      setMeetings(data);
    } catch (err) {
      console.error("Error recargando reuniones:", err);
    }
  }, [user?.id, groupId, scopeToGroup]);

  const refreshMeetingsRef = useRef(refreshMeetings);
  useEffect(() => {
    refreshMeetingsRef.current = refreshMeetings;
  }, [refreshMeetings]);

  // Tabs stay mounted; refresh when returning so status is never stale.
  useFocusEffect(
    useCallback(() => {
      void refreshMeetingsRef.current();
    }, [])
  );

  useEffect(() => {
    if (!user?.id) {
      setMeetings([]);
      setLoading(false);
      return;
    }

    if (scopeToGroup && !groupId) {
      setMeetings([]);
      setLoading(true);
      return;
    }

    const userId = user.id;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data =
          scopeToGroup && groupId
            ? await fetchMeetingsByGroup(groupId, userId)
            : await fetchMeetings(userId);
        if (!cancelled) setMeetings(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "No se pudieron cargar las reuniones"
          );
          setMeetings([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    // Unique topic per mount so React remounts / Strict Mode never call .on()
    // on an already-subscribed channel with the same name.
    const channel = supabase
      .channel(
        `${scopeToGroup
          ? `meetings-list-group-${groupId}-${userId}`
          : `meetings-list-${userId}`
        }-${Math.random().toString(36).slice(2)}`
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meetings",
          ...(scopeToGroup && groupId
            ? { filter: `group_id=eq.${groupId}` }
            : {}),
        },
        () => {
          void refreshMeetingsRef.current();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void refreshMeetingsRef.current();
      });

    const onAppState = (next: AppStateStatus) => {
      if (next === "active") void refreshMeetingsRef.current();
    };
    const appSub = AppState.addEventListener("change", onAppState);

    return () => {
      cancelled = true;
      appSub.remove();
      void supabase.removeChannel(channel);
    };
  }, [user?.id, groupId, scopeToGroup]);

  const createNewMeeting = useCallback(
    async (targetGroupId: string, title: string, startDate?: string) => {
      setIsCreating(true);
      try {
        const newMeetingId = await createMeetingApi(targetGroupId, title, startDate);
        await refreshMeetings();
        return newMeetingId;
      } finally {
        setIsCreating(false);
      }
    },
    [refreshMeetings]
  );

  return {
    meetings,
    loading,
    error,
    refreshMeetings,
    createNewMeeting,
    isCreating,
  };
}
