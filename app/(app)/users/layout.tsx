import { hasPermission } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import React from "react";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const allowed = await hasPermission("users.view");
  if (!allowed) {
    redirect("/dashboard");
  }
  return <>{children}</>;
}
