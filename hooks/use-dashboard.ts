import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardService } from "@/lib/services/dashboard-service";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: DashboardService.getOverviewStats,
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

export function usePerformanceMetrics(days: number = 7) {
  return useQuery({
    queryKey: ["dashboard-metrics", days],
    queryFn: () => DashboardService.getPerformanceMetrics(days),
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export function useContentStats() {
  return useQuery({
    queryKey: ["dashboard-content-stats"],
    queryFn: DashboardService.getContentStats,
    staleTime: 1000 * 60 * 5,
  });
}

export function useVideoStats() {
  return useQuery({
    queryKey: ["dashboard-video-stats"],
    queryFn: DashboardService.getVideoStats,
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

export function useScheduleStats() {
  return useQuery({
    queryKey: ["dashboard-schedule-stats"],
    queryFn: DashboardService.getScheduleStats,
    staleTime: 1000 * 60 * 5,
  });
}
