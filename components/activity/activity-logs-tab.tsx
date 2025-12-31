"use client";

import { useState, useEffect } from "react";
import { formatVietnamDate, formatVietnamDateFull } from "@/lib/utils";
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
import { GlassContainer } from "@/components/dashboard/dashboard-atoms";
import {
  Loader2,
  Calendar,
  User,
  FileText,
  RotateCw,
  Filter,
  Search,
  Database,
  Layers,
} from "lucide-react";
import { getAllUsers } from "@/lib/api";
import { useActivityLogs } from "@/hooks/use-activity-logs";
import { type User as SystemUser } from "@/lib/api/users";
import { toast } from "sonner";
import {
  type ActivityLog,
  type ActivityType,
  type EntityType,
  activityTypeConfig,
  entityTypeConfig,
} from "@/lib/types";

export function ActivityLogsTab() {
  const [filterType, setFilterType] = useState<ActivityType | "all">("all");
  const [filterEntity, setFilterEntity] = useState<EntityType | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  const {
    data: logs = [],
    isLoading,
    refetch,
    isRefetching,
  } = useActivityLogs({
    activityType: filterType,
    entityType: filterEntity,
    limit: 100,
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await getAllUsers();
        const map = users.reduce(
          (acc: Record<string, string>, user: SystemUser) => {
            acc[user.id] = user.name;
            return acc;
          },
          {}
        );
        setUserMap(map);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };
    fetchUsers();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      log.entity_id.toLowerCase().includes(searchLower) ||
      log.description?.toLowerCase().includes(searchLower) ||
      log.user_id?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <GlassContainer className="p-5" intensity="low">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Filter className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              Bộ lọc & Tìm kiếm
            </h3>
          </div>
          <div className="flex items-center gap-2 self-end md:self-auto">
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full hidden sm:inline-block">
              Tự động cập nhật 1 phút/lần
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="bg-white/50 border-white/60 hover:bg-white/80 transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
            >
              <RotateCw
                className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`}
              />
              Làm mới
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2.5">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-500" />
              Loại hoạt động
            </label>
            <Select
              value={filterType}
              onValueChange={(v) => setFilterType(v as ActivityType | "all")}
            >
              <SelectTrigger className="bg-white/50 border-white/40 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all hover:bg-white/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {Object.entries(activityTypeConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2.5">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-500" />
              Loại dữ liệu
            </label>
            <Select
              value={filterEntity}
              onValueChange={(v) => setFilterEntity(v as EntityType | "all")}
            >
              <SelectTrigger className="bg-white/50 border-white/40 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm transition-all hover:bg-white/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {Object.entries(entityTypeConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2.5">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Search className="h-4 w-4 text-amber-500" />
              Tìm kiếm
            </label>
            <div className="relative">
              <Input
                placeholder="ID, mô tả hoặc người dùng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/50 border-white/40 focus:ring-amber-500 focus:border-amber-500 shadow-sm pl-10 transition-all hover:bg-white/70"
              />
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </GlassContainer>

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
                        className={`shadow-sm bg-white/50 backdrop-blur-sm ${
                          activityTypeConfig[log.activity_type].className
                        }`}
                      >
                        {activityTypeConfig[log.activity_type].label}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`bg-white/50 backdrop-blur-sm shadow-sm ${
                          entityTypeConfig[log.entity_type].className
                        }`}
                      >
                        {entityTypeConfig[log.entity_type].label}
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
                          {userMap[log.user_id] || log.user_id}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatVietnamDateFull(log.created_at)}</span>
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
