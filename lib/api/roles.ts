"use server";

import { supabase } from "@/lib/supabase";
import { requirePermission } from "@/lib/auth/permissions";

export interface Role {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  permissions?: string[]; // Array of permission IDs
}

export interface Permission {
  id: string;
  label: string;
  group: string;
  description?: string;
  created_at?: string;
}

export async function getAllPermissions(): Promise<Permission[]> {
  const { data, error } = await supabase
    .from("permissions")
    .select("*")
    .order("group", { ascending: true });

  if (error) {
    console.error("Error fetching permissions:", error);
    return [];
  }

  return data as Permission[];
}

export async function getRoles(): Promise<Role[]> {
  const { data: roles, error } = await supabase
    .from("roles")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching roles:", error);
    throw error;
  }

  // Fetch permissions for each role
  const rolesWithPermissions = await Promise.all(
    roles.map(async (role) => {
      const { data: rolePermissions, error: rpError } = await supabase
        .from("role_permissions")
        .select("permission_id")
        .eq("role_id", role.id);

      if (rpError) {
        console.error(
          `Error fetching permissions for role ${role.id}:`,
          rpError
        );
        return { ...role, permissions: [] };
      }

      return {
        ...role,
        permissions: rolePermissions.map((rp) => rp.permission_id),
      };
    })
  );

  return rolesWithPermissions;
}

export async function getRoleById(id: string): Promise<Role | null> {
  const { data: role, error } = await supabase
    .from("roles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    console.error("Error fetching role:", error);
    throw error;
  }

  const { data: rolePermissions, error: rpError } = await supabase
    .from("role_permissions")
    .select("permission_id")
    .eq("role_id", id);

  if (rpError) {
    console.error(`Error fetching permissions for role ${id}:`, rpError);
    return { ...role, permissions: [] };
  }

  return {
    ...role,
    permissions: rolePermissions.map((rp) => rp.permission_id),
  };
}

export async function createRole(role: {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}): Promise<Role> {
  await requirePermission("roles.create");
  // 1. Create Role
  const { data: newRole, error } = await supabase
    .from("roles")
    .insert({
      id: role.id,
      name: role.name,
      description: role.description,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating role:", error);
    throw error;
  }

  // 2. Assign Permissions
  if (role.permissions.length > 0) {
    const permissionInserts = role.permissions.map((pId) => ({
      role_id: newRole.id,
      permission_id: pId,
    }));

    const { error: pError } = await supabase
      .from("role_permissions")
      .insert(permissionInserts);

    if (pError) {
      console.error("Error assigning permissions:", pError);
      // Optional: Rollback role creation? simplified for now
    }
  }

  return { ...newRole, permissions: role.permissions };
}

export async function updateRole(
  id: string,
  updates: { name: string; description: string; permissions: string[] }
): Promise<Role> {
  await requirePermission("roles.edit");
  // 1. Update Role Details
  const { data: updatedRole, error } = await supabase
    .from("roles")
    .update({
      name: updates.name,
      description: updates.description,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating role:", error);
    throw error;
  }

  // 2. Update Permissions (Delete all and re-insert)
  // Deleting existing
  const { error: delError } = await supabase
    .from("role_permissions")
    .delete()
    .eq("role_id", id);

  if (delError) {
    console.error("Error clearing old permissions:", delError);
    throw delError;
  }

  // Inserting new
  if (updates.permissions.length > 0) {
    const permissionInserts = updates.permissions.map((pId) => ({
      role_id: id,
      permission_id: pId,
    }));

    const { error: insError } = await supabase
      .from("role_permissions")
      .insert(permissionInserts);

    if (insError) {
      console.error("Error inserting new permissions:", insError);
      throw insError;
    }
  }

  return { ...updatedRole, permissions: updates.permissions };
}

export async function deleteRole(id: string): Promise<void> {
  await requirePermission("roles.delete");
  const { error } = await supabase.from("roles").delete().eq("id", id);

  if (error) {
    console.error("Error deleting role:", error);
    throw error;
  }
}
