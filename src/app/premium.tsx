import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import {
  X,
  Clock,
  CalendarDays,
  Calendar,
  Infinity as InfinityIcon,
  FileText,
  Users,
  ArrowRight,
  AlertCircle,
} from "lucide-react-native";
import Purchases, {
  PurchasesPackage,
  PACKAGE_TYPE,
} from "react-native-purchases";

import { alert } from "@/components/Alert";
import { useAuth } from "@/lib/auth";
import { syncPremiumStatus } from "@/services/billing";
import { useThemeColors } from "@/theme/useThemeColors";
import { PremiumSkeleton } from "@/components/skeletons/PremiumSkeleton";

export default function PremiumPaywallScreen() {
  const { user } = useAuth();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    async function fetchOfferings() {
      try {
        const offerings = await Purchases.getOfferings();
        if (
          offerings.current !== null &&
          offerings.current.availablePackages.length !== 0
        ) {
          // Ordenamos para que salgan en orden lógico: 24h, Mensual, Anual
          const sorted = [...offerings.current.availablePackages].sort(
            (a, b) => {
              if (a.packageType === PACKAGE_TYPE.ANNUAL) return 1;
              if (b.packageType === PACKAGE_TYPE.ANNUAL) return -1;
              return 0;
            }
          );
          setPackages(sorted);
          if (sorted.length > 0) {
            setSelectedPackage(sorted[0]);
          }
        }
      } catch (error) {
        console.error("Error obteniendo ofertas desde RevenueCat:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchOfferings();
  }, []);

  const finishWithPremium = useCallback(async (granted: boolean) => {
    if (!granted) {
      alert(
        "Compra registrada",
        "La tienda confirmó el pago, pero el acceso Premium aún no está activo. Prueba «Restaurar compras» en unos segundos."
      );
      return;
    }

    try {
      const isPremium = await syncPremiumStatus();
      if (!isPremium) {
        alert(
          "Sincronizando…",
          "Tu compra está confirmada. El acceso Premium puede tardar unos segundos en reflejarse."
        );
        return;
      }

      alert("¡Gracias!", "Tu cuenta ha sido mejorada con éxito.", [
        { text: "Continuar", onPress: () => router.back() },
      ]);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "No se pudo sincronizar Premium.";
      alert("Error de sincronización", message);
    }
  }, []);

  const handlePurchase = async (pkg: PurchasesPackage) => {
    if (!user?.id) return;
    setPurchasing(true);

    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const hasPremium =
        typeof customerInfo.entitlements.active["premium"] !== "undefined";
      await finishWithPremium(hasPremium);
    } catch (error: any) {
      if (!error.userCancelled) {
        alert(
          "Error de compra",
          error.message ?? "No se pudo completar la compra."
        );
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    if (!user?.id) return;
    setPurchasing(true);

    try {
      const customerInfo = await Purchases.restorePurchases();
      const hasPremium =
        typeof customerInfo.entitlements.active["premium"] !== "undefined";

      if (!hasPremium) {
        alert(
          "Sin compras",
          "No encontramos una suscripción Premium activa para restaurar."
        );
        return;
      }

      await finishWithPremium(true);
    } catch (error: any) {
      alert(
        "Error al restaurar",
        error.message ?? "No se pudieron restaurar las compras."
      );
    } finally {
      setPurchasing(false);
    }
  };

  const getPackageInfo = (pkg: PurchasesPackage) => {
    switch (pkg.packageType) {
      case PACKAGE_TYPE.ANNUAL:
        return {
          badge: "Ahorras un 33%",
          suffix: " /mes",
        };
      case PACKAGE_TYPE.MONTHLY:
        return {
          badge: null,
          suffix: " /mes",
        };
      default:
        return {
          badge: null,
          suffix: "",
        };
    }
  };

  return (
    <View className="flex-1 justify-end bg-black/60">
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: "transparentModal",
          animation: "slide_from_bottom",
        }}
      />

      {/* Fondo clickeable para cerrar */}
      <Pressable className="flex-1" onPress={() => router.back()} />

      <View
        className="h-[90%] bg-[#4338ca] rounded-t-[40px] overflow-hidden"
        style={{ paddingBottom: insets.bottom }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* Header Azul */}
          <View className="px-6 pt-6 pb-8">
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-row items-center gap-2">
                <View className="bg-primary-foreground/20 px-2 py-0.5 rounded">
                  <Text className="text-primary-foreground text-xs font-black tracking-widest">
                    PRO
                  </Text>
                </View>
                <Text className="text-primary-foreground font-bold text-lg">quorum Pro</Text>
              </View>
              <TouchableOpacity
                onPress={() => router.back()}
                className="bg-white/10 p-2 rounded-full"
              >
                <X size={20} color="white" />
              </TouchableOpacity>
            </View>

            <Text className="text-primary-foreground text-3xl font-extrabold mb-2">
              Asambleas sin{"\n"}restricciones
            </Text>
            <Text className="text-primary-foreground/80 text-base mb-8 leading-6">
              Desbloquea el límite de 15 participantes y las herramientas de
              exportación y delegaciones.
            </Text>

            <View className="flex-row bg-white/10 rounded-2xl">
              <View className="flex-1 items-center py-4 border-r border-white/10">
                <InfinityIcon size={24} color="white" className="mb-2" />
                <Text className="text-primary-foreground font-bold text-sm">Sin límite</Text>
                <Text className="text-white/60 text-xs mt-0.5">participantes</Text>
              </View>
              <View className="flex-1 items-center py-4 border-r border-white/10">
                <FileText size={24} color="white" className="mb-2" />
                <Text className="text-primary-foreground font-bold text-sm">PDF + CSV</Text>
                <Text className="text-white/60 text-xs mt-0.5">exportación</Text>
              </View>
              <View className="flex-1 items-center py-4">
                <Users size={24} color="white" className="mb-2" />
                <Text className="text-primary-foreground font-bold text-sm">Delegaciones</Text>
                <Text className="text-white/60 text-xs mt-0.5">y apoderados</Text>
              </View>
            </View>
          </View>

          {/* Sección Blanca */}
          <View className="flex-1 bg-background px-6 pt-4 pb-16">
            <View className="w-10 h-1 bg-border rounded-full self-center mb-6" />

            {loading ? (
              <PremiumSkeleton />
            ) : packages.length === 0 ? (
              <View className="bg-card border border-border rounded-[24px] p-8 items-center mt-4 shadow-sm mx-1">
                <View className="w-16 h-16 bg-muted rounded-full items-center justify-center mb-4">
                  <AlertCircle size={32} color="#a3a3a3" />
                </View>
                <Text className="text-foreground text-[19px] font-bold text-center mb-2">
                  Planes no disponibles
                </Text>
                <Text className="text-muted-foreground text-center text-[15px] leading-6 px-4">
                  No se han podido cargar los planes en este momento. Inténtalo más tarde.
                </Text>
              </View>
            ) : (
              <>
                <View className="gap-3">
                  {packages.map((pkg) => {
                    const info = getPackageInfo(pkg);
                    const isSelected = selectedPackage?.identifier === pkg.identifier;

                    return (
                      <TouchableOpacity
                        key={pkg.identifier}
                        onPress={() => setSelectedPackage(pkg)}
                        disabled={purchasing}
                        className={`border p-4 rounded-2xl flex-row items-center justify-between relative ${isSelected
                          ? "border-[#4338ca] bg-[#4338ca]/5"
                          : "border-border bg-card"
                          }`}
                      >
                        {info.badge && (
                          <View className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-[#4338ca]">
                            <Text className="text-primary-foreground text-[10px] font-bold">
                              {info.badge}
                            </Text>
                          </View>
                        )}

                        <View className="flex-row items-center gap-4">
                          <View
                            className={`w-5 h-5 rounded-full ${isSelected
                              ? "border-[6px] border-[#4338ca]"
                              : "border-2 border-border"
                              }`}
                          />
                          <View>
                            <Text className="text-foreground font-bold text-base">
                              {pkg.product.title}
                            </Text>
                            <Text className="text-muted-foreground text-xs mt-0.5">
                              {pkg.product.description}
                            </Text>
                          </View>
                        </View>

                        <View className="flex-row items-baseline">
                          <Text className="text-foreground font-extrabold text-lg">
                            {pkg.product.priceString}
                          </Text>
                          {info.suffix ? (
                            <Text className="text-muted-foreground text-xs font-medium ml-0.5">
                              {info.suffix}
                            </Text>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  onPress={() => selectedPackage && handlePurchase(selectedPackage)}
                  disabled={purchasing || !selectedPackage}
                  className="w-full bg-[#4338ca] rounded-2xl py-4 flex-row items-center justify-center mt-6 shadow-md"
                >
                  <Text className="text-primary-foreground font-bold text-base mr-2">
                    Activar {selectedPackage?.product.title || "Premium"}
                  </Text>
                  <ArrowRight size={20} color="white" />
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              onPress={handleRestore}
              disabled={purchasing}
              className="mt-8 py-3"
            >
              <Text className="text-muted-foreground text-center text-sm font-medium underline">
                Restaurar compras
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {purchasing && (
          <View className="absolute inset-0 bg-background/90 justify-center items-center z-50">
            <ActivityIndicator color={colors.primary} size="large" />
            <Text className="text-primary font-bold mt-4 text-lg">
              Procesando pago seguro...
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}