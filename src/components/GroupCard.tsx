import { View, Text, TouchableOpacity, Pressable } from "react-native";
import { ShieldAlert, User, QrCode, Trash, ChevronRight } from "lucide-react-native";
import type { GroupListItem } from "@/services/groups";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { alert } from "@/components/Alert";
import { useThemeColors } from "@/theme/useThemeColors";

interface GroupCardProps {
  group: GroupListItem;
  onLeave: (groupId: string, isOrganizer: boolean) => void;
  onShare: (group: GroupListItem) => void;
}

export function GroupCard({ group, onLeave, onShare }: GroupCardProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const isOrganizer = group.role === "organizer";

  const handleLeave = () => {
    if (isOrganizer) {
      alert(
        t("components.groupCard.delete_title"),
        t("components.groupCard.delete_desc", { name: group.name }),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("components.groupCard.delete_btn"),
            style: "destructive",
            onPress: () => onLeave(group.id, true),
          },
        ]
      );
    } else {
      alert(
        t("components.groupCard.leave_title"),
        t("components.groupCard.leave_desc", { name: group.name }),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("components.groupCard.leave_btn"),
            style: "destructive",
            onPress: () => onLeave(group.id, false),
          },
        ]
      );
    }
  };

  return (
    <Pressable
      onPress={() => router.push(`/groups/${group.id}`)}
      className="bg-card border border-border rounded-[24px] p-5 w-full shadow-sm"
    >
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-1 pr-4">
          <Text className="text-foreground text-lg font-bold leading-6">{group.name}</Text>
        </View>

        <View className="flex-row gap-2 items-center">
          {isOrganizer && (
            <TouchableOpacity
              onPress={() => onShare(group)}
              className="bg-primary/10 p-2.5 rounded-full"
            >
              <QrCode size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
          {isOrganizer && (
            <TouchableOpacity
              onPress={handleLeave}
              className="bg-destructive/10 p-2.5 rounded-full"
            >
              <Trash size={16} color={colors.destructive} />
            </TouchableOpacity>
          )}

          <View className="bg-background p-2.5 rounded-full ml-1">
            <ChevronRight size={16} color={colors.mutedForeground} />
          </View>
        </View>
      </View>

      <View className="flex-col gap-2 items-start">
        <View
          className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border ${
            isOrganizer
              ? "bg-primary border-primary"
              : "bg-transparent border-border"
          }`}
        >
          {isOrganizer ? (
            <ShieldAlert size={14} color={colors.primaryForeground} />
          ) : (
            <User size={14} color={colors.mutedForeground} />
          )}
          <Text
            className={
              isOrganizer
                ? "text-primary-foreground text-xs font-semibold"
                : "text-muted-foreground text-xs font-medium"
            }
          >
            {isOrganizer ? t("components.groupCard.role_organizer") : t("components.groupCard.role_participant")}
          </Text>
        </View>

        {isOrganizer && (
          <Text className="text-muted-foreground text-xs font-medium mt-1">
            {t("components.groupCard.pin")} <Text className="font-bold text-muted-foreground">{group.invitePin}</Text>
          </Text>
        )}
      </View>
    </Pressable>
  );
}
