import { useEffect, useState } from "react";
import { Switch, Text, View, ActivityIndicator } from "react-native";
import { Users } from "lucide-react-native";

import {
  fetchAllowDelegations,
  updateAllowDelegations,
} from "@/services/meetings";
import { getUserProfile } from "@/services/profile";
import { useAuth } from "@/lib/auth";
import { openPremiumPaywall } from "@/lib/navigation";
import { alert } from "@/components/Alert";
import { useThemeColors } from "@/theme/useThemeColors";
import { useMeeting } from "@/app/meeting/[id]/_layout";

type DelegationsToggleProps = {
  meetingId: string;
  editable?: boolean;
};

export function DelegationsToggle({
  meetingId,
  editable = true,
}: DelegationsToggleProps) {
  const colors = useThemeColors();
  const { user } = useAuth();
  const { updateAllowDelegations: syncAllowDelegations } = useMeeting();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const value = await fetchAllowDelegations(meetingId);
        if (!cancelled) setEnabled(value);
      } catch {
        // Keep default false.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [meetingId]);

  const handleToggle = async (next: boolean) => {
    if (!editable || saving || !user) return;

    if (next) {
      try {
        const profile = await getUserProfile(user.id);
        if (!profile.is_premium) {
          alert(
            "Función Premium",
            "La delegación de votos es exclusiva para usuarios Premium. ¡Mejora tu cuenta para desbloquearla!",
            [
              { text: "Cancelar", style: "cancel" },
              { text: "Mejorar a Premium", onPress: openPremiumPaywall },
            ]
          );
          return;
        }
      } catch {
        alert("Error", "No se pudo verificar el estado de tu cuenta.");
        return;
      }
    }

    setSaving(true);
    setEnabled(next);
    try {
      await updateAllowDelegations(meetingId, next);
      syncAllowDelegations(next);
    } catch (err) {
      setEnabled(!next);
      if (err instanceof Error && err.message === "PREMIUM_REQUIRED") {
        alert(
          "Función Premium",
          "La delegación de votos es exclusiva para usuarios Premium. ¡Mejora tu cuenta para desbloquearla!",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Mejorar a Premium", onPress: openPremiumPaywall },
          ]
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="bg-card border border-border p-4 rounded-2xl flex-row items-center justify-between">
      <View className="flex-row items-center gap-4 flex-1 pr-3">
        <View className="bg-muted p-3 rounded-full">
          {loading || saving ? (
            <ActivityIndicator size="small" color="#a3a3a3" />
          ) : (
            <Users size={24} color={colors.secondary} />
          )}
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-bold text-lg">
            Delegación de votos
          </Text>
          <Text className="text-muted-foreground text-sm">
            Permite que los participantes deleguen su voto en otros miembros
          </Text>
        </View>
      </View>
      <Switch
        value={enabled}
        onValueChange={(next) => void handleToggle(next)}
        disabled={!editable || loading || saving}
        trackColor={{ false: "#404040", true: "#2563eb" }}
        thumbColor={enabled ? "#ffffff" : "#d4d4d4"}
      />
    </View>
  );
}
