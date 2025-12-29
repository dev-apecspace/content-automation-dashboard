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
import {
  Plus,
  Edit2,
  Trash2,
  Video,
  Calendar,
  Facebook,
  Youtube,
  User,
} from "lucide-react";
import type {
  Project,
  ContentItem,
  Schedule,
  VideoItem,
  Account,
} from "@/lib/types";
import {
  createProject,
  updateProject,
  deleteProject,
  createActivityLog,
} from "@/lib/api";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";

interface ProjectsTabProps {
  projects: Project[];
  contentItems: ContentItem[];
  videoItems: VideoItem[];
  schedules: Schedule[];
  accounts: Account[];
  onUpdateProjects: (projects: Project[]) => void;
  isLoading?: boolean;
}

export function ProjectsTab({
  projects,
  contentItems,
  videoItems,
  schedules,
  accounts,
  onUpdateProjects,
  isLoading,
}: ProjectsTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editItem, setEditItem] = useState<Project | null>(null);
  const [formData, setFormData] = useState<Partial<Project>>({});
  const { hasPermission } = usePermissions();

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "Facebook":
        return <Facebook className="w-3.5 h-3.5 text-blue-600" />;
      case "Youtube":
        return <Youtube className="w-3.5 h-3.5 text-red-600" />;
      case "Tiktok":
        return <Video className="w-3.5 h-3.5 text-black" />;
      default:
        return <User className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const handleAdd = () => {
    setEditItem(null);
    setFormData({ name: "", description: "", color: "#3b82f6" });
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
      toast.success("Đã xóa dự án!");

      await createActivityLog("delete", "project", id, {
        userId: "user_1",
        description: "Deleted project",
      });
    } catch (error) {
      toast.error("Lỗi khi xóa dự án");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      if (!formData.name) {
        toast.error("Tên dự án không được để trống");
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
        toast.success("Đã cập nhật dự án!");

        await createActivityLog("update", "project", editItem.id, {
          userId: "user_1",
          newValues: formData,
          description: `Cập nhật dự án: ${formData.name}`,
        });
      } else {
        const newProject = await createProject(formData as Omit<Project, "id">);
        onUpdateProjects([...projects, newProject]);
        toast.success("Đã tạo dự án!");

        await createActivityLog("create", "project", newProject.id, {
          userId: "user_1",
          newValues: { name: newProject.name, color: newProject.color },
          description: `Tạo dự án: ${newProject.name}`,
        });
      }

      setIsModalOpen(false);
    } catch (error) {
      toast.error("Lỗi khi lưu dự án");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const getProjectStats = (projectId: string) => {
    const contents = contentItems.filter((c) => c.projectId === projectId);
    const videos = videoItems.filter((v) => v.projectId === projectId);
    const projectSchedules = schedules.filter((s) => s.projectId === projectId);

    const pendingStatuses = [
      "idea",
      "awaiting_content_approval",
      "media_edited",
      "ai_generating_content",
    ];
    const allContent = [...contents, ...videos];
    const pendingAll = allContent.filter((item) =>
      pendingStatuses.includes(item.status)
    ).length;
    const publishedAll = allContent.filter(
      (item) => item.status === "posted_successfully"
    ).length;

    return {
      totalContent: allContent.length,
      pendingContent: pendingAll,
      publishedContent: publishedAll,
      scheduleCount: projectSchedules.length,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-600 drop-shadow-sm pb-1">
            Dự án
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            Quản lý các dự án nội dung
          </p>
        </div>
        {hasPermission("projects.create") && (
          <Button
            onClick={handleAdd}
            className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white shadow-md shadow-indigo-200 border-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm dự án
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => {
          const stats = getProjectStats(project.id);
          return (
            <Card
              key={project.id}
              className="relative overflow-hidden bg-white/60 backdrop-blur-xl border-white/60 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300 group py-6"
            >
              <div
                className="absolute top-0 left-0 w-1.5 h-full opacity-80"
                style={{ backgroundColor: project.color }}
              />
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">{project.name}</CardTitle>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {hasPermission("projects.edit") && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(project)}
                      className="hover:bg-white/60 hover:text-indigo-600 h-8 w-8"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                  {hasPermission("projects.delete") && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(project.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col justify-between h-full">
                <div>
                  {project.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {project.description}
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
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

                  {/* Connected Accounts */}
                  <div className="pt-3 border-t border-white/40">
                    <p className="text-xs font-semibold text-slate-500 mb-2">
                      Tài khoản kết nối:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {accounts.filter((a) => a.projectId === project.id)
                        .length > 0 ? (
                        accounts
                          .filter((a) => a.projectId === project.id)
                          .map((acc) => (
                            <div
                              key={acc.id}
                              className="flex items-center gap-1.5 bg-white/50 px-2 py-1 rounded-md border border-white/60 shadow-sm"
                              title={acc.channelName}
                            >
                              {getPlatformIcon(acc.platform)}
                              <span className="text-xs font-medium text-slate-700 truncate max-w-[250px]">
                                {acc.channelName}
                              </span>
                            </div>
                          ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          Chưa có tài khoản
                        </span>
                      )}
                    </div>
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
              <Label htmlFor="description">Mô tả</Label>
              <Input
                id="description"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Nhập mô tả dự án"
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
