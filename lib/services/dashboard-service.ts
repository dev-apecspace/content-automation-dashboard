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
  ProjectStats,
  AIModel,
  CostLog,
  Post,
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
      { data: postsData },
    ] = await Promise.all([
      supabase.from("projects").select("*", { count: "exact", head: true }),
      supabase.from("content_items").select("status"),
      supabase.from("video_items").select("status"),
      supabase
        .from("posts")
        .select("views, reactions, comments, shares, status"),
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

    // Sum stats from posts table
    let totalViews = 0;
    let totalReactions = 0;

    postsData?.forEach((post) => {
      totalViews += post.views || 0;
      totalReactions +=
        (post.reactions || 0) + (post.comments || 0) + (post.shares || 0);
    });

    return {
      totalProjects: projectsCount || 0,
      totalPosts: activeContentsCount,
      pendingApprovals: pendingApprovalsCount,
      scheduledPosts: scheduledPostsCount,
      totalViews,
      totalReactions,
    };
  },

  // Create real activity logs
  getRecentActivity: async (): Promise<ActivityLog[]> => {
    const { getActivityLogs } = await import("@/lib/api/activity-logs");

    try {
      const { data } = await getActivityLogs({ pageSize: 10 });
      return data;
    } catch (error) {
      console.error("Failed to fetch activity logs", error);
      return [];
    }
  },

  // Mock performance metrics for charts (since we might not have historical tracking yet)
  getPerformanceMetrics: async (days = 7): Promise<ChartDataPoint[]> => {
    // Real data fetching and aggregation
    const startDate = subDays(startOfDay(new Date()), days).toISOString();

    const { data: postsData } = await supabase
      .from("posts")
      .select("created_at, views, reactions, comments, shares, status")
      .gte("created_at", startDate);

    const posts = (postsData || []) as any[];

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

    // Process Posts
    posts.forEach((post) => {
      const dateStr = format(new Date(post.created_at), "MMM dd");
      const entry = groupedData.get(dateStr);
      if (entry) {
        entry.views += post.views || 0;
        entry.reactions += post.reactions || 0;
        entry.comments += post.comments || 0;
        entry.shares += post.shares || 0;
        entry.posts += 1;
      }
    });

    return Array.from(groupedData.values());
  },

  // Detailed Content Analytics
  getContentStats: async (): Promise<ContentStats> => {
    const [{ data: contentData }, { data: postsData }] = await Promise.all([
      supabase.from("content_items").select("*"),
      supabase.from("posts").select("*").eq("item_type", "content"),
    ]);

    const items = camelcaseKeys(contentData || [], {
      deep: true,
    }) as ContentItem[];
    const posts = camelcaseKeys(postsData || [], { deep: true }) as Post[];

    // Map posts to items
    const postsMap = new Map<string, Post[]>();
    posts.forEach((p) => {
      const current = postsMap.get(p.itemId) || [];
      current.push(p);
      postsMap.set(p.itemId, current);
    });

    // Attach posts and calculate aggregate stats for sorting/display
    items.forEach((item) => {
      item.posts = postsMap.get(item.id) || [];
    });

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
      .sort((a, b) => {
        const statsA = (a.posts || []).reduce(
          (acc, p) =>
            acc +
            (p.reactions || 0) +
            (p.comments || 0) +
            (p.shares || 0) +
            (p.views || 0),
          0
        );
        const statsB = (b.posts || []).reduce(
          (acc, p) =>
            acc +
            (p.reactions || 0) +
            (p.comments || 0) +
            (p.shares || 0) +
            (p.views || 0),
          0
        );
        return statsB - statsA;
      })
      .slice(0, 5);

    // Project Stats Calculation
    const projectMap = new Map<string, ProjectStats>();
    items.forEach((item) => {
      const pid = item.projectId;
      if (!pid) return;

      if (!projectMap.has(pid)) {
        projectMap.set(pid, {
          projectId: pid,
          projectName: item.projectName || "Unknown Project",
          total: 0,
          posted: 0,
          waiting: 0,
          pending: 0,
        });
      }

      const stats = projectMap.get(pid)!;
      stats.total += 1;
      if (item.status === "posted_successfully") {
        stats.posted += 1;
      } else if (item.status === "content_approved") {
        stats.waiting += 1;
      } else if (
        item.status === "idea" ||
        item.status === "awaiting_content_approval"
      ) {
        stats.pending += 1;
      }
    });

    const byProject = Array.from(projectMap.values()).sort(
      (a, b) => b.total - a.total
    );

    return {
      totalItems: items.length,
      pendingApproval,
      readyToPost,
      overdue,
      byPlatform,
      byStatus,
      byProject,
      topPerforming,
    };
  },

  // Detailed Video Analytics
  getVideoStats: async (): Promise<VideoStats> => {
    const [{ data: videoData }, { data: postsData }] = await Promise.all([
      supabase.from("video_items").select("*"),
      supabase.from("posts").select("*").eq("item_type", "video"),
    ]);

    const videos = camelcaseKeys(videoData || [], {
      deep: true,
    }) as VideoItem[];
    const posts = camelcaseKeys(postsData || [], { deep: true }) as Post[];

    // Map posts to videos
    const postsMap = new Map<string, Post[]>();
    posts.forEach((p) => {
      const current = postsMap.get(p.itemId) || [];
      current.push(p);
      postsMap.set(p.itemId, current);
    });

    // Attach posts
    videos.forEach((v) => {
      v.posts = postsMap.get(v.id) || [];
    });

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

    const totalViews = (posts || []).reduce(
      (acc, p) => acc + (p.views || 0),
      0
    );
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
      .sort((a, b) => {
        const viewsA = (a.posts || []).reduce(
          (acc, p) => acc + (p.views || 0),
          0
        );
        const viewsB = (b.posts || []).reduce(
          (acc, p) => acc + (p.views || 0),
          0
        );
        return viewsB - viewsA;
      })
      .slice(0, 5);

    // Project Stats Calculation for Videos
    const projectMap = new Map<string, ProjectStats>();
    videos.forEach((item) => {
      const pid = item.projectId;
      if (!pid) return;

      if (!projectMap.has(pid)) {
        projectMap.set(pid, {
          projectId: pid,
          projectName: item.projectName || "Unknown Project",
          total: 0,
          posted: 0,
          waiting: 0,
          pending: 0,
        });
      }

      const stats = projectMap.get(pid)!;
      stats.total += 1;
      if (item.status === "posted_successfully") {
        stats.posted += 1;
      } else if (item.status === "content_approved") {
        stats.waiting += 1;
      } else if (
        item.status === "idea" ||
        item.status === "awaiting_content_approval"
      ) {
        stats.pending += 1;
      }
    });

    const byProject = Array.from(projectMap.values()).sort(
      (a, b) => b.total - a.total
    );

    return {
      totalVideos: videos.length,
      totalViews,
      avgDuration,
      pendingApproval,
      readyToPost,
      overdue,
      posted,
      byPlatform,
      byProject,
      topPerforming,
    };
  },

  // Cost Analytics
  getCostStats: async (): Promise<CostStats> => {
    // Fetch all cost logs with model info
    const { data: logsData, error } = await supabase
      .from("cost_logs")
      // Expand ai_models to get cost info
      .select("*, ai_models(*)")
      .order("logged_at", { ascending: true });

    if (error) {
      console.error("Error fetching cost logs:", error);
      // Return empty stats on error
      return {
        totalCost: 0,
        byType: {
          video: { cost: 0, count: 0, duration: 0 },
          image: { cost: 0, count: 0 },
          audio: { cost: 0, count: 0 },
        },
        dailyCosts: [],
      };
    }

    // Process logs
    // camelcaseKeys will convert snake_case DB fields to camelCase
    // e.g. cost_type -> costType, ai_models -> aiModels
    const logs = camelcaseKeys(logsData || [], { deep: true });

    // Fetch video durations for relevant logs
    const videoLogIds = logs
      .filter((l: any) => l.itemType === "video" && l.itemId)
      .map((l: any) => l.itemId);

    const uniqueVideoIds = [...new Set(videoLogIds)];
    const videoDurationsMap = new Map<string, number>();

    if (uniqueVideoIds.length > 0) {
      const { data: videosData } = await supabase
        .from("video_items")
        .select("id, video_duration")
        .in("id", uniqueVideoIds);

      videosData?.forEach((v: any) => {
        videoDurationsMap.set(v.id, v.video_duration || 0);
      });
    }

    let totalCost = 0;
    const byType = {
      video: { cost: 0, count: 0, duration: 0 },
      image: { cost: 0, count: 0 },
      audio: { cost: 0, count: 0 },
    };

    const dailyMap = new Map<string, number>();
    const today = new Date();
    const days = 7;

    // Initialize last 7 days with 0
    for (let i = days - 1; i >= 0; i--) {
      const dateStr = format(subDays(today, i), "MMM dd");
      dailyMap.set(dateStr, 0);
    }
    const startDate = subDays(startOfDay(today), days);

    logs.forEach((log: any) => {
      const amount = log.amount || 0;
      const model = log.aiModels as AIModel | undefined;

      // Calculate Cost
      let cost = 0;
      let duration = 0;

      // Logic:
      // If currency is set, amount is the monetary cost.
      // Else calculate from model unit price.
      if (log.currency) {
        cost = amount;
      } else if (model) {
        cost = amount * (model.costPerUnit || 0);
      }

      totalCost += cost;

      // Categorize
      let type: "video" | "image" | "audio" | "text" | "other" = "other";
      if (model?.modelType) {
        type = model.modelType;
      } else if (log.itemType) {
        // Fallback to itemType if no model
        // Note: logs table item_type might be 'video' or 'content'
        if (log.itemType === "content") type = "image";
        // Assumption: content generation = text/image, usually image spans most cost
        else type = log.itemType as any;
      }

      // Aggregates
      if (type === "video") {
        byType.video.cost += cost;
        byType.video.count += 1;
        // If unit is per_second, amount is duration
        // User Fix: duration lấy từ duration của item, không phải amount
        if (model?.unitType === "per_second") {
          const itemDuration = videoDurationsMap.get(log.itemId) || 0;
          byType.video.duration += itemDuration;
        }
      } else if (type === "image") {
        byType.image.cost += cost;
        byType.image.count += 1;
      } else if (type === "audio") {
        byType.audio.cost += cost;
        byType.audio.count += 1;
      }

      // Daily Trend
      if (log.loggedAt) {
        const logDate = new Date(log.loggedAt);
        if (logDate >= startDate) {
          const dateStr = format(logDate, "MMM dd");
          if (dailyMap.has(dateStr)) {
            dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + cost);
          }
        }
      }
    });

    const dailyCosts = Array.from(dailyMap.entries()).map(([date, cost]) => ({
      date,
      cost,
    }));

    return {
      totalCost,
      byType,
      dailyCosts,
    };
  },
};
