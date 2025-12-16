"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Video, Calendar } from "lucide-react";
import type { Project, ContentItem, Schedule } from "@/lib/types";
import {
  createProject,
  updateProject,
  deleteProject,
  createActivityLog,
} from "@/lib/api";
import { toast } from "sonner";

interface ProjectsTabProps {
  projects: Project[];
  contentItems: ContentItem[];
  schedules: Schedule[];
  onUpdateProjects: (projects: Project[]) => void;
  isLoading?: boolean;
}

export function ProjectsTab({
  projects,
  contentItems,
  schedules,
  onUpdateProjects,
  isLoading,
}: ProjectsTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editItem, setEditItem] = useState<Project | null>(null);
  const [formData, setFormData] = useState<Partial<Project>>({});

  const handleAdd = () => {
    setEditItem(null);
    setFormData({ name: "", color: "#3b82f6" });
    setIsModalOpen(true);
  };

  const handleEdit = (item: Project) => {
    setEditItem(item);
    setFormData(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      setIsSaving(true);
      await deleteProject(id);
      onUpdateProjects(projects.filter((p) => p.id !== id));
      toast.success("Project deleted!");

      await createActivityLog("delete", "project", id, {
        userId: "user_1",
        description: "Deleted project",
      });
    } catch (error) {
      toast.error("Failed to delete project");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      if (!formData.name) {
        toast.error("Project name is required");
        return;
      }

      if (editItem) {
        const updated = await updateProject(
          editItem.id,
          formData as Partial<Project>
        );
        onUpdateProjects(
          projects.map((p) => (p.id === editItem.id ? updated : p))
        );
        toast.success("Project updated!");

        await createActivityLog("update", "project", editItem.id, {
          userId: "user_1",
          newValues: formData,
          description: `Updated project: ${formData.name}`,
        });
      } else {
        const newProject = await createProject(formData as Omit<Project, "id">);
        onUpdateProjects([...projects, newProject]);
        toast.success("Project created!");

        await createActivityLog("create", "project", newProject.id, {
          userId: "user_1",
          newValues: { name: newProject.name, color: newProject.color },
          description: `Created project: ${newProject.name}`,
        });
      }

      setIsModalOpen(false);
    } catch (error) {
      toast.error("Failed to save project");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const getProjectStats = (projectId: string) => {
    const contents = contentItems.filter((c) => c.projectId === projectId);
    const projectSchedules = schedules.filter((s) => s.projectId === projectId);
    return {
      totalContent: contents.length,
      pendingContent: contents.filter((c) => c.status === "cho_duyet").length,
      publishedContent: contents.filter(
        (c) => c.status === "da_dang_thanh_cong"
      ).length,
      scheduleCount: projectSchedules.length,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dự án</h2>
          <p className="text-muted-foreground">Quản lý các dự án nội dung</p>
        </div>
        <Button onClick={handleAdd} className="bg-[#1a365d] hover:bg-[#2a4a7d]">
          <Plus className="h-4 w-4 mr-2" />
          Thêm dự án
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => {
          const stats = getProjectStats(project.id);
          return (
            <Card key={project.id} className="relative overflow-hidden">
              <div
                className="absolute top-0 left-0 w-1 h-full"
                style={{ backgroundColor: project.color }}
              />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(project)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(project.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <span>{stats.totalContent} nội dung</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{stats.scheduleCount} lịch đăng</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 bg-orange-100 rounded p-2 text-center">
                    <div className="text-lg font-bold text-orange-700">
                      {stats.pendingContent}
                    </div>
                    <div className="text-xs text-orange-600">Chờ duyệt</div>
                  </div>
                  <div className="flex-1 bg-green-100 rounded p-2 text-center">
                    <div className="text-lg font-bold text-green-700">
                      {stats.publishedContent}
                    </div>
                    <div className="text-xs text-green-600">Đã đăng</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Chỉnh sửa dự án" : "Thêm dự án mới"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên dự án</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Nhập tên dự án"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Màu đại diện</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, color: e.target.value }))
                  }
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formData.color}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, color: e.target.value }))
                  }
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#1a365d] hover:bg-[#2a4a7d] disabled:opacity-50"
            >
              {isSaving ? "Đang lưu..." : editItem ? "Cập nhật" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
