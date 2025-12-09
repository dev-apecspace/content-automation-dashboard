import { supabase } from "@/lib/supabase"
import type { VideoItem, ContentStatus } from "@/lib/types"

export async function getVideoItems(filters?: {
  status?: ContentStatus | "all"
  projectId?: string
  platform?: string
}): Promise<VideoItem[]> {
  let query = supabase.from("video_items").select("*")

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status)
  }

  if (filters?.projectId) {
    query = query.eq("project_id", filters.projectId)
  }

  if (filters?.platform) {
    query = query.eq("platform", filters.platform)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching video items:", error)
    throw error
  }

  return data || []
}

export async function getVideoItemById(id: string): Promise<VideoItem | null> {
  const { data, error } = await supabase.from("video_items").select("*").eq("id", id).single()

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching video item:", error)
    throw error
  }

  if (data) {
    const scriptScenes = await getScriptScenes(id)
    return { ...data, script: scriptScenes }
  }

  return null
}

export async function createVideoItem(
  video: Omit<VideoItem, "id" | "createdAt" | "updatedAt">
): Promise<VideoItem> {
  const { script, ...videoData } = video

  const dbData = {
    id: Date.now().toString(),
    status: videoData.status,
    idea: videoData.idea,
    project_id: videoData.projectId,
    project_name: videoData.projectName,
    platform: videoData.platform,
    existing_video_link: videoData.existingVideoLink,
    video_duration: videoData.videoDuration,
    image_link: videoData.imageLink,
    topic: videoData.topic,
    target_audience: videoData.targetAudience,
    research_notes: videoData.researchNotes,
    expected_post_date: videoData.expectedPostDate || null,
    posting_time: videoData.postingTime,
    caption: videoData.caption,
    call_to_action: videoData.callToAction,
  }

  const { data, error } = await supabase
    .from("video_items")
    .insert(dbData)
    .select()
    .single()

  if (error) {
    console.error("Error creating video item:", error)
    throw error
  }

  if (script && script.length > 0) {
    await createScriptScenes(data.id, script)
  }

  return data
}

export async function updateVideoItem(
  id: string,
  updates: Partial<VideoItem>
): Promise<VideoItem> {
  const { script, ...updateData } = updates

  const dbData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  }

  if (updateData.status !== undefined) dbData.status = updateData.status
  if (updateData.idea !== undefined) dbData.idea = updateData.idea
  if (updateData.projectId !== undefined) dbData.project_id = updateData.projectId
  if (updateData.projectName !== undefined) dbData.project_name = updateData.projectName
  if (updateData.platform !== undefined) dbData.platform = updateData.platform
  if (updateData.existingVideoLink !== undefined) dbData.existing_video_link = updateData.existingVideoLink
  if (updateData.videoDuration !== undefined) dbData.video_duration = updateData.videoDuration
  if (updateData.imageLink !== undefined) dbData.image_link = updateData.imageLink
  if (updateData.topic !== undefined) dbData.topic = updateData.topic
  if (updateData.targetAudience !== undefined) dbData.target_audience = updateData.targetAudience
  if (updateData.researchNotes !== undefined) dbData.research_notes = updateData.researchNotes
  if (updateData.expectedPostDate !== undefined) dbData.expected_post_date = updateData.expectedPostDate
  if (updateData.postingTime !== undefined) dbData.posting_time = updateData.postingTime
  if (updateData.caption !== undefined) dbData.caption = updateData.caption
  if (updateData.callToAction !== undefined) dbData.call_to_action = updateData.callToAction

  const { data, error } = await supabase
    .from("video_items")
    .update(dbData)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating video item:", error)
    throw error
  }

  if (script && script.length > 0) {
    await deleteScriptScenes(id)
    await createScriptScenes(id, script)
  }

  if (script) {
    data.script = script
  }

  return data
}

export async function deleteVideoItem(id: string): Promise<void> {
  const { error } = await supabase.from("video_items").delete().eq("id", id)

  if (error) {
    console.error("Error deleting video item:", error)
    throw error
  }
}

export async function updateVideoStatus(id: string, status: ContentStatus): Promise<VideoItem> {
  const updates: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === "da_dang_thanh_cong") {
    updates.published_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from("video_items")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating video status:", error)
    throw error
  }

  return data
}

export async function approveVideo(
  id: string,
  approvedBy: string
): Promise<VideoItem> {
  const { data, error } = await supabase
    .from("video_items")
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
    console.error("Error approving video:", error)
    throw error
  }

  return data
}

async function getScriptScenes(videoItemId: string) {
  const { data, error } = await supabase
    .from("script_scenes_video")
    .select("*")
    .eq("video_item_id", videoItemId)
    .order("scene_number", { ascending: true })

  if (error) {
    console.error("Error fetching script scenes:", error)
    return []
  }

  return data?.map((scene) => ({
    scene: scene.scene_number,
    description: scene.description,
    dialogue: scene.dialogue,
  })) || []
}

async function createScriptScenes(
  videoItemId: string,
  scenes: { scene: number; description: string; dialogue: string }[]
) {
  const sceneData = scenes.map((scene) => ({
    video_item_id: videoItemId,
    scene_number: scene.scene,
    description: scene.description,
    dialogue: scene.dialogue,
  }))

  const { error } = await supabase.from("script_scenes_video").insert(sceneData)

  if (error) {
    console.error("Error creating script scenes:", error)
    throw error
  }
}

async function deleteScriptScenes(videoItemId: string) {
  const { error } = await supabase.from("script_scenes_video").delete().eq("video_item_id", videoItemId)

  if (error) {
    console.error("Error deleting script scenes:", error)
    throw error
  }
}
