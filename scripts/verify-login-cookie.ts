/**
 * Verify thật chuỗi login qua Caddy:81 với user tạm:
 *  1. Tạo user tạm trong Supabase (service role key)
 *  2. POST /api/auth/login qua Caddy:81 (hop http) → soi Set-Cookie
 *     (phải là SameSite=None; Secure — fix cookie iframe preview)
 *  3. GET /dashboard với cookie đó → phải 200
 *  4. Xóa user tạm
 */
import bcrypt from "bcryptjs";
import fs from "fs";

const env = fs.readFileSync("/home/z/my-project/.env.local", "utf8");
const get = (k: string) => {
  const m = env.match(new RegExp(`^${k}=(.*)$`, "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
};
const URL = get("NEXT_PUBLIC_SUPABASE_URL");
const KEY = get("SUPABASE_SERVICE_ROLE_KEY");
const EMAIL = "tmp-login-test@internal-check.invalid";

async function supabase(path: string, method: string, body?: object) {
  const res = await fetch(`${URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

async function main() {
  // 1. Tạo user tạm
  const hash = await bcrypt.hash("TestLogin123!", 10);
  let res = await supabase(
    "users",
    "POST",
    { email: EMAIL, password: hash, name: "TMP Login Test", role: "admin", is_active: true }
  );
  if (!res.ok) {
    console.error("Tạo user tạm lỗi:", res.status, (await res.text()).slice(0, 200));
    process.exit(1);
  }
  console.log("✓ user tạm đã tạo:", EMAIL);

  // 2. Login QUA CADDY:81 (hop nội bộ http — điều kiện từng gây bug cookie)
  res = await fetch("http://127.0.0.1:81/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", Host: "preview.example.com" },
    body: JSON.stringify({ email: EMAIL, password: "TestLogin123!" }),
  });
  const setCookie = res.headers.get("set-cookie") ?? "";
  const body = await res.json().catch(() => ({}));
  console.log(`login HTTP ${res.status}; user: ${body.user?.email ?? "N/A"}`);
  console.log("Set-Cookie:", setCookie.slice(0, 120));

  const hasNone = /samesite=none/i.test(setCookie);
  const hasSecure = /secure/i.test(setCookie);
  if (!res.ok || !hasNone || !hasSecure) {
    console.error(`\n❌ COOKIE SAI: SameSite=None=${hasNone}, Secure=${hasSecure}`);
    await supabase(`users?email=eq.${EMAIL}`, "DELETE");
    process.exit(1);
  }
  console.log("✓ Set-Cookie đúng: SameSite=None + Secure (iframe preview chấp nhận)");

  // 3. Dashboard với cookie qua :81
  const token = setCookie.split(";")[0];
  const dash = await fetch("http://127.0.0.1:81/dashboard", {
    headers: { Cookie: token, Host: "preview.example.com" },
    redirect: "manual",
  });
  console.log(`✓ GET /dashboard qua :81 với cookie: HTTP ${dash.status}`);
  if (dash.status !== 200) {
    console.error("❌ Dashboard không vào được với cookie mới");
    await supabase(`users?email=eq.${EMAIL}`, "DELETE");
    process.exit(1);
  }

  // 4. Dọn user tạm
  await supabase(`users?email=eq.${EMAIL}`, "DELETE");
  console.log("✓ đã xóa user tạm");
  console.log("\n🎉 FIX ĐĂNG NHẬP XÁC MINH THÀNH CÔNG QUA ĐÚNG CHUỖI CADDY:81");
}

main().catch((e) => {
  console.error("Lỗi:", e instanceof Error ? e.message : e);
  process.exit(1);
});
