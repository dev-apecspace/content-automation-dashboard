import { supabase } from "@/lib/supabase"
import type { ContentItem, ContentStatus } from "@/lib/types"

export async function getContentItems(filters?: {
  status?: ContentStatus | "all"
  projectId?: string
}): Promise<ContentItem[]> {
  let query = supabase.from("content_items").select("*").eq("platform", "Facebook Post")

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status)
  }

  if (filters?.projectId) {
    query = query.eq("project_id", filters.projectId)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching content items:", error)
    throw error
  }

  return data || []
}

export async function getContentItemById(id: string): Promise<ContentItem | null> {
  const { data, error } = await supabase.from("content_items").select("*").eq("id", id).single()

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching content item:", error)
    throw error
  }

  if (data) {
    const scriptScenes = await getScriptScenes(id)
    return { ...data, script: scriptScenes }
  }

  return null
}

export async function createContentItem(
  content: Omit<ContentItem, "id" | "createdAt" | "updatedAt">
): Promise<ContentItem> {
  const contentData = content

  const dbData = {
    id: Date.now().toString(),
    status: contentData.status,
    idea: contentData.idea,
    project_id: contentData.projectId,
    project_name: contentData.projectName,
    platform: "Facebook Post",
    image_link: contentData.imageLink,
    topic: contentData.topic,
    target_audience: contentData.targetAudience,
    research_notes: contentData.researchNotes,
    expected_post_date: contentData.expectedPostDate || null,
    posting_time: contentData.postingTime,
    caption: contentData.caption,
    call_to_action: contentData.callToAction,
  }

  const { data, error } = await supabase
    .from("content_items")
    .insert(dbData)
    .select()
    .single()

  if (error) {
    console.error("Error creating content item:", error)
    throw error
  }

  return data
}

export async function updateContentItem(
  id: string,
  updates: Partial<ContentItem>
): Promise<ContentItem> {
  const updateData = updates

  const dbData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  }

  if (updateData.status !== undefined) dbData.status = updateData.status
  if (updateData.idea !== undefined) dbData.idea = updateData.idea
  if (updateData.projectId !== undefined) dbData.project_id = updateData.projectId
  if (updateData.projectName !== undefined) dbData.project_name = updateData.projectName
  if (updateData.imageLink !== undefined) dbData.image_link = updateData.imageLink
  if (updateData.topic !== undefined) dbData.topic = updateData.topic
  if (updateData.targetAudience !== undefined) dbData.target_audience = updateData.targetAudience
  if (updateData.researchNotes !== undefined) dbData.research_notes = updateData.researchNotes
  if (updateData.expectedPostDate !== undefined) dbData.expected_post_date = updateData.expectedPostDate
  if (updateData.postingTime !== undefined) dbData.posting_time = updateData.postingTime
  if (updateData.caption !== undefined) dbData.caption = updateData.caption
  if (updateData.callToAction !== undefined) dbData.call_to_action = updateData.callToAction

  const { data, error } = await supabase
    .from("content_items")
    .update(dbData)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating content item:", error)
    throw error
  }

  return data
}

export async function deleteContentItem(id: string): Promise<void> {
  const { error } = await supabase.from("content_items").delete().eq("id", id)

  if (error) {
    console.error("Error deleting content item:", error)
    throw error
  }
}

export async function updateContentStatus(id: string, status: ContentStatus): Promise<ContentItem> {
  const updates: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === "da_dang_thanh_cong") {
    updates.published_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from("content_items")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating content status:", error)
    throw error
  }

  return data
}

export async function approveContent(
  id: string,
  approvedBy: string
): Promise<ContentItem> {
  const { data, error } = await supabase
    .from("content_items")
    .update({
      status: "da_dang_thanh_cong",
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error approving content:", error)
    throw error
  }

  return data
}


