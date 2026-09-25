import { Modal, View, Text, ScrollView, TouchableOpacity, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "@/theme/useThemeColors";

interface PrivacyModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PrivacyModal({ visible, onClose }: PrivacyModalProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background" edges={Platform.OS === 'ios' ? [] : ['top', 'bottom']}>
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-border/50 bg-background">
          <Text className="text-foreground text-xl font-bold">{t("settings.privacy")}</Text>
          <TouchableOpacity onPress={onClose} className="p-2 -mr-2 bg-muted rounded-full" accessibilityRole="button" accessibilityLabel={t("common.close")}>
            <X size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6 py-4 bg-card" contentContainerStyle={{ paddingBottom: 40 }}>
          <Text className="text-foreground text-base leading-6 mb-4">
            {t("components.privacy.intro")}
          </Text>

          <Text className="text-foreground text-lg font-bold mb-2 mt-4">{t("components.privacy.p1")}</Text>
          <Text className="text-muted-foreground text-[15px] leading-6 mb-4">
            {t("components.privacy.p1_desc")}
          </Text>

          <Text className="text-foreground text-lg font-bold mb-2 mt-4">{t("components.privacy.p2")}</Text>
          <Text className="text-muted-foreground text-[15px] leading-6 mb-4">
            {t("components.privacy.p2_desc")}
          </Text>

          <Text className="text-foreground text-lg font-bold mb-2 mt-4">{t("components.privacy.p3")}</Text>
          <Text className="text-muted-foreground text-[15px] leading-6 mb-4">
            {t("components.privacy.p3_desc")}
          </Text>

          <Text className="text-foreground text-lg font-bold mb-2 mt-4">{t("components.privacy.p4")}</Text>
          <Text className="text-muted-foreground text-[15px] leading-6 mb-4">
            {t("components.privacy.p4_desc")}
          </Text>

          <Text className="text-foreground text-lg font-bold mb-2 mt-4">{t("components.privacy.p5")}</Text>
          <Text className="text-muted-foreground text-[15px] leading-6 mb-4">
            {t("components.privacy.p5_desc")}
          </Text>

          <Text className="text-foreground text-lg font-bold mb-2 mt-4">{t("components.privacy.p6")}</Text>
          <Text className="text-muted-foreground text-[15px] leading-6 mb-8">
            {t("components.privacy.p6_desc")}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
