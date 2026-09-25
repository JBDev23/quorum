import { View, Text, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  return (
    <View className="flex-1 bg-background justify-center items-center px-6">
      <Text className="text-destructive text-lg font-bold text-center mb-2">
        {t("voting.status.error_title")}
      </Text>
      <Text className="text-muted-foreground text-center mb-6">{error}</Text>
      <TouchableOpacity
        onPress={onRetry}
        className="bg-muted px-6 py-3 rounded-full"
      >
        <Text className="text-foreground font-semibold">{t("common.retry")}</Text>
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
  const { t } = useTranslation();
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
          {t("voting.status.scheduled_title")}
        </Text>
        <Text className="text-muted-foreground text-center text-base mb-4">
          {when
            ? t("voting.status.scheduled_date", { date: when })
            : t("voting.status.scheduled_tbd")}
        </Text>
        <Text className="text-muted-foreground text-center text-sm">
          {t("voting.status.scheduled_desc")}
        </Text>
      </View>
    );
  }

  if (status === "draft") {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6">
        <Clock size={64} color="#525252" className="mb-6" />
        <Text className="text-foreground text-2xl font-bold text-center mb-2">
          {t("voting.status.draft_title")}
        </Text>
        <Text className="text-muted-foreground text-center text-base">
          {t("voting.status.draft_desc")}
        </Text>
      </View>
    );
  }

  if (status === "accreditation") {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6">
        <Clock size={64} color="#525252" className="mb-6" />
        <Text className="text-foreground text-2xl font-bold text-center mb-2">
          {accredited ? t("voting.status.acc_ready_title") : t("voting.status.acc_pending_title")}
        </Text>
        <Text className="text-muted-foreground text-center text-base mb-8">
          {accredited
            ? isOrganizer
              ? t("voting.status.acc_ready_org")
              : t("voting.status.acc_ready_member")
            : isOrganizer
              ? t("voting.status.acc_pending_org")
              : t("voting.status.acc_pending_member")}
        </Text>
        {!accredited && !isOrganizer && (
          <TouchableOpacity
            onPress={() =>
              router.push(`/meeting/${meetingId}/member/accreditation`)
            }
            className="bg-secondary w-full max-w-xs py-4 rounded-xl flex-row justify-center items-center shadow-lg"
          >
            <Text className="text-primary-foreground font-bold text-lg">{t("voting.status.show_qr")}</Text>
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
          {status === "closed" ? t("voting.status.paused_closed_title") : t("voting.status.paused_paused_title")}
        </Text>
        <Text className="text-muted-foreground text-center text-base">
          {status === "closed"
            ? t("voting.status.paused_closed_desc")
            : t("voting.status.paused_paused_desc")}
        </Text>
      </View>
    );
  }

  if (!accredited) {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6">
        <ShieldAlert size={64} color="#f59e0b" className="mb-6" />
        <Text className="text-foreground text-2xl font-bold text-center mb-2">
          {t("voting.status.no_acc_title")}
        </Text>
        <Text className="text-muted-foreground text-center text-base mb-8">
          {isOrganizer
            ? t("voting.status.no_acc_org")
            : t("voting.status.no_acc_member")}
        </Text>

        {!isOrganizer && (
          <TouchableOpacity
            onPress={() =>
              router.push(`/meeting/${meetingId}/member/accreditation`)
            }
            className="bg-secondary w-full max-w-xs py-4 rounded-xl flex-row justify-center items-center shadow-lg"
          >
            <Text className="text-primary-foreground font-bold text-lg">{t("voting.status.show_qr")}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background justify-center items-center px-6">
      <Clock size={64} color="#525252" className="mb-6" />
      <Text className="text-foreground text-2xl font-bold text-center mb-2">
        {t("voting.status.waiting_title")}
      </Text>
      <Text className="text-muted-foreground text-center text-base">
        {t("voting.status.waiting_desc")}
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
  const { t } = useTranslation();
  return (
    <View className="flex-1 bg-background justify-center items-center px-6">
      <View className="bg-card w-full border border-border rounded-3xl p-8 items-center shadow-sm">
        <View className="bg-muted p-4 rounded-full mb-6">
          <CheckCircle2 size={64} color="#6A7398" />
        </View>
        <Text className="text-foreground text-3xl font-extrabold text-center mb-3">
          {t("voting.status.delegated_title")}
        </Text>
        <Text className="text-muted-foreground text-center text-base mb-2">
          {t("voting.status.delegated_desc")}{" "}
          <Text className="font-bold text-foreground">{delegateName}</Text>.
        </Text>
        <Text className="text-muted-foreground text-center text-sm">
          {t("voting.status.delegated_info", { title: pollTitle })}
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
  const { t } = useTranslation();
  return (
    <View className="flex-1 bg-background px-6 justify-center items-center">
      <View className="bg-card w-full border border-border rounded-3xl p-8 items-center shadow-sm">
        <View className="bg-success/10 p-4 rounded-full mb-6">
          <CheckCircle2 size={64} color="#10b981" />
        </View>
        <Text className="text-foreground text-3xl font-extrabold text-center mb-3">
          {t("voting.status.success_title")}
        </Text>
        <Text className="text-muted-foreground text-center text-base mb-8">
          {t("voting.status.success_desc")}
        </Text>

        <View className="bg-muted p-5 rounded-2xl w-full border border-border">
          <Text className="text-foreground font-bold text-xs uppercase text-center tracking-widest mb-2">
            {t("voting.status.hash_label")}
          </Text>
          <Text
            className="text-foreground font-mono text-center text-sm"
            numberOfLines={2}
            ellipsizeMode="middle"
          >
            {receipt ?? t("voting.status.hash_empty")}
          </Text>
        </View>

        <Text className="text-foreground font-semibold text-center text-base mt-8 mb-2">
          {pollTitle}
        </Text>
        <Text className="text-muted-foreground text-center text-xs px-2">
          {t("voting.status.hash_info")}
        </Text>
      </View>
    </View>
  );
}
