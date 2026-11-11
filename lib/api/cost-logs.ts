import { supabase } from "@/lib/supabase";
import { CostLog } from "@/lib/types";
import camelcaseKeys from "camelcase-keys";

export async function getCostLogsByItem(
  itemId: string,
  itemType: "video" | "content"
): Promise<CostLog[]> {
  const { data, error } = await supabase
    .from("cost_logs")
    .select("*, ai_models(*)")
    .eq("item_id", itemId)
    .eq("item_type", itemType);

  if (error) {
    console.error(`Error fetching cost logs for ${itemType} ${itemId}:`, error);
    return [];
  }

  // Convert snake_case to camelCase
  return camelcaseKeys(data || [], { deep: true }) as unknown as CostLog[];
}
