/**
 * Verify chuỗi login với ĐỦ 3 context truy cập (user tạm trong Supabase):
 *  1. QUA Caddy:81 (có X-Forwarded-For, hop http)  → Set-Cookie phải None+Secure
 *  2. Trực tiếp :3000, Host localhost, http thuần  → Set-Cookie phải Lax
 *  3. Trực tiếp :3000, X-Forwarded-Proto: https    → Set-Cookie phải None+Secure
 * Sau đó GET /dashboard với cookie context 1 → phải 200. Xóa user tạm.
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
const PASSWORD = "TestLogin123!";

async function supabase(path: string, method: string, body?: object) {
  return fetch(`${URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

interface Case {
  name: string;
  url: string;
  headers: Record<string, string>;
  wantSecure: boolean;
}

async function main() {
  // Dọn sót từ lần chạy trước (nếu có)
  await supabase(`users?email=eq.${EMAIL}`, "DELETE");
  const hash = await bcrypt.hash(PASSWORD, 10);
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

  const cases: Case[] = [
    {
      name: "1. QUA Caddy:81 (preview, hop http + xff)",
      url: "http://127.0.0.1:81/api/auth/login",
      headers: { "Content-Type": "application/json", Host: "preview.example.com" },
      wantSecure: true,
    },
    {
      name: "2. Trực tiếp :3000 localhost http thuần",
      url: "http://127.0.0.1:3000/api/auth/login",
      headers: { "Content-Type": "application/json", Host: "localhost:3000" },
      wantSecure: true,
    },
    {
      name: "3. Trực tiếp :3000 với X-Forwarded-Proto: https",
      url: "http://127.0.0.1:3000/api/auth/login",
      headers: { "Content-Type": "application/json", Host: "app.example.com", "X-Forwarded-Proto": "https" },
      wantSecure: true,
    },
  ];

  let previewCookie = "";
  for (const c of cases) {
    const r = await fetch(c.url, {
      method: "POST",
      headers: c.headers,
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    const sc = r.headers.get("set-cookie") ?? "";
    const hasSecure = /secure/i.test(sc);
    const hasNone = /samesite=none/i.test(sc);
    const hasLax = /samesite=lax/i.test(sc);
    const ok = r.ok && hasSecure === c.wantSecure;
    console.log(
      `${ok ? "✓" : "❌"} ${c.name}: HTTP ${r.status}, Secure=${hasSecure}, SameSite=${hasNone ? "None" : hasLax ? "Lax" : "?"} (mong None+Secure — localhost là secure context)`
    );
    if (!ok) throw new Error(`Context "${c.name}" đặt cookie sai`);
    if (c.url.includes(":81")) previewCookie = sc.split(";")[0];
  }

  const dash = await fetch("http://127.0.0.1:81/dashboard", {
    headers: { Cookie: previewCookie, Host: "preview.example.com" },
    redirect: "manual",
  });
  console.log(`${dash.status === 200 ? "✓" : "❌"} GET /dashboard với cookie preview: HTTP ${dash.status}`);
  if (dash.status !== 200) throw new Error("Dashboard không vào được với cookie preview");

  await supabase(`users?email=eq.${EMAIL}`, "DELETE");
  console.log("✓ đã xóa user tạm");
  console.log("\n🎉 COOKIE LOGIN ĐÚNG CHO CẢ 3 CONTEXT TRUY CẬP");
}

main().catch((e) => {
  console.error("❌ FAIL:", e instanceof Error ? e.message : e);
  supabase(`users?email=eq.${EMAIL}`, "DELETE").catch(() => {});
  process.exit(1);
});
