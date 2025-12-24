"use client";

import { useState, useEffect } from "react";
import { SettingsTab } from "@/components/settings/settings-tab";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cài Đặt</h1>
        <p className="text-gray-600 mt-1">
          Quản lý cài đặt hệ thống và tùy chọn
        </p>
      </div>

      <SettingsTab />
    </div>
  );
}
