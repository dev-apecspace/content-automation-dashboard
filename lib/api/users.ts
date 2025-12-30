"use server";

import { supabase } from "@/lib/supabase";
import { createActivityLog } from "@/lib/api/activity-logs";
import { getCurrentUser } from "@/lib/auth/permissions";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "editor" | "viewer";
  is_active: boolean;
  created_at: string;
  updated_at: string;
  password?: string;
}

export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching users:", error);
    throw error;
  }

  return data || [];
}

export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching all users:", error);
    throw error;
  }

  return data || [];
}

export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching user:", error);
    throw error;
  }

  return data || null;
}

import { hashPassword } from "@/lib/server/encryption";

export async function createUser(
  user: Omit<User, "id" | "created_at" | "updated_at">
): Promise<User> {
  if (!user.password) throw new Error("Password is required for new users");
  const hashedPassword = await hashPassword(user.password);
  const { data, error } = await supabase
    .from("users")
    .insert({
      id: Date.now().toString(),
      ...user,
      password: hashedPassword,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating user:", error);
    throw error;
  }

  // Log activity
  const currentUser = await getCurrentUser();
  if (currentUser) {
    await createActivityLog("create", "user", data.id, {
      userId: currentUser.userId,
      newValues: data,
      description: `Tạo người dùng ${data.email}`,
    });
  }

  return data;
}

export async function updateUser(
  id: string,
  updates: Partial<User>
): Promise<User> {
  let finalUpdates = { ...updates };

  if (updates.password) {
    finalUpdates.password = await hashPassword(updates.password);
  }

  // Fetch old data for logging
  const { data: oldData } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  const { data, error } = await supabase
    .from("users")
    .update({ ...finalUpdates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating user:", error);
    throw error;
  }

  // Log activity (Note: not fetching old data here to save perf, usually admin updates)
  const currentUser = await getCurrentUser();
  if (currentUser) {
    await createActivityLog("update", "user", id, {
      userId: currentUser.userId,
      oldValues: oldData,
      newValues: finalUpdates,
      description: `Cập nhật người dùng ${id}`,
    });
  }

  return data;
}

export async function deactivateUser(id: string): Promise<User> {
  // Fetch old data for logging
  const { data: oldData } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  const { data, error } = await supabase
    .from("users")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error deactivating user:", error);
    throw error;
  }

  // Log activity
  const currentUser = await getCurrentUser();
  if (currentUser) {
    await createActivityLog("update", "user", id, {
      userId: currentUser.userId,
      description: `Vô hiệu hóa người dùng ${id}`,
      oldValues: oldData,
      newValues: { is_active: false },
    });
  }

  return data;
}
