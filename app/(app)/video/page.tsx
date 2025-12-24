"use client";

import { useState, useEffect } from "react";
import { VideoTable } from "@/components/video/video-table";
import { VideoFormModal } from "@/components/video/video-form-modal";
import { VideoDetailModal } from "@/components/video/video-detail-modal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  getVideoItems,
  createVideoItem,
  updateVideoItem,
  deleteVideoItem,
  approveVideoIdea,
  approveVideoContent,
  createActivityLog,
} from "@/lib/api";
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
  }, [filterStatus, filterProject, videoItems]);

  const loadVideoItems = async () => {
    try {
      setIsLoading(true);
      const data = await getVideoItems({
        status: filterStatus !== "all" ? filterStatus : undefined,
        projectId: filterProject !== "all" ? filterProject : undefined,
      });
      setVideoItems(data);
    } catch (error) {
      toast.error("Có lỗi khi tải lên danh sách video");
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
    setIsDetailModalOpen(false);
  };

  const handleViewClick = (item: VideoItem) => {
    setSelectedVideo(item);
    setIsDetailModalOpen(true);
  };

  const handleViewPost = (item: VideoItem) => {
    if (item.postUrl) {
      if (Array.isArray(item.postUrl)) {
        item.postUrl.forEach((url) => window.open(url, "_blank"));
      } else {
        window.open(item.postUrl, "_blank");
      }
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa ý tưởng này?")) return;

    try {
      await deleteVideoItem(id);
      setVideoItems((prev) => prev.filter((v) => v.id !== id));
      toast.success("Đã xóa ý tưởng!");

      await createActivityLog("delete", "video", id, {
        userId: "user_1",
        description: `Xóa ý tưởng ${id}`,
      });
    } catch (error) {
      toast.error("Xóa ý tưởng thất bại");
      console.error(error);
    }
  };

  const handleApproveIdea = async (item: VideoItem) => {
    if (!confirm("Bạn có chắc chắn muốn phê duyệt ý tưởng này?")) return;

    try {
      const updated = await approveVideoIdea(
        item.id,
        "user_1",
        item.idea,
        item.projectId,
        item.projectName,
        item.createdAt || new Date().toISOString(),
        item.platform,
        item.videoDuration,
        item.existingVideoLink,
        item.imageLink
      );
      setVideoItems((prev) =>
        prev.map((v) => (v.id === item.id ? updated : v))
      );

      await createActivityLog("approve", "video", item.id, {
        userId: "user_1",
        newValues: { status: "ai_generating_content" },
        description: `Đã duyệt ý tưởng: ${item.idea}`,
      });
    } catch (error) {
      toast.error("Duyệt ý tưởng thất bại");
      console.error(error);
    }
  };

  const handleApproveContent = async (item: VideoItem) => {
    if (!confirm("Bạn có chắc chắn muốn phê duyệt nội dung này?")) return;
    try {
      await schedulePost(item);

      const updated = await approveVideoContent(item.id, "user_1");
      setVideoItems((prev) =>
        prev.map((v) => (v.id === item.id ? updated : v))
      );

      await createActivityLog("approve", "video", item.id, {
        userId: "user_1",
        newValues: { status: "content_approved" },
        description: `Đã duyệt nội dung: ${item.idea}`,
      });
    } catch (error) {
      toast.error("Duyệt nội dung thất bại");
      console.error(error);
    }
  };

  const schedulePost = async (item: VideoItem) => {
    try {
      const response = await fetch("/api/webhook/schedule-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: item.id,
          posting_time: item.postingTime,
          platform: item.platform,
        }),
      });

      if (!response.ok) {
        toast.error("Failed to schedule post");
        throw new Error(await response.text());
      } else {
        toast.success(`Đã lên lịch đăng bài lúc ${item.postingTime}`);

        await createActivityLog("schedule", "video", item.id, {
          userId: "user_1",
          description: `Lên lịch đăng bài: ${item.idea} vào ${item.postingTime}`,
        });
      }
    } catch (error) {
      console.error(error);
      throw error;
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

        if (updated.postingTime) {
          const oldTime = editVideo.postingTime?.trim() || "";
          const newTime = updated.postingTime.trim();

          if (oldTime !== newTime) {
            await schedulePost(updated);
          }
        }

        toast.success("Đã cập nhật video!");

        await createActivityLog("update", "video", editVideo.id, {
          userId: "user_1",
          newValues: data,
          description: `Đã cập nhật ý tưởng: ${data.idea || editVideo.idea}`,
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
          accountIds: data.accountIds,
        } as Omit<VideoItem, "id" | "createdAt" | "updatedAt">);

        setVideoItems((prev) => [newVideo, ...prev]);
        toast.success("Đã tạo ý tưởng mới!");

        await createActivityLog("create", "video", newVideo.id, {
          userId: "user_1",
          newValues: { idea: newVideo.idea, status: newVideo.status },
          description: `Tạo ý tưởng: ${newVideo.idea}`,
        });
      }

      setEditVideo(null);
      setIsFormModalOpen(false);
    } catch (error) {
      toast.error("Đã xảy ra lỗi khi lưu!");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-600 drop-shadow-sm pb-1">
            Quản Lý Video
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Quản lý video (Reels, Shorts) và phê duyệt
          </p>
        </div>
      </div>

      <VideoTable
        data={videoItems}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        filterProject={filterProject}
        onProjectFilterChange={setFilterProject}
        onViewDetails={handleViewClick}
        onViewPost={handleViewPost}
        onEdit={handleEditClick}
        onDelete={handleDeleteVideo}
        onApproveIdea={handleApproveIdea}
        onApproveContent={handleApproveContent}
        onAdd={handleCreateClick}
      />

      <VideoFormModal
        isOpen={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        onSave={handleSaveVideo}
        onApproveIdea={handleApproveIdea}
        onApprove={handleApproveContent}
        editVideo={editVideo}
        isSaving={isSaving}
      />

      <VideoDetailModal
        isOpen={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        content={selectedVideo}
        onEdit={handleEditClick}
      />
    </div>
  );
}
