import { ProjectStats } from "@/lib/types";
import { Folder } from "lucide-react";
import { StatsCard } from "./dashboard-atoms";

interface ProjectStatsListProps {
  stats: ProjectStats[];
  loading?: boolean;
}

export function ProjectStatsList({ stats, loading }: ProjectStatsListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 bg-slate-100 rounded-xl animate-pulse"
          ></div>
        ))}
      </div>
    );
  }

  if (!stats || stats.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-slate-700 mb-3 flex items-center">
        <Folder className="mr-2 text-indigo-500" size={20} />
        Thống Kê Theo Dự Án
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((project) => (
          <div
            key={project.projectId}
            className="bg-white/60 backdrop-blur-sm border border-slate-200/60 rounded-xl p-4 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <h4
                className="font-bold text-slate-800 truncate"
                title={project.projectName}
              >
                {project.projectName}
              </h4>
              <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                {project.total} bài
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm text-center">
              <div className="flex flex-col">
                <span className="text-slate-500 text-xs">Đã đăng</span>
                <span className="font-semibold text-green-600">
                  {project.posted}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 text-xs">Chờ đăng</span>
                <span className="font-semibold text-blue-600">
                  {project.waiting}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 text-xs">Chờ duyệt</span>
                <span className="font-semibold text-orange-600">
                  {project.pending}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
