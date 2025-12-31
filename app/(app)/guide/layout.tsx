import { hasPermission, getCurrentUser } from "@/lib/auth/permissions";
import { createActivityLog } from "@/lib/api/activity-logs";
import { redirect } from "next/navigation";
import React from "react";

export default async function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const allowed = await hasPermission("guide.view");
  if (!allowed) {
    const user = await getCurrentUser();
    if (user) {
      await createActivityLog("unauthorized_access", "security", "guide", {
        userId: user.userId,
        description: `${user.name} cố gắng truy cập module Guide không hợp lệ`,
      });
    }
    redirect("/dashboard");
  }
  return <>{children}</>;
}
