import { useState, useEffect, useCallback, type ComponentType } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Linking,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ChevronLeft,
  Vibrate,
  Moon,
  Sun,
  Smartphone,
  Bell,
  Fingerprint,
  Download,
  LifeBuoy,
  FileText,
  Trash2,
  ChevronRight,
} from "lucide-react-native";

import { TermsModal } from "@/components/TermsModal";
import { PrivacyModal } from "@/components/PrivacyModal";

import { alert } from "@/components/Alert";
import { useAuth } from "@/lib/auth";
import { usePreferences } from "@/lib/preferences";
import { canUseBiometrics } from "@/lib/biometrics";
import {
  SUPPORT_EMAIL,
  TERMS_URL,
  PRIVACY_URL,
} from "@/constants/legal";
import {
  getNotificationPrefs,
  updateNotificationPrefs,
  type NotificationPrefs,
} from "@/services/profile";
import { exportVoteReceiptsCsv, clearLocalVoteReceipts } from "@/services/exportReceipts";
import { deleteAccount } from "@/services/account";
import { useThemeColors } from "@/theme/useThemeColors";
import { SettingsSkeleton } from "@/components/skeletons/SettingsSkeleton";

type IconProps = { size?: number; color?: string };

function SettingSwitchRow({
  icon: Icon,
  title,
  description,
  value,
  onValueChange,
  disabled = false,
  hideBorder = false,
}: {
  icon: ComponentType<IconProps>;
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
  hideBorder?: boolean;
}) {
  const colors = useThemeColors();
  return (
    <View className={`flex-row items-center justify-between py-4 ${hideBorder ? "" : "border-b border-border/30"}`}>
      <View className="flex-row items-center flex-1 pr-4">
        <View className="mr-4">
          <Icon size={22} color={colors.mutedForeground} />
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-semibold text-base">{title}</Text>
          {description ? (
            <Text className="text-muted-foreground text-[13px] mt-0.5">{description}</Text>
          ) : null}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.muted, true: colors.primary }}
        thumbColor={Platform.OS === 'android' ? (value ? colors.primaryForeground : colors.mutedForeground) : undefined}
      />
    </View>
  );
}

function SettingActionRow({
  icon: Icon,
  title,
  description,
  onPress,
  isDanger = false,
  disabled = false,
  hideBorder = false,
}: {
  icon: ComponentType<IconProps>;
  title: string;
  description?: string;
  onPress: () => void;
  isDanger?: boolean;
  disabled?: boolean;
  hideBorder?: boolean;
}) {
  const colors = useThemeColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`flex-row items-center justify-between py-4 ${hideBorder ? "" : "border-b border-border/30"}`}
      style={disabled ? { opacity: 0.5 } : undefined}
    >
      <View className="flex-row items-center flex-1 pr-4">
        <View className="mr-4">
          <Icon size={22} color={isDanger ? colors.destructive : colors.mutedForeground} />
        </View>
        <View className="flex-1">
          <Text
            className={`font-semibold text-base ${isDanger ? "text-destructive" : "text-foreground"}`}
          >
            {title}
          </Text>
          {description ? (
            <Text
              className={`${isDanger ? "text-destructive/70" : "text-muted-foreground"} text-[13px] mt-0.5`}
            >
              {description}
            </Text>
          ) : null}
        </View>
      </View>
      <ChevronRight size={20} color={isDanger ? colors.destructive : colors.mutedForeground} />
    </TouchableOpacity>
  );
}

