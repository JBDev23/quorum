import { Modal, View, Text, ScrollView, TouchableOpacity, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "@/theme/useThemeColors";

interface TermsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function TermsModal({ visible, onClose }: TermsModalProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background" edges={Platform.OS === 'ios' ? [] : ['top', 'bottom']}>
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-border/50 bg-background">
          <Text className="text-foreground text-xl font-bold">{t("settings.terms")}</Text>
          <TouchableOpacity onPress={onClose} className="p-2 -mr-2 bg-muted rounded-full" accessibilityRole="button" accessibilityLabel={t("common.close")}>
            <X size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6 py-4 bg-card" contentContainerStyle={{ paddingBottom: 40 }}>
          <Text className="text-foreground text-base leading-6 mb-4">
            {t("components.terms.intro")}
          </Text>

          <Text className="text-foreground text-lg font-bold mb-2 mt-4">{t("components.terms.p1")}</Text>
          <Text className="text-muted-foreground text-[15px] leading-6 mb-4">
            {t("components.terms.p1_desc")}
          </Text>

          <Text className="text-foreground text-lg font-bold mb-2 mt-4">{t("components.terms.p2")}</Text>
          <Text className="text-muted-foreground text-[15px] leading-6 mb-4">
            {t("components.terms.p2_desc")}
          </Text>

          <Text className="text-foreground text-lg font-bold mb-2 mt-4">{t("components.terms.p3")}</Text>
          <Text className="text-muted-foreground text-[15px] leading-6 mb-4">
            {t("components.terms.p3_desc")}
          </Text>

          <Text className="text-foreground text-lg font-bold mb-2 mt-4">{t("components.terms.p4")}</Text>
          <Text className="text-muted-foreground text-[15px] leading-6 mb-4">
            {t("components.terms.p4_desc")}
          </Text>

          <Text className="text-foreground text-lg font-bold mb-2 mt-4">{t("components.terms.p5")}</Text>
          <Text className="text-muted-foreground text-[15px] leading-6 mb-4">
            {t("components.terms.p5_desc")}
          </Text>

          <Text className="text-foreground text-lg font-bold mb-2 mt-4">{t("components.terms.p6")}</Text>
          <Text className="text-muted-foreground text-[15px] leading-6 mb-4">
            {t("components.terms.p6_desc")}
          </Text>

          <Text className="text-foreground text-lg font-bold mb-2 mt-4">{t("components.terms.p7")}</Text>
          <Text className="text-muted-foreground text-[15px] leading-6 mb-8">
            {t("components.terms.p7_desc")}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
