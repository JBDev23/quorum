import { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { X, Plus, Trash2 } from "lucide-react-native";

import { alert } from "@/components/Alert";
import { type PollType } from "@/services/polls";
import { useTranslation } from "react-i18next";

interface CreatePollModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (input: {
    title: string;
    type: PollType;
    options?: string[];
  }) => Promise<void>;
  isCreating: boolean;
}

const TYPE_OPTIONS: { value: PollType; titleKey: string; descKey: string }[] = [
  {
    value: "yes_no",
    titleKey: "components.createPoll.type_yes_no",
    descKey: "components.createPoll.yes_no_desc",
  },
  {
    value: "multiple_choice",
    titleKey: "components.createPoll.type_multiple",
    descKey: "components.createPoll.multiple_desc",
  },
];

export function CreatePollModal({
  visible,
  onClose,
  onCreate,
  isCreating,
}: CreatePollModalProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<PollType>("yes_no");
  const [options, setOptions] = useState(["", ""]);

  useEffect(() => {
    if (!visible) return;
    setTitle("");
    setType("yes_no");
    setOptions(["", ""]);
  }, [visible]);

  const filledOptions = options.map((o) => o.trim()).filter(Boolean);
  const canSubmit =
    title.trim().length >= 5 &&
    (type === "yes_no" || filledOptions.length >= 2) &&
    !isCreating;

  const updateOption = (index: number, value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  };

  const addOption = () => {
    if (options.length >= 8) return;
    setOptions((prev) => [...prev, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (title.trim().length < 5) {
      alert(t("common.warning"), t("components.createPoll.error_title"));
      return;
    }
    if (type === "multiple_choice" && filledOptions.length < 2) {
      alert(t("common.warning"), t("components.createPoll.error_options"));
      return;
    }

    try {
      await onCreate({
        title,
        type,
        options: type === "multiple_choice" ? filledOptions : undefined,
      });
    } catch (err) {
      alert(
        t("common.error"),
        err instanceof Error ? err.message : t("components.createPoll.error_save")
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-1 bg-black/80 justify-center items-center px-4">
          <View className="bg-card w-full max-w-sm border border-border rounded-3xl max-h-[90%]">
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 24 }}
            >
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-foreground text-xl font-bold">
                  {t("components.createPoll.title")}
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  disabled={isCreating}
                  className="p-2 bg-muted rounded-full"
                >
                  <X color="#a3a3a3" size={20} />
                </TouchableOpacity>
              </View>

              <Text className="text-muted-foreground font-medium mb-2 ml-1">
                {t("components.createPoll.question")}
              </Text>
              <TextInput
                className="bg-background border border-border text-foreground text-lg rounded-xl px-4 py-4 mb-5"
                placeholder={t("components.createPoll.placeholder")}
                placeholderTextColor="#525252"
                multiline
                numberOfLines={3}
                value={title}
                onChangeText={setTitle}
                editable={!isCreating}
                autoFocus
              />

              <Text className="text-muted-foreground font-medium mb-2 ml-1">
                {t("components.createPoll.poll_type")}
              </Text>
              <View className="gap-2 mb-5">
                {TYPE_OPTIONS.map((option) => {
                  const selected = type === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => setType(option.value)}
                      disabled={isCreating}
                      className={`rounded-xl border px-4 py-3 ${
                        selected
                          ? "bg-secondary/15 border-secondary"
                          : "bg-background border-border"
                      }`}
                    >
                      <Text
                        className={`font-semibold mb-0.5 ${
                          selected ? "text-secondary-foreground" : "text-foreground"
                        }`}
                      >
                        {t(option.titleKey as any)}
                      </Text>
                      <Text className="text-muted-foreground text-sm">
                        {t(option.descKey as any)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {type === "yes_no" ? (
                <Text className="text-muted-foreground text-xs mb-6 px-1">
                  {t("components.createPoll.yes_no_info")}
                </Text>
              ) : (
                <View className="mb-6">
                  <Text className="text-muted-foreground font-medium mb-2 ml-1">
                    {t("components.createPoll.options")}
                  </Text>
                  <View className="gap-2">
                    {options.map((option, index) => (
                      <View key={index} className="flex-row items-center gap-2">
                        <TextInput
                          className="flex-1 bg-background border border-border text-foreground rounded-xl px-4 py-3"
                          placeholder={t("components.createPoll.option_placeholder", { index: index + 1 })}
                          placeholderTextColor="#525252"
                          value={option}
                          onChangeText={(value) => updateOption(index, value)}
                          editable={!isCreating}
                          maxLength={80}
                        />
                        {options.length > 2 && (
                          <TouchableOpacity
                            onPress={() => removeOption(index)}
                            disabled={isCreating}
                            className="p-2.5 bg-destructive/10 rounded-xl"
                          >
                            <Trash2 size={16} color="#ef4444" />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>

                  {options.length < 8 && (
                    <TouchableOpacity
                      onPress={addOption}
                      disabled={isCreating}
                      className="mt-3 flex-row items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border"
                    >
                      <Plus size={16} color="#a3a3a3" />
                      <Text className="text-muted-foreground font-medium">
                        {t("components.createPoll.add_option")}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <TouchableOpacity
                onPress={handleCreate}
                disabled={!canSubmit}
                className={`w-full py-4 rounded-xl items-center flex-row justify-center ${
                  canSubmit ? "bg-secondary" : "bg-secondary/50"
                }`}
              >
                {isCreating ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-primary-foreground font-bold text-lg">
                    {t("components.createPoll.save")}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
