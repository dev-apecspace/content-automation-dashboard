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
  const user = await getCurrentUser();
  if (!user) return false;
  const roleId = user.role;

  // Admin always has permission?
  if (roleId === "admin") return true;

  // User khách hàng: quyền theo GÓI ĐANG HIỆU LỰC của công ty
  if (roleId === "customer") {
    return await hasPackagePermission(user.userId, permission);
  }

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

/**
 * Quyền của user khách = quyền của gói đang hiệu lực (subscription
 * status='active' mới nhất) của công ty mà user thuộc về.
 */
export async function hasPackagePermission(
  userId: string,
  permission: PermissionId
): Promise<boolean> {
  const perms = await getCustomerUserPermissions(userId);
  return perms.includes(permission);
}

/**
 * Toàn bộ quyền của user khách (dùng cho hook usePermissions client-side).
 * Không có user/khách/gói hiệu lực → [].
 */
export async function getCustomerUserPermissions(
  userId: string
): Promise<string[]> {
  const { data: u } = await supabase
    .from("users")
    .select("customer_id")
    .eq("id", userId)
    .single();
  if (!u?.customer_id) return [];

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("package_id")
    .eq("customer_id", u.customer_id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (!sub?.package_id) return [];

  const { data: perms, error } = await supabase
    .from("package_permissions")
    .select("permission_id")
    .eq("package_id", sub.package_id);
  if (error || !perms) return [];
  return perms.map((p) => p.permission_id);
}

export async function requirePermission(permission: PermissionId) {
  const allowed = await hasPermission(permission);
  if (!allowed) {
    throw new Error(`Unauthorized: Missing permission ${permission}`);
  }
}
