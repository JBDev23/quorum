import { useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { X } from "lucide-react-native";
import { alert } from "@/components/Alert";

interface CreateMeetingModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (title: string) => Promise<void>;
  isCreating: boolean;
  groupName: string;
}

export function CreateMeetingModal({ visible, onClose, onCreate, isCreating, groupName }: CreateMeetingModalProps) {
  const [title, setTitle] = useState("");

  const handleCreate = async () => {
    if (title.trim().length < 3) {
      alert("Aviso", "El título debe tener al menos 3 caracteres.");
      return;
    }

    try {
      await onCreate(title);
      setTitle("");
      onClose();
    } catch (err) {
      alert(
        "Error",
        err instanceof Error ? err.message : "Error al crear la reunión"
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
              <Text className="text-foreground text-2xl font-bold">Nueva Reunión</Text>
              <Text className="text-secondary-foreground text-sm font-semibold uppercase tracking-wider mt-1">{groupName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={isCreating} className="p-2 bg-muted rounded-full">
              <X color="#a3a3a3" size={20} />
            </TouchableOpacity>
          </View>
          
          <Text className="text-muted-foreground mb-6">
            La reunión se creará en estado "Borrador". Podrás configurar la fecha,
            las preguntas y el voto en blanco antes de programarla.
          </Text>

          <View className="mb-6">
            <Text className="text-muted-foreground font-medium mb-2 ml-1">Título o Tema Principal</Text>
            <TextInput
              className="bg-background border border-border text-foreground text-lg rounded-xl px-4 py-4"
              placeholder="Ej: Aprobación de presupuestos 2026"
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
              <Text className="text-primary-foreground font-bold text-lg">Crear y Configurar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}