import { useQuery } from "@tanstack/react-query";
import { getActivityLogs } from "@/lib/api/activity-logs"; // Adjusted import path to match file location
import { ActivityType, EntityType } from "@/lib/types";

interface UseActivityLogsOptions {
  activityType?: ActivityType | "all";
  entityType?: EntityType | "all";
  userId?: string | "all";
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

export function useActivityLogs(options: UseActivityLogsOptions = {}) {
  const {
    activityType,
    entityType,
    userId,
    startDate,
    endDate,
    page = 1,
    pageSize = 20,
  } = options;

  return useQuery({
    queryKey: [
      "activity-logs",
      activityType,
      entityType,
      userId,
      startDate,
      endDate,
      page,
      pageSize,
    ],
    queryFn: () =>
      getActivityLogs({
        activityType: activityType !== "all" ? activityType : undefined,
        entityType: entityType !== "all" ? entityType : undefined,
        userId: userId !== "all" ? userId : undefined,
        startDate,
        endDate,
        page,
        pageSize,
      }),
    staleTime: 1000 * 30, // 30 seconds
  });
}
