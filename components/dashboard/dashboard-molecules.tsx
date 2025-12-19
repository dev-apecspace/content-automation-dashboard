import { DashboardStats, ScheduleStats, ActivityLog } from "@/lib/types";
import { GlassContainer, StatsCard } from "./dashboard-atoms";
import {
  LayoutGrid,
  FileVideo,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
  Users,
  Calendar,
  Folder,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface ScheduleStatsGridProps {
  stats: ScheduleStats;
  loading?: boolean;
}

export function ScheduleStatsGrid({ stats, loading }: ScheduleStatsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <GlassContainer
            key={i}
            className="h-32 animate-pulse"
            intensity="low"
          >
            <div className="h-full w-full bg-slate-200/50 rounded-2xl" />
          </GlassContainer>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatsCard
        label="Đăng tuần này"
        value={stats?.week || 0}
        icon={Calendar}
        description="Số bài đăng theo lịch"
        className="bg-indigo-50"
      />
      <StatsCard
        label="Đăng tháng này"
        value={stats?.month || 0}
        icon={Calendar}
        description="Số bài đăng theo lịch"
        className="bg-purple-50"
      />
      <StatsCard
        label="Đăng năm nay"
        value={stats?.year || 0}
        icon={Calendar}
        description="Số bài đăng theo lịch"
        className="bg-sky-50"
      />
    </div>
  );
}

interface StatsGridProps {
  stats: DashboardStats;
  loading?: boolean;
}

export function StatsGrid({ stats, loading }: StatsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <GlassContainer
            key={i}
            className="h-32 animate-pulse"
            intensity="low"
          >
            <div className="h-full w-full bg-slate-200/50 rounded-2xl" />
          </GlassContainer>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        label="Dự Án"
        value={stats.totalProjects}
        icon={LayoutGrid}
        description="Tổng số dự án đang chạy"
      />
      <StatsCard
        label="Tổng số bài viết"
        value={stats.totalPosts}
        icon={FileText}
        description="Tổng content và video"
      />
      <StatsCard
        label="Chờ Duyệt"
        value={stats.pendingApprovals}
        icon={Clock}
        description="Idea, content, media đã sửa"
      />
      <StatsCard
        label="Tổng Tương Tác"
        value={stats.totalReactions.toLocaleString()}
        icon={Users}
        description="Reactions, comments, shares"
      />
    </div>
  );
}

interface ActivityItemProps {
  activity: ActivityLog;
}

function ActivityItem({ activity }: ActivityItemProps) {
  const getIcon = () => {
    switch (activity.entity_type) {
      case "video":
        return <FileVideo className="text-red-500" size={18} />;
      case "content":
        return <FileText className="text-blue-500" size={18} />;
      case "project":
        return <Folder className="text-green-700" size={18} />;
      default:
        return <AlertCircle className="text-slate-400" size={18} />;
    }
  };

  return (
    <div className="flex items-start space-x-4 p-3 hover:bg-white/40 rounded-lg transition-colors group">
      <div className="p-2 bg-white rounded-full shadow-sm border border-slate-100">
        {getIcon()}
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium text-slate-800 leading-none">
          {activity.description}
        </p>
        <div className="flex items-center text-xs text-slate-500">
          <span>
            {formatDistanceToNow(new Date(activity.created_at), {
              addSuffix: true,
              locale: vi,
            })}
          </span>
          <span className="mx-1">•</span>
          <span className="capitalize">
            {activity.activity_type.replace("_", " ")}
          </span>
        </div>
      </div>
    </div>
  );
}

interface RecentActivityListProps {
  activities: ActivityLog[];
  loading?: boolean;
}

export function RecentActivityList({
  activities,
  loading,
}: RecentActivityListProps) {
  return (
    <GlassContainer className="h-full flex flex-col" intensity="medium">
      <div className="p-4 flex-1 overflow-y-auto max-h-[400px]">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex space-x-4 animate-pulse">
                <div className="w-10 h-10 bg-slate-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-1">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-500">
            Chưa có hoạt động nào
          </div>
        )}
      </div>
    </GlassContainer>
  );
}
