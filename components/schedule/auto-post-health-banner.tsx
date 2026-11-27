"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, Radio } from "lucide-react";

// Cảnh báo trạng thái chân "cron → n8n" của chuỗi tự động đăng bài.
// N8n chết thì bài hẹn KHÔNG bao giờ được đăng mà app vẫn im lặng →
// banner này làm lộ ra lỗi ngay trên trang Lịch đăng.

type HealthState = "checking" | "ok" | "down";

export function AutoPostHealthBanner() {
  const [state, setState] = useState<HealthState>("checking");
  const [detail, setDetail] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/webhook/auto-post-health")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setState(d.ok ? "ok" : "down");
        setDetail(d.detail || "");
      })
      .catch(() => {
        if (!alive) return;
        setState("down");
        setDetail("Không gọi được health check");
      });
    return () => {
      alive = false;
    };
  }, []);

  if (state === "checking") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Đang kiểm tra webhook tự động đăng…
      </div>
    );
  }

  if (state === "down") {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-700">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-medium">
            Webhook tự động đăng KHÔNG phản hồi — bài hẹn sẽ KHÔNG được đăng!
          </p>
          <p className="mt-0.5 text-xs opacity-80">
            Server n8n (n8n.apecglobal.net) có vẻ đang tắt — khởi động lại n8n
            thì auto-post hồi sinh, không cần sửa gì trong app.
            {detail ? ` (${detail})` : ""}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-700">
      <Radio className="h-4 w-4" />
      Webhook tự động đăng (n8n) đang hoạt động — bài hẹn sẽ được đăng đúng giờ
    </div>
  );
}
