import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { encrypt } from "@/lib/server/encryption";
import { Account } from "@/lib/types";

// GET: List all accounts (mask tokens)
export async function GET() {
  const { data, error } = await supabase
    .from("accounts")
    .select("*, projects(name)")
    .order("project_id", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mask tokens
  const accounts: Account[] = (data || []).map((acc: any) => ({
    ...acc,
    platform: acc.platform,
    channelId: acc.channel_id,
    channelName: acc.channel_name,
    channelLink: acc.channel_link,
    token: "******", // Masked
    clientId: acc.client_id, // Expose Client ID
    clientSecret: acc.client_secret ? "******" : undefined, // Mask Client Secret
    projectId: acc.project_id,
    projectName: acc.projects?.name,
    isActive: acc.is_active,
    createdAt: acc.created_at,
    updatedAt: acc.updated_at,
  }));

  return NextResponse.json(accounts);
}

// POST: Create account (encrypt token)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      platform,
      channelId,
      channelName,
      channelLink,
      token,
      clientId,
      clientSecret,
      isActive,
      projectId,
      projectName,
    } = body;

    // Validate
    if (!platform || !channelId || !channelName || !token) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Encrypt token (Used as Access Token or Refresh Token depending on platform)
    const encryptedToken = encrypt(token);

    // Encrypt clientSecret if provided
    const encryptedClientSecret = clientSecret ? encrypt(clientSecret) : null;

    const { data, error } = await supabase
      .from("accounts")
      .insert([
        {
          platform,
          channel_id: channelId,
          channel_name: channelName,
          channel_link: channelLink,
          token: encryptedToken, // DB Column is `token`
          client_id: clientId,
          client_secret: encryptedClientSecret,
          project_id: projectId,
          is_active: isActive,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ...data,
      id: data.id,
      platform: data.platform,
      channelId: data.channel_id,
      channelName: data.channel_name,
      channelLink: data.channel_link,
      token: "******", // Return masked
      clientId: data.client_id,
      clientSecret: data.client_secret ? "******" : undefined,
      projectId: data.project_id,
      projectName: projectName,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as Account);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH: Update account (re-encrypt if token changed)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      platform,
      channelId,
      channelName,
      channelLink,
      token,
      clientId,
      clientSecret,
      isActive,
      projectId,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (platform) updates.platform = platform;
    if (channelId) updates.channel_id = channelId;
    if (channelName) updates.channel_name = channelName;
    if (channelLink) updates.channel_link = channelLink;
    if (clientId !== undefined) updates.client_id = clientId;
    if (projectId !== undefined) updates.project_id = projectId; // Allow null to unset?
    if (isActive !== undefined) updates.is_active = isActive;

    // Only update token if it's provided and not the masked version
    if (token && token !== "******") {
      updates.token = encrypt(token);
    }

    // Only update clientSecret if provided and not masked
    if (clientSecret && clientSecret !== "******") {
      updates.client_secret = encrypt(clientSecret);
    }

    const { data, error } = await supabase
      .from("accounts")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ...data,
      id: data.id,
      platform: data.platform,
      channelId: data.channel_id,
      channelName: data.channel_name,
      channelLink: data.channel_link,
      token: "******",
      clientId: data.client_id,
      clientSecret: data.client_secret ? "******" : undefined,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as Account);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Remove account
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  }

  const { error } = await supabase.from("accounts").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
