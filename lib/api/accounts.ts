"use server";

import { supabase } from "@/lib/supabase";
import { encrypt } from "@/lib/server/encryption";
import { Account } from "@/lib/types";

// Helper to mask sensitive data
const maskAccount = (acc: any): Account => ({
  ...acc,
  platform: acc.platform,
  channelId: acc.channel_id,
  channelName: acc.channel_name,
  channelLink: acc.channel_link,
  token: "******", // Masked
  clientId: acc.client_id,
  clientSecret: acc.client_secret ? "******" : undefined, // Mask Client Secret
  projectId: acc.project_id,
  projectName: acc.projects?.name,
  isActive: acc.is_active,
  createdAt: acc.created_at,
  updatedAt: acc.updated_at,
});

export async function getAccounts(): Promise<Account[]> {
  const { data, error } = await supabase
    .from("accounts")
    .select("*, projects(name)")
    .order("project_id", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(maskAccount);
}

export async function createAccount(
  account: Omit<Account, "id" | "createdAt" | "updatedAt">
): Promise<Account> {
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
  } = account;

  // Validate
  if (!platform || !channelId || !channelName || !token) {
    throw new Error("Missing required fields");
  }

  // Encrypt token
  const encryptedToken = encrypt(token);
  const encryptedClientSecret = clientSecret ? encrypt(clientSecret) : null;

  const { data, error } = await supabase
    .from("accounts")
    .insert([
      {
        platform,
        channel_id: channelId,
        channel_name: channelName,
        channel_link: channelLink,
        token: encryptedToken,
        client_id: clientId,
        client_secret: encryptedClientSecret,
        project_id: projectId,
        is_active: isActive,
      },
    ])
    .select("*, projects(name)")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // Manually construct the response if join alias isn't perfect or just reuse maskAccount
  // Note: projects(name) might return { projects: { name: ... } } structure which maskAccount handles via `acc.projects?.name`
  return maskAccount(data);
}

export async function updateAccount(
  id: string,
  updates: Partial<Omit<Account, "id" | "createdAt" | "updatedAt">>
): Promise<Account> {
  const dbUpdates: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.platform) dbUpdates.platform = updates.platform;
  if (updates.channelId) dbUpdates.channel_id = updates.channelId;
  if (updates.channelName) dbUpdates.channel_name = updates.channelName;
  if (updates.channelLink) dbUpdates.channel_link = updates.channelLink;
  if (updates.clientId !== undefined) dbUpdates.client_id = updates.clientId;
  if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId;
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

  if (updates.token && updates.token !== "******") {
    dbUpdates.token = encrypt(updates.token);
  }

  if (updates.clientSecret && updates.clientSecret !== "******") {
    dbUpdates.client_secret = encrypt(updates.clientSecret);
  }

  const { data, error } = await supabase
    .from("accounts")
    .update(dbUpdates)
    .eq("id", id)
    .select("*, projects(name)")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return maskAccount(data);
}

export async function deleteAccount(id: string): Promise<void> {
  const { error } = await supabase.from("accounts").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
