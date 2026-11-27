// Dọn dẹp video test A5YIRp9k1dg + row test còn sót sau khi script E2E
// crash ở bước verify: verify privacy (bằng chứng PASS) → xóa video trên
// YouTube → xóa video_item + posts row trong DB.
import fs from "fs";
import crypto from "crypto";

const env = Object.fromEntries(
  fs
    .readFileSync("/home/z/my-project/.env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);

function decryptMaybe(text) {
  if (!text) return "";
  if (!text.includes(":")) return text;
  const parts = text.split(":");
  const iv = Buffer.from(parts.shift(), "hex");
  const data = Buffer.from(parts.join(":"), "hex");
  const d = crypto.createDecipheriv("aes-256-cbc", Buffer.from(env.ENCRYPTION_KEY), iv);
  return Buffer.concat([d.update(data), d.final()]).toString();
}

const H = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY, "Content-Type": "application/json", Prefer: "return=representation" };
const U = env.NEXT_PUBLIC_SUPABASE_URL + "/rest/v1";

const accs = await (await fetch(U + "/accounts?channel_name=eq.NMND&platform=eq.Youtube&select=id,token,client_id,client_secret", { headers: H })).json();
const acc = accs[0];
// refresh token luôn lưu dạng mã hóa iv:data → giải mã riêng
const parts = acc.token.split(":");
const iv = Buffer.from(parts.shift(), "hex");
const data = Buffer.from(parts.join(":"), "hex");
const dc = crypto.createDecipheriv("aes-256-cbc", Buffer.from(env.ENCRYPTION_KEY), iv);
const refreshToken = Buffer.concat([dc.update(data), dc.final()]).toString();
const tok = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    client_id: decryptMaybe(acc.client_id),
    client_secret: decryptMaybe(acc.client_secret),
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  }),
}).then((r) => r.json());
const access = tok.access_token;
if (!access) throw new Error("refresh fail: " + JSON.stringify(tok).slice(0, 150));

// 1. Verify video còn tồn tại + privacy (bằng chứng E2E PASS)
const vj = await fetch("https://www.googleapis.com/youtube/v3/videos?part=status,snippet&id=A5YIRp9k1dg", {
  headers: { Authorization: "Bearer " + access },
}).then((r) => r.json());
const v = vj.items?.[0];
console.log(`Verify: title="${v?.snippet?.title}" privacy=${v?.status?.privacyStatus} uploadStatus=${v?.status?.uploadStatus}`);

// 2. Xóa video trên YouTube
const del = await fetch("https://www.googleapis.com/youtube/v3/videos?id=A5YIRp9k1dg", {
  method: "DELETE",
  headers: { Authorization: "Bearer " + access },
});
console.log("Xóa video YouTube: HTTP", del.status);

// 3. Xóa row test trong DB (posts trước, item sau)
const orphan = await (await fetch(U + "/video_items?idea=like." + encodeURIComponent("TEST YT ENGINE*") + "&select=id", { headers: H })).json();
for (const it of orphan) {
  await fetch(U + "/posts?item_id=eq." + it.id, { method: "DELETE", headers: H });
  await fetch(U + "/video_items?id=eq." + it.id, { method: "DELETE", headers: H });
  console.log("Đã xóa video_item + posts:", it.id);
}
if (!orphan.length) console.log("Không còn video_item test trong DB");
console.log(">>> CLEANUP DONE");
