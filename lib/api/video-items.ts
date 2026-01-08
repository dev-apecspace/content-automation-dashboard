"use server";

import { supabase } from "@/lib/supabase";
import camelcaseKeys from "camelcase-keys";
import type { VideoItem, Status, Platform } from "@/lib/types";
import { requirePermission, getCurrentUser } from "@/lib/auth/permissions";
import { createActivityLog } from "@/lib/api/activity-logs";

export async function getVideoItems(filters?: {
  status?: Status | "all";
  projectId?: string;
  platform?: Platform;
  page?: number;
  pageSize?: number;
}): Promise<{ data: VideoItem[]; total: number }> {
  await requirePermission("videos.view");
  let query = supabase.from("video_items").select("*", { count: "exact" });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters?.projectId && filters.projectId !== "all") {
    query = query.eq("project_id", filters.projectId);
  }

  if (filters?.platform) {
    query = query.contains("platform", [filters.platform]);
  }

  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 15;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .order("idea", { ascending: true })
    .range(from, to);

  if (error) {
    console.error("Error fetching video items:", error);
    throw error;
  }

  // Tự động chuyển toàn bộ snake_case sang camelCase (deep: true để xử lý nested object nếu có)
  const items = camelcaseKeys(data || [], { deep: true }) as VideoItem[];

  // Fetch posts separately for these items
  if (items.length > 0) {
    const itemIds = items.map((i) => i.id);
    const { data: postsData } = await supabase
      .from("posts")
      .select("*")
      .in("item_id", itemIds)
      .eq("item_type", "video");

    const posts = camelcaseKeys(postsData || [], { deep: true }) as any[];

    // Map posts to items
    items.forEach((item) => {
      item.posts = posts.filter((p) => p.itemId === item.id);
    });
  }

  return { data: items, total: count || 0 };
}

export async function getVideoItemById(id: string): Promise<VideoItem | null> {
  await requirePermission("videos.view");
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

  const item = camelcaseKeys(data || null, { deep: true }) as VideoItem;

  if (item) {
    const { data: postsData } = await supabase
      .from("posts")
      .select("*")
      .eq("item_id", id)
      .eq("item_type", "video");

    if (postsData && postsData.length > 0) {
      item.posts = camelcaseKeys(postsData, { deep: true }) as any[];
    }
  }

  return item;
}

export async function createVideoItem(
  video: Omit<VideoItem, "id" | "createdAt" | "updatedAt">
): Promise<VideoItem> {
  await requirePermission("videos.create");
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
    account_ids: video.accountIds,
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

  const item = camelcaseKeys(data, { deep: true }) as VideoItem;

  // Log activity
  const user = await getCurrentUser();
  if (user) {
    await createActivityLog("create", "video", item.id, {
      userId: user.userId,
      newValues: item,
      description: `Tạo video: ${item.idea}`,
    });
  }

  return item;
}

export async function updateVideoItem(
  id: string,
  updates: Partial<VideoItem>
): Promise<VideoItem> {
  await requirePermission("videos.edit");

  // Fetch old data for logging
  const { data: oldData } = await supabase
    .from("video_items")
    .select("*")
    .eq("id", id)
    .single();

  const dbData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.status !== undefined) dbData.status = updates.status;
  if (updates.title !== undefined) dbData.title = updates.title;
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
  if (updates.accountIds !== undefined) dbData.account_ids = updates.accountIds;

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

  // Log activity
  const user = await getCurrentUser();
  if (user) {
    await createActivityLog("update", "video", id, {
      userId: user.userId,
      oldValues: oldData,
      newValues: dbData,
      description: `Cập nhật video ${oldData.idea}`,
    });
  }

  return camelcaseKeys(data || null, { deep: true }) as VideoItem;
}

