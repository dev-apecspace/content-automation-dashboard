"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { FileImage, Video, Calendar, FolderOpen, HelpCircle, Settings, X, LayoutDashboard, LogsIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const menuItems: { route: string; label: string; icon: React.ElementType }[] = [
  { route: "/content", label: "Bài viết + ảnh", icon: FileImage },
  { route: "/video", label: "Video", icon: Video },
  { route: "/schedules", label: "Lịch đăng", icon: Calendar },
  { route: "/projects", label: "Dự án", icon: FolderOpen },
  { route: "/activity-logs", label: "Nhật ký hoạt động", icon: LogsIcon },
  { route: "/guide", label: "Hướng dẫn", icon: HelpCircle },
  { route: "/settings", label: "Cài đặt", icon: Settings },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-[#1a365d] text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between p-5 border-b border-blue-800">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-7 w-7 text-blue-300" />
            <span className="text-lg font-bold">Content Dashboard</span>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden text-white hover:bg-blue-800" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.route}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2 rounded-md text-white/80 hover:bg-blue-800 hover:text-white transition-colors",
                pathname === item.route && "bg-blue-700 text-white",
              )}
              onClick={onClose}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-blue-800">
          <div className="text-xs text-blue-300">Kết nối với Google Sheets</div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-400"></div>
            <span className="text-sm text-white/80">Đã kết nối</span>
          </div>
        </div>
      </aside>

      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}
    </>
  )
}
