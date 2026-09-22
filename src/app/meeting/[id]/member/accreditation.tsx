import { useMemo, useState, useEffect, type ReactNode } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import { CheckCircle2, Clock } from "lucide-react-native";

import { useAuth } from "@/lib/auth";
import { useMeeting } from "../_layout";
import { MeetingExitButton } from "@/components/MeetingExitButton";
import { memberTabsForStatus } from "@/types/meeting";
import { supabase } from "@/lib/supabase";
import { useThemeColors } from "@/theme/useThemeColors";
import { AccreditationSkeleton } from "@/components/skeletons/AccreditationSkeleton";

function AccreditationShell({ children }: { children: ReactNode }) {
  return (
    <View className="flex-1 bg-background">
      <SafeAreaView
        edges={["top"]}
        pointerEvents="box-none"
        className="absolute top-0 left-0 z-20 px-4 pt-2"
      >
        <MeetingExitButton />
      </SafeAreaView>
      {children}
    </View>
  );
}

export default function MemberAccreditationScreen() {
  const colors = useThemeColors();
  const { meetingId, status, allowDelegations } = useMeeting();
  const { user } = useAuth();
  const [isAccredited, setIsAccredited] = useState(false);
  const [loading, setLoading] = useState(true);
  const tabs = memberTabsForStatus(status, isAccredited, allowDelegations);

  useEffect(() => {
    if (!user?.id) return;

    let mounted = true;

    const checkAccreditation = async () => {
      const { data } = await supabase
        .from("meeting_attendances")
        .select("user_id")
        .eq("meeting_id", meetingId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (mounted) {
        setIsAccredited(!!data);
        setLoading(false);
      }
    };

    void checkAccreditation();

    const channel = supabase
      .channel(`accreditation-${meetingId}-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "meeting_attendances",
          filter: `meeting_id=eq.${meetingId}`,
        },
        (payload) => {
          if (payload.new.user_id === user.id) {
            setIsAccredited(true);
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, [meetingId, user?.id]);

  const qrPayload = useMemo(() => {
    if (!user?.id) return null;
    return JSON.stringify({
      meeting_id: meetingId,
      user_id: user.id,
      timestamp: Date.now(),
    });
  }, [meetingId, user?.id]);

  if (!tabs.accreditation) {
    return <Redirect href={`/meeting/${meetingId}/member`} />;
  }

  if (loading) {
    return (
      <AccreditationShell>
        <AccreditationSkeleton />
      </AccreditationShell>
    );
  }

  if (!qrPayload) {
    return (
      <AccreditationShell>
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-muted-foreground">Inicia sesión para ver tu QR.</Text>
        </View>
      </AccreditationShell>
    );
  }

  // Accredited while meeting is still in accreditation: wait for assembly to start.
  if (isAccredited) {
    return (
      <AccreditationShell>
        <View className="flex-1 justify-center items-center p-6">
          <View className="bg-card border border-success/80/30 rounded-3xl p-8 items-center w-full max-w-sm">
            <CheckCircle2 size={72} color="#22c55e" className="mb-4" />
            <Text className="text-foreground text-2xl font-bold mb-2 text-center">
              ¡Acreditado!
            </Text>
            <Text className="text-muted-foreground text-center text-base mb-8">
              Tu asistencia está registrada. Aún no hay urnas: la reunión sigue en
              fase de acreditación.
            </Text>

            <View className="w-full bg-background border border-border rounded-2xl p-4 flex-row items-start gap-3">
              <Clock size={22} color="#a3a3a3" />
              <Text className="text-muted-foreground flex-1 text-sm leading-5">
                Cuando el organizador inicie la asamblea, pasarás automáticamente a
                la pestaña Urnas.
              </Text>
            </View>
          </View>
        </View>
      </AccreditationShell>
    );
  }

  return (
    <AccreditationShell>
      <View className="flex-1 justify-center items-center p-6">
        <Text className="text-foreground text-2xl font-bold mb-2">Tu Acreditación</Text>
        <Text className="text-muted-foreground text-center mb-8">
          Muestra este código en la entrada para que el organizador te registre.
        </Text>

        <View className="p-4 bg-card rounded-3xl">
          <QRCode value={qrPayload} size={250} color="black" backgroundColor="white" />
        </View>

        <Text className="text-muted-foreground mt-8 text-xs font-mono">
          Meeting: {meetingId.slice(0, 8)}… · User: {user?.id?.slice(0, 8)}…
        </Text>
      </View>
    </AccreditationShell>
  );
}
