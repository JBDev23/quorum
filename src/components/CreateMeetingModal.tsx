import { useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { X } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { alert } from "@/components/Alert";

interface CreateMeetingModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (title: string) => Promise<void>;
  isCreating: boolean;
  groupName: string;
}

export function CreateMeetingModal({ visible, onClose, onCreate, isCreating, groupName }: CreateMeetingModalProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");

  const handleCreate = async () => {
    if (title.trim().length < 3) {
      alert(t("common.warning"), t("components.createMeeting.error_length"));
      return;
    }

    try {
      await onCreate(title);
      setTitle("");
      onClose();
    } catch (err) {
      alert(
        t("common.error"),
        err instanceof Error ? err.message : t("components.createMeeting.error_create")
      );
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 justify-center items-center px-4">
        
        <View className="bg-card w-full max-w-sm border border-border rounded-3xl p-6 shadow-2xl">
          <View className="flex-row justify-between items-start mb-4">
            <View>
              <Text className="text-foreground text-2xl font-bold">{t("components.createMeeting.title")}</Text>
              <Text className="text-secondary-foreground text-sm font-semibold uppercase tracking-wider mt-1">{groupName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={isCreating} className="p-2 bg-muted rounded-full" accessibilityRole="button" accessibilityLabel={t("common.close")}>
              <X color="#a3a3a3" size={20} />
            </TouchableOpacity>
          </View>
          
          <Text className="text-muted-foreground mb-6">
            {t("components.createMeeting.desc")}
          </Text>

          <View className="mb-6">
            <Text className="text-muted-foreground font-medium mb-2 ml-1">{t("components.createMeeting.input_label")}</Text>
            <TextInput
              className="bg-background border border-border text-foreground text-lg rounded-xl px-4 py-4"
              placeholder={t("components.createMeeting.placeholder")}
              placeholderTextColor="#525252"
              autoCapitalize="sentences"
              maxLength={60}
              value={title}
              onChangeText={setTitle}
              editable={!isCreating}
              autoFocus
            />
          </View>

          <TouchableOpacity
            onPress={handleCreate}
            disabled={isCreating || title.trim().length < 3}
            className={`w-full py-4 rounded-xl items-center flex-row justify-center gap-2 ${
              title.trim().length >= 3 && !isCreating ? "bg-secondary" : "bg-secondary/50"
            }`}
          >
            {isCreating ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text className="text-primary-foreground font-bold text-lg">{t("components.createMeeting.create")}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}