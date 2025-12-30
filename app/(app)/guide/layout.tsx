import { hasPermission } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import React from "react";

export default async function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const allowed = await hasPermission("guide.view");
  if (!allowed) {
    redirect("/dashboard");
  }
  return <>{children}</>;
}
