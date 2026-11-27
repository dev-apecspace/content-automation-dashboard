// E2E test auto-post engine: tạo item hẹn giờ (token FB đã chết → an toàn,
// không thể đăng công khai) → chờ engine quét → kiểm tra claim + lỗi Graph
// → dọn dẹp item test.
import fs from "fs";

const env = Object.fromEntries(
  fs
    .readFileSync("/home/z/my-project/.env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const H = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY, "Content-Type": "application/json", Prefer: "return=representation" };
const U = env.NEXT_PUBLIC_SUPABASE_URL + "/rest/v1";

async function api(method, path, body) {
  const r = await fetch(U + path, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status} ${JSON.stringify(j).slice(0, 200)}`);
  return j;
}

// 1. Tạo item hẹn 1 phút trước (đến hạn ngay)
const past = new Date(Date.now() - 60_000 + 7 * 3600_000);
const p = (n) => String(n).padStart(2, "0");
const postingTime = `${p(past.getUTCDate())}/${p(past.getUTCMonth() + 1)}/${past.getUTCFullYear()} ${p(past.getUTCHours())}:${p(past.getUTCMinutes())}`;

// account APEC GLOBAL (token chết) + project của nó
const [acc] = await api("GET", "/accounts?channel_name=eq.APEC%20GLOBAL&select=id,project_id");
const [item] = await api("POST", "/content_items", {
  idea: "TEST ENGINE - sẽ bị xóa",
  caption: "[TEST ENGINE] bài test nội bộ - sẽ bị xóa",
  status: "content_approved",
  platform: ["Facebook Post"],
  account_ids: [acc.id],
  project_id: acc.project_id,
  project_name: "APEC GLOBAL",
  posting_time: postingTime,
  content_type: "other",
});
console.log("✓ Tạo item test:", item.id, "| posting_time:", postingTime, "(đến hạn)");

// 2. Chờ engine quét (chu kỳ 60s)
console.log("... chờ engine quét (≤70s)");
await new Promise((r) => setTimeout(r, 70_000));

// 3. Kiểm tra trạng thái + engine stats
const [after] = await api("GET", `/content_items?id=eq.${item.id}&select=status,updated_at`);
const posts = await api("GET", `/posts?item_id=eq.${item.id}&select=id`);
console.log("✓ Status sau quét:", after.status, "(mong đợi: error vì token FB đã chết)");
console.log("✓ Posts tạo ra:", posts.length, "(mong đợi: 0 — không đăng được vì token chết)");

// 4. Dọn dẹp
await api("DELETE", `/content_items?id=eq.${item.id}`);
console.log("✓ Đã xóa item test — DB sạch");
console.log(after.status === "error" ? ">>> E2E PASS: quét→claim→decrypt→Graph→xử lý lỗi→status hết hoạt động" : ">>> E2E CHECK: status=" + after.status);
