import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
} from "react-native";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
} from "lucide-react-native";

import { useThemeColors } from "@/theme/useThemeColors";
import i18n from "@/lib/i18n";

export type AlertButtonStyle = "default" | "cancel" | "destructive";

export type AlertButton = {
  text: string;
  style?: AlertButtonStyle;
  onPress?: () => void | Promise<void>;
};

export type AlertVariant = "default" | "destructive" | "success" | "warning" | "error";

export type AlertConfig = {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  variant?: AlertVariant;
};

type AlertContextValue = {
  show: (config: AlertConfig) => void;
  hide: () => void;
};

const AlertContext = createContext<AlertContextValue | null>(null);

let showAlertRef: ((config: AlertConfig) => void) | null = null;

function inferVariant(config: AlertConfig): AlertVariant {
  if (config.variant) return config.variant;

  const hasDestructive = config.buttons?.some((b) => b.style === "destructive");
  if (hasDestructive) return "destructive";

  const title = config.title.toLowerCase();
  if (
    title.includes("error") ||
    title.includes("sin conexión") ||
    title.includes("inválido")
  ) {
    return "error";
  }
  if (
    title.includes("aviso") ||
    title.includes("vacía") ||
    title.includes("disponible") ||
    title.includes("sin compras")
  ) {
    return "warning";
  }
  if (
    title.includes("listo") ||
    title.includes("gracias") ||
    title.includes("sincronizando")
  ) {
    return "success";
  }

  return "default";
}

const VARIANT_ICON = {
  default: { Icon: Info, bg: "bg-primary/10" },
  destructive: { Icon: AlertTriangle, bg: "bg-destructive/10" },
  error: { Icon: XCircle, bg: "bg-destructive/10" },
  warning: { Icon: AlertTriangle, bg: "bg-warning/10" },
  success: { Icon: CheckCircle2, bg: "bg-success/10" },
} as const;

function buttonClassName(style: AlertButtonStyle | undefined, fullWidth: boolean) {
  const base = `${fullWidth ? "w-full" : "flex-1"} py-3.5 rounded-2xl items-center justify-center`;
  if (style === "cancel") return `${base} bg-muted`;
  if (style === "destructive") return `${base} bg-destructive`;
  return `${base} bg-primary`;
}

function buttonTextClassName(style: AlertButtonStyle | undefined) {
  if (style === "cancel") return "text-foreground font-semibold text-base";
  return "text-primary-foreground font-bold text-base";
}

function AlertDialog({
  config,
  onDismiss,
}: {
  config: AlertConfig;
  onDismiss: () => void;
}) {
  const colors = useThemeColors();
  const [busyIndex, setBusyIndex] = useState<number | null>(null);

  const buttons = useMemo(() => {
    if (config.buttons && config.buttons.length > 0) return config.buttons;
    return [{ text: i18n.t("common.understood"), style: "default" as const }];
  }, [config.buttons]);

  const variant = inferVariant(config);
  const { Icon, bg } = VARIANT_ICON[variant];
  const iconColor =
    variant === "default"
      ? colors.primary
      : variant === "success"
        ? colors.success
        : variant === "warning"
          ? colors.warning
          : colors.destructive;
  const stacked = buttons.length > 2;
  const cancelFirst = [...buttons].sort((a, b) => {
    if (a.style === "cancel" && b.style !== "cancel") return -1;
    if (b.style === "cancel" && a.style !== "cancel") return 1;
    return 0;
  });

  const handlePress = async (button: AlertButton, index: number) => {
    if (busyIndex !== null) return;
    if (!button.onPress) {
      onDismiss();
      return;
    }
    setBusyIndex(index);
    // Dismiss before onPress so navigations (e.g. paywall modal) are not
    // blocked by this RN Modal still being mounted.
    onDismiss();
    try {
      await button.onPress();
    } catch {
      // Alert already dismissed; caller handles its own errors.
    }
  };

  const dismissOnBackdrop = buttons.length === 1;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismissOnBackdrop ? onDismiss : undefined}
    >
      <View className="flex-1 bg-black/45 justify-center items-center px-6">
        {dismissOnBackdrop ? (
          <Pressable
            onPress={onDismiss}
            className="absolute inset-0"
            accessibilityRole="button"
            accessibilityLabel={i18n.t("common.close")}
          />
        ) : null}

        <View className="bg-card w-full max-w-sm border border-border rounded-[24px] p-6 shadow-sm">
          <View className={`w-12 h-12 rounded-full items-center justify-center mb-4 ${bg}`}>
            <Icon size={24} color={iconColor} />
          </View>

          <Text className="text-foreground text-2xl font-extrabold mb-2">
            {config.title}
          </Text>

          {!!config.message && (
            <Text className="text-muted-foreground text-base leading-6 mb-6">
              {config.message}
            </Text>
          )}

          {!config.message && <View className="mb-6" />}

          <View className={stacked ? "gap-3" : "flex-row gap-3"}>
            {cancelFirst.map((button, index) => {
              const originalIndex = buttons.indexOf(button);
              const isBusy = busyIndex === originalIndex;
              return (
                <TouchableOpacity
                  key={`${button.text}-${index}`}
                  activeOpacity={0.85}
                  disabled={busyIndex !== null}
                  onPress={() => void handlePress(button, originalIndex)}
                  className={buttonClassName(button.style, stacked || buttons.length === 1)}
                >
                  {isBusy ? (
                    <ActivityIndicator
                      color={
                        button.style === "cancel"
                          ? colors.foreground
                          : colors.primaryForeground
                      }
                      size="small"
                    />
                  ) : (
                    <Text className={buttonTextClassName(button.style)}>
                      {button.text}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function AlertProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AlertConfig | null>(null);

  const show = useCallback((next: AlertConfig) => {
    setConfig(next);
  }, []);

  const hide = useCallback(() => {
    setConfig(null);
  }, []);

  useEffect(() => {
    showAlertRef = show;
    return () => {
      showAlertRef = null;
    };
  }, [show]);

  const value = useMemo(() => ({ show, hide }), [show, hide]);

  return (
    <AlertContext.Provider value={value}>
      {children}
      {config ? <AlertDialog config={config} onDismiss={hide} /> : null}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) {
    throw new Error("useAlert must be used within AlertProvider");
  }
  return ctx;
}

/** Imperative API compatible with React Native's `Alert.alert`. */
export function alert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
): void {
  if (!showAlertRef) {
    console.warn("[Alert] AlertProvider is not mounted");
    return;
  }
  showAlertRef({ title, message, buttons });
}

/** Promise helper for confirm dialogs. Resolves `true` if confirmed. */
export function confirm(options: {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}): Promise<boolean> {
  return new Promise((resolve) => {
    alert(options.title, options.message, [
      {
        text: options.cancelLabel ?? i18n.t("common.cancel"),
        style: "cancel",
        onPress: () => resolve(false),
      },
      {
        text: options.confirmLabel ?? i18n.t("common.confirm"),
        style: options.destructive ? "destructive" : "default",
        onPress: () => resolve(true),
      },
    ]);
  });
}
