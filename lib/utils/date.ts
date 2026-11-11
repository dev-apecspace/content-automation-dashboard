import { format } from "date-fns";
import { vi } from "date-fns/locale";

export function formatVietnamDate(
  date: string | Date | number,
  formatStr: string = "HH:mm dd/MM/yyyy",
): string {
  if (!date) return "";

  const d = new Date(
    typeof date === "string"
      ? date.replace(" ", "T") + (date.includes("Z") ? "" : "Z")
      : date,
  );

  return format(d, formatStr, { locale: vi });
}

export function formatVietnamDateFull(date: string | Date | number): string {
  return formatVietnamDate(date, "HH:mm:ss dd/MM/yyyy");
}

export function formatManualPostTimestamp(date: Date = new Date()): string {
  return format(date, "ddMMyyHHmm");
}

export function formatPostDate(date: Date = new Date()): string {
  return format(date, "dd/MM/yyyy HH:mm");
}

export function isOverdue(dateStr?: string): boolean {
  if (!dateStr) return false;
  try {
    const [datePart, timePart] = dateStr.includes(" ")
      ? dateStr.split(" ")
      : [dateStr, "00:00"];
    const [day, month, year] = datePart.split("/").map(Number);
    const [hour, minute] = timePart.split(":").map(Number);

    const date = new Date(year, month - 1, day, hour, minute);
    const now = new Date();
    now.setSeconds(0, 0);

    return date < now;
  } catch {
    return false;
  }
}
