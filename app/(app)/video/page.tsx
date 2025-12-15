"use client";

import { useState, useEffect } from "react";
import { VideoTable } from "@/components/video-table";
import { VideoFormModal } from "@/components/video-form-modal";
import { VideoDetailModal } from "@/components/video-detail-modal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getVideoItems, createVideoItem, updateVideoItem, deleteVideoItem, approveVideoContent, createActivityLog } from "@/lib/api";
import { toast } from "sonner";
import type { Status, VideoItem } from "@/lib/types";

export default function VideoPage() {
  const [videoItems, setVideoItems] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editVideo, setEditVideo] = useState<VideoItem | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [filterProject, setFilterProject] = useState<string>("all");

  useEffect(() => {
    loadVideoItems();
  }, [filterStatus, filterProject]);

  const loadVideoItems = async () => {
    try {
      setIsLoading(true);
      const data = await getVideoItems({
        status: filterStatus !== "all" ? filterStatus : undefined,
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
      const updated = await approveVideoContent(item.id, "user_1");
      setVideoItems((prev) =>
        prev.map((v) => (v.id === item.id ? updated : v))
      );
      toast.success("Video content approved!");

      await createActivityLog("approve", "video", item.id, {
        userId: "user_1",
        newValues: { status: "content_approved" },
        description: `Approved content: ${item.idea}`,
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
        const newVideo = await createVideoItem({
          status: data.status || "idea",
          idea: data.idea || "",
          projectId: data.projectId || "",
          projectName: data.projectName || "",
          platform: data.platform || ["Facebook Reels"],
          existingVideoLink: data.existingVideoLink,
          videoDuration: data.videoDuration,
          imageLink: data.imageLink,
          topic: data.topic,
          targetAudience: data.targetAudience,
          researchNotes: data.researchNotes,
          postingTime: data.postingTime,
          caption: data.caption,
          callToAction: data.callToAction,
          title: data.title,
          videoLink: data.videoLink,
          postUrl: data.postUrl,
        } as Omit<VideoItem, "id" | "createdAt" | "updatedAt">);

        setVideoItems((prev) => [newVideo, ...prev]);
        toast.success("Video created!");

        await createActivityLog("create", "video", newVideo.id, {
          userId: "user_1",
          newValues: { idea: newVideo.idea, status: newVideo.status },
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

      <VideoTable
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

      <VideoFormModal
        isOpen={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        onSave={handleSaveVideo}
        editVideo={editVideo}
        isSaving={isSaving}
      />

      <VideoDetailModal
        isOpen={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        content={selectedVideo}
      />
    </div>
  );
}