/** Selected chip style — inline shadow avoids NativeWind shadow-* toggle crash with Expo Router. */
function themeSelectedStyle(card: string, border: string) {
  return {
    backgroundColor: card,
    borderWidth: 1,
    borderColor: border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  } as const;
}

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const {
    hapticEnabled,
    setHapticEnabled,
    theme,
    setTheme,
    bioAuthEnabled,
    setBioAuthEnabled,
    clearDevicePreferences,
  } = usePreferences();

  const [notifyPrefs, setNotifyPrefs] = useState<NotificationPrefs>({
    notify_new_meetings: true,
    notify_doors_open: true,
    notify_polls: true,
  });
  const [notifyLoading, setNotifyLoading] = useState(true);
  const [notifySaving, setNotifySaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setNotifyLoading(true);
    getNotificationPrefs(user.id)
      .then((prefs) => {
        if (!cancelled) setNotifyPrefs(prefs);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) {
          alert("Error", "No se pudieron cargar las preferencias de notificación.");
        }
      })
      .finally(() => {
        if (!cancelled) setNotifyLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const updateNotify = useCallback(
    async (key: keyof NotificationPrefs, value: boolean) => {
      if (!user?.id) return;
      const previous = notifyPrefs;
      const next = { ...notifyPrefs, [key]: value };
      setNotifyPrefs(next);
      setNotifySaving(true);
      try {
        await updateNotificationPrefs(user.id, { [key]: value });
      } catch (err) {
        setNotifyPrefs(previous);
        alert(
          "Error",
          err instanceof Error
            ? err.message
            : "No se pudieron guardar las preferencias."
        );
      } finally {
        setNotifySaving(false);
      }
    },
    [notifyPrefs, user?.id]
  );

  const handleBioToggle = async (enabled: boolean) => {
    if (!enabled) {
      await setBioAuthEnabled(false);
      return;
    }
    const check = await canUseBiometrics();
    if (!check.ok) {
      alert("Biometría no disponible", check.reason ?? "No se puede activar.");
      return;
    }
    await setBioAuthEnabled(true);
  };

  const handleExport = async () => {
    if (!user?.id || exporting) return;
    setExporting(true);
    try {
      await exportVoteReceiptsCsv(user.id);
    } catch (err) {
      if (err instanceof Error && err.message === "EMPTY") {
        alert("Caja fuerte vacía", "No hay recibos para exportar.");
      } else {
        alert(
          "Error",
          err instanceof Error ? err.message : "No se pudo exportar el CSV."
        );
      }
    } finally {
      setExporting(false);
    }
  };

  const performDelete = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      await clearLocalVoteReceipts();
      await clearDevicePreferences();
      try {
        await signOut();
      } catch {
        // Session may already be invalid after delete.
      }
    } catch (err) {
      alert(
        "Error",
        err instanceof Error ? err.message : "No se pudo eliminar la cuenta."
      );
      setDeleting(false);
    }
  };

  const handleDeleteAccount = () => {
    alert(
      "Eliminar Cuenta",
      "Esta acción es irreversible y borrará todos tus datos, excepto los recibos de votación que ya forman parte del escrutinio anónimo.\n\n¿Estás completamente seguro?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, eliminar",
          style: "destructive",
          onPress: () => void performDelete(),
        },
      ]
    );
  };

  const notifyDisabled = notifyLoading || notifySaving || !user?.id;
  const colors = useThemeColors();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="bg-background" stickyHeaderIndices={[0]}>
        <View className="w-full px-6 pt-6 pb-4 bg-background z-10">
          <Text className="text-3xl font-extrabold text-foreground">
            Ajustes
          </Text>
        </View>

        <View className="pt-4 pb-2 px-6">
          <Text className="text-muted-foreground font-bold uppercase text-[11px] tracking-wider">
            PREFERENCIAS
          </Text>
        </View>
        <View className="px-6">
          <SettingSwitchRow
            icon={Vibrate}
            title="Feedback Háptico"
            description="Vibración al votar o escanear códigos"
            value={hapticEnabled}
            onValueChange={(v) => void setHapticEnabled(v)}
          />
          <View className="py-4">
            <View className="flex-row items-center mb-3">
              <View className="mr-4">
                <Moon size={22} color={colors.mutedForeground} />
              </View>
              <Text className="text-foreground font-semibold text-base">Apariencia</Text>
            </View>
            <View className="flex-row bg-muted p-1.5 rounded-[16px] border border-border">
              <TouchableOpacity
                onPress={() => void setTheme("dark")}
                activeOpacity={0.7}
                className="flex-1 flex-row items-center justify-center py-2.5 rounded-[12px] gap-2"
                style={
                  theme === "dark"
                    ? themeSelectedStyle(colors.card, colors.border)
                    : undefined
                }
              >
                <Moon
                  size={16}
                  color={theme === "dark" ? colors.primary : colors.mutedForeground}
                />
                <Text
                  className={`font-bold text-[13px] ${
                    theme === "dark" ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  Oscuro
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => void setTheme("light")}
                activeOpacity={0.7}
                className="flex-1 flex-row items-center justify-center py-2.5 rounded-[12px] gap-2"
                style={
                  theme === "light"
                    ? themeSelectedStyle(colors.card, colors.border)
                    : undefined
                }
              >
                <Sun
                  size={16}
                  color={theme === "light" ? colors.primary : colors.mutedForeground}
                />
                <Text
                  className={`font-bold text-[13px] ${
                    theme === "light" ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  Claro
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => void setTheme("system")}
                activeOpacity={0.7}
                className="flex-1 flex-row items-center justify-center py-2.5 rounded-[12px] gap-2"
                style={
                  theme === "system"
                    ? themeSelectedStyle(colors.card, colors.border)
                    : undefined
                }
              >
                <Smartphone
                  size={16}
                  color={theme === "system" ? colors.primary : colors.mutedForeground}
                />
                <Text
                  className={`font-bold text-[13px] ${
                    theme === "system" ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  Sistema
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View className="pt-6 pb-2 px-6 border-t border-border/30 mt-2">
          <Text className="text-muted-foreground font-bold uppercase text-[11px] tracking-wider">
            NOTIFICACIONES
          </Text>
        </View>
        <View className="px-6 mb-2">
          <Text className="text-muted-foreground text-[13px]">
            Recibirás alertas según tus preferencias cuando haya asambleas, acreditaciones o votaciones.
          </Text>
        </View>
        <View className="px-6">
          {notifyLoading ? (
            <SettingsSkeleton />
          ) : (
            <>
              <SettingSwitchRow
                icon={Bell}
                title="Nuevas Asambleas"
                value={notifyPrefs.notify_new_meetings}
                onValueChange={(v) => void updateNotify("notify_new_meetings", v)}
                disabled={notifyDisabled}
              />
              <SettingSwitchRow
                icon={Bell}
                title="Apertura de Acreditaciones"
                value={notifyPrefs.notify_doors_open}
                onValueChange={(v) => void updateNotify("notify_doors_open", v)}
                disabled={notifyDisabled}
              />
              <SettingSwitchRow
                icon={Bell}
                title="Nuevas Votaciones"
                description="Avisar en tiempo real al abrir urnas"
                value={notifyPrefs.notify_polls}
                onValueChange={(v) => void updateNotify("notify_polls", v)}
                disabled={notifyDisabled}
                hideBorder
              />
            </>
          )}
        </View>

        <View className="pt-6 pb-2 px-6 border-t border-border/30 mt-2">
          <Text className="text-muted-foreground font-bold uppercase text-[11px] tracking-wider">
            PRIVACIDAD Y SEGURIDAD
          </Text>
        </View>
        <View className="px-6">
          <SettingSwitchRow
            icon={Fingerprint}
            title="Protección Biométrica"
            description="Requerir huella o FaceID para emitir un voto"
            value={bioAuthEnabled}
            onValueChange={(v) => void handleBioToggle(v)}
          />
          <SettingActionRow
            icon={Download}
            title="Exportar Caja Fuerte"
            description={
              exporting
                ? "Generando CSV…"
                : "Descargar recibos de votación (CSV)"
            }
            onPress={() => void handleExport()}
            disabled={exporting}
            hideBorder
          />
        </View>

        <View className="pt-6 pb-2 px-6 border-t border-border/30 mt-2">
          <Text className="text-muted-foreground font-bold uppercase text-[11px] tracking-wider">
            ACERCA DE
          </Text>
        </View>
        <View className="px-6">
          <SettingActionRow
            icon={LifeBuoy}
            title="Soporte y Ayuda"
            onPress={() =>
              Linking.openURL(
                `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Ayuda con quorum")}`
              )
            }
          />
          <SettingActionRow
            icon={FileText}
            title="Términos y Condiciones"
            onPress={() => setShowTerms(true)}
          />
          <SettingActionRow
            icon={FileText}
            title="Política de Privacidad"
            onPress={() => setShowPrivacy(true)}
            hideBorder
          />
        </View>

        <View className="px-6 mt-8">
          <SettingActionRow
            icon={Trash2}
            title={deleting ? "Eliminando…" : "Eliminar cuenta"}
            description="Borrar datos personales permanentemente"
            isDanger
            onPress={handleDeleteAccount}
            disabled={deleting}
            hideBorder
          />
        </View>
      </ScrollView>

      <TermsModal visible={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyModal visible={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </SafeAreaView>
  );
}
