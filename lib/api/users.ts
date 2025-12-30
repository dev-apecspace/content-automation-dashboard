import { supabase } from "@/lib/supabase";

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

  return data;
}

export async function deactivateUser(id: string): Promise<User> {
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

  return data;
}
