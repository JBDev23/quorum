import { View, Text } from "react-native";
import { ShieldAlert } from "lucide-react-native";

import {
  MEETING_STATUS_LABELS,
  type MeetingStatus,
} from "@/types/meeting";

const STATUS_STYLES: Record<
  MeetingStatus,
  { wrap: string; text: string; icon: string }
> = {
  draft: {
    wrap: "bg-amber-500/10 border-amber-500/30",
    text: "text-amber-500",
    icon: "#f59e0b",
  },
  scheduled: {
    wrap: "bg-sky-500/10 border-sky-500/30",
    text: "text-sky-400",
    icon: "#38bdf8",
  },
  accreditation: {
    wrap: "bg-yellow-500/10 border-yellow-500/30",
    text: "text-yellow-500",
    icon: "#eab308",
  },
  active: {
    wrap: "bg-success/10 border-success/30",
    text: "text-success",
    icon: "#22c55e",
  },
  closed: {
    wrap: "bg-destructive/10 border-destructive/30",
    text: "text-destructive",
    icon: "#ef4444",
  },
};

type StatusBadgeProps = {
  status: MeetingStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles = STATUS_STYLES[status];

  return (
    <View
      className={`self-start px-3 py-1.5 rounded-full border flex-row items-center gap-2 ${styles.wrap}`}
    >
      <ShieldAlert size={14} color={styles.icon} />
      <Text className={`font-semibold text-sm ${styles.text}`}>
        Fase: {MEETING_STATUS_LABELS[status]}
      </Text>
    </View>
  );
}
