// Next.js instrumentation hook — chạy 1 lần lúc server boot (dev + standalone).
// Khởi động auto-post engine: quét item đến hạn và đăng Facebook trực tiếp,
// thay thế chuỗi webhook n8n đã ngưng sử dụng.
export async function register() {
  // Build phase (prerender) không chạy engine — chỉ chạy khi server thật boot
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startAutoPostEngine } = await import("./lib/auto-post/engine");
    startAutoPostEngine();
  }
}
