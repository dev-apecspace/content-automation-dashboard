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

    // 2.5. Đích đến sau đăng nhập theo loại user:
    //      admin → /companies (quản trị kinh doanh + chọn côngty),
    //      customer → workspace công ty của họ /{slug}
    let redirectTo = "/dashboard";
    if (user.role === "admin") {
      redirectTo = "/companies";
    } else if (user.role === "customer" && user.customer_id) {
      const { data: cu } = await supabase
        .from("customers")
        .select("slug")
        .eq("id", user.customer_id)
        .single();
      if (cu?.slug) redirectTo = `/${cu.slug}`;
    }

    // 3. Generate JWT
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    // 4. Set Cookie
    // Cookie policy: LUÔN SameSite=None + Secure.
    // - Preview/publish của platform: browser nhận https từ edge, iframe
    //   cross-origin của preview panel CHỈ chấp nhận cookie None+Secure
    //   (SameSite=Lax sẽ bị iframe bỏ qua → đăng nhập xong bị đá về /login).
    //   Hop nội bộ (edge → Caddy:81 → Next) là http nhưng KHÔNG đại diện cho
    //   context của browser, và X-Forwarded-* không đáng tin (Next dev tự
    //   inject x-forwarded-for ::ffff:127.0.0.1 cho cả request trực tiếp).
    // - Localhost http: browser coi là secure context nên vẫn chấp nhận
    //   Secure cookie.
    // - Http thuần qua domain thật (không qua edge https): không tồn tại trong
    //   môi trường platform này.
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
      redirectTo,
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