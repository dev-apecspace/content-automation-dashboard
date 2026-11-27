// Verify FB page tokens: decrypt from DB + Graph API GET /me (read-only)
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

const svcHeaders = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY };
const res = await fetch(
  env.NEXT_PUBLIC_SUPABASE_URL + "/rest/v1/accounts?platform=eq.Facebook&is_active=eq.true&select=id,channel_id,channel_name,token",
  { headers: svcHeaders },
);
const accounts = await res.json();

for (const acc of accounts) {
  let token;
  try {
    token = decrypt(acc.token);
  } catch (e) {
    console.log(`❌ ${acc.channel_name}: DECRYPT FAIL ${e.message}`);
    continue;
  }
  console.log(`🔑 ${acc.channel_name} (page ${acc.channel_id}): decrypt OK, token ${token.length} chars, prefix ${token.slice(0, 8)}...`);

  // GET /me with the page token — read-only, no posting
  for (const v of ["v23.0", "v21.0", "v18.0"]) {
    try {
      const r = await fetch(`https://graph.facebook.com/${v}/me?access_token=${encodeURIComponent(token)}`, { signal: AbortSignal.timeout(15000) });
      const j = await r.json();
      if (j.id) {
        console.log(`   ✅ ${v} /me OK → id=${j.id} name="${j.name}"`);
        break;
      } else {
        console.log(`   ⚠️ ${v}: ${JSON.stringify(j.error || j).slice(0, 140)}`);
      }
    } catch (e) {
      console.log(`   ⚠️ ${v} network: ${e.message}`);
    }
  }
}
console.log("DONE", accounts.length, "FB accounts");
