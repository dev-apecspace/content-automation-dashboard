"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit2, Trash2, List, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Schedule, Platform, Frequency, Project } from "@/lib/types"
import { createSchedule, updateSchedule, deleteSchedule, createActivityLog } from "@/lib/api"
import { projects as defaultProjects } from "@/lib/mock-data"
import { toast } from "sonner"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from "date-fns"
import { vi } from "date-fns/locale"

interface ScheduleTabProps {
  schedules: Schedule[]
  onUpdate: (schedules: Schedule[]) => void
  isLoading?: boolean
  projectsList?: Project[]
}

const platforms: Platform[] = ["Facebook Post", "Facebook Reels", "Youtube Shorts"]
const frequencies: Frequency[] = ["10 phút/lần", "Tuần", "Ngày", "Tháng", "3 ngày/lần"]

const platformColors: Record<Platform, string> = {
  "Facebook Post": "bg-blue-100 text-blue-700 border-blue-300",
  "Facebook Reels": "bg-pink-100 text-pink-700 border-pink-300",
  "Youtube Shorts": "bg-red-100 text-red-700 border-red-300",
}

export function ScheduleTab({ schedules, onUpdate, isLoading, projectsList = [] }: ScheduleTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editItem, setEditItem] = useState<Schedule | null>(null)
  const [formData, setFormData] = useState<Partial<Schedule>>({})
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const handleAdd = () => {
    setEditItem(null)
    setFormData({
      projectId: "",
      projectName: "",
      platform: "Facebook Post",
      frequency: "Ngày",
      postingDays: "",
      postingTime: "",
    })
    setIsModalOpen(true)
  }

  const handleEdit = (item: Schedule) => {
    setEditItem(item)
    setFormData(item)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      setIsSaving(true)
      await deleteSchedule(id)
      onUpdate(schedules.filter((s) => s.id !== id))
      toast.success("Schedule deleted!")

      await createActivityLog("delete", "schedule", id, {
        userId: "user_1",
        description: "Deleted schedule",
      })
    } catch (error) {
      toast.error("Failed to delete schedule")
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)

      if (!formData.projectId) {
        toast.error("Please select a project")
        return
      }

      if (editItem) {
        const updated = await updateSchedule(editItem.id, formData as Partial<Schedule>)
        onUpdate(schedules.map((s) => (s.id === editItem.id ? updated : s)))
        toast.success("Schedule updated!")

        await createActivityLog("update", "schedule", editItem.id, {
          userId: "user_1",
          newValues: formData,
          description: `Updated schedule for ${formData.projectName}`,
        })
      } else {
        const newSchedule = await createSchedule(formData as Omit<Schedule, "id">)
        onUpdate([...schedules, newSchedule])
        toast.success("Schedule created!")

        await createActivityLog("create", "schedule", newSchedule.id, {
          userId: "user_1",
          newValues: { projectName: newSchedule.projectName, platform: newSchedule.platform },
          description: `Created schedule for ${newSchedule.projectName}`,
        })
      }

      setIsModalOpen(false)
    } catch (error) {
      toast.error("Failed to save schedule")
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleProjectChange = (projectId: string) => {
    const project = projectsList.find((p) => p.id === projectId)
    setFormData((prev) => ({
      ...prev,
      projectId,
      projectName: project?.name || "",
    }))
  }

  // Group schedules by project
  const groupedSchedules = schedules.reduce(
    (acc, schedule) => {
      if (!acc[schedule.projectName]) {
        acc[schedule.projectName] = []
      }
      acc[schedule.projectName].push(schedule)
      return acc
    },
    {} as Record<string, Schedule[]>,
  )

  // Get schedules for a specific date
  const getSchedulesForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    const dayName = format(date, "EEEE").toLowerCase()
    return schedules.filter((schedule) => {
      if (!schedule.postingDays) return false
      const days = schedule.postingDays.toLowerCase()
      return days.includes(dayName) || days.includes("mỗi ngày") || days.includes("daily")
    })
  }

  // Get all days in current month with schedules
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

  const daysWithSchedules = daysInMonth.filter((day) => getSchedulesForDate(day).length > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Lịch đăng</h2>
          <p className="text-muted-foreground">Quản lý lịch đăng bài cho các dự án</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={viewMode === "list" ? "bg-[#1a365d] hover:bg-[#2a4a7d]" : ""}
            >
              <List className="h-4 w-4 mr-1" />
              Danh sách
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("calendar")}
              className={viewMode === "calendar" ? "bg-[#1a365d] hover:bg-[#2a4a7d]" : ""}
            >
              <CalendarDays className="h-4 w-4 mr-1" />
              Lịch
            </Button>
          </div>
          <Button onClick={handleAdd} className="bg-[#1a365d] hover:bg-[#2a4a7d]">
            <Plus className="h-4 w-4 mr-2" />
            Thêm lịch đăng
          </Button>
        </div>
      </div>

      {viewMode === "list" ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-semibold text-sm">Dự án</th>
                  <th className="text-left p-4 font-semibold text-sm">Nền tảng</th>
                  <th className="text-left p-4 font-semibold text-sm">Tần suất</th>
                  <th className="text-left p-4 font-semibold text-sm">Ngày đăng</th>
                  <th className="text-left p-4 font-semibold text-sm">Giờ đăng</th>
                  <th className="text-left p-4 font-semibold text-sm">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((item) => {
                  const project = (projectsList.length > 0 ? projectsList : defaultProjects).find((p) => p.id === item.projectId)
                  return (
                    <tr key={item.id} className="border-t hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <Badge
                          variant="outline"
                          style={{
                            backgroundColor: `${project?.color}20`,
                            borderColor: project?.color,
                            color: project?.color,
                          }}
                        >
                          {item.projectName}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={cn("border", platformColors[item.platform])}>
                          {item.platform}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm">{item.frequency}</td>
                      <td className="p-4 text-sm">{item.postingDays}</td>
                      <td className="p-4 text-sm font-medium">{item.postingTime}</td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              >
                ← Tháng trước
              </Button>
              <h3 className="text-lg font-semibold">{format(currentMonth, "MMMM yyyy", { locale: vi })}</h3>
              <Button
                variant="outline"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              >
                Tháng sau →
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-2 mt-4">
              {["Cn", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
                <div key={day} className="text-center font-semibold text-sm text-muted-foreground py-2">
                  {day}
                </div>
              ))}

              {daysInMonth.map((day) => {
                const daySchedules = getSchedulesForDate(day)
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const isToday = isSameDay(day, new Date())

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "min-h-24 border rounded-lg p-2 flex flex-col gap-1 text-xs",
                      !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                      isToday && "border-primary bg-primary/5",
                    )}
                  >
                    <div className={cn("font-semibold", isToday && "text-primary")}>
                      {format(day, "d")}
                    </div>
                    <div className="flex-1 space-y-1 overflow-y-auto">
                      {daySchedules.map((schedule, idx) => {
                        const project = (projectsList.length > 0 ? projectsList : defaultProjects).find((p) => p.id === schedule.projectId)
                        return (
                          <div
                            key={`${day.toISOString()}-${idx}`}
                            className="p-1 rounded bg-blue-100 text-blue-700 cursor-pointer hover:bg-blue-200 transition-colors truncate"
                            onClick={() => handleEdit(schedule)}
                            title={`${schedule.projectName} - ${schedule.platform} - ${schedule.postingTime}`}
                          >
                            {schedule.postingTime}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? "Chỉnh sửa lịch đăng" : "Thêm lịch đăng mới"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Dự án</Label>
              <Select value={formData.projectId} onValueChange={handleProjectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn dự án" />
                </SelectTrigger>
                <SelectContent>
                  {(projectsList.length > 0 ? projectsList : defaultProjects).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nền tảng</Label>
              <Select
                value={formData.platform}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, platform: v as Platform }))}
              >
                <SelectTrigger>
                  <SelectValue />
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

            <div className="space-y-2">
              <Label>Tần suất</Label>
              <Select
                value={formData.frequency}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, frequency: v as Frequency }))}
              >
                <SelectTrigger>
                  <SelectValue />
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

            <div className="space-y-2">
              <Label htmlFor="postingDays">Ngày đăng</Label>
              <Input
                id="postingDays"
                value={formData.postingDays}
                onChange={(e) => setFormData((prev) => ({ ...prev, postingDays: e.target.value }))}
                placeholder="VD: Mỗi ngày, Thứ 2 Thứ 6, Ngày 5 ngày 20..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postingTime">Giờ đăng</Label>
              <Input
                id="postingTime"
                type="time"
                value={formData.postingTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, postingTime: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-[#1a365d] hover:bg-[#2a4a7d] disabled:opacity-50">
              {isSaving ? "Đang lưu..." : editItem ? "Cập nhật" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
