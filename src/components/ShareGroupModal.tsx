import { Modal, View, Text, TouchableOpacity } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { X } from "lucide-react-native";
import type { GroupListItem } from "@/services/groups";
import { useThemeColors } from "@/theme/useThemeColors";

interface ShareGroupModalProps {
  visible: boolean;
  onClose: () => void;
  group: GroupListItem | null;
}

export function ShareGroupModal({ visible, onClose, group }: ShareGroupModalProps) {
  const colors = useThemeColors();
  if (!group) return null;

  // Payload seguro para que solo nuestra app lo entienda
  const qrPayload = JSON.stringify({
    type: "quorum_invite",
    pin: group.invitePin,
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-overlay/60 justify-center items-center px-4">
        <View className="bg-card w-full max-w-sm border border-border rounded-[32px] p-8 shadow-2xl items-center">
          <TouchableOpacity
            onPress={onClose}
            className="absolute top-5 right-5 w-8 h-8 bg-muted rounded-full items-center justify-center"
          >
            <X color={colors.mutedForeground} size={18} />
          </TouchableOpacity>

          <Text className="text-foreground text-2xl font-extrabold mb-2 text-center pr-8 pl-8 mt-2">
            {group.name}
          </Text>
          <Text className="text-muted-foreground mb-8 text-center text-[15px]">
            Escanea este QR para unirte al instante
          </Text>

          <View className="p-5 bg-card rounded-[24px] mb-8 shadow-sm border border-border">
            <QRCode value={qrPayload} size={200} color="black" backgroundColor="white" />
          </View>

          <View className="bg-primary/10 w-full px-6 py-4 rounded-[24px] border border-primary/20">
            <Text className="text-primary text-[11px] uppercase tracking-widest mb-1.5 text-center font-bold">
              O usa este PIN
            </Text>
            <Text className="text-foreground text-3xl font-mono tracking-widest text-center font-extrabold">
              {group.invitePin}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
