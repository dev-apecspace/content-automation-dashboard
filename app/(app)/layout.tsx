"use client";

import type React from "react";
import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";
import { useFullscreen } from "@/stores/useFullscreenStore";
import { ImageFullscreenViewer } from "@/components/shared/ImageFullScreenViewer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { imageSrc, close } = useFullscreen();

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/50">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            <div className="p-6">{children}</div>
          </div>
        </main>
      </div>
      <Toaster />

      <ImageFullscreenViewer
        src={imageSrc || ""}
        alt="Ảnh fullscreen"
        isOpen={!!imageSrc}
        onClose={close}
      />
    </ThemeProvider>
  );
}
