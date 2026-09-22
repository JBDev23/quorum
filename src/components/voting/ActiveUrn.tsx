import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Vote, Check } from "lucide-react-native";
import { alert } from "@/components/Alert";
import { impactHaptic, selectionHaptic } from "@/lib/haptics";
import type { Poll } from "@/services/polls";

const BLANK_SENTINEL = "__blank__";

interface ActiveUrnProps {
  poll: Poll;
  allowBlankVotes: boolean;
  groupName?: string;
  votingForName?: string;
  onVote: (optionId: string, isBlank: boolean) => Promise<void>;
}

const getOptionConfig = (text?: string, isBlank = false) => {
  if (isBlank) return {
    appBg: "bg-background",
    cardBg: "bg-muted-foreground",
    subtitle: "Sin posición"
  };
  const normalized = text?.toLowerCase() || "";
  if (normalized === "sí" || normalized === "si" || normalized.includes("favor")) {
    return {
      appBg: "bg-background",
      cardBg: "bg-secondary",
      subtitle: "A favor",
    };
  }
  if (normalized === "no" || normalized.includes("contra")) {
    return {
      appBg: "bg-destructive/10",
      cardBg: "bg-destructive",
      subtitle: "En contra",
    };
  }
  return {
    appBg: "bg-background",
    cardBg: "bg-primary",
    subtitle: "Sin posición"
  };
};

export function ActiveUrn({ poll, allowBlankVotes, groupName, votingForName, onVote }: ActiveUrnProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelect = (id: string) => {
    void selectionHaptic();
    setSelectedOption(id);
  };

  const handleSubmit = () => {
    if (!selectedOption) return;

    // Obtenemos el texto de lo que ha seleccionado para la doble confirmación
    const optionText = selectedOption === BLANK_SENTINEL
      ? "Voto en blanco"
      : poll.poll_options?.find(o => o.id === selectedOption)?.text;

    void impactHaptic();

    alert(
      "Confirmar Voto",
      `Vas a votar:\n\n"${optionText}"\n\nEsta acción es irreversible. ¿Estás seguro?`,
      [
        { text: "Modificar", style: "cancel" },
        {
          text: "Sí, Depositar Voto",
          onPress: async () => {
            setIsSubmitting(true);
            try {
              await onVote(selectedOption, selectedOption === BLANK_SENTINEL);
              // On success the parent unmounts this view and shows Success.
            } catch {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const activeConfig = selectedOption
    ? getOptionConfig(
      selectedOption === BLANK_SENTINEL ? undefined : poll.poll_options?.find((o) => o.id === selectedOption)?.text,
      selectedOption === BLANK_SENTINEL
    )
    : null;

  const appBgClass = activeConfig ? activeConfig.appBg : "bg-background";
  const buttonBgClass = activeConfig ? activeConfig.cardBg : "bg-muted";
  const buttonText = selectedOption
    ? `Depositar Voto: ${selectedOption === BLANK_SENTINEL ? "En blanco" : poll.poll_options?.find((o) => o.id === selectedOption)?.text}`
    : "Selecciona una opción";
  const buttonTextColor = selectedOption
    ? activeConfig?.cardBg === "bg-secondary"
      ? "text-secondary-foreground"
      : "text-primary-foreground"
    : "text-muted-foreground";

  return (
    <View className={`flex-1 ${appBgClass}`}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <SafeAreaView>
          <View className="px-6 pt-16 pb-8">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-muted-foreground font-bold text-[10px] tracking-widest uppercase flex-1 mr-2">
                {groupName?.toUpperCase() ?? "COMUNIDAD DE VECINOS"}
              </Text>
              <View className="bg-secondary/10 px-2 py-1 rounded-full border border-secondary/30 flex-row items-center gap-1.5">
                <View className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                <Text className="text-secondary font-bold text-[9px] tracking-widest uppercase">
                  Votación en curso
                </Text>
              </View>
            </View>
            <Text className="text-foreground text-2xl font-extrabold leading-tight">
              {poll.title}
            </Text>
            {votingForName && (
              <View className="mt-3 bg-primary/10 self-start px-3 py-1.5 rounded-full border border-primary/20">
                <Text className="text-primary font-bold text-[12px]">
                  👤 Votando en nombre de: {votingForName}
                </Text>
              </View>
            )}
          </View>

          <View className="px-5 gap-4">
            {poll.poll_options?.map((option) => {
              const isSelected = selectedOption === option.id;
              const config = getOptionConfig(option.text);

              const cardBgClass = isSelected ? config.cardBg : "bg-card";
              const textColorClass = isSelected
                ? config.cardBg === "bg-secondary"
                  ? "text-secondary-foreground"
                  : "text-primary-foreground"
                : "text-foreground";
              const subtitleColorClass = isSelected
                ? config.cardBg === "bg-secondary"
                  ? "text-secondary-foreground/80"
                  : "text-primary-foreground/80"
                : "text-muted-foreground";
              const borderClass = isSelected ? "border-transparent" : "border-border";

              return (
                <TouchableOpacity
                  key={option.id}
                  activeOpacity={0.7}
                  onPress={() => handleSelect(option.id)}
                  className={`p-6 rounded-[24px] flex-row justify-between items-center shadow-sm border ${cardBgClass} ${borderClass}`}
                >
                  <View className="flex-1 pr-4">
                    <Text className={`text-xl font-extrabold mb-1 ${textColorClass}`}>
                      {option.text}
                    </Text>
                    <Text className={`text-[15px] ${subtitleColorClass}`}>
                      {config.subtitle}
                    </Text>
                  </View>

                  <View className={`w-8 h-8 rounded-full border items-center justify-center ${isSelected ? "border-border" : "border-border"
                    }`}>
                    {isSelected && (
                      <Check
                        color={config.cardBg === "bg-secondary" ? "#0A2348" : "#FFFFFF"}
                        size={16}
                        strokeWidth={3}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            {allowBlankVotes && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleSelect(BLANK_SENTINEL)}
                className={`p-6 rounded-[24px] flex-row justify-between items-center shadow-sm border ${selectedOption === BLANK_SENTINEL
                  ? "bg-muted-foreground border-transparent"
                  : "bg-card border-border"
                  }`}
              >
                <View className="flex-1 pr-4">
                  <Text className={`text-xl font-extrabold mb-1 ${selectedOption === BLANK_SENTINEL ? "text-primary-foreground" : "text-foreground"
                    }`}>
                    Voto en blanco
                  </Text>
                  <Text className={`text-[15px] ${selectedOption === BLANK_SENTINEL ? "text-primary-foreground/80" : "text-muted-foreground"
                    }`}>
                    Sin posición
                  </Text>
                </View>
                <View className={`w-8 h-8 rounded-full border items-center justify-center ${selectedOption === BLANK_SENTINEL ? "border-border" : "border-border"
                  }`}>
                  {selectedOption === BLANK_SENTINEL && <Check color="#FFFFFF" size={16} strokeWidth={3} />}
                </View>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 px-5 pt-4 pb-8 bg-transparent">
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!selectedOption || isSubmitting}
          className={`py-5 rounded-[20px] flex-row justify-center items-center gap-2 ${buttonBgClass}`}
        >
          {isSubmitting ? (
            <ActivityIndicator color={selectedOption ? "#FFFFFF" : "#5A7A96"} />
          ) : (
            <Text className={`font-extrabold text-xl ${buttonTextColor}`}>
              {buttonText}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}