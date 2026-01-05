import { supabase } from "@/lib/supabase";
import { ActivityLog, ActivityType, EntityType } from "@/lib/types";

export async function createActivityLog(
  activityType: ActivityType,
  entityType: EntityType,
  entityId: string,
  options?: {
    userId?: string | null;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    description?: string;
  }
): Promise<ActivityLog> {
  const { data, error } = await supabase
    .from("activity_logs")
    .insert({
      activity_type: activityType,
      entity_type: entityType,
      entity_id: entityId,
      user_id: options?.userId || null,
      old_values: options?.oldValues || null,
      new_values: options?.newValues || null,
      description: options?.description || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating activity log:", error);
    throw error;
  }

  return data;
}

export async function getActivityLogs(filters?: {
  userId?: string;
  entityType?: EntityType;
  entityId?: string;
  activityType?: ActivityType;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}): Promise<{ data: ActivityLog[]; total: number }> {
  let query = supabase.from("activity_logs").select("*", { count: "exact" });

  if (filters?.userId && filters.userId !== "all") {
    query = query.eq("user_id", filters.userId);
  }

  if (filters?.entityType) {
    query = query.eq("entity_type", filters.entityType);
  }

  if (filters?.entityId) {
    query = query.eq("entity_id", filters.entityId);
  }

  if (filters?.activityType) {
    query = query.eq("activity_type", filters.activityType);
  }

  if (filters?.startDate) {
    query = query.gte("created_at", filters.startDate.toISOString());
  }

  if (filters?.endDate) {
    // End of the day
    const endOfDay = new Date(filters.endDate);
    endOfDay.setHours(23, 59, 59, 999);
    query = query.lte("created_at", endOfDay.toISOString());
  }

  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching activity logs:", error);
    throw error;
  }

  return { data: data || [], total: count || 0 };
}

export async function getEntityHistory(
  entityType: EntityType,
  entityId: string
): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching entity history:", error);
    throw error;
  }

  return data || [];
}

export async function deleteActivityLog(id: number): Promise<void> {
  const { error } = await supabase.from("activity_logs").delete().eq("id", id);

  if (error) {
    console.error("Error deleting activity log:", error);
    throw error;
  }
}

export async function clearOldActivityLogs(
  daysOld: number = 90
): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const { error } = await supabase
    .from("activity_logs")
    .delete()
    .lt("created_at", cutoffDate.toISOString());

  if (error) {
    console.error("Error clearing old activity logs:", error);
    throw error;
  }
}
