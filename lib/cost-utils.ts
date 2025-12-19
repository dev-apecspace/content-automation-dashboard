import { AIModel, CostLog } from "@/lib/types";

export function calculateImageCost(model: AIModel | undefined): number {
  if (!model) return 0;

  let cost = 0;
  if (model.unitType === "per_megapixel") {
    cost = model.costPerUnit * 1; // Default 1MP for estimation
  } else if (model.unitType === "per_run") {
    cost = model.costPerUnit;
  }
  // If per_second, likely not image, but if it is content generation that takes time?
  // Usually estimating image is per run or MP.

  return cost;
}

export function calculateVideoCost(
  videoModel: AIModel | undefined,
  audioModel: AIModel | undefined,
  duration: number
): { total: number; breakdown: string } {
  let totalCost = 0;
  const breakdownParts: string[] = [];

  if (videoModel && duration > 0) {
    let cost = 0;
    if (videoModel.unitType === "per_second") {
      cost = duration * videoModel.costPerUnit;
    } else if (videoModel.unitType === "per_run") {
      cost = videoModel.costPerUnit;
    }
    totalCost += cost;
    breakdownParts.push(`${videoModel.name}`);
  }

  if (audioModel && duration > 0) {
    let cost = 0;
    if (audioModel.unitType === "per_second") {
      cost = duration * audioModel.costPerUnit;
    } else if (audioModel.unitType === "per_run") {
      cost = audioModel.costPerUnit;
    }
    totalCost += cost;
    breakdownParts.push(`${audioModel.name}`);
  }

  return {
    total: totalCost,
    breakdown: breakdownParts.join(" + "),
  };
}

export function calculateTotalCostFromLogs(logs: CostLog[]): number {
  return logs.reduce((total, log) => {
    let cost = 0;
    const model = log.aiModels as AIModel | undefined;

    if (log.currency) {
      // If currency is present (specifically for fixed cost api calls), usage amount
      cost = log.amount;
    } else if (model) {
      // Calculate based on model cost
      cost = log.amount * model.costPerUnit;
    }
    return total + cost;
  }, 0);
}

export function analyzeCostLogs(logs: CostLog[]) {
  const result = {
    totalCost: 0,
    generateCost: 0,
    editCost: 0,
    details: {
      video: { generate: 0, edit: 0, editCount: 0 },
      audio: { generate: 0, edit: 0, editCount: 0 },
      image: { generate: 0, edit: 0, editCount: 0 },
    },
  };

  logs.forEach((log) => {
    let cost = 0;
    const model = log.aiModels as AIModel | undefined;

    if (log.currency) {
      cost = log.amount;
    } else if (model) {
      cost = log.amount * model.costPerUnit;
    }

    result.totalCost += cost;

    const modelType = model?.modelType || "image"; // Default to image if unknown, or handle appropriately
    // map modelType string to key
    let typeKey: "video" | "audio" | "image" = "image";
    if (modelType === "video") typeKey = "video";
    if (modelType === "audio") typeKey = "audio";

    if (log.costType === "generate") {
      result.generateCost += cost;
      result.details[typeKey].generate += cost;
    } else if (log.costType === "edit") {
      result.editCost += cost;
      result.details[typeKey].edit += cost;
      result.details[typeKey].editCount++;
    }
  });

  return result;
}

export function formatCurrency(
  amount: number,
  currency: string = "USD"
): string {
  if (currency === "VND") {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 3,
  }).format(amount);
}

export function convertUSDToVND(amountUSD: number): number {
  return amountUSD * 26000;
}
