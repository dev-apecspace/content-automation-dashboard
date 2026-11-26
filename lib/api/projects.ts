"use server";

import { supabase } from "@/lib/supabase";
import type { Project } from "@/lib/types";
import { requirePermission, getCurrentUser } from "@/lib/auth/permissions";
import { createActivityLog } from "@/lib/api/activity-logs";
import { resolveCustomerForUser } from "@/lib/api/business";
import { getDataScopeProjectIds } from "@/lib/api/scope";

export async function getProjects(): Promise<Project[]> {
  // Join tên khách hàng; nếu cột customer_id chưa tồn tại (chưa chạy bản SQL
  // mới) thì fallback về select thường để trang dự án không chết.
  const joined = await supabase
    .from("projects")
    .select("*, customer:customer_id(id, name)")
    .order("created_at", { ascending: false });

  const scope = await getDataScopeProjectIds();
  if (!joined.error) {
    const list = joined.data || [];
    return scope ? list.filter((p) => scope.has(p.id)) : list;
  }

  const plain = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (plain.error) {
    console.error("Error fetching projects:", plain.error);
    throw plain.error;
  }

  const list = plain.data || [];
  return scope ? list.filter((p) => scope.has(p.id)) : list;
}

export async function getProjectById(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching project:", error);
    throw error;
  }

  return data || null;
}

export async function createProject(
  project: Omit<Project, "id">
): Promise<Project> {
  await requirePermission("projects.create");
  // Không ghi trường join `customer` (chỉ có customer_id là cột thật)
  const { customer: _customer, ...fields } = project as Project;

  // User khách luôn tạo dự án cho đúng công ty của mình (không tin form)
  let customerId = fields.customer_id ?? null;
  const me = await getCurrentUser();
  if (me?.role === "customer") {
    const mine = await resolveCustomerForUser(me.userId);
    customerId = mine.customer_id;
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      ...fields,
      customer_id: customerId,
      id: Date.now().toString(), // sinh lại id đúng (fields có thể còn mang id cũ)
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating project:", error);
    throw error;
  }

  // Log activity
  const user = await getCurrentUser();
  if (user) {
    await createActivityLog("create", "project", data.id, {
      userId: user.userId,
      newValues: data,
      description: `Tạo dự án ${data.name}`,
    });
  }

  return data;
}

export async function updateProject(
  id: string,
  updates: Partial<Project>
): Promise<Project> {
  await requirePermission("projects.edit");

  // Fetch old data for logging
  const { data: oldData } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  // Không ghi trường join `customer` (chỉ có customer_id là cột thật)
  const { customer: _customer, ...fields } = updates as Partial<Project>;
  const { data, error } = await supabase
    .from("projects")
    .update(fields)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating project:", error);
    throw error;
  }

  // Log activity
  const user = await getCurrentUser();
  if (user) {
    await createActivityLog("update", "project", id, {
      userId: user.userId,
      oldValues: oldData,
      newValues: updates,
      description: `Cập nhật dự án ${oldData.name}`,
    });
  }

  return data;
}

export async function deleteProject(id: string): Promise<void> {
  await requirePermission("projects.delete");

  // Fetch old data for logging
  const { data: oldData } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    console.error("Error deleting project:", error);
    throw error;
  }

  // Log activity
  const user = await getCurrentUser();
  if (user && oldData) {
    await createActivityLog("delete", "project", id, {
      userId: user.userId,
      oldValues: oldData,
      description: `Xóa dự án ${oldData.name}`,
    });
  }
}
