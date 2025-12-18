"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Calendar, User, FileText } from "lucide-react";
import { getActivityLogs } from "@/lib/api";
import { toast } from "sonner";
import type { ActivityLog, ActivityType, EntityType } from "@/lib/api";

const activityTypeColors: Record<ActivityType, string> = {
  create: "bg-yellow-100 text-yellow-700 border-yellow-300",
  update: "bg-blue-100 text-blue-700 border-blue-300",
  delete: "bg-red-100 text-red-700 border-red-300",
  approve: "bg-cyan-100 text-cyan-700 border-cyan-300",
  publish: "bg-green-100 text-green-700 border-green-300",
  schedule: "bg-pink-100 text-pink-700 border-pink-300",
  "remove-post": "bg-orange-100 text-orange-700 border-orange-300",
};

const entityTypeColors: Record<EntityType, string> = {
  content: "bg-indigo-100 text-indigo-700",
  schedule: "bg-cyan-100 text-cyan-700",
  project: "bg-teal-100 text-teal-700",
  user: "bg-amber-100 text-amber-700",
  settings: "bg-gray-100 text-gray-700",
  video: "bg-rose-100 text-rose-700",
};

export function ActivityLogsTab() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<ActivityType | "all">("all");
  const [filterEntity, setFilterEntity] = useState<EntityType | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadLogs();
  }, [filterType, filterEntity]);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const data = await getActivityLogs({
        activityType:
          filterType !== "all" ? (filterType as ActivityType) : undefined,
        entityType:
          filterEntity !== "all" ? (filterEntity as EntityType) : undefined,
        limit: 100,
      });
      setLogs(data);
    } catch (error) {
      toast.error("Failed to load activity logs");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      log.entity_id.toLowerCase().includes(searchLower) ||
      log.description?.toLowerCase().includes(searchLower) ||
      log.user_id?.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN");
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/40 backdrop-blur-sm border border-white/60 shadow-sm rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">
          Lọc và tìm kiếm
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">
              Loại hoạt động
            </label>
            <Select
              value={filterType}
              onValueChange={(v) => setFilterType(v as ActivityType | "all")}
            >
              <SelectTrigger className="bg-white/60 border-white/60 focus:ring-indigo-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="create">Tạo mới</SelectItem>
                <SelectItem value="update">Cập nhật</SelectItem>
                <SelectItem value="delete">Xóa ý tưởng</SelectItem>
                <SelectItem value="approve">Phê duyệt</SelectItem>
                <SelectItem value="publish">Đăng bài</SelectItem>
                <SelectItem value="schedule">Tạo lịch</SelectItem>
                <SelectItem value="remove-post">Xóa bài đăng</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">
              Loại dữ liệu
            </label>
            <Select
              value={filterEntity}
              onValueChange={(v) => setFilterEntity(v as EntityType | "all")}
            >
              <SelectTrigger className="bg-white/60 border-white/60 focus:ring-indigo-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="content">Nội dung</SelectItem>
                <SelectItem value="schedule">Lịch đăng</SelectItem>
                <SelectItem value="project">Dự án</SelectItem>
                <SelectItem value="user">Người dùng</SelectItem>
                <SelectItem value="settings">Cài đặt</SelectItem>
                <SelectItem value="video">Video</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">
              Tìm kiếm
            </label>
            <Input
              placeholder="ID, mô tả hoặc người dùng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/60 border-white/60 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <Card className="bg-white/60 backdrop-blur-xl border-white/60 shadow-lg rounded-2xl">
          <CardContent className="p-8 text-center text-slate-500">
            Không tìm thấy nhật ký hoạt động nào
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white/60 backdrop-blur-xl border-white/60 shadow-lg rounded-2xl overflow-hidden">
          <div className="divide-y divide-white/40">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 hover:bg-indigo-50/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`border shadow-sm bg-white/50 backdrop-blur-sm ${
                          activityTypeColors[log.activity_type]
                        }`}
                      >
                        {log.activity_type === "create" && "Tạo mới"}
                        {log.activity_type === "update" && "Cập nhật"}
                        {log.activity_type === "delete" && "Xóa ý tưởng"}
                        {log.activity_type === "approve" && "Phê duyệt"}
                        {log.activity_type === "publish" && "Đăng bài"}
                        {log.activity_type === "schedule" && "Tạo lịch"}
                        {log.activity_type === "remove-post" && "Xóa bài đăng"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`bg-white/50 backdrop-blur-sm shadow-sm ${
                          entityTypeColors[log.entity_type]
                        }`}
                      >
                        {log.entity_type === "content" && "Nội dung"}
                        {log.entity_type === "schedule" && "Lịch đăng"}
                        {log.entity_type === "project" && "Dự án"}
                        {log.entity_type === "user" && "Người dùng"}
                        {log.entity_type === "settings" && "Cài đặt"}
                        {log.entity_type === "video" && "Video"}
                      </Badge>
                      <span className="text-xs font-mono text-slate-400">
                        ID: {log.entity_id.substring(0, 8)}...
                      </span>
                    </div>

                    {log.description && (
                      <p className="text-sm text-slate-700 font-medium">
                        <FileText className="h-4 w-4 inline mr-2 text-indigo-500" />
                        {log.description}
                      </p>
                    )}

                    {(log.old_values || log.new_values) && (
                      <details className="text-sm text-slate-500 cursor-pointer group">
                        <summary className="hover:text-indigo-600 transition-colors list-none flex items-center gap-1 font-medium">
                          <span className="opacity-70 group-hover:opacity-100">
                            See details
                          </span>
                        </summary>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/50 p-3 rounded-lg border border-white/60 text-xs font-mono shadow-inner">
                          {log.old_values && (
                            <div>
                              <div className="font-semibold text-red-500 mb-1">
                                Giá trị cũ:
                              </div>
                              <pre className="overflow-auto max-h-40 bg-red-50/50 p-2 rounded border border-red-100">
                                {JSON.stringify(log.old_values, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.new_values && (
                            <div>
                              <div className="font-semibold text-green-600 mb-1">
                                Giá trị mới:
                              </div>
                              <pre className="overflow-auto max-h-40 bg-green-50/50 p-2 rounded border border-green-100">
                                {JSON.stringify(log.new_values, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 text-xs text-slate-500 whitespace-nowrap">
                    {log.user_id && (
                      <div className="flex items-center gap-1 bg-white/50 px-2 py-1 rounded-full border border-white/60 shadow-sm">
                        <User className="h-3 w-3 text-indigo-500" />
                        <span className="font-medium text-slate-700">
                          {log.user_id}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(log.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
