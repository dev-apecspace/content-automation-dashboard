import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { engineStats, parseVnPostingTime } from "@/lib/auto-post/engine";

// Trạng thái auto-post engine (lib/auto-post/engine chạy trong cùng process —
// khởi động từ instrumentation.ts). Thay cho health check n8n đã ngưng sử dụng.

let client: SupabaseClient | null = null;
function getServiceClient(): SupabaseClient | null {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export async function GET() {
  const svc = getServiceClient();
  let dueNow = 0;
  let approvedPending = 0;

  if (svc) {
    const now = Date.now();
    for (const table of ["content_items", "video_items"] as const) {
      const { data } = await svc
        .from(table)
        .select("posting_time")
        .eq("status", "content_approved");
      for (const row of data || []) {
        approvedPending += 1;
        const due = parseVnPostingTime(row.posting_time);
        if (due && due.getTime() <= now) dueNow += 1;
      }
    }
  }

  return NextResponse.json({
    ...engineStats,
    dueNow,
    approvedPending,
  });
}
