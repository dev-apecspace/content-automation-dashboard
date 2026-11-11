"use client";

import type React from "react";
import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <div className="flex h-screen bg-slate-50 dark:bg-slate-950 isolate overflow-hidden relative">
        {/* Background Gradients */}
        <div className="absolute inset-0 z-[-1] pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-200/40 rounded-full blur-[80px] mix-blend-multiply dark:mix-blend-normal dark:bg-purple-900/20" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-green-200/40 rounded-full blur-[80px] mix-blend-multiply dark:mix-blend-normal dark:bg-blue-900/20" />
          <div className="absolute top-[20%] left-[15%] w-[400px] h-[400px] bg-purple-200/30 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-normal dark:bg-pink-900/20" />
        </div>

        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onMobileOpen={() => setSidebarOpen(true)}
          isDesktopOpen={isDesktopOpen}
          onDesktopToggle={() => setIsDesktopOpen(!isDesktopOpen)}
        />
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            <div className="p-6">{children}</div>
          </div>
        </main>
      </div>
      <Toaster />
    </ThemeProvider>
  );
}
