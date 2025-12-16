import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const { post_id, posting_time, platform } = await request.json();

  if (!post_id || !posting_time) {
    return Response.json(
      { error: "Thiếu post_id hoặc posting_time" },
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
    p_post_id: post_id,
    p_posting_time: posting_time,
    p_platform: platform,
  });

  if (error) {
    console.error("Lỗi tạo cron:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ success: true, message: data });
}
