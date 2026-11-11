import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const WEBHOOK_URL = process.env.NEXT_PUBLIC_EDIT_MEDIA_WEBHOOK!;

    if (!WEBHOOK_URL) {
      return NextResponse.json(
        { error: "Image Webhook URL not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Webhook error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.text();
    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = { message: "Webhook accepted", data };
    }

    return NextResponse.json(jsonData);
  } catch (error) {
    console.error("Error forwarding to webhook:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
