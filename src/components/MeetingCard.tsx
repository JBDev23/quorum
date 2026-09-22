import { View, Text, TouchableOpacity } from "react-native";
import { Href, router } from "expo-router";
import { User, MessageCircle } from "lucide-react-native";

// 1. Definimos las props fuertemente tipadas basadas en tu BD
export interface MeetingCardProps {
  id: string;
  title: string;
  groupId: string;
  groupName: string;
  role: "organizer" | "participant";
  status: "draft" | "scheduled" | "accreditation" | "active" | "closed";
  dateText: string; // Ej: "Empieza en 10 min" o "12 de Octubre"
}

export function MeetingCard({
  id,
  title,
  groupName,
  role,
  status,
  dateText,
}: MeetingCardProps) {
  // Helpers para los colores y textos del estado
  const getStatusConfig = () => {
    switch (status) {
      case "active":
        return {
          color: "bg-emerald-500",
          text: "text-emerald-600",
          bg: "bg-emerald-100",
          label: "En curso",
        };
      case "accreditation":
        return {
          color: "bg-yellow-500",
          text: "text-yellow-600",
          bg: "bg-yellow-100",
          label: "Acreditando",
        };
      case "draft":
        return {
          color: "bg-muted-foreground",
          text: "text-muted-foreground",
          bg: "bg-muted",
          label: "Borrador",
        };
      case "scheduled":
        return {
          color: "bg-sky-500",
          text: "text-sky-600",
          bg: "bg-sky-100",
          label: "Programada",
        };
      case "closed":
        return {
          color: "bg-destructive",
          text: "text-destructive",
          bg: "bg-destructive/20",
          label: "Finalizada",
        };
    }
  };

  const statusConfig = getStatusConfig();
  const isOrganizer = role === "organizer";

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => router.push(`/meeting/${id}` as Href)}
      className="bg-card border border-border rounded-2xl p-4 w-full"
    >
      {/* Cabecera: Estado y Fecha */}
      <View className="flex-row justify-between items-center mb-4">
        <View className={`flex-row items-center gap-1.5 px-2.5 py-1 rounded-full ${statusConfig.bg}`}>
          <View className={`w-1.5 h-1.5 rounded-full ${statusConfig.color}`} />
          <Text
            className={`${statusConfig.text} text-[10px] font-bold uppercase tracking-wider`}
          >
            {statusConfig.label}
          </Text>
        </View>

        <Text className="text-muted-foreground text-xs font-medium">
          {dateText}
        </Text>
      </View>

      {/* Cuerpo: Grupo y Título */}
      <View className="mb-4">
        <Text className="text-primary text-[10px] font-bold mb-1 uppercase tracking-widest">
          {groupName}
        </Text>
        <Text className="text-foreground text-lg font-extrabold leading-tight">
          {title}
        </Text>
      </View>

      {/* Rol del usuario */}
      <View className="flex-row items-center justify-between">
        <View
          className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full ${isOrganizer ? "bg-primary" : "bg-muted"}`}
        >
          {isOrganizer ? (
            <MessageCircle size={14} color="white" />
          ) : (
            <User size={14} className="text-muted-foreground" />
          )}
          <Text
            className={
              isOrganizer
                ? "text-primary-foreground text-xs font-bold"
                : "text-muted-foreground text-xs font-medium"
            }
          >
            {isOrganizer ? "Organizador" : "Participante"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
