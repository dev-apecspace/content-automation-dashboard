import { NextResponse } from "next/server";

// Health check cho chuỗi tự động đăng bài:
// pg_cron (Supabase) bắn HTTP vào webhook n8n theo khung giờ đã lên lịch →
// n8n quét các item đến hạn và đăng. Nếu n8n chết thì KHÔNG bài nào được
// đăng và app không hề biết → route này cho UI kiểm tra chân "cron → n8n".

const webhookUrl = process.env.NEXT_PUBLIC_AUTO_POST_WEBHOOK;

// Cache 60s để không bắn n8n mỗi lần tải trang
let cache: { at: number; body: Record<string, unknown> } | null = null;
const TTL_MS = 60_000;

export async function GET() {
  if (!webhookUrl) {
    return NextResponse.json({
      ok: false,
      detail: "Chưa cấu hình NEXT_PUBLIC_AUTO_POST_WEBHOOK trong .env.local",
    });
  }

  if (cache && Date.now() - cache.at < TTL_MS) {
    return NextResponse.json(cache.body);
  }

  try {
    // POST body tối giản: workflow n8n chỉ quét item đến hạn → không đăng gì cả
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ health_check: true }),
      // TCP timeout của n8n chết có thể ~20s → cắt ở 6s để UI không treo
      signal: AbortSignal.timeout(6000),
    });
    // N8n còn sống là chính — mã HTTP nào cũng được (200/404/500 đều chứng tỏ server nhận kết nối)
    const body = { ok: true, status: res.status };
    cache = { at: Date.now(), body };
    return NextResponse.json(body);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const body = { ok: false, detail: msg.slice(0, 160) };
    cache = { at: Date.now(), body };
    return NextResponse.json(body);
  }
}
