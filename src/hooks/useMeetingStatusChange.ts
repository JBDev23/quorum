import { useState } from "react";

import { alert } from "@/components/Alert";
import { updateMeetingStatus } from "@/services/meetings";
import type { MeetingStatus } from "@/types/meeting";

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel: string;
};

/**
 * Confirms and applies a meeting status transition, then updates local context.
 */
export function useMeetingStatusChange(
  meetingId: string,
  onStatusUpdated: (status: MeetingStatus) => void
) {
  const [isUpdating, setIsUpdating] = useState(false);

  const applyStatus = async (next: MeetingStatus) => {
    setIsUpdating(true);
    try {
      await updateMeetingStatus(meetingId, next);
      onStatusUpdated(next);
    } catch (err) {
      alert(
        "Error",
        err instanceof Error
          ? err.message
          : "No se pudo cambiar el estado de la reunión."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmAndApply = (next: MeetingStatus, options: ConfirmOptions) => {
    alert(options.title, options.message, [
      { text: "Cancelar", style: "cancel" },
      {
        text: options.confirmLabel,
        onPress: () => {
          void applyStatus(next);
        },
      },
    ]);
  };

  return { isUpdating, applyStatus, confirmAndApply };
}
