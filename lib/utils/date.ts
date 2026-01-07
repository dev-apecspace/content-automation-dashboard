import { format } from "date-fns";
import { vi } from "date-fns/locale";

export function formatVietnamDate(
  date: string | Date | number,
  formatStr: string = "HH:mm dd/MM/yyyy"
): string {
  if (!date) return "";

  const d = new Date(
    typeof date === "string"
      ? date.replace(" ", "T") + (date.includes("Z") ? "" : "Z")
      : date
  );

  return format(d, formatStr, { locale: vi });
}

export function formatVietnamDateFull(date: string | Date | number): string {
  return formatVietnamDate(date, "HH:mm:ss dd/MM/yyyy");
}

export function formatManualPostTimestamp(date: Date = new Date()): string {
  return format(date, "ddMMyyHHmm");
}
