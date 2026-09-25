import { useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import { alert } from "@/components/Alert";

interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
  isCreating: boolean;
}

export function CreateGroupModal({ visible, onClose, onCreate, isCreating }: CreateGroupModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");

  const handleCreate = async () => {
    if (name.trim().length < 3) {
      alert(t("common.warning"), t("components.createGroup.error_length"));
      return;
    }

    try {
      await onCreate(name);
      setName(""); 
      onClose(); 
    } catch (err) {
      alert(t("common.error"), err instanceof Error ? err.message : "Error desconocido");
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-overlay/60 justify-center items-center px-4">
        
        <View className="bg-card w-full max-w-sm border border-border rounded-3xl p-6 shadow-2xl">
          <Text className="text-foreground text-2xl font-bold mb-2">{t("components.createGroup.title")}</Text>
          <Text className="text-muted-foreground mb-6">
            {t("components.createGroup.desc")}
          </Text>

          <TextInput
            className="bg-background border border-border text-foreground text-lg rounded-xl px-4 py-4 mb-6"
            placeholder={t("components.createGroup.placeholder")}
            placeholderTextColor="#525252"
            autoCapitalize="words"
            maxLength={40}
            value={name}
            onChangeText={setName}
            editable={!isCreating}
            autoFocus
          />

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              disabled={isCreating}
              className="flex-1 bg-muted py-3 rounded-xl items-center"
            >
              <Text className="text-foreground font-semibold">{t("common.cancel")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCreate}
              disabled={isCreating || name.trim().length < 3}
              className={`flex-1 py-3 rounded-xl items-center ${
                name.trim().length >= 3 && !isCreating ? "bg-secondary" : "bg-secondary/50"
              }`}
            >
              {isCreating ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-primary-foreground font-semibold">{t("components.createGroup.create")}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}