"use client"

import { ActivityLogsTab } from "@/components/activity-logs-tab"

export default function ActivityLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Nhật Ký Hoạt Động</h1>
        <p className="text-gray-600 mt-1">Xem lịch sử hoạt động hệ thống</p>
      </div>

      <ActivityLogsTab />
    </div>
  )
}
