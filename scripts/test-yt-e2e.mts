/**
 * E2E test YouTube auto-post: tạo video_item hẹn giờ → engine quét → upload
 * THẬT lên kênh NMND với privacyStatus=PRIVATE (invisible với công chúng)
 * → verify qua videos.list → xóa video + toàn bộ row test.
 *
 * Chạy bằng bun (có Bun.serve + tự load .env.local + resolve tsconfig paths):
 *   pkill dev trước để dev engine không thắng claim (sẽ upload PUBLIC!)
 *   YOUTUBE_UPLOAD_PRIVACY=private bun run scripts/test-yt-e2e.mts
 */
import { runAutoPostSweep, formatVnPostingTime } from "@/lib/auto-post/engine";
import crypto from "crypto";

// bun tự load .env.local vào process.env — dùng trực tiếp
const H = { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + process.env.SUPABASE_SERVICE_ROLE_KEY, "Content-Type": "application/json", Prefer: "return=representation" };
const U = process.env.NEXT_PUBLIC_SUPABASE_URL + "/rest/v1";

async function api(method: string, path: string, body?: any) {
  const r = await fetch(U + path, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status} ${JSON.stringify(j).slice(0, 200)}`);
  return j;
}

function decryptMaybe(text?: string | null): string {
  if (!text) return "";
  if (!text.includes(":")) return text; // client_id lưu dạng raw
  try {
    return decrypt(text);
  } catch {
    return text;
  }
}

function decrypt(text: string): string {
  const parts = text.split(":");
  const iv = Buffer.from(parts.shift()!, "hex");
  const data = Buffer.from(parts.join(":"), "hex");
  const d = crypto.createDecipheriv("aes-256-cbc", Buffer.from(process.env.ENCRYPTION_KEY!), iv);
  return Buffer.concat([d.update(data), d.final()]).toString();
}

// 0. Tạo video test 2 giây (dọc, chuẩn Shorts) + serve qua localhost
const proc = Bun.spawnSync({
  cmd: ["ffmpeg", "-y", "-f", "lavfi", "-i", "testsrc=size=480x854:rate=30:duration=2", "-pix_fmt", "yuv420p", "-c:v", "libx264", "/tmp/yt-test.mp4"],
});
const file = Bun.file("/tmp/yt-test.mp4");
if (!(await file.exists()) || (await file.size) === 0) throw new Error("ffmpeg tạo video test thất bại: " + proc.stderr.toString().slice(0, 200));
const server = Bun.serve({ port: 9899, fetch: () => new Response(file) });
console.log("✓ Video test:", await file.size, "bytes, serve tại http://127.0.0.1:9899/yt-test.mp4");

// 1. Lấy account NMND + tạo video_item hẹn giờ quá khứ (đến hạn ngay)
const [acc] = await api("GET", "/accounts?channel_name=eq.NMND&platform=eq.Youtube&select=id,project_id");
const postingTime = formatVnPostingTime(new Date(Date.now() - 60_000));
const [item] = await api("POST", "/video_items", {
  idea: "TEST YT ENGINE - sẽ bị xóa",
  title: "[TEST ENGINE] Video kiểm tra auto-post - sẽ bị xóa",
  caption: "Video test nội bộ engine tự động đăng — sẽ bị xóa ngay sau khi kiểm tra.",
  status: "content_approved",
  platform: ["Youtube Shorts"],
  account_ids: [acc.id],
  project_id: acc.project_id,
  project_name: "NMND",
  posting_time: postingTime,
  video_link: "http://127.0.0.1:9899/yt-test.mp4",
  video_duration: 2,
});
console.log("✓ Tạo video_item:", item.id, "| hẹn:", postingTime);

// 2. Chạy engine sweep NGAY trong process này (env private → không công khai)
console.log("... engine sweep (upload private lên kênh NMND)");
const result = await runAutoPostSweep();
console.log("✓ Sweep result:", JSON.stringify(result));

// 3. Verify
const [after] = await api("GET", `/video_items?id=eq.${item.id}&select=status`);
const posts = await api("GET", `/posts?item_id=eq.${item.id}&select=id,platform,post_url`);
console.log("✓ Status video_item:", after.status);
console.log("✓ Posts row:", JSON.stringify(posts));

let videoId = posts[0]?.id;
let pass = false;
if (videoId) {
  // Đổi access token để verify trên YouTube
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: decryptMaybe(acc.client_id),
      client_secret: decryptMaybe(acc.client_secret),
      refresh_token: decrypt(acc.token),
      grant_type: "refresh_token",
    }),
  }).then((r) => r.json());
  const access = tokenRes.access_token;
  const vj = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=status,snippet&id=${videoId}`, {
    headers: { Authorization: "Bearer " + access },
  }).then((r) => r.json());
  const v = vj.items?.[0];
  console.log(`✓ YouTube: video tồn tại="${v?.snippet?.title}" privacy=${v?.status?.privacyStatus} uploadStatus=${v?.status?.uploadStatus}`);
  pass = v?.status?.privacyStatus === "private";

  // 4. Dọn dẹp: xóa video trên YouTube + rows trong DB
  const del = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + access },
  });
  console.log("✓ Xóa video trên YouTube: HTTP", del.status);
}

await api("DELETE", `/video_items?id=eq.${item.id}`);
await api("DELETE", `/posts?item_id=eq.${item.id}`);
server.stop(true);
await Bun.spawnSync({ cmd: ["rm", "-f", "/tmp/yt-test.mp4"] });
console.log("✓ Đã xóa video_item + posts row — DB sạch");

console.log(after.status === "posted_successfully" && pass ? ">>> YT E2E PASS: refresh→init→download→upload→posts row→status, video đã xóa" : `>>> YT E2E CHECK: status=${after.status} pass=${pass}`);
