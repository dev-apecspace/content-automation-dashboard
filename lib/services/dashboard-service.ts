import { supabase } from "@/lib/supabase";
import camelcaseKeys from "camelcase-keys";
import {
  ChartDataPoint,
  DashboardStats,
  ContentItem,
  VideoItem,
  ContentStats,
  VideoStats,
  CostStats,
  PlatformDistribution,
  Platform,
  StatusDistribution,
  ActivityLog,
} from "@/lib/types";
import {
  startOfDay,
  subDays,
  format,
  getISOWeek,
  getYear,
  getMonth,
} from "date-fns";

export const DashboardService = {
  // Schedule Statistics (Week, Month, Year)
  getScheduleStats: async (): Promise<{
    week: number;
    month: number;
    year: number;
  }> => {
    // Fetch all contents and videos that have a postingTime
    // Ideally this should be filtered by date range in SQL for performance,
    // but for now we'll fetch all active items and filter in JS as per other methods to ensure accurate parsing of custom date strings "dd/MM/yyyy HH:mm"

    // We only care about items that are NOT in error or removed state
    const { data: contentData } = await supabase
      .from("content_items")
      .select("status, posting_time")
      .not("status", "in", '("post_removed","error")')
      .not("posting_time", "is", null);

    const { data: videoData } = await supabase
      .from("video_items")
      .select("status, posting_time")
      .not("status", "in", '("post_removed","error")')
      .not("posting_time", "is", null);

    const allItems = [
      ...(contentData || []).map((c) => ({ ...c, type: "content" })),
      ...(videoData || []).map((v) => ({ ...v, type: "video" })),
    ];

    const now = new Date();
    const currentYear = getYear(now);
    const currentMonth = getMonth(now); // 0-indexed
    const currentWeek = getISOWeek(now);

    let weekCount = 0;
    let monthCount = 0;
    let yearCount = 0;

    allItems.forEach((item) => {
      if (!item.posting_time) return;

      // Parse "dd/MM/yyyy HH:mm"
      // TODO: Refactor date parsing into a shared utility
      try {
        const [datePart, timePart] = item.posting_time.split(" ");
        if (!datePart) return; // invalid format

        const [day, month, year] = datePart.split("/");

        // Construct date object
        // Note: Months in JS Date are 0-indexed, but our string is 1-indexed (1-12)
        const itemDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day)
        );

        if (isNaN(itemDate.getTime())) return;

        const itemYear = getYear(itemDate);
        const itemMonth = getMonth(itemDate);
        const itemWeek = getISOWeek(itemDate);

        if (itemYear === currentYear) {
          yearCount++;
          if (itemMonth === currentMonth) {
            monthCount++;
          }
          if (itemWeek === currentWeek) {
            // Note: ISO Week calculation can be tricky around year boundaries,
            // but usually matching year + week is sufficient for "this week"
            weekCount++;
          }
        }
      } catch (e) {
        // ignore parse errors
      }
    });

    return {
      week: weekCount,
      month: monthCount,
      year: yearCount,
    };
  },

  // Aggregate stats from multiple tables
  getOverviewStats: async (): Promise<DashboardStats> => {
    // supabase client is already initialized

    // Parallel fetch for efficiency
    const [
      { count: projectsCount },
      { data: contentData },
      { data: videoData },
    ] = await Promise.all([
      supabase.from("projects").select("*", { count: "exact", head: true }),
      supabase
        .from("content_items")
        .select("status, reactions, comments, shares"),
      supabase
        .from("video_items")
        .select("status, views, reactions, comments, shares"),
    ]);

    const activeContentsCount =
      (contentData?.length || 0) + (videoData?.length || 0);

    const pendingApprovalsCount =
      (contentData?.filter((c) =>
        ["idea", "awaiting_content_approval", "media_edited"].includes(c.status)
      ).length || 0) +
      (videoData?.filter((v) =>
        ["idea", "awaiting_content_approval", "media_edited"].includes(v.status)
      ).length || 0);

    const scheduledPostsCount =
      (contentData?.filter((c) => c.status === "posted_successfully").length ||
        0) +
      (videoData?.filter((v) => v.status === "posted_successfully").length ||
        0);

    const totalViews =
      videoData?.reduce(
        (acc: number, curr: { views: number | null }) =>
          acc + (curr.views || 0),
        0
      ) || 0;

    const contentReactions =
      contentData?.reduce(
        (
          acc: number,
          c: {
            reactions: number | null;
            comments: number | null;
            shares: number | null;
          }
        ) => acc + (c.reactions || 0) + (c.comments || 0) + (c.shares || 0),
        0
      ) || 0;
    const videoReactions =
      videoData?.reduce(
        (
          acc: number,
          v: {
            reactions: number | null;
            comments: number | null;
            shares: number | null;
          }
        ) => acc + (v.reactions || 0) + (v.comments || 0) + (v.shares || 0),
        0
      ) || 0;

    return {
      totalProjects: projectsCount || 0,
      totalPosts: activeContentsCount,
      pendingApprovals: pendingApprovalsCount,
      scheduledPosts: scheduledPostsCount,
      totalViews,
      totalReactions: contentReactions + videoReactions,
    };
  },

  // Create real activity logs
  getRecentActivity: async (): Promise<ActivityLog[]> => {
    const { getActivityLogs } = await import("@/lib/api/activity-logs");

    try {
      return await getActivityLogs({ limit: 10 });
    } catch (error) {
      console.error("Failed to fetch activity logs", error);
      return [];
    }
  },

  // Mock performance metrics for charts (since we might not have historical tracking yet)
  getPerformanceMetrics: async (days = 7): Promise<ChartDataPoint[]> => {
    // Real data fetching and aggregation
    const startDate = subDays(startOfDay(new Date()), days).toISOString();

    const [contentRes, videoRes] = await Promise.all([
      supabase
        .from("content_items")
        .select("created_at, reactions, comments, shares")
        .gte("created_at", startDate),
      supabase
        .from("video_items")
        .select("created_at, views, reactions, comments, shares")
        .gte("created_at", startDate),
    ]);

    const contentItems = (contentRes.data || []) as any[];
    const videoItems = (videoRes.data || []) as any[];

    // Initialize map with all dates in range
    const groupedData = new Map<string, ChartDataPoint>();
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const dateStr = format(subDays(today, i), "MMM dd");
      groupedData.set(dateStr, {
        date: dateStr,
        views: 0,
        reactions: 0,
        comments: 0,
        shares: 0,
        posts: 0,
      });
    }

    // Process Content Items
    contentItems.forEach((item) => {
      const dateStr = format(new Date(item.created_at), "MMM dd");
      const entry = groupedData.get(dateStr);
      if (entry) {
        entry.reactions += item.reactions || 0;
        entry.comments += item.comments || 0;
        entry.shares += item.shares || 0;
        entry.posts += 1;
      }
    });

    // Process Video Items
    videoItems.forEach((item) => {
      const dateStr = format(new Date(item.created_at), "MMM dd");
      const entry = groupedData.get(dateStr);
      if (entry) {
        entry.views += item.views || 0;
        entry.reactions += item.reactions || 0;
        entry.comments += item.comments || 0;
        entry.shares += item.shares || 0;
        entry.posts += 1;
      }
    });

    return Array.from(groupedData.values());
  },

  // Detailed Content Analytics
  getContentStats: async (): Promise<ContentStats> => {
    const { data: contentData } = await supabase
      .from("content_items")
      .select("*");
    const items = camelcaseKeys(contentData || [], {
      deep: true,
    }) as ContentItem[];

    // Calculate specific status counts
    const now = new Date();

    const pendingApproval = items.filter(
      (c) => c.status === "idea" || c.status === "awaiting_content_approval"
    ).length;

    const readyToPost = items.filter(
      (c) => c.status === "content_approved"
    ).length;

    const overdue = items.filter((c) => {
      // Check if status is NOT posted_successfully
      if (c.status === "posted_successfully" || c.status === "post_removed")
        return false;

      // Check postingTime format dd/mm/yyyy HH:mm
      if (!c.postingTime) return false;

      try {
        const [datePart, timePart] = c.postingTime.split(" ");
        if (!datePart || !timePart) return false;

        const [day, month, year] = datePart.split("/");
        const [hour, minute] = timePart.split(":");

        const postDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hour),
          parseInt(minute)
        );

        return postDate < now;
      } catch (e) {
        return false;
      }
    }).length;

    // Platform Distribution
    const platformCounts = items.reduce((acc: any, item) => {
      const p = item.platform || "Other";
      acc[p] = (acc[p] || 0) + 1;
      return acc;
    }, {});

    const byPlatform: PlatformDistribution[] = Object.entries(
      platformCounts
    ).map(([key, count]) => ({
      platform: key as Platform | "Other",
      count: count as number,
      percentage:
        items.length > 0 ? ((count as number) / items.length) * 100 : 0,
    }));

    // Status Distribution
    const statusCounts = items.reduce((acc: any, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});

    const { statusConfig } = await import("@/lib/types");
    const byStatus: StatusDistribution[] = Object.entries(statusCounts).map(
      ([key, count]) => ({
        status: key as import("@/lib/types").Status,
        count: count as number,
        label: statusConfig[key as import("@/lib/types").Status]?.label || key,
      })
    );

    const topPerforming = [...items]
      .sort(
        (a, b) =>
          (b.reactions || 0) +
          (b.comments || 0) -
          ((a.reactions || 0) + (a.comments || 0))
      )
      .slice(0, 5);

    return {
      totalItems: items.length,
      pendingApproval,
      readyToPost,
      overdue,
      byPlatform,
      byStatus,
      topPerforming,
    };
  },

  // Detailed Video Analytics
  getVideoStats: async (): Promise<VideoStats> => {
    const { data: videoData } = await supabase.from("video_items").select("*");
    const videos = camelcaseKeys(videoData || [], {
      deep: true,
    }) as VideoItem[];

    // Calculate specific status counts
    const now = new Date();

    const pendingApproval = videos.filter(
      (v) => v.status === "idea" || v.status === "awaiting_content_approval"
    ).length;

    const readyToPost = videos.filter(
      (v) => v.status === "content_approved"
    ).length;

    const overdue = videos.filter((v) => {
      // Check if status is NOT posted_successfully
      if (v.status === "posted_successfully" || v.status === "post_removed")
        return false;

      // Check postingTime format dd/mm/yyyy HH:mm
      if (!v.postingTime) return false;

      try {
        const [datePart, timePart] = v.postingTime.split(" ");
        if (!datePart || !timePart) return false;

        const [day, month, year] = datePart.split("/");
        const [hour, minute] = timePart.split(":");

        const postDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hour),
          parseInt(minute)
        );

        return postDate < now;
      } catch (e) {
        return false;
      }
    }).length;

    const posted = videos.filter(
      (v) => v.status === "posted_successfully"
    ).length;

    const totalViews = videos.reduce((acc, v) => acc + (v.views || 0), 0);
    const avgDuration =
      videos.length > 0
        ? videos.reduce((acc, v) => acc + (v.videoDuration || 0), 0) /
          videos.length
        : 0;

    const platformCounts: Record<string, number> = {};
    videos.forEach((v) => {
      if (Array.isArray(v.platform)) {
        v.platform.forEach((p) => {
          platformCounts[p] = (platformCounts[p] || 0) + 1;
        });
      }
    });

    const byPlatform: PlatformDistribution[] = Object.entries(
      platformCounts
    ).map(([key, count]) => ({
      platform: key as Platform | "Other",
      count,
      percentage: videos.length > 0 ? (count / videos.length) * 100 : 0,
    }));

    const topPerforming = [...videos]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5);

    return {
      totalVideos: videos.length,
      totalViews,
      avgDuration,
      pendingApproval,
      readyToPost,
      overdue,
      posted,
      byPlatform,
      topPerforming,
    };
  },

  // Cost Analytics
  getCostStats: async (): Promise<CostStats> => {
    const { DEFAULT_MODELS } = await import("@/lib/types");
    const videoModel = DEFAULT_MODELS.find((m) => m.type === "video");
    const imageModel = DEFAULT_MODELS.find((m) => m.type === "image");

    const videoCostPerSec = videoModel?.cost || 0.07;
    const imageCostPerItem = imageModel?.cost || 0.025; // Assuming 1MP avg

    // Fetch ALL items for Total Cost (optimized select)
    // Note: For very large datasets, this should be an RPC call or paginated
    const [allContentRes, allVideoRes] = await Promise.all([
      supabase.from("content_items").select("created_at"),
      supabase.from("video_items").select("created_at, video_duration"),
    ]);

    const contentItems = (allContentRes.data || []) as any[];
    const videoItems = (allVideoRes.data || []) as any[];

    // 1. Calculate Total Costs
    const totalImages = contentItems.length;
    const totalImageCost = totalImages * imageCostPerItem;

    const totalDuration = videoItems.reduce(
      (acc, v) => acc + (v.video_duration || 0),
      0
    );
    const totalVideoCost = totalDuration * videoCostPerSec;

    // Derived Audio Cost (If we tracked audio separately we'd query it. For now assuming 0 unless we have audio_items table)
    // User requested "no mock data", so if we don't have audio data, audio cost is 0.
    const totalAudioCost = 0;

    const totalCost = totalVideoCost + totalImageCost + totalAudioCost;

    // 2. Calculate Daily Costs (Last 7 Days)
    const dailyMap = new Map<string, number>();
    const today = new Date();
    const days = 7;

    // Initialize last 7 days with 0
    for (let i = days - 1; i >= 0; i--) {
      const dateStr = format(subDays(today, i), "MMM dd");
      dailyMap.set(dateStr, 0);
    }

    const startDate = subDays(startOfDay(today), days);

    // Filter and sum Content costs for last 7 days
    contentItems.forEach((item) => {
      const itemDate = new Date(item.created_at);
      if (itemDate >= startDate) {
        const dateStr = format(itemDate, "MMM dd");
        if (dailyMap.has(dateStr)) {
          dailyMap.set(
            dateStr,
            (dailyMap.get(dateStr) || 0) + imageCostPerItem
          );
        }
      }
    });

    // Filter and sum Video costs for last 7 days
    videoItems.forEach((item) => {
      const itemDate = new Date(item.created_at);
      if (itemDate >= startDate) {
        const dateStr = format(itemDate, "MMM dd");
        if (dailyMap.has(dateStr)) {
          const cost = (item.video_duration || 0) * videoCostPerSec;
          dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + cost);
        }
      }
    });

    const dailyCosts = Array.from(dailyMap.entries()).map(([date, cost]) => ({
      date,
      cost,
    }));

    return {
      totalCost,
      byType: {
        video: totalVideoCost,
        image: totalImageCost,
        audio: totalAudioCost,
      },
      dailyCosts,
    };
  },
};
