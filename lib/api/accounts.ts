"use server";

import { supabase } from "@/lib/supabase";
import { encrypt } from "@/lib/server/encryption";
import { Account } from "@/lib/types";
import { requirePermission, getCurrentUser } from "@/lib/auth/permissions";
import { createActivityLog } from "@/lib/api/activity-logs";

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
  await requirePermission("accounts.create");
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

  // Manually construct the response
  const newAccount = maskAccount(data);

  // Log activity
  const user = await getCurrentUser();
  if (user) {
    await createActivityLog("create", "settings", data.id, {
      userId: user.userId,
      newValues: newAccount,
      description: `Thêm tài khoản ${channelName} trên ${platform}`,
    });
  }

  return newAccount;
}

export async function updateAccount(
  id: string,
  updates: Partial<Omit<Account, "id" | "createdAt" | "updatedAt">>
): Promise<Account> {
  await requirePermission("accounts.edit");

  // Fetch old data for logging
  const { data: oldData } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", id)
    .single();

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

  const updatedAccount = maskAccount(data);

  // Log activity
  const user = await getCurrentUser();
  if (user) {
    await createActivityLog("update", "settings", id, {
      userId: user.userId,
      oldValues: oldData ? maskAccount(oldData) : undefined,
      newValues: updatedAccount,
      description: `Cập nhật tài khoản ${updatedAccount.channelName} trên ${updatedAccount.platform}`,
    });
  }

  return updatedAccount;
}

export async function deleteAccount(id: string): Promise<void> {
  await requirePermission("accounts.delete");
  const { data, error } = await supabase
    .from("accounts")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // Log activity
  const user = await getCurrentUser();
  if (user) {
    await createActivityLog("delete", "settings", id, {
      userId: user.userId,
      description: `Xóa tài khoản ${data.channel_name} trên ${data.platform}`,
    });
  }
}
