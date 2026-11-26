import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardService } from "@/lib/services/dashboard-service";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

// Key phân biệt cache giữa dashboard tổng (all) và theo công ty (ids)
const scopeKey = (scope?: string[] | null) =>
  scope && scope.length > 0 ? scope.join(",") : scope ? "empty" : "all";

export function useDashboardStats(scope?: string[] | null) {
  return useQuery({
    queryKey: ["dashboard-stats", scopeKey(scope)],
    queryFn: () => DashboardService.getOverviewStats(scope ?? null),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ["dashboard-activity"],
    queryFn: DashboardService.getRecentActivity,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
}

export function usePerformanceMetrics(
  days: number = 7,
  scope?: string[] | null,
) {
  return useQuery({
    queryKey: ["dashboard-metrics", days, scopeKey(scope)],
    queryFn: () => DashboardService.getPerformanceMetrics(days, scope ?? null),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useDashboardRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // supabase imported above

    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "content_items" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-activity"] });
          queryClient.invalidateQueries({
            queryKey: ["dashboard-content-stats"],
          });
          queryClient.invalidateQueries({ queryKey: ["dashboard-cost-stats"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "video_items" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-activity"] });
          queryClient.invalidateQueries({
            queryKey: ["dashboard-video-stats"],
          });
          queryClient.invalidateQueries({ queryKey: ["dashboard-cost-stats"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activity_logs" } as any,
        () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard-activity"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export function useContentStats(scope?: string[] | null) {
  return useQuery({
    queryKey: ["dashboard-content-stats", scopeKey(scope)],
    queryFn: () => DashboardService.getContentStats(scope ?? null),
    staleTime: 1000 * 60 * 5,
  });
}

export function useVideoStats(scope?: string[] | null) {
  return useQuery({
    queryKey: ["dashboard-video-stats", scopeKey(scope)],
    queryFn: () => DashboardService.getVideoStats(scope ?? null),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCostStats() {
  return useQuery({
    queryKey: ["dashboard-cost-stats"],
    queryFn: DashboardService.getCostStats,
    staleTime: 1000 * 60 * 5,
  });
}

export function useScheduleStats(scope?: string[] | null) {
  return useQuery({
    queryKey: ["dashboard-schedule-stats", scopeKey(scope)],
    queryFn: () => DashboardService.getScheduleStats(scope ?? null),
    staleTime: 1000 * 60 * 5,
  });
}
