import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const webhookUrl = process.env.NEXT_PUBLIC_AUTO_POST_WEBHOOK;

export async function POST(request: NextRequest) {
  const { posting_time, platform } = await request.json();

  if (!posting_time || !platform) {
    return Response.json(
      { error: "Thiếu posting_time hoặc platform" },
      { status: 400 }
    );
  }

  // Kiểm tra định dạng đơn giản
  if (!/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/.test(posting_time)) {
    return Response.json(
      { error: "posting_time phải có dạng dd/mm/yyyy HH:mm" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase.rpc("schedule_post_daily_vn", {
    p_webhook_url: webhookUrl,
    p_posting_time: posting_time,
    p_platform: platform,
  });

  if (error) {
    console.error("Lỗi tạo cron:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ success: true, message: data });
}
