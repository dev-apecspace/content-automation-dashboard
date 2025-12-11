"use client";

import { useState, useEffect } from "react";
import { ContentTable } from "@/components/content-table";
import { ContentFormModal } from "@/components/content-form-modal";
import { ContentDetailModal } from "@/components/content-detail-modal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getVideoItems, createActivityLog } from "@/lib/api";
import { toast } from "sonner";
import type { VideoItem } from "@/lib/types";

export default function VideoPage() {
  const [videoItems, setVideoItems] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editVideo, setEditVideo] = useState<VideoItem | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    "cho_duyet" | "da_dang_thanh_cong" | "dang_xu_ly" | "loi" | "all"
  >("all");
  const [filterProject, setFilterProject] = useState<string>("all");

  useEffect(() => {
    loadVideoItems();
  }, [filterStatus, filterProject]);

  const loadVideoItems = async () => {
    try {
      setIsLoading(true);
      const data = await getVideoItems({
        status: filterStatus !== "all" ? (filterStatus as any) : undefined,
        projectId: filterProject !== "all" ? filterProject : undefined,
      });
      setVideoItems(data);
    } catch (error) {
      toast.error("Failed to load video items");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClick = () => {
    setEditVideo(null);
    setIsFormModalOpen(true);
  };

  const handleEditClick = (item: VideoItem) => {
    setEditVideo(item);
    setIsFormModalOpen(true);
  };

  const handleViewClick = (item: VideoItem) => {
    setSelectedVideo(item);
    setIsDetailModalOpen(true);
  };

  const handleDeleteVideo = async (id: string) => {
    try {
      const { deleteVideoItem } = await import("@/lib/api");
      await deleteVideoItem(id);
      setVideoItems((prev) => prev.filter((v) => v.id !== id));
      toast.success("Video deleted!");

      await createActivityLog("delete", "video", id, {
        userId: "user_1",
        description: "Deleted video item",
      });
    } catch (error) {
      toast.error("Failed to delete video");
      console.error(error);
    }
  };

  const handleApproveVideo = async (item: VideoItem) => {
    try {
      const { approveVideo } = await import("@/lib/api");
      const updated = await approveVideo(item.id, "user_1");
      setVideoItems((prev) =>
        prev.map((v) => (v.id === item.id ? updated : v))
      );
      toast.success("Video approved!");

      await createActivityLog("approve", "video", item.id, {
        userId: "user_1",
        newValues: { status: "da_dang_thanh_cong" },
        description: `Approved: ${item.idea}`,
      });
    } catch (error) {
      toast.error("Failed to approve video");
      console.error(error);
    }
  };

  const handleSaveVideo = async (data: Partial<VideoItem>) => {
    try {
      setIsSaving(true);

      if (editVideo) {
        const { updateVideoItem } = await import("@/lib/api");
        const updated = await updateVideoItem(editVideo.id, data);
        setVideoItems((prev) =>
          prev.map((v) => (v.id === editVideo.id ? updated : v))
        );
        toast.success("Video updated!");

        await createActivityLog("update", "video", editVideo.id, {
          userId: "user_1",
          newValues: data,
          description: `Updated: ${data.idea || editVideo.idea}`,
        });
      } else {
        const { createVideoItem } = await import("@/lib/api");
        const newVideo = await createVideoItem({
          ...data,
          status: "cho_duyet",
          idea: data.idea || "",
          projectId: data.projectId || "",
          projectName: data.projectName || "",
          platform:
            (data.platform as "Facebook Reels" | "Youtube Shorts") ||
            "Facebook Reels",
          existingVideoLink: data.existingVideoLink || "",
          videoDuration: data.videoDuration || 5,
          imageLink: data.imageLink || "",
          topic: data.topic || "",
          targetAudience: data.targetAudience || "",
          researchNotes: data.researchNotes || "",
          expectedPostDate: data.expectedPostDate || "",
          postingTime: data.postingTime || "",
        } as Omit<VideoItem, "id" | "createdAt" | "updatedAt">);

        setVideoItems((prev) => [...prev, newVideo]);
        toast.success("Video created!");

        await createActivityLog("create", "video", newVideo.id, {
          userId: "user_1",
          newValues: { idea: newVideo.idea, status: "cho_duyet" },
          description: `Created: ${newVideo.idea}`,
        });
      }

      setEditVideo(null);
      setIsFormModalOpen(false);
    } catch (error) {
      toast.error("Failed to save video");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản Lý Video</h1>
          <p className="text-gray-600 mt-1">
            Quản lý video (Reels, Shorts) và phê duyệt
          </p>
        </div>
        <Button onClick={handleCreateClick} className="gap-2">
          <Plus className="h-4 w-4" />
          Tạo Video
        </Button>
      </div>

      <ContentTable
        data={videoItems}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        filterProject={filterProject}
        onProjectFilterChange={setFilterProject}
        onViewDetails={handleViewClick}
        onEdit={handleEditClick}
        onDelete={handleDeleteVideo}
        onApprove={handleApproveVideo}
        onAdd={handleCreateClick}
      />

      <ContentFormModal
        isOpen={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        onSave={handleSaveVideo}
        editContent={editVideo}
        isSaving={isSaving}
      />

      <ContentDetailModal
        isOpen={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        content={selectedVideo}
      />
    </div>
  );
}
