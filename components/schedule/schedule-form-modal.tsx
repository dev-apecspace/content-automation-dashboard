"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
  type Schedule,
  type Platform,
  type Frequency,
  type Project,
  CONTENT_PLATFORMS,
  VIDEO_PLATFORMS,
} from "@/lib/types";
import { createSchedule, updateSchedule } from "@/lib/api";
import { toast } from "sonner";

interface ScheduleFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  editItem?: Schedule | null;
  initialData?: Partial<Schedule>;
  onSuccess: (schedule: Schedule) => void;
}

const platforms: Platform[] = [...CONTENT_PLATFORMS, ...VIDEO_PLATFORMS];

const frequencies: Frequency[] = ["Tháng", "Tuần", "Ngày", "3 ngày/lần"];

export function ScheduleFormModal({
  isOpen,
  onOpenChange,
  projects,
  editItem,
  initialData,
  onSuccess,
}: ScheduleFormModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Schedule>>({
    projectId: "",
    projectName: "",
    platform: "Facebook Post",
    frequency: "Ngày",
    postingDays: "",
    postingTime: "",
  });

  // Initialize form data when opening or when props change
  useEffect(() => {
    if (isOpen) {
      if (editItem) {
        setFormData(editItem);
      } else {
        setFormData({
          projectId: "",
          projectName: "",
          platform: "Facebook Post",
          frequency: "Ngày",
          postingDays: "",
          postingTime: "",
          ...initialData,
        });
      }
    }
  }, [isOpen, editItem, initialData]);

  const handleProjectChange = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    setFormData((prev) => ({
      ...prev,
      projectId,
      projectName: project?.name || "",
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      if (!formData.projectId) {
        toast.error("Vui lòng chọn dự án");
        return;
      }

      let result: Schedule;

      if (editItem) {
        const updated = await updateSchedule(
          editItem.id,
          formData as Partial<Schedule>,
        );
        result = updated;
        toast.success("Đã cập nhật lịch đăng!");
      } else {
        const newSchedule = await createSchedule(
          formData as Omit<Schedule, "id">,
        );
        result = newSchedule;
        toast.success("Đã tạo lịch đăng!");
      }

      onSuccess(result);
      onOpenChange(false);
    } catch (error) {
      toast.error("Lưu lịch đăng thất bại");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white/80 backdrop-blur-xl border-white/60 shadow-2xl rounded-2xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 pb-2 shrink-0">
          <DialogTitle className="text-xl font-bold text-slate-800">
            {editItem ? "Chỉnh sửa lịch đăng" : "Tạo lịch đăng mới"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-2 grid gap-4">
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
              value={formData.postingDays || ""}
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
              value={formData.postingTime || ""}
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

        <DialogFooter className="p-6 pt-4 border-t border-slate-100 bg-slate-50/50">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
          >
            {isSaving ? "Đang lưu..." : editItem ? "Cập nhật" : "Lưu lịch đăng"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
