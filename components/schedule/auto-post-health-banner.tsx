"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Bot, Loader2, RefreshCw } from "lucide-react";

// Banner trạng thái auto-post ENGINE (chạy trong app, thay n8n).
// Engine chết/tắt server thì bài hẹn không bao giờ được đăng → làm lộ ngay
// trên trang Lịch đăng. Poll mỗi 30s + nút quét lại ngay.

type HealthData = {
  enabled: boolean;
  startedAt: string | null;
  lastSweepAt: string | null;
  sweeps: number;
  postedCount: number;
  failedCount: number;
  lastError: string | null;
  lastPostedSummary: string | null;
  dueNow: number;
  approvedPending: number;
};

type HealthState = "checking" | "ok" | "down";

function vnTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const vn = new Date(d.getTime() + 7 * 3600_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(vn.getUTCHours())}:${p(vn.getUTCMinutes())}:${p(vn.getUTCSeconds())}`;
}

export function AutoPostHealthBanner() {
  const [state, setState] = useState<HealthState>("checking");
  const [data, setData] = useState<HealthData | null>(null);
  const [rechecking, setRechecking] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/webhook/auto-post-health", { cache: "no-store" });
      const d: HealthData = await r.json();
      setData(d);
      setState(d.enabled ? "ok" : "down");
    } catch {
      setState("down");
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  if (state === "checking") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Đang kiểm tra engine tự động đăng…
      </div>
    );
  }

  if (state === "down") {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-700">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-medium">
            Engine tự động đăng KHÔNG chạy — bài hẹn sẽ KHÔNG được đăng!
          </p>
          <p className="mt-0.5 text-xs opacity-80">
            Engine chạy ngay trong app (không phụ thuộc server ngoài). Nếu thấy
            thông báo này, server vừa khởi động lại lỗi — thử tải lại trang,
            vẫn lỗi thì kiểm tra log server.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-700">
      <span className="flex items-center gap-2 font-medium">
        <Bot className="h-4 w-4" />
        Engine tự động đăng đang chạy
      </span>
      <span className="text-xs">
        Quét mỗi 60s · lần gần nhất {vnTime(data?.lastSweepAt ?? null)}
      </span>
      <span className="text-xs">
        Đã đăng: {data?.postedCount ?? 0} · Lỗi: {data?.failedCount ?? 0}
      </span>
      {(data?.dueNow ?? 0) > 0 && (
        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
          {data?.dueNow} bài đến hạn đang chờ đăng
        </span>
      )}
      {(data?.failedCount ?? 0) > 0 && data?.lastError && (
        <span
          className="max-w-full truncate text-xs text-rose-600"
          title={data.lastError}
        >
          Lỗi gần nhất: {data.lastError}
        </span>
      )}
      <button
        onClick={async () => {
          setRechecking(true);
          await load();
          setRechecking(false);
        }}
        className="ml-auto flex items-center gap-1.5 rounded border border-emerald-500/30 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-500/10"
      >
        <RefreshCw className={`h-3 w-3 ${rechecking ? "animate-spin" : ""}`} />
        Kiểm tra
      </button>
    </div>
  );
}
