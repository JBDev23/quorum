import { useState, useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { Tabs, router } from "expo-router";
import { ShieldCheck, ChevronLeft, Lock } from "lucide-react-native";

import { useAuth } from "@/lib/auth";
import { getVoteReceipts, type VoteReceipt } from "@/services/profile";
import { useThemeColors } from "@/theme/useThemeColors";
import { ReceiptsSkeleton } from "@/components/skeletons/ReceiptsSkeleton";

export default function VaultScreen() {
  const { user } = useAuth();
  const colors = useThemeColors();
  const [receipts, setReceipts] = useState<VoteReceipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    getVoteReceipts(user.id)
      .then(setReceipts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.id]);

  return (
    <View className="flex-1 bg-background">
      <Tabs.Screen
        options={{
          headerShown: true,
          title: "Caja Fuerte",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerShadowVisible: false,
          headerTitleStyle: {
            fontWeight: "bold",
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              className="ml-4 mr-4 w-9 h-9 items-center justify-center"
            >
              <ChevronLeft color={colors.primary} size={24} strokeWidth={2.5} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View className="items-center mt-6 mb-10 px-4">
          <View className="bg-primary/10 p-5 rounded-3xl mb-6">
            <ShieldCheck size={32} color={colors.primary} strokeWidth={2} />
          </View>
          <Text className="text-foreground text-2xl font-bold text-center mb-4">
            Registro Inmutable
          </Text>
          <Text className="text-muted-foreground text-center text-base leading-6">
            Aquí se guardan las pruebas criptográficas de tu participación. Los
            votos son anónimos, pero estos recibos garantizan que tu voto entró
            en la urna.
          </Text>
        </View>

        {loading ? (
          <ReceiptsSkeleton />
        ) : receipts.length === 0 ? (
          <View className="bg-card border border-border p-8 rounded-3xl items-center mt-4">
            <Lock size={32} color="#525252" className="mb-4" />
            <Text className="text-foreground font-bold text-lg mb-2">Caja fuerte vacía</Text>
            <Text className="text-muted-foreground text-center">
              Aún no has participado en ninguna votación oficial.
            </Text>
          </View>
        ) : (
          <View className="gap-4">
            {receipts.map((receipt) => {
              const dateObj = new Date(receipt.voted_at);
              const formattedDate = dateObj.toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              const formattedTime = dateObj.toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              });
              const displayDate = `${formattedDate}, ${formattedTime}`;

              return (
                <View
                  key={`${receipt.poll_id}-${receipt.voted_at}`}
                  className="bg-card border border-border p-6 rounded-3xl"
                >
                  <View className="flex-row justify-between items-center mb-6">
                    <View className="bg-primary/10 px-3 py-1 rounded-full">
                      <Text className="text-primary text-xs font-bold" numberOfLines={1}>
                        {receipt.poll_id.length > 20
                          ? `V-${receipt.poll_id.slice(0, 20)}...`
                          : `V-${receipt.poll_id}`}
                      </Text>
                    </View>
                    <Text className="text-muted-foreground text-xs font-medium" numberOfLines={1}>
                      {displayDate}
                    </Text>
                  </View>

                  <Text className="text-primary text-xs font-bold uppercase tracking-wider mb-1">
                    {receipt.meeting_title}
                  </Text>

                  <Text className="text-foreground text-lg font-bold mb-4">
                    {receipt.poll_title}
                  </Text>

                  <View className="bg-primary/5 p-4 rounded-2xl">
                    <Text className="text-muted-foreground text-xs font-medium mb-2">
                      Hash criptográfico
                    </Text>
                    {receipt.receipt_hash ? (
                      <Text
                        className="text-primary font-mono text-xs leading-5"
                      >
                        {receipt.receipt_hash}
                      </Text>
                    ) : (
                      <Text className="text-muted-foreground text-xs">
                        No disponible en este dispositivo. Se generó al votar y
                        solo se conserva localmente.
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
