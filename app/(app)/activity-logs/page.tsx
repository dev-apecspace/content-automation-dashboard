"use client";

import { ActivityLogsTab } from "@/components/activity/activity-logs-tab";

export default function ActivityLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-600 drop-shadow-sm pb-1">
          Nhật ký hoạt động
        </h2>
        <p className="text-slate-500 font-medium mt-1">
          Theo dõi tất cả các thay đổi trong hệ thống
        </p>
      </div>

      <ActivityLogsTab />
    </div>
  );
}
