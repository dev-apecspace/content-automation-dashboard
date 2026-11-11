import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/server/encryption";
import { createActivityLog } from "@/lib/api/activity-logs";

export async function POST(req: NextRequest) {
  try {
    // 1. Get token from cookies
    const token = req.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Verify token
    let payload;
    try {
      payload = verifyToken(token);
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!payload?.userId) {
      return NextResponse.json(
        { error: "Invalid token payload" },
        { status: 401 }
      );
    }

    // 3. Get request body
    const body = await req.json();
    const { url, description } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // 4. Create log
    await createActivityLog("visit_page", "page", url, {
      userId: payload.userId,
      description: description || `Truy cập trang ${url}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Activity logging error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
