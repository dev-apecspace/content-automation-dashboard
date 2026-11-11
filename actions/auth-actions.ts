"use server";

import { getCurrentUserRole } from "@/lib/auth/permissions";
import { supabase } from "@/lib/supabase";

import { cookies } from "next/headers";
import { verifyToken } from "@/lib/server/encryption";

export async function getMyProfile() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return null;

  try {
    const payload = verifyToken(token);
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, name, role")
      .eq("id", payload.userId)
      .single();

    if (error) return null;
    return user;
  } catch (error) {
    return null;
  }
}

export async function getMyPermissions() {
  const roleId = await getCurrentUserRole();

  if (!roleId) {
    return { role: null, permissions: [] };
  }

  // If admin, maybe return all permissions?
  // For consistency with hook logic, just returning role is enough if hook handles 'admin' check.
  // But let's fetch permissions anyway for completeness.

  const { data, error } = await supabase
    .from("role_permissions")
    .select("permission_id")
    .eq("role_id", roleId);

  if (error) {
    console.error("Error fetching my permissions:", error);
    return { role: roleId, permissions: [] };
  }

  return {
    role: roleId,
    permissions: data.map((p) => p.permission_id),
  };
}
