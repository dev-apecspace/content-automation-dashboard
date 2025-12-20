export const USD_TO_VND_RATE = 26000;

export function convertUSDToVND(amountUSD: number): number {
  return amountUSD * USD_TO_VND_RATE;
}

export function formatVND(usd: number): string {
  const vnd = convertUSDToVND(usd);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(vnd);
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 3,
  }).format(amount);
}

export function formatCurrency(
  amount: number,
  currency: "USD" | "VND" = "USD"
): string {
  if (currency === "VND") {
    // If input is USD but we want VND output, logic might be ambiguous in generic function without context.
    // BUT looking at cost-utils implementation, it took 'amount' and 'currency'.
    // If currency is VND, it formatted as VND. Assuming amount was already correct?
    // Wait, cost-utils implementation of formatCurrency:
    // if currency === "VND" => format vi-VN.
    // It did NOT convert.
    // So distinct usage: format value AS currency.
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return formatUSD(amount);
}
