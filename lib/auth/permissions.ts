import { cookies } from "next/headers";
import { verifyToken } from "@/lib/server/encryption";
import { supabase } from "@/lib/supabase";
import { PermissionId } from "@/lib/constants/permissions";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return null;

  try {
    const payload = verifyToken(token);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function getCurrentUserRole(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.role || null;
}

export async function hasPermission(
  permission: PermissionId
): Promise<boolean> {
  const roleId = await getCurrentUserRole();
  if (!roleId) return false;

  // Admin always has permission?
  if (roleId === "admin") return true;

  // Check database
  const { data, error } = await supabase
    .from("role_permissions")
    .select("permission_id")
    .eq("role_id", roleId)
    .eq("permission_id", permission)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

export async function requirePermission(permission: PermissionId) {
  const allowed = await hasPermission(permission);
  if (!allowed) {
    throw new Error(`Unauthorized: Missing permission ${permission}`);
  }
}
