"use server";

import { supabase } from "@/lib/supabase";
import type { Project } from "@/lib/types";
import { requirePermission, getCurrentUser } from "@/lib/auth/permissions";
import { createActivityLog } from "@/lib/api/activity-logs";

export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }

  return data || [];
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
  const { data, error } = await supabase
    .from("projects")
    .insert({
      id: Date.now().toString(),
      ...project,
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

  const { data, error } = await supabase
    .from("projects")
    .update(updates)
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
      description: `Cập nhật dự án ${id}`,
    });
  }

  return data;
}

export async function deleteProject(id: string): Promise<void> {
  await requirePermission("projects.delete");
  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    console.error("Error deleting project:", error);
    throw error;
  }

  // Log activity
  const user = await getCurrentUser();
  if (user) {
    await createActivityLog("delete", "project", id, {
      userId: user.userId,
      description: `Xóa dự án ${id}`,
    });
  }
}
