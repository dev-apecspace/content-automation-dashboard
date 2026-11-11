"use server";

import { supabase } from "@/lib/supabase";
import { Prompt } from "../types";
import { createActivityLog } from "./activity-logs";
import { getCurrentUser } from "@/lib/auth/permissions";

const mapToPrompt = (data: any): Prompt => ({
  id: data.id,
  name: data.name,
  description: data.description,
  template: data.template,
  type: data.type,
  isActive: data.is_active,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

export const getPrompts = async (): Promise<Prompt[]> => {
  const { data, error } = await supabase
    .from("prompts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapToPrompt);
};

export const createPrompt = async (
  prompt: Omit<Prompt, "id" | "createdAt" | "updatedAt">,
): Promise<Prompt> => {
  // If setting to active, deactivate others of specific type
  if (prompt.isActive) {
    await supabase
      .from("prompts")
      .update({ is_active: false })
      .eq("type", prompt.type)
      .eq("is_active", true);
  }

  const { data, error } = await supabase
    .from("prompts")
    .insert({
      name: prompt.name,
      description: prompt.description,
      template: prompt.template,
      type: prompt.type,
      is_active: prompt.isActive,
    })
    .select()
    .single();

  if (error) throw error;

  const newPrompt = mapToPrompt(data);

  // Log activity
  const user = await getCurrentUser();
  if (user) {
    await createActivityLog("create", "prompt", newPrompt.id.toString(), {
      userId: user.userId,
      newValues: newPrompt,
      description: `Tạo prompt mới: ${newPrompt.name}`,
    });
  }

  return newPrompt;
};

export const updatePrompt = async (
  id: number,
  prompt: Partial<Prompt>,
): Promise<Prompt> => {
  // Get old data for log and type check
  const { data: oldDataRaw } = await supabase
    .from("prompts")
    .select("*")
    .eq("id", id)
    .single();

  const oldData = oldDataRaw ? mapToPrompt(oldDataRaw) : undefined;

  // Use new type if provided, otherwise use existing type
  const typeToCheck = prompt.type || oldData?.type;

  // If setting to active, deactivate others of this type
  if (prompt.isActive === true && typeToCheck) {
    await supabase
      .from("prompts")
      .update({ is_active: false })
      .eq("type", typeToCheck)
      .eq("is_active", true)
      .neq("id", id);
  }

  const updates: any = {
    updated_at: new Date().toISOString(),
  };

  if (prompt.name !== undefined) updates.name = prompt.name;
  if (prompt.description !== undefined)
    updates.description = prompt.description;
  if (prompt.template !== undefined) updates.template = prompt.template;
  if (prompt.type !== undefined) updates.type = prompt.type;
  if (prompt.isActive !== undefined) updates.is_active = prompt.isActive;

  const { data, error } = await supabase
    .from("prompts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  const updatedPrompt = mapToPrompt(data);

  // Log activity
  const user = await getCurrentUser();
  if (user) {
    await createActivityLog("update", "prompt", id.toString(), {
      userId: user.userId,
      oldValues: oldData,
      newValues: updatedPrompt,
      description: `Cập nhật prompt: ${updatedPrompt.name}`,
    });
  }

  return updatedPrompt;
};

export const deletePrompt = async (id: number): Promise<void> => {
  // Get old data for log
  const { data: oldDataRaw } = await supabase
    .from("prompts")
    .select("*")
    .eq("id", id)
    .single();

  const oldData = oldDataRaw ? mapToPrompt(oldDataRaw) : undefined;

  const { error } = await supabase.from("prompts").delete().eq("id", id);
  if (error) throw error;

  // Log activity
  const user = await getCurrentUser();
  if (user) {
    await createActivityLog("delete", "prompt", id.toString(), {
      userId: user.userId,
      oldValues: oldData,
      description: `Xóa prompt: ${oldData?.name || id}`,
    });
  }
};
