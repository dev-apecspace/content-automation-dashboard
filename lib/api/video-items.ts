import { supabase } from "@/lib/supabase";
import camelcaseKeys from "camelcase-keys";
import type { VideoItem, Status, Platform } from "@/lib/types";

export async function getVideoItems(filters?: {
  status?: Status | "all";
  projectId?: string;
  platform?: Platform;
}): Promise<VideoItem[]> {
  let query = supabase.from("video_items").select("*");

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters?.projectId && filters.projectId !== "all") {
    query = query.eq("project_id", filters.projectId);
  }

  if (filters?.platform) {
    query = query.contains("platform", [filters.platform]);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching video items:", error);
    throw error;
  }

  // Tự động chuyển toàn bộ snake_case sang camelCase (deep: true để xử lý nested object nếu có)
  return camelcaseKeys(data || [], { deep: true }) as VideoItem[];
}

export async function getVideoItemById(id: string): Promise<VideoItem | null> {
  const { data, error } = await supabase
    .from("video_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116: no rows returned
    console.error("Error fetching video item:", error);
    throw error;
  }

  return camelcaseKeys(data || null, { deep: true }) as VideoItem;
}

export async function createVideoItem(
  video: Omit<VideoItem, "id" | "createdAt" | "updatedAt">
): Promise<VideoItem> {
  const dbData = {
    status: video.status || "idea",
    idea: video.idea,
    project_id: video.projectId,
    project_name: video.projectName,
    platform: video.platform,
    existing_video_link: video.existingVideoLink,
    video_duration: video.videoDuration,
    image_link: video.imageLink,
    topic: video.topic,
    target_audience: video.targetAudience,
    research_notes: video.researchNotes,
    posting_time: video.postingTime,
    caption: video.caption,
    call_to_action: video.callToAction,
    title: video.title,
    video_link: video.videoLink,
    post_url: video.postUrl,
  };

  const { data, error } = await supabase
    .from("video_items")
    .insert(dbData)
    .select()
    .single();

  if (error) {
    console.error("Error creating video item:", error);
    throw error;
  }

  return camelcaseKeys(data, { deep: true }) as VideoItem;
}

export async function updateVideoItem(
  id: string,
  updates: Partial<VideoItem>
): Promise<VideoItem> {
  const dbData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.status !== undefined) dbData.status = updates.status;
  if (updates.idea !== undefined) dbData.idea = updates.idea;
  if (updates.projectId !== undefined) dbData.project_id = updates.projectId;
  if (updates.projectName !== undefined)
    dbData.project_name = updates.projectName;
  if (updates.platform !== undefined) dbData.platform = updates.platform;
  if (updates.existingVideoLink !== undefined)
    dbData.existing_video_link = updates.existingVideoLink;
  if (updates.videoDuration !== undefined)
    dbData.video_duration = updates.videoDuration;
  if (updates.imageLink !== undefined) dbData.image_link = updates.imageLink;
  if (updates.topic !== undefined) dbData.topic = updates.topic;
  if (updates.targetAudience !== undefined)
    dbData.target_audience = updates.targetAudience;
  if (updates.researchNotes !== undefined)
    dbData.research_notes = updates.researchNotes;
  if (updates.postingTime !== undefined)
    dbData.posting_time = updates.postingTime;
  if (updates.caption !== undefined) dbData.caption = updates.caption;
  if (updates.callToAction !== undefined)
    dbData.call_to_action = updates.callToAction;
  if (updates.title !== undefined) dbData.title = updates.title;
  if (updates.videoLink !== undefined) dbData.video_link = updates.videoLink;
  if (updates.postUrl !== undefined) dbData.post_url = updates.postUrl;
  if (updates.approvedBy !== undefined) dbData.approved_by = updates.approvedBy;
  if (updates.approvedAt !== undefined) dbData.approved_at = updates.approvedAt;
  if (updates.publishedAt !== undefined)
    dbData.published_at = updates.publishedAt;
  if (updates.views !== undefined) dbData.views = updates.views;
  if (updates.reactions !== undefined) dbData.reactions = updates.reactions;
  if (updates.comments !== undefined) dbData.comments = updates.comments;
  if (updates.shares !== undefined) dbData.shares = updates.shares;
  if (updates.statsAt !== undefined) dbData.stats_at = updates.statsAt;

  const { data, error } = await supabase
    .from("video_items")
    .update(dbData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating video item:", error);
    throw error;
  }

  return camelcaseKeys(data || null, { deep: true }) as VideoItem;
}

export async function deleteVideoItem(id: string): Promise<void> {
  const { error } = await supabase.from("video_items").delete().eq("id", id);

  if (error) {
    console.error("Error deleting video item:", error);
    throw error;
  }
}

// Hàm cập nhật trạng thái chung (dùng cho các bước chuyển status)
export async function updateVideoStatus(
  id: string,
  status: Status
): Promise<VideoItem> {
  const updates: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  };

  // Nếu đăng thành công thì lưu thời gian published
  if (status === "posted_successfully") {
    updates.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("video_items")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating video status:", error);
    throw error;
  }

  return camelcaseKeys(data || null, { deep: true }) as VideoItem;
}

// Phê duyệt ý tưởng (từ idea → idea_approved)
export async function approveVideoIdea(
  id: string,
  approvedBy: string,
  idea: string,
  projectId: string,
  platform: Platform[],
  videoDuration?: number,
  existingVideoLink?: string
): Promise<VideoItem> {
  const { data, error } = await supabase
    .from("video_items")
    .update({
      status: "ai_generating_content",
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error approving idea:", error);
    throw error;
  }

  const webhookUrl = process.env.NEXT_PUBLIC_VIDEO_TRIGGER_WEBHOOK;

  if (webhookUrl) {
    fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "video_idea.approved",
        timestamp: new Date().toISOString(),
        data: {
          id,
          idea,
          projectId,
          platform,
          videoDuration,
          existingVideoLink,
        },
      }),
    }).catch((webhookError) => {
      console.error("Failed to send webhook:", webhookError);
    });
  } else {
    console.warn("Webhook URL not configured. Skipping webhook call.");
  }

  return camelcaseKeys(data || null, { deep: true }) as VideoItem;
}

// Phê duyệt nội dung (từ awaiting_content_approval → content_approved)
export async function approveVideoContent(
  id: string,
  approvedBy: string
): Promise<VideoItem> {
  const { data, error } = await supabase
    .from("video_items")
    .update({
      status: "content_approved",
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error approving content:", error);
    throw error;
  }

  return camelcaseKeys(data || null, { deep: true }) as VideoItem;
}