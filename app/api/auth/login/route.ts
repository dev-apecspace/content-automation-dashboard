import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { comparePassword, signToken } from "@/lib/server/encryption";
import { serialize } from "cookie";
import { createActivityLog } from "@/lib/api/activity-logs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // 1. Find user by email
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("is_active", true)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 2. Verify password
    const isValid = await comparePassword(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 3. Generate JWT
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    // 4. Set Cookie
    // Cookie policy: preview của platform LUÔN phục vụ browser qua HTTPS, nhưng
    // hop nội bộ (edge → Caddy:81 → Next) là http và Caddy có thể ghi đè
    // X-Forwarded-Proto thành http. Nếu chỉ tin proto, login sẽ đặt cookie
    // SameSite=Lax → iframe cross-origin của preview panel TỪ CHỐI lưu cookie →
    // đăng nhập xong bị đá về /login, không vào được dashboard (lỗi dev preview).
    //
    // Vì vậy cookie luôn SameSite=None + Secure:
    // - context https (preview/publish) → yêu cầu bắt buộc của iframe cross-origin;
    // - localhost: browser coi là secure context nên vẫn chấp nhận Secure cookie.
    const cookie = serialize("auth_token", token, {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
      sameSite: "none",
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    response.headers.append("Set-Cookie", cookie);

    // Log login activity
    await createActivityLog("login", "auth", user.id, {
      userId: user.id,
      description: `${user.name} đăng nhập thành công`,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle other methods
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Allow": "POST, OPTIONS",
      "Content-Type": "application/json",
    },
  });
}

export async function GET(req: NextRequest) {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}