import { hasPermission, getCurrentUser } from "@/lib/auth/permissions";
import { createActivityLog } from "@/lib/api/activity-logs";
import { redirect } from "next/navigation";
import React from "react";

export default async function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const allowed = await hasPermission("content.view");
  if (!allowed) {
    const user = await getCurrentUser();
    if (user) {
      await createActivityLog("unauthorized_access", "security", "content", {
        userId: user.userId,
        description: `${user.name} cố gắng truy cập module Content không hợp lệ`,
      });
    }
    redirect("/dashboard");
  }
  return <>{children}</>;
}
