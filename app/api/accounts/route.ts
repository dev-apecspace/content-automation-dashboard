import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { encrypt } from "@/lib/server/encryption";
import { Account } from "@/lib/types";

// GET: List all accounts (mask tokens)
export async function GET() {
  const { data, error } = await supabase
    .from("accounts")
    .select("*, projects(name)")
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
    accessToken: "******", // Masked
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
      accessToken,
      isActive,
      projectId,
      projectName,
    } = body;

    // Validate
    if (!platform || !channelId || !channelName || !accessToken) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Encrypt token
    const encryptedToken = encrypt(accessToken);

    const { data, error } = await supabase
      .from("accounts")
      .insert([
        {
          platform,
          channel_id: channelId,
          channel_name: channelName,
          access_token: encryptedToken,
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
      accessToken: "******", // Return masked
      projectId: data.project_id,
      projectName: projectName, // We optimistically return this or we should join from DB
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
      accessToken,
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
    if (projectId !== undefined) updates.project_id = projectId; // Allow null to unset?
    if (isActive !== undefined) updates.is_active = isActive;

    // Only update token if it's provided and not the masked version
    if (accessToken && accessToken !== "******") {
      updates.access_token = encrypt(accessToken);
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
      accessToken: "******",
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
