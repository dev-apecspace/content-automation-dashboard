import { NextRequest, NextResponse } from "next/server";
import { serialize } from "cookie";
import { verifyToken } from "@/lib/server/encryption";
import { createActivityLog } from "@/lib/api/activity-logs";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (token) {
      try {
        const payload = verifyToken(token);
        await createActivityLog("logout", "auth", payload.userId, {
          userId: payload.userId,
          description: `${payload.name} đã đăng xuất`,
        });
      } catch (e) {
        // Ignore token verification errors during logout
        console.error("Error logging logout activity:", e);
      }
    }
  } catch (error) {
    console.error("Logout logging error:", error);
  }

  // Đồng bộ chính sách cookie với login (SameSite=None + Secure trên HTTPS/localhost)
  const proto = (
    req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "")
  )
    .split(",")[0]
    .trim();
  const host = (req.headers.get("host") ?? "").split(":")[0];
  const isHttps =
    proto === "https" || host === "localhost" || host === "127.0.0.1";
  const cookie = serialize("auth_token", "", {
    httpOnly: true,
    secure: isHttps,
    maxAge: -1,
    path: "/",
    sameSite: isHttps ? "none" : "lax",
  });

  const response = NextResponse.json({ success: true });
  response.headers.append("Set-Cookie", cookie);

  return response;
}
