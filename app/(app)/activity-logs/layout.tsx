import { hasPermission } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import React from "react";

export default async function ActivityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const allowed = await hasPermission("activity_logs.view");
  if (!allowed) {
    redirect("/dashboard");
  }
  return <>{children}</>;
}
