import { useState, useEffect } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { CameraView, Camera } from "expo-camera";
import { X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { alert } from "@/components/Alert";
import { useThemeColors } from "@/theme/useThemeColors";

interface ScanJoinModalProps {
  visible: boolean;
  onClose: () => void;
  onScanSuccess: (pin: string) => void;
}

export function ScanJoinModal({ visible, onClose, onScanSuccess }: ScanJoinModalProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setScanned(false);
      (async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === "granted");
      })();
    }
  }, [visible]);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    try {
      const payload = JSON.parse(data);
      if (payload.type === "quorum_invite" && payload.pin) {
        onScanSuccess(payload.pin);
      } else {
        throw new Error("QR no reconocido");
      }
    } catch (error) {
      alert(t("components.scanJoin.invalid_qr_title"), t("components.scanJoin.invalid_qr_desc"), [
        { text: t("common.retry"), onPress: () => setScanned(false) }
      ]);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-background">
        {hasPermission === false ? (
          <View className="flex-1 justify-center items-center px-4 bg-background">
            <Text className="text-foreground text-center mb-4">{t("components.scanJoin.no_permission")}</Text>
            <TouchableOpacity onPress={onClose} className="bg-muted px-6 py-3 rounded-xl">
              <Text className="text-foreground">{t("components.scanJoin.go_back")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-1">
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            />
            
            <View style={styles.overlay}>
              <View style={[styles.scanBox, { borderColor: colors.primary }]} />
            </View>

            <View 
              className="absolute top-0 left-0 right-0 flex-row items-center px-4 pb-4 bg-black/40"
              style={{ paddingTop: insets.top + 16 }}
            >
              <TouchableOpacity 
                onPress={onClose} 
                className="mr-3 bg-primary-foreground/20 w-10 h-10 rounded-full items-center justify-center"
              >
                <X color="white" size={20} />
              </TouchableOpacity>
              <Text className="text-primary-foreground text-xl font-extrabold flex-1" numberOfLines={1}>
                {t("components.scanJoin.scan_title")}
              </Text>
            </View>

            <View 
              className="absolute left-0 right-0 items-center"
              style={{ bottom: Math.max(insets.bottom + 24, 48) }}
            >
              <View className="bg-card px-6 py-4 rounded-[24px] shadow-lg flex-row items-center gap-3">
                <View className="w-2.5 h-2.5 rounded-full bg-primary" />
                <Text className="text-foreground font-bold">{t("components.scanJoin.aim_qr")}</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanBox: {
    width: 250,
    height: 250,
    borderWidth: 2,
    backgroundColor: "transparent",
    borderRadius: 32,
  }
});
