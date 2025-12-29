"use server";

import { supabase } from "@/lib/supabase";
import type { Schedule } from "@/lib/types";
import camelcaseKeys from "camelcase-keys";
import snakecaseKeys from "snakecase-keys";
import { requirePermission } from "@/lib/auth/permissions";

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

  return camelcaseKeys(data || null, { deep: true }) as Schedule;
}

export async function updateSchedule(
  id: string,
  updates: Partial<Schedule>
): Promise<Schedule> {
  await requirePermission("schedules.edit");
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

  return camelcaseKeys(data || null, { deep: true }) as Schedule;
}

export async function deleteSchedule(id: string): Promise<void> {
  await requirePermission("schedules.delete");
  const { error } = await supabase.from("schedules").delete().eq("id", id);

  if (error) {
    console.error("Error deleting schedule:", error);
    throw error;
  }
}

export async function toggleScheduleActive(
  id: string,
  isActive: boolean
): Promise<Schedule> {
  await requirePermission("schedules.edit");
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

  return camelcaseKeys(data || null, { deep: true }) as Schedule;
}
