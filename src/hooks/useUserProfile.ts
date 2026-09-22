import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/lib/auth";
import { getUserProfile, type UserProfile } from "@/services/profile";

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getUserProfile(user.id);
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el perfil");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { profile, loading, error, refresh };
}
