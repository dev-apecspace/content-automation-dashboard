import { supabase } from "@/lib/supabase"

export interface Setting {
  id: number
  key: string
  value: string | null
  description: string | null
  updated_at: string
  updated_by: string | null
}

export interface AIConfig {
  id: number
  model_name: string
  system_prompt: string | null
  max_tokens: number
  temperature: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface NotificationSettings {
  id: number
  user_id: string | null
  email: string
  notify_on_approve: boolean
  notify_on_publish: boolean
  notify_on_error: boolean
  created_at: string
  updated_at: string
}

export async function getSetting(key: string): Promise<Setting | null> {
  const { data, error } = await supabase.from("settings").select("*").eq("key", key).single()

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching setting:", error)
    throw error
  }

  return data || null
}

export async function getSettings(keys: string[]): Promise<Record<string, string | null>> {
  const { data, error } = await supabase.from("settings").select("*").in("key", keys)

  if (error) {
    console.error("Error fetching settings:", error)
    throw error
  }

  const result: Record<string, string | null> = {}
  data?.forEach((setting) => {
    result[setting.key] = setting.value
  })

  return result
}

export async function updateSetting(
  key: string,
  value: string,
  updatedBy: string
): Promise<Setting> {
  const existing = await getSetting(key)

  let result

  if (existing) {
    const { data, error } = await supabase
      .from("settings")
      .update({
        value,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy,
      })
      .eq("key", key)
      .select()
      .single()

    if (error) {
      console.error("Error updating setting:", error)
      throw error
    }

    result = data
  } else {
    const { data, error } = await supabase
      .from("settings")
      .insert({
        key,
        value,
        updated_by: updatedBy,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating setting:", error)
      throw error
    }

    result = data
  }

  return result
}

export async function getAIConfig(): Promise<AIConfig | null> {
  const { data, error } = await supabase
    .from("ai_config")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching AI config:", error)
    throw error
  }

  return data || null
}

export async function updateAIConfig(updates: Partial<AIConfig>): Promise<AIConfig> {
  const existing = await getAIConfig()

  if (!existing) {
    const { data, error } = await supabase
      .from("ai_config")
      .insert({
        ...updates,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating AI config:", error)
      throw error
    }

    return data
  }

  const { data, error } = await supabase
    .from("ai_config")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", existing.id)
    .select()
    .single()

  if (error) {
    console.error("Error updating AI config:", error)
    throw error
  }

  return data
}

export async function getNotificationSettings(userId?: string): Promise<NotificationSettings[]> {
  let query = supabase.from("notification_settings").select("*")

  if (userId) {
    query = query.eq("user_id", userId)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching notification settings:", error)
    throw error
  }

  return data || []
}

export async function updateNotificationSettings(
  userId: string,
  email: string,
  settings: {
    notify_on_approve?: boolean
    notify_on_publish?: boolean
    notify_on_error?: boolean
  }
): Promise<NotificationSettings> {
  const existing = await supabase
    .from("notification_settings")
    .select("*")
    .eq("user_id", userId)
    .single()

  let result

  if (existing.data) {
    const { data, error } = await supabase
      .from("notification_settings")
      .update({
        ...settings,
        email,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select()
      .single()

    if (error) {
      console.error("Error updating notification settings:", error)
      throw error
    }

    result = data
  } else {
    const { data, error } = await supabase
      .from("notification_settings")
      .insert({
        user_id: userId,
        email,
        ...settings,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating notification settings:", error)
      throw error
    }

    result = data
  }

  return result
}
