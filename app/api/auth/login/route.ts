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

    // 4. Set Cookie — thích ứng theo giao thức mà BROWSER thực sự thấy:
    // - Browser nhận https (edge preview, kể cả iframe cross-origin):
    //   SameSite=None + Secure — iframe preview CHỈ chấp nhận combo này,
    //   SameSite=Lax sẽ bị iframe bỏ qua → đăng nhập xong bị đá về /login.
    // - Browser nhận http thuần (preview :81, dev trực tiếp, localhost):
    //   SameSite=Lax KHÔNG Secure — cookie Secure bị browser VỨT trên http,
    //   gây vòng lặp chuyển hướng đăng nhập vô tận (lỗi "chuyển hướng"
    //   của run dev server). Header x-forwarded-proto do edge/Caddy ghi.
    const proto = (
      req.headers.get("x-forwarded-proto") ??
      req.nextUrl.protocol.replace(":", "")
    )
      .split(",")[0]
      .trim();
    const host = (req.headers.get("host") ?? "").split(":")[0];
    const isHttps =
      proto === "https" || host === "localhost" || host === "127.0.0.1";
    const base = {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    } as const;
    // Cookie chính: None+Secure trên https (iframe preview bắt buộc), Lax trên http
    const cookie = serialize("auth_token", token, {
      ...base,
      secure: isHttps,
      sameSite: isHttps ? "none" : "lax",
    });
    // Cookie fallback: Lax KHÔNG Secure — trường hợp browser đang ở http
    // thuần mà chuỗi proxy báo https (Secure cookie bị vứt → vòng lặp
    // chuyển hướng đăng nhập). Trên https cookie này vô hại, luôn được set.
    const fallbackCookie = serialize("auth_token_fb", token, {
      ...base,
      secure: false,
      sameSite: "lax",
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
    response.headers.append("Set-Cookie", fallbackCookie);

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