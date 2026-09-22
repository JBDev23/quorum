import { Modal, View, Text, ScrollView, TouchableOpacity, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { useThemeColors } from "@/theme/useThemeColors";

interface PrivacyModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PrivacyModal({ visible, onClose }: PrivacyModalProps) {
  const colors = useThemeColors();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background" edges={Platform.OS === 'ios' ? [] : ['top', 'bottom']}>
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-border/50 bg-background">
          <Text className="text-foreground text-xl font-bold">Política de Privacidad</Text>
          <TouchableOpacity onPress={onClose} className="p-2 -mr-2 bg-muted rounded-full">
            <X size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6 py-4 bg-card" contentContainerStyle={{ paddingBottom: 40 }}>
          <Text className="text-foreground text-base leading-6 mb-4">
            En JBDev (Jordi Barrachina Méndez) respetamos tu privacidad y estamos comprometidos con la protección de tus datos personales.
          </Text>

          <Text className="text-foreground text-lg font-bold mb-2 mt-4">1. Datos Recopilados</Text>
          <Text className="text-muted-foreground text-[15px] leading-6 mb-4">
            Recopilamos la información básica necesaria para crear tu cuenta (email, nombre y apellidos) y garantizar el correcto funcionamiento del sistema de autenticación, operado de manera segura.
          </Text>

          <Text className="text-foreground text-lg font-bold mb-2 mt-4">2. Anonimato del Voto</Text>
          <Text className="text-muted-foreground text-[15px] leading-6 mb-4">
            El sistema está diseñado para separar la identidad del votante de su voto. Tu participación (el hecho de que has votado) se registra para fines de quórum, pero la opción que has elegido se almacena de forma completamente anónima. Guardamos un hash criptográfico local en tu dispositivo como resguardo.
          </Text>

          <Text className="text-foreground text-lg font-bold mb-2 mt-4">3. Uso de la Información</Text>
          <Text className="text-muted-foreground text-[15px] leading-6 mb-4">
            Utilizamos tus datos únicamente para gestionar tu acceso, enviar notificaciones relacionadas con asambleas y proveer los servicios de la aplicación. No compartimos tus datos con terceros para fines publicitarios.
          </Text>

          <Text className="text-foreground text-lg font-bold mb-2 mt-4">4. Retención de Datos</Text>
          <Text className="text-muted-foreground text-[15px] leading-6 mb-4">
            Conservamos tus datos mientras tu cuenta esté activa. Puedes eliminar tu cuenta permanentemente desde la sección de Ajustes, lo cual borrará tus datos personales. Los votos ya emitidos permanecerán en el escrutinio de forma anónima para garantizar la integridad de resultados pasados.
          </Text>

          <Text className="text-foreground text-lg font-bold mb-2 mt-4">5. Seguridad</Text>
          <Text className="text-muted-foreground text-[15px] leading-6 mb-4">
            Implementamos medidas de seguridad estándar de la industria, incluyendo bases de datos seguras (Supabase) y conexiones cifradas para proteger tu información contra acceso no autorizado.
          </Text>

          <Text className="text-foreground text-lg font-bold mb-2 mt-4">6. Contacto</Text>
          <Text className="text-muted-foreground text-[15px] leading-6 mb-8">
            Si tienes dudas sobre el tratamiento de tus datos o quieres ejercer tus derechos (acceso, rectificación, supresión), contáctanos en: jordibarrachinam@gmail.com
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
