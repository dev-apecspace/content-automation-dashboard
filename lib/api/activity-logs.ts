import { supabase } from "@/lib/supabase"

export type ActivityType = "create" | "update" | "delete" | "approve" | "publish" | "schedule"
export type EntityType = "content" | "schedule" | "project" | "user" | "settings" | "video"

export interface ActivityLog {
  id: number
  user_id: string | null
  activity_type: ActivityType
  entity_type: EntityType
  entity_id: string
  old_values: Record<string, any> | null
  new_values: Record<string, any> | null
  description: string | null
  created_at: string
}

export async function createActivityLog(
  activityType: ActivityType,
  entityType: EntityType,
  entityId: string,
  options?: {
    userId?: string | null
    oldValues?: Record<string, any>
    newValues?: Record<string, any>
    description?: string
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
    .single()

  if (error) {
    console.error("Error creating activity log:", error)
    throw error
  }

  return data
}

export async function getActivityLogs(filters?: {
  userId?: string
  entityType?: EntityType
  entityId?: string
  activityType?: ActivityType
  limit?: number
  offset?: number
}): Promise<ActivityLog[]> {
  let query = supabase.from("activity_logs").select("*")

  if (filters?.userId) {
    query = query.eq("user_id", filters.userId)
  }

  if (filters?.entityType) {
    query = query.eq("entity_type", filters.entityType)
  }

  if (filters?.entityId) {
    query = query.eq("entity_id", filters.entityId)
  }

  if (filters?.activityType) {
    query = query.eq("activity_type", filters.activityType)
  }

  query = query.order("created_at", { ascending: false })

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching activity logs:", error)
    throw error
  }

  return data || []
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
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching entity history:", error)
    throw error
  }

  return data || []
}

export async function deleteActivityLog(id: number): Promise<void> {
  const { error } = await supabase.from("activity_logs").delete().eq("id", id)

  if (error) {
    console.error("Error deleting activity log:", error)
    throw error
  }
}

export async function clearOldActivityLogs(daysOld: number = 90): Promise<void> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  const { error } = await supabase
    .from("activity_logs")
    .delete()
    .lt("created_at", cutoffDate.toISOString())

  if (error) {
    console.error("Error clearing old activity logs:", error)
    throw error
  }
}
