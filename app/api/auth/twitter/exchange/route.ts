import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, clientId, clientSecret, redirectUri, codeVerifier } = body;

    if (!code || !clientId || !clientSecret || !redirectUri) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const credentials = btoa(`${clientId}:${clientSecret}`);

    const res = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        code: code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code_verifier: codeVerifier || "challenge",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Twitter Token Error:", data);
      return NextResponse.json(
        {
          error:
            data.error_description || data.error || "Failed to fetch token",
        },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Twitter Proxy Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
