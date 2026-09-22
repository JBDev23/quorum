import { View, Text, TouchableOpacity } from "react-native";
import { Clock, ShieldAlert, CheckCircle2 } from "lucide-react-native";
import { router } from "expo-router";

import { MemberPollsSkeleton } from "@/components/skeletons/MemberPollsSkeleton";

export function VotingLoadingState() {
  return <MemberPollsSkeleton />;
}

export function VotingErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <View className="flex-1 bg-background justify-center items-center px-6">
      <Text className="text-destructive text-lg font-bold text-center mb-2">
        Error
      </Text>
      <Text className="text-muted-foreground text-center mb-6">{error}</Text>
      <TouchableOpacity
        onPress={onRetry}
        className="bg-muted px-6 py-3 rounded-full"
      >
        <Text className="text-foreground font-semibold">Reintentar</Text>
      </TouchableOpacity>
    </View>
  );
}

export function VotingWaitingState({
  status,
  accredited,
  hasPoll,
  meetingId,
  isOrganizer = false,
  startDate = null,
}: {
  status: string;
  accredited: boolean;
  hasPoll: boolean;
  meetingId: string;
  isOrganizer?: boolean;
  startDate?: string | null;
}) {
  if (status === "scheduled") {
    const when = startDate
      ? new Date(startDate).toLocaleString("es-ES", {
          weekday: "long",
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

    return (
      <View className="flex-1 bg-background justify-center items-center px-6">
        <Clock size={64} color="#38bdf8" className="mb-6" />
        <Text className="text-foreground text-2xl font-bold text-center mb-2">
          Reunión programada
        </Text>
        <Text className="text-muted-foreground text-center text-base mb-4">
          {when
            ? `Está prevista para el ${when}.`
            : "La fecha aún no está confirmada."}
        </Text>
        <Text className="text-muted-foreground text-center text-sm">
          Cuando el organizador abra las acreditaciones podrás participar.
          Mientras tanto no hay nada que hacer.
        </Text>
      </View>
    );
  }

  if (status === "draft") {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6">
        <Clock size={64} color="#525252" className="mb-6" />
        <Text className="text-foreground text-2xl font-bold text-center mb-2">
          Aún no publicada
        </Text>
        <Text className="text-muted-foreground text-center text-base">
          Esta reunión está en borrador. Cuando el organizador la programe
          verás la fecha aquí.
        </Text>
      </View>
    );
  }

  if (status === "accreditation") {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6">
        <Clock size={64} color="#525252" className="mb-6" />
        <Text className="text-foreground text-2xl font-bold text-center mb-2">
          {accredited ? "Listo para la asamblea" : "Fase de acreditación"}
        </Text>
        <Text className="text-muted-foreground text-center text-base mb-8">
          {accredited
            ? isOrganizer
              ? "Estás acreditado. Las urnas aparecerán aquí cuando inicies la asamblea desde el Panel."
              : "Ya estás acreditado. Las urnas aparecerán aquí cuando el organizador inicie la asamblea."
            : isOrganizer
              ? "La reunión está acreditando asistentes. Inicia la asamblea desde el Panel para abrir las urnas."
              : "La reunión aún está acreditando asistentes. Muestra tu QR en la entrada."}
        </Text>
        {!accredited && !isOrganizer && (
          <TouchableOpacity
            onPress={() =>
              router.push(`/meeting/${meetingId}/member/accreditation`)
            }
            className="bg-secondary w-full max-w-xs py-4 rounded-xl flex-row justify-center items-center shadow-lg"
          >
            <Text className="text-primary-foreground font-bold text-lg">Mostrar mi QR</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (status !== "active") {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6">
        <Clock size={64} color="#525252" className="mb-6" />
        <Text className="text-foreground text-2xl font-bold text-center mb-2">
          {status === "closed" ? "Reunión finalizada" : "Asamblea en pausa"}
        </Text>
        <Text className="text-muted-foreground text-center text-base">
          {status === "closed"
            ? "Ya no hay urnas abiertas en esta asamblea."
            : "La reunión no está en fase activa. Espera a que el organizador dé paso."}
        </Text>
      </View>
    );
  }

  if (!accredited) {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6">
        <ShieldAlert size={64} color="#f59e0b" className="mb-6" />
        <Text className="text-foreground text-2xl font-bold text-center mb-2">
          Sin acreditación
        </Text>
        <Text className="text-muted-foreground text-center text-base mb-8">
          {isOrganizer
            ? "Tu acreditación automática aún no está lista. Vuelve al Panel e inténtalo de nuevo."
            : "Debes mostrar tu QR en la entrada para que el organizador te acredite antes de poder votar."}
        </Text>

        {!isOrganizer && (
          <TouchableOpacity
            onPress={() =>
              router.push(`/meeting/${meetingId}/member/accreditation`)
            }
            className="bg-secondary w-full max-w-xs py-4 rounded-xl flex-row justify-center items-center shadow-lg"
          >
            <Text className="text-primary-foreground font-bold text-lg">Mostrar mi QR</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background justify-center items-center px-6">
      <Clock size={64} color="#525252" className="mb-6" />
      <Text className="text-foreground text-2xl font-bold text-center mb-2">
        Esperando votación
      </Text>
      <Text className="text-muted-foreground text-center text-base">
        El organizador aún no ha lanzado ninguna pregunta. Aparecerá aquí
        automáticamente.
      </Text>
    </View>
  );
}

export function VotingDelegatedAwayState({
  delegateName,
  pollTitle,
}: {
  delegateName: string;
  pollTitle: string;
}) {
  return (
    <View className="flex-1 bg-background justify-center items-center px-6">
      <View className="bg-card w-full border border-border rounded-3xl p-8 items-center shadow-sm">
        <View className="bg-muted p-4 rounded-full mb-6">
          <CheckCircle2 size={64} color="#6A7398" />
        </View>
        <Text className="text-foreground text-3xl font-extrabold text-center mb-3">
          Voto delegado
        </Text>
        <Text className="text-muted-foreground text-center text-base mb-2">
          Has delegado tu voto en{" "}
          <Text className="font-bold text-foreground">{delegateName}</Text>.
        </Text>
        <Text className="text-muted-foreground text-center text-sm">
          No puedes depositar tu propio voto en «{pollTitle}». Esa persona votará
          en tu nombre.
        </Text>
      </View>
    </View>
  );
}

export function VotingSuccessState({
  receipt,
  pollTitle,
}: {
  receipt: string | null;
  pollTitle: string;
}) {
  return (
    <View className="flex-1 bg-background px-6 justify-center items-center">
      <View className="bg-card w-full border border-border rounded-3xl p-8 items-center shadow-sm">
        <View className="bg-success/10 p-4 rounded-full mb-6">
          <CheckCircle2 size={64} color="#10b981" />
        </View>
        <Text className="text-foreground text-3xl font-extrabold text-center mb-3">
          ¡Voto Depositado!
        </Text>
        <Text className="text-muted-foreground text-center text-base mb-8">
          Tu voto ha sido contabilizado de forma segura y anónima.
        </Text>

        <View className="bg-muted p-5 rounded-2xl w-full border border-border">
          <Text className="text-foreground font-bold text-xs uppercase text-center tracking-widest mb-2">
            Hash de urna
          </Text>
          <Text
            className="text-foreground font-mono text-center text-sm"
            numberOfLines={2}
            ellipsizeMode="middle"
          >
            {receipt ?? "Guardado en este dispositivo tras votar"}
          </Text>
        </View>

        <Text className="text-foreground font-semibold text-center text-base mt-8 mb-2">
          {pollTitle}
        </Text>
        <Text className="text-muted-foreground text-center text-xs px-2">
          Guarda este hash. Es la prueba criptográfica de que tu papeleta entró en la urna desde este dispositivo.
        </Text>
      </View>
    </View>
  );
}
