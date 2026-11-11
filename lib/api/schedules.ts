"use server";

import { supabase } from "@/lib/supabase";
import type { Schedule } from "@/lib/types";
import camelcaseKeys from "camelcase-keys";
import snakecaseKeys from "snakecase-keys";
import { requirePermission, getCurrentUser } from "@/lib/auth/permissions";
import { createActivityLog } from "@/lib/api/activity-logs";

export async function getSchedules(): Promise<Schedule[]> {
  const { data, error } = await supabase
    .from("schedules")
    .select("*")
    .order("project_name", { ascending: true });

  if (error) {
    console.error("Error fetching schedules:", error);
    throw error;
  }

  return camelcaseKeys(data || [], { deep: true }) as Schedule[];
}

export async function getSchedulesByProjectId(
  projectId: string
): Promise<Schedule[]> {
  const { data, error } = await supabase
    .from("schedules")
    .select("*")
    .eq("project_id", projectId);

  if (error) {
    console.error("Error fetching schedules:", error);
    throw error;
  }

  return camelcaseKeys(data || [], { deep: true }) as Schedule[];
}

export async function getScheduleById(id: string): Promise<Schedule | null> {
  const { data, error } = await supabase
    .from("schedules")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching schedule:", error);
    throw error;
  }

  return camelcaseKeys(data || null, { deep: true }) as Schedule;
}

export async function createSchedule(
  schedule: Omit<Schedule, "id">
): Promise<Schedule> {
  await requirePermission("schedules.create");
  const { data, error } = await supabase
    .from("schedules")
    .insert(
      snakecaseKeys(
        {
          id: Date.now().toString(),
          ...schedule,
        },
        { deep: true }
      )
    )
    .select()
    .single();

  if (error) {
    console.error("Error creating schedule:", error);
    throw error;
  }

  // Log activity
  const user = await getCurrentUser();
  if (user) {
    await createActivityLog("create", "schedule", data.id, {
      userId: user.userId,
      newValues: data,
      description: `Tạo lịch đăng cho dự án ${data.project_name} trên ${data.platform} (${data.frequency})`,
    });
  }

  return camelcaseKeys(data || null, { deep: true }) as Schedule;
}

export async function updateSchedule(
  id: string,
  updates: Partial<Schedule>
): Promise<Schedule> {
  await requirePermission("schedules.edit");

  // Fetch old data for logging
  const { data: oldData } = await supabase
    .from("schedules")
    .select("*")
    .eq("id", id)
    .single();

  const { data, error } = await supabase
    .from("schedules")
    .update(snakecaseKeys(updates, { deep: true }))
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating schedule:", error);
    throw error;
  }

  // Log activity
  const user = await getCurrentUser();
  if (user) {
    await createActivityLog("update", "schedule", id, {
      userId: user.userId,
      oldValues: oldData,
      newValues: updates,
      description: `Cập nhật lịch đăng dự án ${oldData.project_name} trên ${oldData.platform}`,
    });
  }

  return camelcaseKeys(data || null, { deep: true }) as Schedule;
}

export async function deleteSchedule(id: string): Promise<void> {
  await requirePermission("schedules.delete");
  // Fetch old data for logging
  const { data: oldData } = await supabase
    .from("schedules")
    .select("*")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("schedules").delete().eq("id", id);

  if (error) {
    console.error("Error deleting schedule:", error);
    throw error;
  }

  // Log activity
  const user = await getCurrentUser();
  if (user && oldData) {
    await createActivityLog("delete", "schedule", id, {
      userId: user.userId,
      oldValues: oldData,
      description: `Xóa lịch đăng dự án ${oldData.project_name} trên ${oldData.platform}`,
    });
  }
}

export async function toggleScheduleActive(
  id: string,
  isActive: boolean
): Promise<Schedule> {
  await requirePermission("schedules.edit");

  // Fetch old data for logging
  const { data: oldData } = await supabase
    .from("schedules")
    .select("*")
    .eq("id", id)
    .single();

  const { data, error } = await supabase
    .from("schedules")
    .update({ is_active: isActive })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error toggling schedule:", error);
    throw error;
  }

  // Log activity
  const user = await getCurrentUser();
  if (user) {
    await createActivityLog("update", "schedule", id, {
      userId: user.userId,
      description: `Đổi trạng thái lịch đăng dự án ${
        oldData.project_name
      } trên ${oldData.platform} sang ${isActive ? "Hoạt động" : "Tạm dừng"}`,
      oldValues: oldData,
      newValues: { isActive },
    });
  }

  return camelcaseKeys(data || null, { deep: true }) as Schedule;
}
