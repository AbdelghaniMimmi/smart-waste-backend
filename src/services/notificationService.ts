import { NotificationModel } from "../models/Notification";
import { SettingsModel } from "../models/Settings";

const FALLBACK_THRESHOLD = 80;

async function getThreshold(): Promise<number> {
  const settings = await SettingsModel.findOne();
  return settings?.defaultThreshold ?? FALLBACK_THRESHOLD;
}

/**
 * ينشئ إشعارًا فقط عند عبور الحد (وليس عند كل قراءة) لتفادي التكرار.
 */
export async function notifyOnFillChange(
  binId: string,
  previousFill: number | null | undefined,
  newFill: number | null | undefined
): Promise<void> {
  if (typeof newFill !== "number") return;

  try {
    const threshold = await getThreshold();
    const wasCritical =
      typeof previousFill === "number" && previousFill >= threshold;
    const isCritical = newFill >= threshold;

    if (isCritical && !wasCritical) {
      await NotificationModel.create({
        type: "bin_critical",
        binId,
        fillLevel: newFill,
        severity: "critical",
        message: `الحاوية ${binId} وصلت إلى ${newFill}% وتحتاج إلى جمع عاجل`,
      });
      return;
    }

    if (!isCritical && wasCritical) {
      await NotificationModel.create({
        type: "bin_emptied",
        binId,
        fillLevel: newFill,
        severity: "info",
        message: `تم تفريغ الحاوية ${binId} وعادت إلى ${newFill}%`,
      });
    }
  } catch (err) {
    // فشل الإشعار يجب ألا يمنع حفظ قراءة المستشعر
    console.error("Error creating notification:", err);
  }
}
