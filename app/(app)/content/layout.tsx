import { hasPermission } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import React from "react";

export default async function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const allowed = await hasPermission("content.view");
  if (!allowed) {
    redirect("/dashboard");
  }
  return <>{children}</>;
}
