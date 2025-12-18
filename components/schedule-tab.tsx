"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Edit2,
  Trash2,
  List,
  CalendarDays,
  FileImage,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type Schedule,
  type Platform,
  type Frequency,
  type Project,
  type ContentItem,
  type VideoItem,
  platformColors,
  statusConfig,
} from "@/lib/types";
import {
  createSchedule,
  updateSchedule,
  deleteSchedule,
  createActivityLog,
} from "@/lib/api";
import { toast } from "sonner";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
  isValid,
} from "date-fns";
import { vi } from "date-fns/locale";
import { ContentDetailModal } from "./content-detail-modal";
import { VideoDetailModal } from "./video-detail-modal";
import { ContentFormModal } from "./content-form-modal";
import { VideoFormModal } from "./video-form-modal";
import { updateContentItem } from "@/lib/api/content-items";
import { updateVideoItem } from "@/lib/api/video-items";

interface ScheduleTabProps {
  // ... props
  schedules: Schedule[];
  projects: Project[];
  contentItems: ContentItem[];
  videoItems: VideoItem[];
  onUpdate: (schedules: Schedule[]) => void;
  onUpdateContent?: (items: ContentItem[]) => void;
  onUpdateVideo?: (items: VideoItem[]) => void;
  isLoading?: boolean;
}

const platforms: Platform[] = [
  "Facebook Post",
  "Facebook Reels",
  "Youtube Shorts",
];

const frequencies: Frequency[] = ["Tháng", "Tuần", "Ngày", "3 ngày/lần"];

