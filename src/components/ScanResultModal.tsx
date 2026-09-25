import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, Modal, TouchableOpacity, Image } from "react-native";
import { CheckCircle2, AlertCircle, XCircle, User } from "lucide-react-native";

import { useThemeColors } from "@/theme/useThemeColors";

export type ScanOutcomeData = {
  type: "success" | "existing" | "error";
  title: string;
  message: string;
  user?: {
    fullName: string;
    avatarUrl: string | null;
  };
};

interface ScanResultModalProps {
  outcome: ScanOutcomeData | null;
  onClose: () => void;
}

export function ScanResultModal({ outcome, onClose }: ScanResultModalProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-cierre del modal
  useEffect(() => {
    if (outcome) {
      timeoutRef.current = setTimeout(() => {
        onClose();
      }, 3000);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [outcome, onClose]);

  const handleManualClose = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    onClose();
  };

  if (!outcome) return null;

  return (
    <Modal visible={!!outcome} transparent animationType="fade">
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={handleManualClose} 
        className="flex-1 justify-center items-center px-6 bg-overlay/60"
      >
        <TouchableOpacity 
          activeOpacity={1} 
          className="w-full bg-card border border-border rounded-3xl p-6 items-center shadow-2xl"
        >
          {/* ICONOS DE ESTADO */}
          {outcome.type === "success" && <CheckCircle2 size={64} color="#22c55e" className="mb-4" />}
          {outcome.type === "existing" && <AlertCircle size={64} color={colors.secondary} className="mb-4" />}
          {outcome.type === "error" && <XCircle size={64} color="#ef4444" className="mb-4" />}
          
          <Text className="text-foreground text-2xl font-bold text-center mb-2">
            {outcome.title}
          </Text>
          <Text className="text-muted-foreground text-center mb-6 text-base">
            {outcome.message}
          </Text>

          {/* TARJETA DEL USUARIO (Si existe) */}
          {outcome.user && (
            <View className="flex-row items-center bg-background p-4 rounded-2xl w-full mb-6 border border-border">
              {outcome.user.avatarUrl ? (
                <Image 
                  source={{ uri: outcome.user.avatarUrl }} 
                  className="w-12 h-12 rounded-full bg-muted mr-4"
                />
              ) : (
                <View className="w-12 h-12 rounded-full bg-muted justify-center items-center mr-4">
                  <User size={24} color="#737373" />
                </View>
              )}
              <View className="flex-1">
                <Text className="text-foreground font-bold text-lg" numberOfLines={1}>
                  {outcome.user.fullName}
                </Text>
                <Text className="text-muted-foreground text-sm font-mono mt-0.5">
                  {t("meeting.organizer.scanner.scan_id_verified")}
                </Text>
              </View>
            </View>
          )}

          {/* BOTÓN DE CONTINUAR */}
          <TouchableOpacity 
            onPress={handleManualClose}
            className={`w-full py-4 rounded-xl items-center ${
              outcome.type === "success" ? "bg-success" :
              outcome.type === "existing" ? "bg-secondary" : "bg-destructive"
            }`}
          >
            <Text className="text-primary-foreground font-bold text-lg">{t("meeting.organizer.scanner.continue_btn")}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}