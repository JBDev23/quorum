import { useEffect, useState } from "react";
import { Platform, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Calendar } from "lucide-react-native";

import { PanelActionRow } from "@/components/organizer/PanelActionRow";
import {
  fetchMeetingStartDate,
  updateMeetingDate,
} from "@/services/meetings";
import { useThemeColors } from "@/theme/useThemeColors";
import { useTranslation } from "react-i18next";

type MeetingDatePickerProps = {
  meetingId: string;
  editable?: boolean;
};

function formatFriendlyDate(date: Date, locale: string) {
  return date.toLocaleString(locale, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MeetingDatePicker({
  meetingId,
  editable = true,
}: MeetingDatePickerProps) {
  const colors = useThemeColors();
  const { t, i18n } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isUpdatingDate, setIsUpdatingDate] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [androidMode, setAndroidMode] = useState<"date" | "time">("date");
  const [tempDate, setTempDate] = useState(new Date());

  const [minDate] = useState(new Date());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const start = await fetchMeetingStartDate(meetingId);
        if (!cancelled && start) setCurrentDate(start);
      } catch {
        // Keep local default if fetch fails.
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [meetingId]);

  const persistDate = async (date: Date) => {
    setIsUpdatingDate(true);
    try {
      await updateMeetingDate(meetingId, date);
      setCurrentDate(date);
    } finally {
      setIsUpdatingDate(false);
    }
  };

  const openPicker = () => {
    if (!editable) return;
    if (Platform.OS === "android") {
      setAndroidMode("date");
      setTempDate(currentDate);
    }
    setShowDatePicker(true);
  };

  const handleDateChange = async (
    event: { type: string },
    selectedDate?: Date
  ) => {
    if (event.type === "dismissed" || !selectedDate) {
      setShowDatePicker(false);
      return;
    }

    if (Platform.OS === "android") {
      setShowDatePicker(false);

      if (androidMode === "date") {
        setTempDate(selectedDate);
        setAndroidMode("time");
        setTimeout(() => setShowDatePicker(true), 100);
      } else {
        const finalDate = new Date(tempDate);
        finalDate.setHours(
          selectedDate.getHours(),
          selectedDate.getMinutes()
        );
        await persistDate(finalDate);
      }
      return;
    }

    await persistDate(selectedDate);
  };

  const pickerValue = Platform.OS === "android" ? tempDate : currentDate;
  const effectiveMinDate = pickerValue < minDate ? pickerValue : minDate;

  return (
    <View>
      <PanelActionRow
        title={t("meeting.organizer.components.meetingDate.title")}
        subtitle={formatFriendlyDate(currentDate, i18n.language)}
        icon={<Calendar size={24} color={colors.secondary} />}
        onPress={editable ? openPicker : undefined}
        disabled={!editable}
        loading={isUpdatingDate}
      />

      {showDatePicker && editable ? (
        <DateTimePicker
          value={pickerValue}
          mode={Platform.OS === "android" ? androidMode : "datetime"}
          display="default"
          onChange={handleDateChange}
          minimumDate={effectiveMinDate}
        />
      ) : null}
    </View>
  );
}
