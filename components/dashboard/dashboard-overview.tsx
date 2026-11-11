"use client";

import {
  useDashboardStats,
  useRecentActivity,
  usePerformanceMetrics,
  useDashboardRealtime,
  useContentStats,
  useVideoStats,
  useCostStats,
  useScheduleStats,
} from "@/hooks/use-dashboard";
import {
  StatsGrid,
  RecentActivityList,
  ScheduleStatsGrid,
} from "./dashboard-molecules";
import { ProjectStatsList } from "./project-stats-list";
import { DashboardCharts } from "./dashboard-charts";
import { PlatformPieChart, StatusBarChart } from "./analytics-components";
import { CostAnalytics } from "./cost-analytics";
import { StatsCard, GlassContainer } from "./dashboard-atoms";
import {
  FileText,
  PlayCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
} from "lucide-react";

export function DashboardOverview() {
  // Initialize real-time updates
  useDashboardRealtime();

  // Fetch data
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: activity, isLoading: activityLoading } = useRecentActivity();
  const { data: metrics, isLoading: metricsLoading } = usePerformanceMetrics();

  const { data: contentStats, isLoading: contentStatsLoading } =
    useContentStats();
  const { data: videoStats, isLoading: videoStatsLoading } = useVideoStats();
  const { data: costStats, isLoading: costStatsLoading } = useCostStats();
  const { data: scheduleStats, isLoading: scheduleStatsLoading } =
    useScheduleStats();

  // Mock initial stats if undefined
  const defaultStats = {
    totalProjects: 0,
    totalPosts: 0,
    pendingApprovals: 0,
    scheduledPosts: 0,
    totalViews: 0,
    totalReactions: 0,
  };

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Dashboard
        </h1>
        <p className="text-slate-500 mt-1">
          Tổng quan hoạt động và hiệu suất nội dung
        </p>
      </div>

      {/* 1. High Level Stats */}
      <section>
        <StatsGrid stats={stats || defaultStats} loading={statsLoading} />
      </section>

      {/* Schedule Stats */}
      <section>
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
          <Calendar className="mr-2 text-indigo-500" size={24} />
          Thống kê Lịch Đăng
        </h2>
        <ScheduleStatsGrid
          stats={scheduleStats || { week: 0, month: 0, year: 0 }}
          loading={scheduleStatsLoading}
        />
      </section>

      {/* 3. Main Performance Charts & Activity */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            Hiệu Suất Tổng Thể
          </h2>
          <DashboardCharts data={metrics || []} loading={metricsLoading} />
        </div>
        <div className="lg:col-span-1">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            Hoạt Động Gần Đây
          </h2>
          <RecentActivityList
            activities={activity || []}
            loading={activityLoading}
          />
        </div>
      </section>

      {/* 4. Detailed Content Analytics */}
      <section>
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
          <FileText className="mr-2 text-indigo-500" size={24} />
          Chi Tiết Content
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Key Metrics */}
          <div className="md:col-span-12 lg:col-span-7 grid grid-cols-2 gap-4">
            <StatsCard
              label="Tổng Bài Viết"
              value={contentStats?.totalItems || 0}
              icon={FileText}
              className="bg-gradient-to-br from-indigo-200/40 via-purple-100/20 to-blue-200/40 col-span-2"
              variant="gradient"
            />
            <StatsCard
              label="Đã Đăng"
              value={
                contentStats?.byStatus.find(
                  (s) => s.status === "posted_successfully"
                )?.count || 0
              }
              icon={CheckCircle2}
              className="bg-gradient-to-br from-emerald-200/40 via-teal-100/20 to-green-200/40"
              variant="gradient"
            />
            <StatsCard
              label="Chờ Duyệt"
              value={contentStats?.pendingApproval || 0}
              icon={Clock}
              className="bg-gradient-to-br from-orange-200/40 via-amber-100/20 to-yellow-200/40"
              variant="gradient"
            />
            <StatsCard
              label="Chờ Đăng"
              value={contentStats?.readyToPost || 0}
              icon={BarChart3}
              className="bg-gradient-to-br from-sky-200/40 via-cyan-100/20 to-blue-200/40"
              variant="gradient"
            />
            <StatsCard
              label="Quá Hạn"
              value={contentStats?.overdue || 0}
              icon={AlertTriangle}
              className="bg-gradient-to-br from-rose-200/40 via-pink-100/20 to-red-200/40"
              variant="gradient"
            />
          </div>

          {/* Visualizations */}
          <div className="md:col-span-12 lg:col-span-5">
            <PlatformPieChart
              data={contentStats?.byPlatform || []}
              loading={contentStatsLoading}
            />
          </div>

          {/* Project Stats for Content */}
          <div className="md:col-span-12">
            <ProjectStatsList
              stats={contentStats?.byProject || []}
              loading={contentStatsLoading}
            />
          </div>
        </div>
      </section>

      {/* 5. Detailed Video Analytics */}
      <section>
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
          <PlayCircle className="mr-2 text-pink-500" size={24} />
          Chi Tiết Video
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Key Metrics */}
          <div className="md:col-span-12 lg:col-span-7 grid grid-cols-2 gap-4">
            <StatsCard
              label="Tổng Video"
              value={videoStats?.totalVideos || 0}
              icon={PlayCircle}
              className="bg-gradient-to-br from-purple-200/40 via-fuchsia-100/20 to-pink-200/40 col-span-2"
              variant="gradient"
            />
            <StatsCard
              label="Đã Đăng"
              value={videoStats?.posted || 0}
              icon={CheckCircle2}
              className="bg-gradient-to-br from-emerald-200/40 via-teal-100/20 to-green-200/40"
              variant="gradient"
            />
            <StatsCard
              label="Chờ Duyệt"
              value={videoStats?.pendingApproval || 0}
              icon={Clock}
              className="bg-gradient-to-br from-orange-200/40 via-amber-100/20 to-yellow-200/40"
              variant="gradient"
            />
            <StatsCard
              label="Chờ Đăng"
              value={videoStats?.readyToPost || 0}
              icon={BarChart3}
              className="bg-gradient-to-br from-sky-200/40 via-cyan-100/20 to-blue-200/40"
              variant="gradient"
            />
            <StatsCard
              label="Quá Hạn"
              value={videoStats?.overdue || 0}
              icon={AlertTriangle}
              className="bg-gradient-to-br from-rose-200/40 via-pink-100/20 to-red-200/40"
              variant="gradient"
            />

            {/* Grouped Engagement Stats */}
            <div className="col-span-2 grid grid-cols-2 gap-4 pt-2">
              <StatsCard
                label="Tổng Lượt Xem"
                value={(videoStats?.totalViews || 0).toLocaleString()}
                icon={PlayCircle}
                className="bg-gradient-to-br from-indigo-200/40 via-blue-100/20 to-violet-200/40"
                variant="gradient"
              />
              <StatsCard
                label="Thời Lượng TB"
                value={`${Math.round(videoStats?.avgDuration || 0)}s`}
                icon={Activity}
                className="bg-gradient-to-br from-sky-200/40 via-cyan-100/20 to-blue-200/40"
                variant="gradient"
              />
            </div>
          </div>

          {/* Platform Distribution for Video */}
          <div className="md:col-span-12 lg:col-span-5">
            <PlatformPieChart
              data={videoStats?.byPlatform || []}
              loading={videoStatsLoading}
            />
          </div>

          {/* Project Stats for Video */}
          <div className="md:col-span-12">
            <ProjectStatsList
              stats={videoStats?.byProject || []}
              loading={videoStatsLoading}
            />
          </div>
        </div>
      </section>
      {/* 2. Cost Analysis Section */}
      <section>
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
          <Activity className="mr-2 text-indigo-500" size={24} />
          Phân Tích Chi Phí AI
        </h2>
        <CostAnalytics data={costStats} loading={costStatsLoading} />
      </section>
    </div>
  );
}
