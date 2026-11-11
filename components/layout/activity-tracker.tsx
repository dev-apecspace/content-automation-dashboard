"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function ActivityTrackerContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = `${pathname}${
      searchParams.toString() ? `?${searchParams.toString()}` : ""
    }`;

    fetch("/api/activity/log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        description: `Truy cập trang ${url}`,
      }),
    }).catch((err) => {
      console.error("Failed to log page visit:", err);
    });
  }, [pathname, searchParams]);

  return null;
}

export function ActivityTracker() {
  return (
    <Suspense fallback={null}>
      <ActivityTrackerContent />
    </Suspense>
  );
}
