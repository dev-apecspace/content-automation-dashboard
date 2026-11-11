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
  Calendar as CalendarIcon,
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
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";
import { type User as SystemUser } from "@/lib/api/users";
import { toast } from "sonner";
import {
  type ActivityLog,
  type ActivityType,
  type EntityType,
  activityTypeConfig,
  entityTypeConfig,
} from "@/lib/types";
import { PaginationControl } from "@/components/ui/pagination-control";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function ActivityLogsTab() {
  const [filterType, setFilterType] = useState<ActivityType | "all">("all");
  const [filterEntity, setFilterEntity] = useState<EntityType | "all">("all");
  const [filterUser, setFilterUser] = useState<string | "all">("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const {
    data: { data: logs = [], total = 0 } = {},
    isLoading,
    refetch,
    isRefetching,
  } = useActivityLogs({
    activityType: filterType,
    entityType: filterEntity,
    userId: filterUser,
    startDate: dateRange?.from,
    endDate: dateRange?.to,
    page,
    pageSize,
  });

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [filterType, filterEntity, filterUser, dateRange]);

  // Realtime subscription
  useRealtimeSubscription("activity_logs", () => {
    refetch();
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

  const handleResetFilters = () => {
    setFilterType("all");
    setFilterEntity("all");
    setFilterUser("all");
    setDateRange(undefined);
    setSearchTerm("");
    setPage(1);
    refetch();
  };

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
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <User className="h-4 w-4 text-blue-500" />
              Người dùng
            </label>
            <Select value={filterUser} onValueChange={(v) => setFilterUser(v)}>
              <SelectTrigger className="bg-white/50 border-white/40 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all hover:bg-white/70">
                <SelectValue placeholder="Tất cả người dùng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả người dùng</SelectItem>
                {Object.entries(userMap).map(([id, name]) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2.5">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-rose-500" />
              Thời gian
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal bg-white/50 border-white/40 shadow-sm hover:bg-white/70",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                        {format(dateRange.to, "dd/MM/yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy")
                    )
                  ) : (
                    <span>Chọn khoảng thời gian</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
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
                      <span>{formatVietnamDateFull(log.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200">
            <PaginationControl
              currentPage={page}
              pageSize={pageSize}
              totalCount={total}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
