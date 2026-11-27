// Kiểm tra tài khoản Youtube trong DB: token là refresh hay access,
// còn đổi được access token mới không, channels.list trả về channel nào.
// Chỉ gọi API ĐỌC — không upload gì cả.
import crypto from "crypto";
import fs from "fs";

const env = Object.fromEntries(
  fs
    .readFileSync("/home/z/my-project/.env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);

function decrypt(text) {
  const parts = text.split(":");
  const iv = Buffer.from(parts.shift(), "hex");
  const data = Buffer.from(parts.join(":"), "hex");
  const d = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(env.ENCRYPTION_KEY),
    iv,
  );
  return Buffer.concat([d.update(data), d.final()]).toString();
}

const H = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY };
const accs = await (
  await fetch(env.NEXT_PUBLIC_SUPABASE_URL + "/rest/v1/accounts?platform=eq.Youtube&select=*", { headers: H })
).json();

for (const acc of accs) {
  console.log(`📺 ${acc.channel_name} | channel_id=${acc.channel_id} | is_active=${acc.is_active}`);
  console.log(`   client_id: ${acc.client_id ? acc.client_id.slice(0, 12) + "..." : "(trống)"}`);
  console.log(`   client_secret: ${acc.client_secret ? "<có, đã mã hóa? len=" + acc.client_secret.length + ">" : "(trống)"}`);
  console.log(`   expires_in: ${acc.expires_in} | custom_fields: ${(JSON.stringify(acc.custom_fields) || "").slice(0, 120)}`);

  let token;
  try {
    token = decrypt(acc.token);
  } catch (e) {
    console.log("   ❌ decrypt token THẤT BẠI:", e.message);
    continue;
  }
  console.log(`   token decrypted: ${token.length} chars, prefix "${token.slice(0, 6)}..."`);
  const isRefresh = token.startsWith("1//") || token.startsWith("1/");
  console.log(`   → ${isRefresh ? "REFRESH TOKEN (dùng được lâu dài)" : token.startsWith("ya29.") ? "ACCESS TOKEN (hết hạn sau ~1h)" : "không rõ loại"}`);

  // client_secret trong DB có mã hóa không? thử decrypt nếu có định dạng iv:data
  let secret = acc.client_secret || "";
  if (secret.includes(":")) {
    try {
      secret = decrypt(secret);
      console.log("   client_secret: đã giải mã OK");
    } catch {
      console.log("   client_secret: dùng nguyên bản (không phải định dạng mã hóa)");
    }
  }

  if (isRefresh && acc.client_id && secret) {
    // Đổi refresh token lấy access token (chỉ xác thực, không gọi gì khác)
    const r = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: acc.client_id,
        client_secret: secret,
        refresh_token: token,
        grant_type: "refresh_token",
      }),
      signal: AbortSignal.timeout(20_000),
    });
    const j = await r.json();
    if (j.access_token) {
      console.log(`   ✅ REFRESH OK — access token mới ${j.access_token.length} chars, expires_in=${j.expires_in}s, scope=${(j.scope || "").slice(0, 120)}`);
      // channels.list — đọc thông tin channel (an toàn)
      const ch = await (
        await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
          headers: { Authorization: "Bearer " + j.access_token },
          signal: AbortSignal.timeout(20_000),
        })
      ).json();
      const c = ch.items?.[0];
      if (c) {
        console.log(`   ✅ CHANNEL: id=${c.id} tên="${c.snippet?.title}"`);
        console.log(`   ${c.id === acc.channel_id ? "✅ khớp channel_id trong DB" : "⚠️ KHÔNG khớp channel_id trong DB (" + acc.channel_id + ")"}`);
      } else {
        console.log("   ⚠️ channels.list không trả channel:", JSON.stringify(ch).slice(0, 160));
      }
    } else {
      console.log(`   ❌ REFRESH FAIL: ${JSON.stringify(j).slice(0, 200)}`);
    }
  }
}
console.log("DONE", accs.length, "Youtube accounts");
