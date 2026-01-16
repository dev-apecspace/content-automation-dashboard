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
    const cookie = serialize("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
      sameSite: "lax",
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