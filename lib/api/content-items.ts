"use server";

import { supabase } from "@/lib/supabase";
import camelcaseKeys from "camelcase-keys";
import type { ContentItem, Status } from "@/lib/types";
import { requirePermission, getCurrentUser } from "@/lib/auth/permissions";
import { createActivityLog } from "@/lib/api/activity-logs";

export async function getContentItems(filters?: {
  status?: Status | "all";
  projectId?: string;
}): Promise<ContentItem[]> {
  await requirePermission("content.view");
  let query = supabase.from("content_items").select("*");

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters?.projectId && filters.projectId !== "all") {
    query = query.eq("project_id", filters.projectId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching content items:", error);
    throw error;
  }

  // Tự động chuyển toàn bộ snake_case sang camelCase (deep: true để xử lý nested object nếu có)
  const items = camelcaseKeys(data || [], { deep: true }) as ContentItem[];

  // Fetch posts separately for these items
  if (items.length > 0) {
    const itemIds = items.map((i) => i.id);
    const { data: postsData } = await supabase
      .from("posts")
      .select("*")
      .in("item_id", itemIds)
      .eq("item_type", "content");

    const posts = camelcaseKeys(postsData || [], { deep: true }) as any[];

    // Map posts to items
    items.forEach((item) => {
      item.posts = posts.filter((p) => p.itemId === item.id);
    });
  }

  return items;
}

export async function getContentItemById(
  id: string
): Promise<ContentItem | null> {
  await requirePermission("content.view");
  const { data, error } = await supabase
    .from("content_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116: no rows returned
    console.error("Error fetching content item:", error);
    throw error;
  }

  const item = camelcaseKeys(data || null, { deep: true }) as ContentItem;

  if (item) {
    const { data: postsData } = await supabase
      .from("posts")
      .select("*")
      .eq("item_id", id)
      .eq("item_type", "content");

    if (postsData && postsData.length > 0) {
      item.posts = camelcaseKeys(postsData, { deep: true }) as any[];
    }
  }

  return item;
}

export async function createContentItem(
  content: Omit<ContentItem, "id" | "createdAt" | "updatedAt">
): Promise<ContentItem> {
  await requirePermission("content.create");
  const dbData = {
    status: content.status || "idea",
    idea: content.idea,
    project_id: content.projectId,
    project_name: content.projectName,
    platform: content.platform,
    content_type: content.contentType,
    image_links: content.imageLinks,
    topic: content.topic,
    target_audience: content.targetAudience,
    research_notes: content.researchNotes,
    posting_time: content.postingTime,
    caption: content.caption,
    call_to_action: content.callToAction,
    account_ids: content.accountIds,
  };

  const { data, error } = await supabase
    .from("content_items")
    .insert(dbData)
    .select()
    .single();

  if (error) {
    console.error("Error creating content item:", error);
    throw error;
  }

  // Log activity
  const user = await getCurrentUser();
  if (user) {
    await createActivityLog("create", "content", data.id, {
      userId: user.userId,
      newValues: data,
      description: `Tạo nội dung mới ${data.id}`,
    });
  }

  return data;
}

export async function updateContentItem(
  id: string,
  updates: Partial<ContentItem>
): Promise<ContentItem> {
  await requirePermission("content.edit");

  // Fetch old data for logging
  const { data: oldData } = await supabase
    .from("content_items")
    .select("*")
    .eq("id", id)
    .single();

  const dbData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.status !== undefined) dbData.status = updates.status;
  if (updates.idea !== undefined) dbData.idea = updates.idea;
  if (updates.projectId !== undefined) dbData.project_id = updates.projectId;
  if (updates.projectName !== undefined)
    dbData.project_name = updates.projectName;
  if (updates.platform !== undefined) dbData.platform = updates.platform;
  if (updates.contentType !== undefined)
    dbData.content_type = updates.contentType;
  if (updates.imageLinks !== undefined) dbData.image_links = updates.imageLinks;
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
  if (updates.accountIds !== undefined) dbData.account_ids = updates.accountIds;

  const { data, error } = await supabase
    .from("content_items")
    .update(dbData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating content item:", error);
    throw error;
  }

  // Log activity
  const user = await getCurrentUser();
  if (user) {
    await createActivityLog("update", "content", id, {
      userId: user.userId,
      oldValues: oldData,
      newValues: dbData,
      description: `Cập nhật nội dung ${oldData.idea}`,
    });
  }

  return camelcaseKeys(data || null, { deep: true }) as ContentItem;
}

export async function deleteContentItem(id: string): Promise<void> {
  await requirePermission("content.delete");
  const { data: oldData, error } = await supabase
    .from("content_items")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error deleting content item:", error);
    throw error;
  }

  // Log activity
  const user = await getCurrentUser();
  if (user && oldData) {
    await createActivityLog("delete", "content", id, {
      userId: user.userId,
      description: `Xóa nội dung ${oldData.idea}`,
    });
  }
}

// Hàm cập nhật trạng thái chung (dùng cho các bước chuyển status)
export async function updateContentStatus(
  id: string,
  status: Status
): Promise<ContentItem> {
  await requirePermission("content.edit");
  const updates: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  };

  // Fetch old data for logging
  const { data: oldData } = await supabase
    .from("content_items")
    .select("*")
    .eq("id", id)
    .single();

  const { data, error } = await supabase
    .from("content_items")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating content status:", error);
    throw error;
  }

  // Log activity
  const user = await getCurrentUser();
  if (user) {
    await createActivityLog("update", "content", id, {
      userId: user.userId,
      oldValues: oldData,
      newValues: updates,
      description: `Cập nhật trạng thái nội dung ${oldData.idea} sang ${status}`,
    });
  }

  return data;
}

// Phê duyệt ý tưởng (từ idea → idea_approved)
export async function approveIdea(
  id: string,
  approvedBy: string,
  idea: string,
  projectId: string,
  contentType: string,
  imageLinks: string[]
): Promise<ContentItem> {
  await requirePermission("content.approve");

  // Fetch old data for logging
  const { data: oldData } = await supabase
    .from("content_items")
    .select("*")
    .eq("id", id)
    .single();

  const { data, error } = await supabase
    .from("content_items")
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

  const webhookUrl = process.env.NEXT_PUBLIC_POST_TRIGGER_WEBHOOK;

  if (webhookUrl) {
    fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "content_idea.approved",
        timestamp: new Date().toISOString(),
        data: {
          id,
          idea,
          projectId,
          contentType,
          imageLinks,
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
    await createActivityLog("approve", "content", id, {
      userId: user.userId,
      oldValues: oldData,
      newValues: {
        status: "ai_generating_content",
        approvedBy,
        idea,
      },
      description: `Phê duyệt ý tưởng ${oldData.idea}`,
    });
  }

  return camelcaseKeys(data || null, { deep: true }) as ContentItem;
}

// Phê duyệt nội dung (từ awaiting_content_approval → content_approved)
export async function approveContent(
  id: string,
  approvedBy: string
): Promise<ContentItem> {
  await requirePermission("content.approve");

  // Fetch old data for logging
  const { data: oldData } = await supabase
    .from("content_items")
    .select("*")
    .eq("id", id)
    .single();

  const { data, error } = await supabase
    .from("content_items")
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
    await createActivityLog("approve", "content", id, {
      userId: user.userId,
      oldValues: oldData,
      newValues: {
        status: "content_approved",
        approvedBy,
      },
      description: `Phê duyệt nội dung ${oldData.idea}`,
    });
  }

  return camelcaseKeys(data || null, { deep: true }) as ContentItem;
}
