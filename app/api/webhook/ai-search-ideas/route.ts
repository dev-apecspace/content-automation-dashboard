import { NextRequest } from "next/server";
import { WEBHOOK_TIMEOUT_MS, webhookErrorMessage } from "@/lib/webhook";

const WEBHOOK_URL = process.env.NEXT_PUBLIC_SEARCH_IDEAS_WEBHOOK!;

export async function POST(request: NextRequest) {
  try {
    const { postType, projectQuantities } = await request.json();

    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ postType, projectQuantities }),
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    });

    if (!res.ok) {
      const error = await res.text();
      return new Response(
        JSON.stringify({ error: "Webhook failed", details: error }),
        {
          status: res.status,
        }
      );
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: webhookErrorMessage(err) }), {
      status: 500,
    });
  }
}
