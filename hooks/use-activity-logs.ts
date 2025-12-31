import { useQuery } from "@tanstack/react-query";
import { getActivityLogs } from "@/lib/api/activity-logs"; // Adjusted import path to match file location
import { ActivityType, EntityType } from "@/lib/types";

interface UseActivityLogsOptions {
  activityType?: ActivityType | "all";
  entityType?: EntityType | "all";
  userId?: string;
  limit?: number;
  offset?: number;
}

export function useActivityLogs(options: UseActivityLogsOptions = {}) {
  const { activityType, entityType, userId, limit = 100, offset = 0 } = options;

  return useQuery({
    queryKey: [
      "activity-logs",
      activityType,
      entityType,
      userId,
      limit,
      offset,
    ],
    queryFn: () =>
      getActivityLogs({
        activityType: activityType !== "all" ? activityType : undefined,
        entityType: entityType !== "all" ? entityType : undefined,
        userId,
        limit,
        offset,
      }),
    refetchInterval: 60000, // 1 minute
    staleTime: 1000 * 30, // 30 seconds
  });
}
