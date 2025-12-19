import { supabase } from "@/lib/supabase";
import { AIModel } from "@/lib/types";

export async function getAIModels(): Promise<AIModel[]> {
  const { data, error } = await supabase
    .from("ai_models")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching AI models:", error);
    throw error;
  }

  // Cast the checks to ensure type compatibility if DB types vary slightly
  return (data || []).map((item) => ({
    ...item,
    costPerUnit: item.cost_per_unit || 0, // Handle snake_case to camelCase if needed, or map correctly
    unitType: item.unit_type,
    modelType: item.model_type,
    isActive: item.is_active,
  })) as any as AIModel[];
}

// NOTE: Based on the seed data and types, we might need to be careful about snake_case vs camelCase.
// The types.ts defines AIModel with camelCase (costPerUnit), but DB usually uses snake_case (cost_per_unit).
// Let's refine the query to alias if possible, or just map it manually.
// However, Supabase client usually returns what's in DB.
// Let's check the type definition again.
// export interface AIModel {
//   id: number;
//   name: string;
//   modelType: ModelType;
//   costPerUnit: number;
//   unitType: "per_second" | "per_megapixel" | "per_run";
//   ...
// }
//
// If the DB table is ai_models, columns likely are: id, name, model_type, cost_per_unit, unit_type.
// I will implement mapper to be safe.

export async function createAIModel(
  model: Omit<AIModel, "id" | "createdAt" | "updatedAt">
): Promise<AIModel> {
  const dbModel = {
    name: model.name,
    model_type: model.modelType,
    cost_per_unit: model.costPerUnit,
    unit_type: model.unitType,
    currency: model.currency,
    is_active: model.isActive ?? true,
    notes: model.notes,
  };

  const { data, error } = await supabase
    .from("ai_models")
    .insert(dbModel)
    .select()
    .single();

  if (error) {
    console.error("Error creating AI model:", error);
    throw error;
  }

  return mapDBToAIModel(data);
}

export async function updateAIModel(
  id: number,
  updates: Partial<AIModel>
): Promise<AIModel> {
  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.modelType !== undefined) dbUpdates.model_type = updates.modelType;
  if (updates.costPerUnit !== undefined)
    dbUpdates.cost_per_unit = updates.costPerUnit;
  if (updates.unitType !== undefined) dbUpdates.unit_type = updates.unitType;
  if (updates.currency !== undefined) dbUpdates.currency = updates.currency;
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

  dbUpdates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("ai_models")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating AI model:", error);
    throw error;
  }

  return mapDBToAIModel(data);
}

export async function deleteAIModel(id: number): Promise<void> {
  const { error } = await supabase.from("ai_models").delete().eq("id", id);

  if (error) {
    console.error("Error deleting AI model:", error);
    throw error;
  }
}

function mapDBToAIModel(data: any): AIModel {
  return {
    id: data.id,
    name: data.name,
    modelType: data.model_type,
    costPerUnit: data.cost_per_unit,
    unitType: data.unit_type,
    currency: data.currency,
    isActive: data.is_active,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
