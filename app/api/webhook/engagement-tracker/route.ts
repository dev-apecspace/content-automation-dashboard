import { NextRequest } from 'next/server';

const WEBHOOK_URL = process.env.NEXT_PUBLIC_ENGAGEMENT_TRACKER_WEBHOOK!;

export async function POST(request: NextRequest) {
  try {
    // const { postId, platform } = await request.json();

    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    //   body: JSON.stringify({ postId, platform }),
    });

    if (!res.ok) {
      const error = await res.text();
      return new Response(JSON.stringify({ error: 'Webhook failed', details: error }), {
        status: res.status,
      });
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}