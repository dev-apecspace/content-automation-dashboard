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
  UserCircle,
  LogOut,
  Shield,
  ShieldCheck,
  ChevronLeft,
  PanelLeft,
  Menu,
  Users,
  SquareUser,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onMobileOpen?: () => void;
  isDesktopOpen?: boolean;
  onDesktopToggle?: () => void;
}

import { PermissionId } from "@/lib/constants/permissions";
import { usePermissions } from "@/hooks/use-permissions";

import { getMyProfile } from "@/actions/auth-actions";
import { useEffect, useState } from "react";
import { useUser } from "@/hooks/use-user";

interface MenuItem {
  route: string;
  label: string;
  icon: React.ElementType;
  permission?: PermissionId;
}

const menuItems: MenuItem[] = [
  { route: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    route: "/content",
    label: "Bài viết + ảnh",
    icon: FileImage,
    permission: "content.view",
  },
  { route: "/video", label: "Video", icon: Video, permission: "videos.view" },
  {
    route: "/schedules",
    label: "Lịch đăng",
    icon: Calendar,
    permission: "schedules.view",
  },
  {
    route: "/projects",
    label: "Dự án",
    icon: FolderOpen,
    permission: "projects.view",
  },
  {
    route: "/accounts",
    label: "Tài khoản MXH",
    icon: SquareUser,
    permission: "accounts.view",
  },
  {
    route: "/users",
    label: "Người dùng",
    icon: Users,
    permission: "users.view",
  },
  {
    route: "/roles",
    label: "Phân quyền",
    icon: ShieldCheck,
    permission: "roles.view",
  },
  {
    route: "/activity-logs",
    label: "Nhật ký hoạt động",
    icon: LogsIcon,
    permission: "activity_logs.view",
  },
  {
    route: "/guide",
    label: "Hướng dẫn",
    icon: HelpCircle,
    permission: "guide.view",
  },
  {
    route: "/settings",
    label: "Cài đặt",
    icon: Settings,
    permission: "settings.view",
  },
];

export function Sidebar({
  isOpen,
  onClose,
  onMobileOpen,
  isDesktopOpen = true,
  onDesktopToggle,
}: SidebarProps) {
  const pathname = usePathname();
  const { hasPermission } = usePermissions();
  const { user, fetchUser } = useUser();

  useEffect(() => {
    if (!user) {
      fetchUser();
    }
  }, [user, fetchUser]);

  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-[#0f172a] border-r border-white/10 shadow-2xl text-slate-100 transition-all duration-300 ease-in-out lg:static flex flex-col",
          // Mobile state
          isOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop state
          isDesktopOpen
            ? "w-64 lg:translate-x-0"
            : "w-64 lg:w-20 lg:translate-x-0"
        )}
      >
        <div
          className={cn(
            "flex items-center p-5 border-b border-white/10 bg-white/5 transition-all duration-300",
            isDesktopOpen ? "justify-between" : "justify-center"
          )}
        >
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <LayoutDashboard className="h-6 w-6 min-w-[24px] text-indigo-400" />
            <span
              className={cn(
                "text-lg font-bold text-white tracking-wide drop-shadow-md transition-opacity duration-300",
                isDesktopOpen ? "opacity-100" : "opacity-0 w-0 hidden delay-0"
              )}
            >
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

        <nav
          className={cn(
            "flex-1 p-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent",
            isDesktopOpen ? "min-w-[256px]" : "min-w-[80px]"
          )}
        >
          {filteredMenuItems.map((item) => (
            <Link
              key={item.label}
              href={item.route}
              className={cn(
                "flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                pathname === item.route
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                  : "text-slate-400 hover:bg-white/5 hover:text-white",
                !isDesktopOpen && "justify-center"
              )}
              onClick={onClose}
              title={!isDesktopOpen ? item.label : undefined}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-colors duration-200 min-w-[20px]",
                  pathname === item.route
                    ? "text-white"
                    : "text-slate-500 group-hover:text-blue-300"
                )}
              />
              <span
                className={cn(
                  "font-medium transition-all duration-300 whitespace-nowrap",
                  isDesktopOpen ? "opacity-100" : "opacity-0 w-0 hidden"
                )}
              >
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div
            className={cn(
              "flex items-center gap-3 transition-all duration-300",
              isDesktopOpen ? "justify-start" : "justify-center"
            )}
          >
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg shrink-0">
              {user?.name ? (
                user.name.charAt(0).toUpperCase()
              ) : (
                <UserCircle className="h-6 w-6" />
              )}
            </div>

            <div
              className={cn(
                "flex-1 min-w-0 overflow-hidden transition-all duration-300",
                isDesktopOpen ? "opacity-100" : "opacity-0 w-0 hidden"
              )}
            >
              <p className="text-sm font-medium text-white truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "text-slate-400 hover:text-red-400 hover:bg-red-500/10 shrink-0 cursor-pointer",
                !isDesktopOpen &&
                  "hidden group-hover:flex absolute inset-0 bg-black/50 backdrop-blur-sm rounded-xl"
              )}
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/login";
              }}
              title="Đăng xuất"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Toggle Button */}
      {!isOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden fixed left-4 top-4 z-40 bg-white/10 backdrop-blur-md border border-white/20 text-slate-700 shadow-lg"
          onClick={onMobileOpen}
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Desktop Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "fixed z-[50] hidden lg:flex items-center justify-center transition-all duration-300 ease-in-out",
          "h-8 w-8 rounded-full",
          "bg-white/10 backdrop-blur-md border border-white/20 shadow-lg", // Glassmorphism
          "text-white hover:bg-white/20 hover:text-blue-300 hover:border-blue-300/50 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)]",
          "active:scale-95",
          "cursor-pointer",
          isDesktopOpen ? "left-[15rem]" : "left-[4rem]",
          "top-8"
        )}
        onClick={onDesktopToggle}
      >
        <ChevronLeft
          className={cn(
            "h-4 w-4 transition-transform duration-300",
            !isDesktopOpen && "rotate-180"
          )}
        />
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
}
