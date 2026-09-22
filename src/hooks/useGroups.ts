import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { fetchGroups, joinGroupByPin, type GroupListItem, leaveOrDeleteGroup, createGroup } from "@/services/groups";

export function useGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<GroupListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const userId = user.id;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchGroups(userId);
        if (!cancelled) setGroups(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "No se pudieron cargar los grupos");
          setGroups([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const joinGroup = useCallback(async (pin: string) => {
    if (!user?.id) throw new Error("Debes iniciar sesión");

    setIsJoining(true);
    try {
      const newGroup = await joinGroupByPin(pin);

      setGroups((prevGroups) => {
        if (prevGroups.some((g) => g.id === newGroup.id)) return prevGroups;

        return [...prevGroups, newGroup].sort((a, b) => a.name.localeCompare(b.name));
      });

      return newGroup;
    } finally {
      setIsJoining(false);
    }
  }, [user?.id]);

  const quitGroup = useCallback(async (groupId: string, isOrganizer: boolean) => {
    if (!user?.id) return;

    try {
      await leaveOrDeleteGroup(user.id, groupId, isOrganizer);
      setGroups((prevGroups) => prevGroups.filter((g) => g.id !== groupId));
    } catch (err) {
      throw err;
    }
  }, [user?.id]);

  const createNewGroup = useCallback(async (name: string) => {
    if (!user?.id) throw new Error("Debes iniciar sesión");

    setIsCreating(true);
    try {
      const newGroup = await createGroup(name);

      setGroups((prevGroups) =>
        [...prevGroups, newGroup].sort((a, b) => a.name.localeCompare(b.name))
      );

      return newGroup;
    } finally {
      setIsCreating(false);
    }
  }, [user?.id]);

  return {
    groups,
    loading,
    error,
    joinGroup,
    isJoining,
    quitGroup,
    createNewGroup,
    isCreating
  };
}