export async function triggerEngagementTracker(itemId: string) {
  const res = await fetch("/api/webhook/engagement-tracker", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemId }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Lỗi gọi AI lấy tương tác");
  }

  return res;
}