export async function deleteVideoItem(id: string): Promise<void> {
  await requirePermission("videos.delete");

  // Fetch old data for logging
  const { data: oldData } = await supabase
    .from("video_items")
    .select("*")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("video_items").delete().eq("id", id);
  if (error) {
    console.error("Error deleting video item:", error);
    throw error;
  }

  // Log activity
  const user = await getCurrentUser();
  if (user && oldData) {
    await createActivityLog("delete", "video", id, {
      userId: user.userId,
      description: `Xóa video ${oldData.idea}`,
    });
  }
}

export async function updateVideoStatus(
  id: string,
  status: Status
): Promise<VideoItem> {
  await requirePermission("videos.edit");
  return updateVideoItem(id, { status });
}

// Phê duyệt ý tưởng (từ idea → ai_generating_content)
export async function approveVideoIdea(
  id: string,
  approvedBy: string,
  idea: string,
  projectId: string,
  projectName: string,
  createdAt: string,
  platform: Platform[],
  videoDuration?: number,
  existingVideoLink?: string,
  imageLink?: string
): Promise<VideoItem> {
  await requirePermission("videos.edit");

  // Fetch old data for logging
  const { data: oldData } = await supabase
    .from("video_items")
    .select("*")
    .eq("id", id)
    .single();

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
          projectName,
          platform,
          videoDuration,
          existingVideoLink,
          imageLink,
          createdAt,
        },
      }),
    }).catch((webhookError) => {
      console.error("Failed to send webhook:", webhookError);
    });
  } else {
    console.warn("Webhook URL not configured. Skipping webhook call.");
  }

  // Log activity
  const user = await getCurrentUser();
  if (user) {
    await createActivityLog("approve", "video", id, {
      userId: user.userId,
      oldValues: oldData,
      newValues: {
        status: "ai_generating_content",
        approvedBy,
        idea,
      },
      description: `Phê duyệt ý tưởng video ${oldData.idea}`,
    });
  }

  return camelcaseKeys(data || null, { deep: true }) as VideoItem;
}

// Phê duyệt nội dung (từ awaiting_content_approval → content_approved)
export async function approveVideoContent(
  id: string,
  approvedBy: string
): Promise<VideoItem> {
  await requirePermission("videos.edit");

  // Fetch old data for logging
  const { data: oldData } = await supabase
    .from("video_items")
    .select("*")
    .eq("id", id)
    .single();

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

  // Log activity
  const user = await getCurrentUser();
  if (user) {
    await createActivityLog("approve", "video", id, {
      userId: user.userId,
      oldValues: oldData,
      newValues: {
        status: "content_approved",
        approvedBy,
      },
      description: `Phê duyệt nội dung video ${oldData.idea}`,
    });
  }

  return camelcaseKeys(data || null, { deep: true }) as VideoItem;
}

// Đăng bài ngay lập tức (Post Now)
export async function postVideoNow(id: string): Promise<VideoItem> {
  await requirePermission("videos.edit"); // Use edit permission or appropriate one

  // Fetch old data for logging
  const { data: oldData } = await supabase
    .from("video_items")
    .select("*")
    .eq("id", id)
    .single();

  // 1. Cập nhật status -> content_approved
  const { data, error } = await supabase
    .from("video_items")
    .update({
      status: "content_approved",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error posting video now:", error);
    throw error;
  }

  // 2. Gọi Webhook Post Now
  const webhookUrl = process.env.NEXT_PUBLIC_POST_NOW_WEBHOOK;

  if (webhookUrl) {
    // Fire-and-forget
    fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        item_id: id,
      }),
    }).catch((webhookError) => {
      console.error("Failed to send post_now webhook:", webhookError);
    });
  } else {
    console.warn("WEBHOOK not configured.");
  }

  // 3. Log activity
  const user = await getCurrentUser();
  if (user) {
    await createActivityLog("publish", "video", id, {
      userId: user.userId,
      oldValues: oldData,
      newValues: { status: "content_approved", action: "post_now" },
      description: `Đăng ngay video ${oldData.idea}`,
    });
  }

  return camelcaseKeys(data || null, { deep: true }) as VideoItem;
}
