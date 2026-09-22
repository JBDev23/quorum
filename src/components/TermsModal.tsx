import { Modal, View, Text, ScrollView, TouchableOpacity, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { useThemeColors } from "@/theme/useThemeColors";

interface TermsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function TermsModal({ visible, onClose }: TermsModalProps) {
  const colors = useThemeColors();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background" edges={Platform.OS === 'ios' ? [] : ['top', 'bottom']}>
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-border/50 bg-background">
          <Text className="text-foreground text-xl font-bold">Términos y Condiciones</Text>
          <TouchableOpacity onPress={onClose} className="p-2 -mr-2 bg-muted rounded-full">
            <X size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6 py-4 bg-card" contentContainerStyle={{ paddingBottom: 40 }}>
          <Text className="text-foreground text-base leading-6 mb-4">
            Bienvenido a quorum / quorum Pro. Estos Términos y Condiciones ("Términos") rigen tu uso de nuestra aplicación móvil, proporcionada por JBDev (Jordi Barrachina Méndez).
          </Text>

          <Text className="text-foreground text-lg font-bold mb-2 mt-4">1. Aceptación de los Términos</Text>
          <Text className="text-muted-foreground text-[15px] leading-6 mb-4">
            Al acceder y usar esta aplicación, aceptas estar sujeto a estos Términos. Si no estás de acuerdo con alguna parte, no podrás usar nuestro servicio.
          </Text>

          <Text className="text-foreground text-lg font-bold mb-2 mt-4">2. Descripción del Servicio</Text>
          <Text className="text-muted-foreground text-[15px] leading-6 mb-4">
            La aplicación proporciona una plataforma para la gestión de asambleas digitales y votaciones. Incluye un sistema de caja fuerte criptográfica para garantizar la integridad del voto anónimo.
          </Text>

          <Text className="text-foreground text-lg font-bold mb-2 mt-4">3. Cuentas de Usuario</Text>
          <Text className="text-muted-foreground text-[15px] leading-6 mb-4">
            Eres responsable de mantener la confidencialidad de tu cuenta y de las credenciales de acceso. Debes notificarnos inmediatamente sobre cualquier brecha de seguridad. 
          </Text>

          <Text className="text-foreground text-lg font-bold mb-2 mt-4">4. Comportamiento Cívico</Text>
          <Text className="text-muted-foreground text-[15px] leading-6 mb-4">
            Te comprometes a utilizar la plataforma de forma cívica, legal y sin vulnerar los derechos de otros usuarios. Está prohibido intentar alterar los resultados de las votaciones de forma fraudulenta.
          </Text>

          <Text className="text-foreground text-lg font-bold mb-2 mt-4">5. Responsabilidad</Text>
          <Text className="text-muted-foreground text-[15px] leading-6 mb-4">
            JBDev (Jordi Barrachina Méndez) no se hace responsable de las decisiones tomadas en las asambleas alojadas en la plataforma, ni de los daños indirectos, incidentales o consecuentes derivados del uso de la misma.
          </Text>

          <Text className="text-foreground text-lg font-bold mb-2 mt-4">6. Jurisdicción</Text>
          <Text className="text-muted-foreground text-[15px] leading-6 mb-4">
            Estos Términos se rigen por las leyes de España. Cualquier disputa se someterá a los tribunales competentes de dicha jurisdicción.
          </Text>

          <Text className="text-foreground text-lg font-bold mb-2 mt-4">7. Contacto</Text>
          <Text className="text-muted-foreground text-[15px] leading-6 mb-8">
            Para cualquier pregunta sobre estos Términos, puedes contactarnos en: jordibarrachinam@gmail.com
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
