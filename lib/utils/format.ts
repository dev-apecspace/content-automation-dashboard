/**
 * Định dạng tiền Việt Nam (giá trị đầu vào đã là VND).
 * Riêng với lib/utils/currency.ts (formatVND nhận USD) — không dùng nhầm.
 */
export function formatVnd(amount: number | null | undefined): string {
  const n = Number(amount);
  if (amount == null || Number.isNaN(n)) return "0 ₫";
  return new Intl.NumberFormat("vi-VN").format(n) + " ₫";
}

export function formatDateVi(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
