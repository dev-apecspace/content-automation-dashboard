"use client";

import { GuideTab } from "@/components/guide/guide-tab";

export default function GuidePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Hướng Dẫn</h1>
        <p className="text-gray-600 mt-1">Hướng dẫn sử dụng hệ thống</p>
      </div>

      <GuideTab />
    </div>
  );
}
