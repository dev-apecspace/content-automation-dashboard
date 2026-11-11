import { hasPermission } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import React from "react";

export default async function VideoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const allowed = await hasPermission("videos.view");
  if (!allowed) {
    redirect("/dashboard");
  }
  return <>{children}</>;
}
