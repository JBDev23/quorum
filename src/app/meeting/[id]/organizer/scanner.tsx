import { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { CameraView, Camera } from "expo-camera";
import { Redirect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Users } from "lucide-react-native";

import { useMeeting } from "../_layout";
import {
  accreditParticipant,
  fetchAttendanceStats,
  type AttendanceStats,
  ParticipantLimitError,
} from "@/services/meetings";
import { organizerTabsForStatus } from "@/types/meeting";
import { openPremiumPaywall } from "@/lib/navigation";
import { supabase } from "@/lib/supabase"; // Necesario para buscar los datos del usuario

import { ScanResultModal, type ScanOutcomeData } from "@/components/ScanResultModal";
import { useThemeColors } from "@/theme/useThemeColors";

export default function OrganizerScannerScreen() {
  const colors = useThemeColors();
  const { meetingId, groupId, status, allowDelegations } = useMeeting();
  const tabs = organizerTabsForStatus(status, allowDelegations);
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scanOutcome, setScanOutcome] = useState<ScanOutcomeData | null>(null);
  
  const [stats, setStats] = useState<AttendanceStats>({ accredited: 0, totalMembers: 0 });

  const loadStats = useCallback(async () => {
    try {
      const data = await fetchAttendanceStats(meetingId, groupId);
      setStats(data);
    } catch (error) {
      console.error("Failed to load stats", error);
    }
  }, [meetingId, groupId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status: permission } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(permission === "granted");
    };
    getCameraPermissions();
  }, []);

  const handleCloseModal = () => {
    setScanOutcome(null);
    setScanned(false); // Permite volver a escanear
  };

  if (!tabs.scanner) {
    return <Redirect href={`/meeting/${meetingId}/organizer`} />;
  }

  const handleBarcodeScanned = async ({ data }: { type: string; data: string }) => {
    setScanned(true);

    try {
      let payload: { meeting_id?: string; user_id?: string };
      try {
        payload = JSON.parse(data);
      } catch {
        throw new Error("Código no válido o corrupto");
      }

      if (!payload.meeting_id || !payload.user_id) {
        throw new Error("Formato QR no válido");
      }

      if (payload.meeting_id !== meetingId) {
        setScanOutcome({
          type: "error",
          title: "Reunión incorrecta",
          message: "Este código QR pertenece a otra asamblea.",
        });
        return;
      }

      // 1. Buscamos los datos del usuario para mostrarlos en el Modal
      const { data: userData } = await supabase
        .from('users')
        .select('first_name, last_name, avatar_url')
        .eq('id', payload.user_id)
        .single();

      const fullName = [userData?.first_name, userData?.last_name]
        .filter(Boolean)
        .join(" ") || "Usuario Desconocido";

      const userInfo = {
        fullName,
        avatarUrl: userData?.avatar_url || null,
      };

      // 2. Acreditamos al usuario en la base de datos
      const result = await accreditParticipant(meetingId, payload.user_id);
      
      // 3. Mostramos el resultado
      if (result === "existing") {
        setScanOutcome({
          type: "existing",
          title: "Ya acreditado",
          message: "Este usuario ya había registrado su asistencia previamente.",
          user: userInfo
        });
      } else {
        loadStats(); // Recargar stats si es nuevo
        setScanOutcome({
          type: "success",
          title: "Acreditado con éxito",
          message: "Asistencia registrada correctamente.",
          user: userInfo
        });
      }

    } catch (error) {
      if (error instanceof ParticipantLimitError) {
        setScanned(false);
        openPremiumPaywall();
        return;
      }

      const message = error instanceof Error ? error.message : "Código no válido o corrupto";
      setScanOutcome({
        type: "error",
        title: "Error de lectura",
        message,
      });
    }
  };

  if (hasPermission === null) {
    return <View className="flex-1 bg-background" />;
  }
  if (hasPermission === false) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-foreground text-lg">No hay acceso a la cámara</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />

      <View style={styles.overlay}>
        <View style={[styles.scanBox, { borderColor: colors.secondary }]} />
      </View>

      {/* Box de Acreditados Superior */}
      <SafeAreaView edges={["top"]} className="absolute top-0 w-full px-5 pt-4 z-10">
        <View className="bg-[#1A1A24] rounded-2xl p-4 flex-row items-center justify-between border border-white/5">
          <View>
            <Text className="text-muted-foreground text-xs font-bold tracking-widest uppercase mb-1">
              Acreditados
            </Text>
            <View className="flex-row items-baseline gap-1">
              <Text className="text-primary-foreground text-3xl font-extrabold">{stats.accredited}</Text>
              <Text className="text-muted-foreground text-xl font-semibold">/ {stats.totalMembers}</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            className="w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg"
            onPress={() => router.push(`/meeting/${meetingId}/organizer`)}
          >
            <Users color="white" size={24} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View className="absolute bottom-10 left-0 right-0 items-center">
        <View className="bg-card/80 px-6 py-3 rounded-full">
          <Text className="text-foreground font-semibold">
            {scanned ? "Procesando código..." : "Apunta al QR del participante"}
          </Text>
        </View>
      </View>

      {/* Componente Modal Abstraído */}
      <ScanResultModal outcome={scanOutcome} onClose={handleCloseModal} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanBox: {
    width: 250,
    height: 250,
    borderWidth: 2,
    backgroundColor: "transparent",
    borderRadius: 16,
  },
});