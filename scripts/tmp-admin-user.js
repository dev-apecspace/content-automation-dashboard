// Create a temporary admin user in Supabase for login testing
const bcrypt = require("bcryptjs");
require("fs").readFileSync(".env.local", "utf8").split("\n").forEach((l) => {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
});

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = "tmp-admin-test@tmp.local";
  const password = "TmpAdmin123!";
  const hash = bcrypt.hashSync(password, 10);

  // delete old temp user if exists
  await fetch(`${url}/rest/v1/users?email=eq.${email}`, {
    method: "DELETE",
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });

  const res = await fetch(`${url}/rest/v1/users`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      id: `tmp_${Date.now()}`,
      email,
      name: "Tmp Admin",
      password: hash,
      role: "admin",
      is_active: true,
    }),
  });
  const body = await res.text();
  console.log("insert status:", res.status);
  console.log("insert body:", body.slice(0, 300));
  if (res.status >= 200 && res.status < 300) {
    require("fs").writeFileSync("/tmp/tmp-user.json", JSON.stringify({ email, password }));
    console.log("saved /tmp/tmp-user.json");
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
