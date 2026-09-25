import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowRight, ScanLine, Users } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { alert } from "@/components/Alert";
import { useGroups } from "@/hooks/useGroups";
import { GroupCard } from "@/components/GroupCard";
import { ShareGroupModal } from "@/components/ShareGroupModal";
import { ScanJoinModal } from "@/components/ScanJoinModal";
import type { GroupListItem } from "@/services/groups";
import { CreateGroupModal } from "@/components/CreateGroupModal";
import { useThemeColors } from "@/theme/useThemeColors";
import { GroupsSkeleton } from "@/components/skeletons/GroupsSkeleton";

export default function GroupsScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const {
    groups,
    loading,
    error,
    joinGroup,
    quitGroup,
    isJoining,
    createNewGroup,
    isCreating,
  } = useGroups();
  const [pin, setPin] = useState("");

  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [shareGroup, setShareGroup] = useState<GroupListItem | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const handleCreate = async (name: string) => {
    if (name.trim().length < 3) return;
    Keyboard.dismiss();
    try {
      await createNewGroup(name);
      setCreateModalVisible(false);
    } catch (err) {
      alert(
        t("common.error"),
        err instanceof Error ? err.message : t("main.groups.error_create"),
      );
    }
  };

  const handleJoin = async (pinToJoin: string) => {
    if (pinToJoin.trim().length < 4) return;
    Keyboard.dismiss();

    try {
      await joinGroup(pinToJoin);
      setPin("");
      setScanModalVisible(false);
    } catch (err) {
      alert(
        t("common.error"),
        err instanceof Error ? err.message : t("main.groups.error_join"),
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        className="bg-background"
        stickyHeaderIndices={[0]}
      >
        {/* Cabecera Principal */}
        <View className="w-full bg-background px-6 pt-6 pb-4 z-10">
          <Text className="text-3xl font-extrabold text-foreground mb-1">{t("main.groups.title")}</Text>
          <Text className="text-muted-foreground text-base font-medium">
            {loading ? t("main.groups.loading") : t("main.groups.subtitle", { count: groups.length })}
          </Text>
        </View>

        <View className="px-6 flex-1">
        {/* Action Bar */}
        <View className="bg-card border border-border p-2 rounded-[24px] flex-row items-center mb-8 shadow-sm">
          <TextInput
            className="flex-1 text-foreground text-base font-mono tracking-widest px-4 py-3 h-14"
            placeholder={t("main.groups.pin_placeholder")}
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="characters"
            maxLength={8}
            value={pin}
            onChangeText={setPin}
            editable={!isJoining}
            returnKeyType="done"
            onSubmitEditing={() => handleJoin(pin)}
          />

          <View className="flex-row gap-2 pr-1">
            {/* Botón QR */}
            <TouchableOpacity
              onPress={() => setScanModalVisible(true)}
              disabled={isJoining}
              className="h-12 w-12 rounded-[16px] bg-primary/10 justify-center items-center"
            >
              <ScanLine size={22} color={colors.primary} />
            </TouchableOpacity>

            {/* Botón Unirse (Flecha) */}
            <TouchableOpacity
              onPress={() => handleJoin(pin)}
              disabled={isJoining || pin.length < 4}
              className={`h-12 w-12 rounded-[16px] justify-center items-center ${pin.length >= 4 && !isJoining ? "bg-primary" : "bg-muted"
                }`}
            >
              {isJoining ? (
                <ActivityIndicator
                  color={pin.length >= 4 ? colors.primaryForeground : colors.foreground}
                  size="small"
                />
              ) : (
                <ArrowRight
                  size={20}
                  color={colors.primaryForeground}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setCreateModalVisible(true)}
          className="items-center mt-2 mb-6"
        >
          <Text className="text-muted-foreground text-sm font-medium">
            {t("main.groups.are_you_organizer")}
            <Text className="text-primary font-bold">
              {t("main.groups.create_new_group")}
            </Text>
          </Text>
        </TouchableOpacity>

        {/* Lista de Grupos */}
        {loading ? (
          <GroupsSkeleton />
        ) : groups.length === 0 ? (
          <View className="flex-1 items-center justify-center py-10 px-6 my-4 bg-card rounded-3xl border border-border">
            <View className="bg-muted w-20 h-20 rounded-full items-center justify-center mb-6">
              <Users size={36} color={colors.mutedForeground} />
            </View>
            <Text className="text-xl font-bold text-foreground text-center mb-2">
              {t("main.groups.empty_title")}
            </Text>
            <Text className="text-sm text-muted-foreground text-center leading-relaxed mb-8">
              {t("main.groups.empty_desc")}
            </Text>
            
            <View className="w-full gap-3">
              <TouchableOpacity 
                className="w-full bg-primary py-4 rounded-xl items-center justify-center"
                onPress={() => setCreateModalVisible(true)}
              >
                <Text className="text-primary-foreground font-bold text-base">{t("main.groups.btn_create_group")}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="w-full bg-muted py-4 rounded-xl items-center justify-center border border-border"
                onPress={() => setScanModalVisible(true)}
              >
                <Text className="text-foreground font-bold text-base">{t("main.groups.btn_scan_qr")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="gap-4">
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onLeave={(groupId, isOrganizer) => quitGroup(groupId, isOrganizer)}
                onShare={setShareGroup}
              />
            ))}
          </View>
        )}
        </View>
      </ScrollView>

      {/* MODALES */}
      <ShareGroupModal
        visible={!!shareGroup}
        group={shareGroup}
        onClose={() => setShareGroup(null)}
      />

      <ScanJoinModal
        visible={scanModalVisible}
        onClose={() => setScanModalVisible(false)}
        onScanSuccess={(scannedPin) => handleJoin(scannedPin)}
      />

      <CreateGroupModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onCreate={handleCreate}
        isCreating={isCreating}
      />
    </SafeAreaView>
  );
}
