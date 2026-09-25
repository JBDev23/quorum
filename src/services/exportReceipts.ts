import AsyncStorage from "@react-native-async-storage/async-storage";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import { getVoteReceipts } from "@/services/profile";
import i18n from "@/lib/i18n";

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Build CSV of vote vault receipts and open the native share sheet. */
export async function exportVoteReceiptsCsv(userId: string): Promise<void> {
  const receipts = await getVoteReceipts(userId);

  if (receipts.length === 0) {
    throw new Error(i18n.t("services.exportReceipts.empty"));
  }

  const rows = receipts.map((r) => {
    const receipt = r.receipt_hash || i18n.t("services.exportReceipts.unavailable_on_device");
    const fecha = new Date(r.voted_at).toISOString();
    return [
      escapeCsv(r.meeting_title),
      escapeCsv(r.poll_title),
      escapeCsv(fecha),
      escapeCsv(receipt),
    ].join(",");
  });

  const csv = ["asamblea,votacion,fecha,recibo_hash", ...rows].join("\n");

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error(i18n.t("services.exportReceipts.share_unavailable"));
  }

  const file = new File(Paths.cache, `caja-fuerte-${Date.now()}.csv`);
  if (file.exists) {
    file.delete();
  }
  file.create();
  file.write(csv);

  await Sharing.shareAsync(file.uri, {
    mimeType: "text/csv",
    dialogTitle: i18n.t("services.exportReceipts.export_vault"),
    UTI: "public.comma-separated-values-text",
  });
}

/** Remove local vote receipt hashes (best-effort, used on account delete). */
export async function clearLocalVoteReceipts(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const receiptKeys = keys.filter((k) => k.startsWith("vote-receipt:"));
  if (receiptKeys.length > 0) {
    await AsyncStorage.multiRemove(receiptKeys);
  }
}
