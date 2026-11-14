// Shared config for outbound n8n webhook calls.
//
// Root cause this file addresses: n8n.apecglobal.net can become unreachable
// (server down / firewall drops TCP). A fetch without a timeout then hangs
// forever inside the API route; the platform proxy eventually kills the
// connection with an HTML 504 page, and the client's res.json() blows up with
// "Unexpected token '<'" instead of a readable error.

export const WEBHOOK_TIMEOUT_MS = 60_000;

export function webhookErrorMessage(err: unknown, fallback = "Lỗi không xác định khi gọi webhook"): string {
  if (
    err instanceof Error &&
    (err.name === "TimeoutError" || err.name === "AbortError")
  ) {
    return `Dịch vụ webhook (n8n) không phản hồi sau ${WEBHOOK_TIMEOUT_MS / 1000}s — server có thể đang tắt hoặc chặn kết nối. Vui lòng thử lại sau.`;
  }
  // Bun/undici surfaces DNS/TCP failures as a bare TypeError("fetch failed").
  const cause = (err as any)?.cause?.code;
  if (
    (err instanceof Error && err.message === "fetch failed") ||
    ["ECONNREFUSED", "ECONNRESET", "ENOTFOUND", "EAI_AGAIN", "EHOSTUNREACH", "ETIMEDOUT"].includes(cause)
  ) {
    return "Không thể kết nối tới dịch vụ webhook (n8n) — server có thể đang tắt hoặc chặn kết nối. Vui lòng liên hệ admin kiểm tra n8n.apecglobal.net.";
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
