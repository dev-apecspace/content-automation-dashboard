// lib/api/content-items.ts
import { supabase } from "@/lib/supabase";
import camelcaseKeys from "camelcase-keys";
import type { ContentItem, Status } from "@/lib/types";

export async function getContentItems(filters?: {
  status?: Status | "all";
  projectId?: string;
}): Promise<ContentItem[]> {
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
  return camelcaseKeys(data || [], { deep: true }) as ContentItem[];
}

export async function getContentItemById(
  id: string
): Promise<ContentItem | null> {
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

  return camelcaseKeys(data || null, { deep: true }) as ContentItem;
}

export async function createContentItem(
  content: Omit<ContentItem, "id" | "createdAt" | "updatedAt">
): Promise<ContentItem> {
  const dbData = {
    status: content.status || "idea",
    idea: content.idea,
    project_id: content.projectId,
    project_name: content.projectName,
    platform: content.platform,
    content_type: content.contentType,
    image_link: content.imageLink,
    topic: content.topic,
    target_audience: content.targetAudience,
    research_notes: content.researchNotes,
    posting_time: content.postingTime,
    caption: content.caption,
    call_to_action: content.callToAction,
    post_url: content.postUrl,
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

  return data;
}

export async function updateContentItem(
  id: string,
  updates: Partial<ContentItem>
): Promise<ContentItem> {
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
  if (updates.postUrl !== undefined) dbData.post_url = updates.postUrl;
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

  return camelcaseKeys(data || null, { deep: true }) as ContentItem;
}

export async function deleteContentItem(id: string): Promise<void> {
  const { error } = await supabase.from("content_items").delete().eq("id", id);

  if (error) {
    console.error("Error deleting content item:", error);
    throw error;
  }
}

// Hàm cập nhật trạng thái chung (dùng cho các bước chuyển status)
export async function updateContentStatus(
  id: string,
  status: Status
): Promise<ContentItem> {
  const updates: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  };

  // Nếu đăng thành công thì lưu thời gian published
  if (status === "posted_successfully") {
    updates.published_at = new Date().toISOString();
  }

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

  return data;
}

// Phê duyệt ý tưởng (từ idea → idea_approved)
export async function approveIdea(
  id: string,
  approvedBy: string,
  idea: string,
  projectId: string,
  contentType: string,
  imageLink: string
): Promise<ContentItem> {
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
          imageLink,
        },
      }),
    }).catch((webhookError) => {
      console.error("Failed to send webhook:", webhookError);
    });
  } else {
    console.warn("Webhook URL not configured. Skipping webhook call.");
  }

  return camelcaseKeys(data || null, { deep: true }) as ContentItem;
}

// Phê duyệt nội dung (từ awaiting_content_approval → content_approved)
export async function approveContent(
  id: string,
  approvedBy: string
): Promise<ContentItem> {
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

  return camelcaseKeys(data || null, { deep: true }) as ContentItem;
}
