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
  create: "bg-green-100 text-green-700 border-green-300",
  update: "bg-blue-100 text-blue-700 border-blue-300",
  delete: "bg-red-100 text-red-700 border-red-300",
  approve: "bg-purple-100 text-purple-700 border-purple-300",
  publish: "bg-orange-100 text-orange-700 border-orange-300",
  schedule: "bg-pink-100 text-pink-700 border-pink-300",
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
      <div>
        <h2 className="text-2xl font-bold">Nhật ký hoạt động</h2>
        <p className="text-muted-foreground">
          Theo dõi tất cả các thay đổi trong hệ thống
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Lọc và tìm kiếm</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Loại hoạt động</label>
              <Select
                value={filterType}
                onValueChange={(v) => setFilterType(v as ActivityType | "all")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="create">Tạo mới</SelectItem>
                  <SelectItem value="update">Cập nhật</SelectItem>
                  <SelectItem value="delete">Xóa</SelectItem>
                  <SelectItem value="approve">Phê duyệt</SelectItem>
                  <SelectItem value="publish">Đăng bài</SelectItem>
                  <SelectItem value="schedule">Tạo lịch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Loại dữ liệu</label>
              <Select
                value={filterEntity}
                onValueChange={(v) => setFilterEntity(v as EntityType | "all")}
              >
                <SelectTrigger>
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
              <label className="text-sm font-medium">Tìm kiếm</label>
              <Input
                placeholder="ID, mô tả hoặc người dùng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Không tìm thấy nhật ký hoạt động nào
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <Card key={log.id} className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`border ${
                          activityTypeColors[log.activity_type]
                        }`}
                      >
                        {log.activity_type === "create" && "Tạo mới"}
                        {log.activity_type === "update" && "Cập nhật"}
                        {log.activity_type === "delete" && "Xóa"}
                        {log.activity_type === "approve" && "Phê duyệt"}
                        {log.activity_type === "publish" && "Đăng bài"}
                        {log.activity_type === "schedule" && "Tạo lịch"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={entityTypeColors[log.entity_type]}
                      >
                        {log.entity_type === "content" && "Nội dung"}
                        {log.entity_type === "schedule" && "Lịch đăng"}
                        {log.entity_type === "project" && "Dự án"}
                        {log.entity_type === "user" && "Người dùng"}
                        {log.entity_type === "settings" && "Cài đặt"}
                        {log.entity_type === "video" && "Video"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        ID: {log.entity_id}
                      </span>
                    </div>

                    {log.description && (
                      <p className="text-sm text-foreground">
                        <FileText className="h-4 w-4 inline mr-2" />
                        {log.description}
                      </p>
                    )}

                    {(log.old_values || log.new_values) && (
                      <details className="text-sm text-muted-foreground cursor-pointer">
                        <summary className="hover:text-foreground">
                          Chi tiết thay đổi
                        </summary>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted p-2 rounded text-xs font-mono">
                          {log.old_values && (
                            <div>
                              <div className="font-medium text-foreground mb-1">
                                Giá trị cũ:
                              </div>
                              <pre className="overflow-auto">
                                {JSON.stringify(log.old_values, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.new_values && (
                            <div>
                              <div className="font-medium text-foreground mb-1">
                                Giá trị mới:
                              </div>
                              <pre className="overflow-auto">
                                {JSON.stringify(log.new_values, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 text-xs text-muted-foreground whitespace-nowrap">
                    {log.user_id && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{log.user_id}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(log.created_at)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
