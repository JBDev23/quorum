import { useEffect, useState } from "react";
import { Switch, Text, View, ActivityIndicator } from "react-native";
import { Vote } from "lucide-react-native";

import {
  fetchAllowBlankVotes,
  updateAllowBlankVotes,
} from "@/services/meetings";
import { useThemeColors } from "@/theme/useThemeColors";
import { useTranslation } from "react-i18next";

type BlankVotesToggleProps = {
  meetingId: string;
  editable?: boolean;
};

export function BlankVotesToggle({
  meetingId,
  editable = true,
}: BlankVotesToggleProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const value = await fetchAllowBlankVotes(meetingId);
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
    if (!editable || saving) return;
    setSaving(true);
    setEnabled(next);
    try {
      await updateAllowBlankVotes(meetingId, next);
    } catch {
      setEnabled(!next);
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
            <Vote size={24} color={colors.secondary} />
          )}
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-bold text-lg">{t("meeting.organizer.components.blankVotes.title")}</Text>
          <Text className="text-muted-foreground text-sm">
            {t("meeting.organizer.components.blankVotes.description")}
          </Text>
        </View>
      </View>
      <Switch
        value={enabled}
        onValueChange={handleToggle}
        disabled={!editable || loading || saving}
        trackColor={{ false: "#404040", true: "#2563eb" }}
        thumbColor={enabled ? "#ffffff" : "#d4d4d4"}
      />
    </View>
  );
}