export function ScheduleTab({
  schedules,
  projects,
  contentItems,
  videoItems,
  onUpdate,
  onUpdateContent,
  onUpdateVideo,
  isLoading,
}: ScheduleTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editItem, setEditItem] = useState<Schedule | null>(null);
  const [formData, setFormData] = useState<Partial<Schedule>>({});
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Detail Modal States
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(
    null
  );
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  // Edit Form States
  const [isContentFormOpen, setIsContentFormOpen] = useState(false);
  const [isVideoFormOpen, setIsVideoFormOpen] = useState(false);
  const [editContent, setEditContent] = useState<ContentItem | null>(null);
  const [editVideo, setEditVideo] = useState<VideoItem | null>(null);

  const handleEditContent = (item: ContentItem) => {
    setEditContent(item);
    setSelectedContent(null);
    setTimeout(() => {
      setIsContentFormOpen(true);
    }, 100);
  };

  const handleEditVideo = (item: VideoItem) => {
    setEditVideo(item);
    setSelectedVideo(null);
    setTimeout(() => {
      setIsVideoFormOpen(true);
    }, 100);
  };

  const handleSaveContent = async (data: Partial<ContentItem>) => {
    try {
      setIsSaving(true);
      if (editContent) {
        const updated = await updateContentItem(editContent.id, data);
        onUpdateContent?.(
          contentItems.map((c) => (c.id === editContent.id ? updated : c))
        );
        toast.success("Cập nhật bài viết thành công!");

        await createActivityLog("update", "content", editContent.id, {
          userId: "user_1",
          newValues: data,
          description: `Cập nhật từ lịch: ${data.idea || editContent.idea}`,
        });
      }
      setIsContentFormOpen(false);
      setEditContent(null);
    } catch (error) {
      toast.error("Lưu bài viết thất bại");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveVideo = async (data: Partial<VideoItem>) => {
    try {
      setIsSaving(true);
      if (editVideo) {
        const updated = await updateVideoItem(editVideo.id, data);
        onUpdateVideo?.(
          videoItems.map((v) => (v.id === editVideo.id ? updated : v))
        );
        toast.success("Cập nhật video thành công!");

        await createActivityLog("update", "video", editVideo.id, {
          userId: "user_1",
          newValues: data,
          description: `Cập nhật từ lịch: ${data.idea || editVideo.idea}`,
        });
      }
      setIsVideoFormOpen(false);
      setEditVideo(null);
    } catch (error) {
      toast.error("Lưu video thất bại");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdd = () => {
    setEditItem(null);
    setFormData({
      projectId: "",
      projectName: "",
      platform: "Facebook Post",
      frequency: "Ngày",
      postingDays: "",
      postingTime: "",
    });
    setIsModalOpen(true);
  };

  const handleEdit = (item: Schedule) => {
    setEditItem(item);
    setFormData(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      setIsSaving(true);
      await deleteSchedule(id);
      onUpdate(schedules.filter((s) => s.id !== id));
      toast.success("Đã xóa lịch đăng!");

      await createActivityLog("delete", "schedule", id, {
        userId: "user_1",
        description: "Xóa lịch đăng",
      });
    } catch (error) {
      toast.error("Xóa lịch đăng thất bại");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      if (!formData.projectId) {
        toast.error("Vui lòng chọn dự án");
        return;
      }

      if (editItem) {
        const updated = await updateSchedule(
          editItem.id,
          formData as Partial<Schedule>
        );
        onUpdate(schedules.map((s) => (s.id === editItem.id ? updated : s)));
        toast.success("Đã cập nhật lịch đăng!");

        await createActivityLog("update", "schedule", editItem.id, {
          userId: "user_1",
          newValues: formData,
          description: `Cập nhật lịch đăng cho ${formData.projectName}`,
        });
      } else {
        const newSchedule = await createSchedule(
          formData as Omit<Schedule, "id">
        );
        onUpdate([...schedules, newSchedule]);
        toast.success("Đã tạo lịch đăng!");

        await createActivityLog("create", "schedule", newSchedule.id, {
          userId: "user_1",
          newValues: {
            projectName: newSchedule.projectName,
            platform: newSchedule.platform,
          },
          description: `Tạo lịch đăng cho ${newSchedule.projectName}`,
        });
      }

      setIsModalOpen(false);
    } catch (error) {
      toast.error("Tạo lịch đăng thất bại");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleProjectChange = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    setFormData((prev) => ({
      ...prev,
      projectId,
      projectName: project?.name || "",
    }));
  };

  // Group schedules by project
  const groupedSchedules = schedules.reduce((acc, schedule) => {
    if (!acc[schedule.projectName]) {
      acc[schedule.projectName] = [];
    }
    acc[schedule.projectName].push(schedule);
    return acc;
  }, {} as Record<string, Schedule[]>);

  // Get merged events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const dayName = format(date, "EEEE").toLowerCase();

    // Helper to check if item matches date based on postingTime or expectedPostDate
    const isItemOnDate = (item: ContentItem | VideoItem) => {
      // 1. Try parsing postingTime: "dd/MM/yyyy HH:mm"
      if (item.postingTime) {
        const parts = item.postingTime.split(" ");
        if (parts.length >= 1) {
          // Check date part "dd/MM/yyyy"
          const datePart = parts[0];
          const [day, month, year] = datePart.split("/");

          if (day && month && year) {
            // Construct target date string to match format(date, "yyyy-MM-dd")
            // Note: month is 1-indexed in string, output needs 2 digits
            const itemDateStr = `${year}-${month.padStart(
              2,
              "0"
            )}-${day.padStart(2, "0")}`;
            if (itemDateStr === dateStr) return true;
          }
        }
      }

      // 2. Fallback to expectedPostDate
      if (item.expectedPostDate === dateStr) return true;

      return false;
    };

    // 1. Recurring Schedules (lịch lặp lại dự kiến)
    const scheduleEvents: {
      type: "schedule";
      data: Schedule;
      time: string;
    }[] = [];

    const dayOfMonth = date.getDate(); // 1-31
    const dayOfWeekVi = format(date, "EEEE", { locale: vi }).toLowerCase();
    // ví dụ: "thứ hai", "chủ nhật"

    const dayMap: Record<string, string> = {
      "Thứ 2": "thứ hai",
      "Thứ 3": "thứ ba",
      "Thứ 4": "thứ tư",
      "Thứ 5": "thứ năm",
      "Thứ 6": "thứ sáu",
      "Thứ 7": "thứ bảy",
      Cn: "chủ nhật",
    };

    schedules.forEach((schedule) => {
      if (!schedule.isActive) return; // bỏ qua nếu không active

      let matches = false;
      const times: string[] = schedule.postingTime
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean); // tách nhiều giờ, ví dụ "8:00, 11:00, 19:00" → ["8:00", "11:00", "19:00"]

      if (schedule.frequency === "Ngày") {
        // Mỗi ngày đều đăng
        matches = true;
      } else if (schedule.frequency === "Tuần") {
        const daysStr = schedule.postingDays.trim();
        if (daysStr === "Mỗi ngày") {
          matches = true;
        } else {
          // "Thứ 2, Thứ 5" → split thành array
          const scheduleDays = daysStr
            .split(",")
            .map((d) => d.trim())
            .map((d) => dayMap[d])
            .filter(Boolean);

          if (scheduleDays.includes(dayOfWeekVi)) {
            matches = true;
          }
        }
      } else if (schedule.frequency === "Tháng") {
        // postingDays dạng "Ngày 10, ngày 25, ngày 27"
        const daysStr = schedule.postingDays.trim();
        const monthlyDays = daysStr
          .split(",")
          .map((d) => d.trim())
          .map((d) => parseInt(d.replace(/^(Ngày|ngày)\s*/i, ""), 10)) // bỏ "Ngày " hoặc "ngày "
          .filter((n) => !isNaN(n));

        if (monthlyDays.includes(dayOfMonth)) {
          matches = true;
        }
      } else if (schedule.frequency === "3 ngày/lần") {
        // Ví dụ đơn giản: cứ cách 3 ngày từ một mốc cố định (có thể lấy ngày đầu tiên của tháng làm mốc)
        // Hoặc nếu cần chính xác hơn, có thể lưu thêm startDate trong schedule sau này
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const daysSinceStart = dayOfMonth - 1;
        if (daysSinceStart % 3 === 0) {
          matches = true;
        }
      }

      if (matches && times.length > 0) {
        times.forEach((time) => {
          scheduleEvents.push({
            type: "schedule",
            data: schedule,
            time,
          });
        });
      }
    });

    // 2. Content Items (Posts)
    const contentEvents = contentItems
      .filter((item) => isItemOnDate(item))
      .map((item) => ({
        type: "content" as const,
        data: item,
        time: item.postingTime?.split(" ")[1] || item.postingTime || "00:00",
      }));

    // 3. Video Items
    const videoEvents = videoItems
      .filter((item) => isItemOnDate(item))
      .map((item) => ({
        type: "video" as const,
        data: item,
        time: item.postingTime?.split(" ")[1] || item.postingTime || "00:00",
      }));

    return [...scheduleEvents, ...contentEvents, ...videoEvents].sort((a, b) =>
      a.time.localeCompare(b.time)
    );
  };

  // Thêm hàm này để tạo mảng ngày cho calendar
  const getCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    // Ngày đầu tiên của tháng
    const firstDay = new Date(year, month, 1);
    // Ngày cuối cùng của tháng
    const lastDay = new Date(year, month + 1, 0);

    // Lấy thứ của ngày đầu tiên (0 = Chủ nhật, 1 = Thứ 2, ...)
    const firstDayOfWeek = firstDay.getDay();

    // Tạo mảng các ngày
    const days: Date[] = [];

    // Thêm các ngày từ tháng trước để lấp đầy tuần đầu tiên
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i));
    }

    // Thêm tất cả các ngày trong tháng hiện tại
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    // Thêm các ngày từ tháng sau để lấp đầy tuần cuối cùng
    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        days.push(new Date(year, month + 1, i));
      }
    }

    return days;
  };

  // Get all days in current month with schedules
  const daysInMonth = getCalendarDays(currentMonth);

  const daysWithSchedules = daysInMonth.filter(
    (day) => getEventsForDate(day).length > 0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-600 drop-shadow-sm">
            Lịch đăng
          </h2>
          <p className="text-slate-500 font-medium">
            Quản lý lịch đăng bài cho các dự án
          </p>
        </div>
        <div className="flex gap-3 bg-white/40 p-1.5 rounded-xl border border-white/60 shadow-sm backdrop-blur-sm">
          <div className="flex bg-slate-100/50 rounded-lg p-1">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={
                viewMode === "list"
                  ? "bg-white text-indigo-600 shadow-sm font-semibold"
                  : "text-slate-500 hover:text-indigo-600"
              }
            >
              <List className="h-4 w-4 mr-1" />
              Danh sách
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("calendar")}
              className={
                viewMode === "calendar"
                  ? "bg-white text-indigo-600 shadow-sm font-semibold"
                  : "text-slate-500 hover:text-indigo-600"
              }
            >
              <CalendarDays className="h-4 w-4 mr-1" />
              Lịch
            </Button>
          </div>
          <Button
            onClick={handleAdd}
            className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white shadow-md shadow-indigo-200 border-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm lịch đăng
          </Button>
        </div>
      </div>

      {viewMode === "list" ? (
        <Card className="bg-white/60 backdrop-blur-xl border-white/60 shadow-lg rounded-2xl overflow-hidden">
          {schedules.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <CalendarDays className="w-8 h-8 text-slate-300" />
              </div>
              Chưa có lịch đăng nào được tạo.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="text-left p-4 font-semibold text-sm text-slate-600">
                      Dự án
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-slate-600">
                      Nền tảng
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-slate-600">
                      Tần suất
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-slate-600">
                      Ngày đăng
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-slate-600">
                      Giờ đăng
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-slate-600">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/40">
                  {schedules.map((item) => {
                    const project = projects.find(
                      (p) => p.id === item.projectId
                    );
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-indigo-50/30 transition-colors"
                      >
                        <td className="p-4">
                          <Badge
                            variant="outline"
                            className="bg-white/50 backdrop-blur-sm shadow-sm"
                            style={{
                              backgroundColor: `${project?.color}15`,
                              borderColor: `${project?.color}40`,
                              color: project?.color,
                            }}
                          >
                            {item.projectName}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge
                            variant="outline"
                            className={cn(
                              "border shadow-sm bg-white/50 backdrop-blur-sm",
                              platformColors[item.platform]
                            )}
                          >
                            {item.platform}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-slate-700 font-medium">
                          {item.frequency}
                        </td>
                        <td className="p-4 text-sm text-slate-600">
                          {item.postingDays}
                        </td>
                        <td className="p-4 text-sm font-semibold text-indigo-600 font-mono tracking-tight">
                          {item.postingTime}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(item)}
                              className="hover:bg-white/60 hover:text-indigo-600"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(item.id)}
                              className="text-red-400 hover:text-red-600 hover:bg-white/60"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() - 1
                    )
                  )
                }
              >
                ← Tháng trước
              </Button>
              <h3 className="text-lg font-semibold">
                {format(currentMonth, "MMMM yyyy", { locale: vi })}
              </h3>
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() + 1
                    )
                  )
                }
              >
                Tháng sau →
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-2 mt-4">
              {["Cn", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
                <div
                  key={day}
                  className="text-center font-semibold text-sm text-muted-foreground py-2 text-orange-600"
                >
                  {day}
                </div>
              ))}

              {daysInMonth.map((day) => {
                const daySchedules = getEventsForDate(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, new Date());

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "min-h-24 border rounded-lg p-2 flex flex-col gap-1 text-xs",
                      !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                      isToday && "border-primary bg-primary/5"
                    )}
                  >
                    <div
                      className={cn("font-semibold", isToday && "text-primary")}
                    >
                      {format(day, "d")}
                    </div>
                    <div className="flex-1 space-y-1 overflow-y-auto">
                      {daySchedules.map((event, idx) => {
                        if (event.type === "schedule") {
                          const sched = event.data;
                          const project = projects.find(
                            (p) => p.id === sched.projectId
                          );

                          // Style based on project color if available
                          const style = project?.color
                            ? {
                                color: project.color,
                              }
                            : undefined;

                          // Fallback class if no color
                          const fallbackClass = !project?.color
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : "";

                          return (
                            <div
                              key={`sched-${sched.id}`}
                              className={cn(
                                "p-1 rounded border border-dashed cursor-default truncate text-[10px] transition-all hover:opacity-100 opacity-90",
                                fallbackClass
                              )}
                              style={style}
                              title={`${sched.projectName} - ${sched.platform} (${sched.frequency})`}
                            >
                              <div className="flex items-center gap-1">
                                <span className="font-bold">{event.time} - </span>
                                <span className="font-semibold truncate">
                                  {sched.projectName}
                                </span>
                              </div>
                              <div className="flex items-center justify-between opacity-80 text-[9px] mt-1">
                                <span
                                  className={cn(
                                    "px-1 rounded text-[8px] font-medium border",
                                    platformColors[sched.platform]
                                  )}
                                >
                                  {sched.platform.split(" ")[0]}
                                </span>
                                <span>({sched.frequency})</span>
                              </div>
                            </div>
                          );
                        }

                        // Actual Post/Video
                        const item = event.data as ContentItem | VideoItem;
                        const statusColor =
                          statusConfig[item.status]?.className ||
                          "bg-gray-100 text-gray-700";

                        const handleClick = (e: React.MouseEvent) => {
                          e.stopPropagation();
                          if (event.type === "content") {
                            setSelectedContent(item as ContentItem);
                          } else {
                            setSelectedVideo(item as VideoItem);
                          }
                        };

                        return (
                          <div
                            key={`item-${item.id}`}
                            className={cn(
                              "p-1 rounded border cursor-pointer transition-colors truncate text-[10px]",
                              statusColor
                            )}
                            onClick={handleClick}
                            title={`${item.projectName} - ${
                              // @ts-ignore
                              item.platform
                            }: ${item.idea || "No Idea"}`}
                          >
                            <span className="font-bold mr-1 block">
                              {item.postingTime || "?"}
                            </span>
                            <span className="font-semibold block truncate">
                              {item.projectName}
                            </span>

                            {/* Platform Badge */}
                            <div className="flex flex-wrap gap-1 mt-1 mb-1">
                              {event.type === "content" ? (
                                <span
                                  className={cn(
                                    "px-1 rounded text-[8px] font-medium border bg-white/50",
                                    platformColors[
                                      (item as ContentItem).platform
                                    ] || "border-gray-300 text-gray-500"
                                  )}
                                >
                                  {(item as ContentItem).platform.split(" ")[0]}
                                </span>
                              ) : (
                                (item as VideoItem).platform.map((p, i) => (
                                  <span
                                    key={i}
                                    className={cn(
                                      "px-1 rounded text-[8px] font-medium border bg-white/50",
                                      platformColors[p] ||
                                        "border-gray-300 text-gray-500"
                                    )}
                                  >
                                    {p.split(" ")[0]}
                                  </span>
                                ))
                              )}
                            </div>

                            <span className="opacity-80 block truncate">
                              {item.idea || "No Idea"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {daysWithSchedules.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Không có lịch đăng trong tháng này
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-white/80 backdrop-blur-xl border-white/60 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">
              {editItem ? "Chỉnh sửa lịch đăng" : "Tạo lịch đăng mới"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project" className="text-right text-slate-600">
                Dự án
              </Label>
              <Select
                value={formData.projectId}
                onValueChange={handleProjectChange}
              >
                <SelectTrigger className="col-span-3 bg-white/50 border-slate-200 focus:ring-indigo-500/20">
                  <SelectValue placeholder="Chọn dự án" />
                </SelectTrigger>
                <SelectContent>
                  {projects.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      Không có dự án
                    </div>
                  ) : (
                    projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="platform" className="text-right text-slate-600">
                Nền tảng
              </Label>
              <Select
                value={formData.platform}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, platform: v as Platform }))
                }
              >
                <SelectTrigger className="col-span-3 bg-white/50 border-slate-200 focus:ring-indigo-500/20">
                  <SelectValue placeholder="Chọn nền tảng" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="frequency" className="text-right text-slate-600">
                Tần suất
              </Label>
              <Select
                value={formData.frequency}
                onValueChange={(v) =>
                  setFormData((prev) => ({
                    ...prev,
                    frequency: v as Frequency,
                  }))
                }
              >
                <SelectTrigger className="col-span-3 bg-white/50 border-slate-200 focus:ring-indigo-500/20">
                  <SelectValue placeholder="Chọn tần suất" />
                </SelectTrigger>
                <SelectContent>
                  {frequencies.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="days" className="text-right text-slate-600">
                Ngày
              </Label>
              <Input
                id="days"
                value={formData.postingDays}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    postingDays: e.target.value,
                  }))
                }
                className="col-span-3 bg-white/50 border-slate-200 focus:border-indigo-400"
                placeholder='Ví dụ: "Thứ 2, Thứ 5" hoặc "Ngày 10"'
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right text-slate-600">
                Giờ
              </Label>
              <Input
                id="time"
                type="text"
                placeholder='Ví dụ: "9:00, 20:00"'
                value={formData.postingTime}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    postingTime: e.target.value,
                  }))
                }
                className="col-span-3 bg-white/50 border-slate-200 focus:border-indigo-400"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="active" className="text-right text-slate-600">
                Trạng thái
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.isActive ?? true}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="active" className="text-sm text-slate-600">
                  Đang hoạt động
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
              className="border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
            >
              {isSaving
                ? "Đang lưu..."
                : editItem
                ? "Cập nhật"
                : "Lưu lịch đăng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Detail Modals */}
      <ContentDetailModal
        key={selectedContent?.id || "content-modal"}
        isOpen={!!selectedContent}
        onClose={() => setSelectedContent(null)}
        item={selectedContent}
        onEdit={handleEditContent}
        onApprove={(item) => {
          handleEditContent(item);
        }}
      />

      <VideoDetailModal
        key={selectedVideo?.id || "video-modal"}
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
        item={selectedVideo}
        onEdit={handleEditVideo}
      />

      <ContentFormModal
        isOpen={isContentFormOpen}
        onOpenChange={setIsContentFormOpen}
        onSave={handleSaveContent}
        editContent={editContent}
        isSaving={isSaving}
      />

      <VideoFormModal
        isOpen={isVideoFormOpen}
        onOpenChange={setIsVideoFormOpen}
        onSave={handleSaveVideo}
        editVideo={editVideo}
        isSaving={isSaving}
      />
    </div>
  );
}
