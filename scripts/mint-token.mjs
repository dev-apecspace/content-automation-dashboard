/**
 * Mint JWT test token (role admin) để curl các trang protected qua terminal.
 * Dùng: node scripts/mint-token.mjs   → in token ra stdout (dòng cuối)
 */
import jwt from "/home/z/my-project/node_modules/jsonwebtoken/index.js";
import fs from "fs";

const env = fs.readFileSync("/home/z/my-project/.env.local", "utf8");
const m = env.match(/^JWT_SECRET=(.*)$/m);
const secret = m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
console.log(
  jwt.sign(
    { userId: "test-user", email: "t@t.local", role: "admin", name: "Test" },
    secret,
    { expiresIn: "7d" }
  )
);
