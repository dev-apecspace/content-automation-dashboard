// Mint a valid admin JWT for the sandbox user to test the production artifact
// Reads env from project .env.local, queries Supabase for the admin user,
// signs a token identical to app login (jsonwebtoken HS256, 7d).
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env.local");
const env = {};
for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

async function main() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  const res = await fetch(`${url}/rest/v1/users?select=id,email,name,role&limit=5`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    console.error("Supabase query failed:", res.status, await res.text());
    process.exit(1);
  }
  const users = await res.json();
  console.log("users in DB:", JSON.stringify(users.map((u) => ({ email: u.email, name: u.name, role: u.role })), null, 1));
  const admin = users.find((u) => u.role === "admin") || users[0];
  if (!admin) {
    console.error("NO USERS IN DB");
    process.exit(2);
  }
  const jwt = require("jsonwebtoken");
  const token = jwt.sign(
    { userId: admin.id, email: admin.email, role: admin.role },
    env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  fs.writeFileSync("/tmp/test-auth-token.txt", token);
  console.log("TOKEN_MINTED_FOR:", admin.email, "role:", admin.role);
  console.log("token saved to /tmp/test-auth-token.txt");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
