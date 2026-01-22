import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { id, title, caption, platform } = await request.json();

    if (!id || !caption || !platform) {
      return NextResponse.json(
        { error: "Missing required fields: id, caption, or platform" },
        { status: 400 },
      );
    }

    const WEBHOOK_URL = process.env.NEXT_PUBLIC_UPDATE_POST_WEBHOOK;

    if (!WEBHOOK_URL) {
      console.warn("NEXT_PUBLIC_UPDATE_POST_WEBHOOK is not set");
      // For now, we return success to simulate the feature if env is missing,
      // or we can error. Usually strictly better to error if real functionality is needed.
      // But based on "edit-media", it returns 500.
      return NextResponse.json(
        { error: "Update Post Webhook URL not configured" },
        { status: 500 },
      );
    }

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        title,
        caption,
        platform,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Webhook error: ${response.statusText}` },
        { status: response.status },
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
      { status: 500 },
    );
  }
}
