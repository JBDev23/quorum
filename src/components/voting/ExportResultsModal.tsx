import { useState } from "react";
import { View, Text, Modal, TouchableOpacity, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, FileText, Table, CheckSquare, Square } from "lucide-react-native";
import { exportMeetingResults, type ExportFormat, type ExportOptions } from "@/services/export";
import { useThemeColors } from "@/theme/useThemeColors";

interface ExportResultsModalProps {
  visible: boolean;
  onClose: () => void;
  meetingId: string;
}

export function ExportResultsModal({ visible, onClose, meetingId }: ExportResultsModalProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [options, setOptions] = useState<ExportOptions>({
    includeResults: true,
    includeAttendance: true,
    includeAudit: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    if (!options.includeResults && !options.includeAttendance && !options.includeAudit) {
      setError(t("voting.export_modal.error_min_select"));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await exportMeetingResults(meetingId, format, options);
      onClose(); // Close on success
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : t("voting.export_modal.error_export"));
    } finally {
      setLoading(false);
    }
  };

  const toggleOption = (key: keyof ExportOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-end">
        <SafeAreaView edges={["bottom"]} className="bg-card rounded-t-3xl p-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-foreground text-xl font-bold">{t("voting.export_modal.title")}</Text>
            <TouchableOpacity onPress={onClose} disabled={loading} className="p-2">
              <X size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Formato */}
          <Text className="text-foreground font-semibold mb-3">{t("voting.export_modal.format")}</Text>
          <View className="flex-row gap-4 mb-6">
            <TouchableOpacity
              onPress={() => setFormat("pdf")}
              className={`flex-1 flex-row items-center justify-center py-3 rounded-xl border ${
                format === "pdf" ? "border-primary bg-primary/10" : "border-border bg-background"
              }`}
            >
              <FileText size={20} color={format === "pdf" ? colors.primary : colors.mutedForeground} />
              <Text
                className={`ml-2 font-medium ${
                  format === "pdf" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {t("voting.export_modal.pdf")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFormat("csv")}
              className={`flex-1 flex-row items-center justify-center py-3 rounded-xl border ${
                format === "csv" ? "border-primary bg-primary/10" : "border-border bg-background"
              }`}
            >
              <Table size={20} color={format === "csv" ? colors.primary : colors.mutedForeground} />
              <Text
                className={`ml-2 font-medium ${
                  format === "csv" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {t("voting.export_modal.csv")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Datos a incluir */}
          <Text className="text-foreground font-semibold mb-3">{t("voting.export_modal.data_include")}</Text>
          <View className="gap-3 mb-6">
            <TouchableOpacity
              onPress={() => toggleOption("includeResults")}
              className="flex-row items-center"
            >
              {options.includeResults ? (
                <CheckSquare size={24} color={colors.primary} />
              ) : (
                <Square size={24} color={colors.mutedForeground} />
              )}
              <Text className="text-foreground ml-3 text-base">{t("voting.export_modal.data_results")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => toggleOption("includeAttendance")}
              className="flex-row items-center"
            >
              {options.includeAttendance ? (
                <CheckSquare size={24} color={colors.primary} />
              ) : (
                <Square size={24} color={colors.mutedForeground} />
              )}
              <Text className="text-foreground ml-3 text-base">{t("voting.export_modal.data_attendance")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => toggleOption("includeAudit")}
              className="flex-row items-center"
            >
              {options.includeAudit ? (
                <CheckSquare size={24} color={colors.primary} />
              ) : (
                <Square size={24} color={colors.mutedForeground} />
              )}
              <Text className="text-foreground ml-3 text-base">
                {t("voting.export_modal.data_audit")}
              </Text>
            </TouchableOpacity>
          </View>

          {error && (
            <Text className="text-destructive text-sm text-center mb-4">{error}</Text>
          )}

          <TouchableOpacity
            onPress={handleExport}
            disabled={loading}
            className="bg-primary py-4 rounded-xl items-center justify-center flex-row"
          >
            {loading ? (
              <ActivityIndicator color={colors.card} />
            ) : (
              <Text className="text-primary-foreground font-bold text-lg">
                {t("voting.export_modal.generate", { format: format.toUpperCase() })}
              </Text>
            )}
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
