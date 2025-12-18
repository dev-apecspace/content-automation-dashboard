"use client";

import type React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  FileImage,
  Video,
  Calendar,
  FolderOpen,
  HelpCircle,
  Settings,
  X,
  LayoutDashboard,
  LogsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems: { route: string; label: string; icon: React.ElementType }[] = [
  { route: "/content", label: "Bài viết + ảnh", icon: FileImage },
  { route: "/video", label: "Video", icon: Video },
  { route: "/schedules", label: "Lịch đăng", icon: Calendar },
  { route: "/projects", label: "Dự án", icon: FolderOpen },
  { route: "/activity-logs", label: "Nhật ký hoạt động", icon: LogsIcon },
  { route: "/guide", label: "Hướng dẫn", icon: HelpCircle },
  { route: "/settings", label: "Cài đặt", icon: Settings },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-[#0f172a] border-r border-white/10 shadow-2xl text-slate-100 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-6 w-6 text-indigo-400" />
            <span className="text-lg font-bold text-white tracking-wide drop-shadow-md">
              Content Dashboard
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden hover:text-white hover:bg-white/10"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.route}
              className={cn(
                "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                pathname === item.route
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
              onClick={onClose}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-colors duration-200",
                  pathname === item.route
                    ? "text-white"
                    : "text-slate-500 group-hover:text-blue-300"
                )}
              />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 ml-1">
            Trạng thái hệ thống
          </div>
          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 shadow-inner">
            <div className="relative">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]"></div>
              <div className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-emerald-400 blur-sm opacity-50"></div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-200">
                Google Sheets
              </div>
              <div className="text-[10px] text-slate-400">Đã kết nối</div>
            </div>
          </div>
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
}
