"use client";

import { useState, useEffect } from "react";
import { VideoTable } from "@/components/video/video-table";
import { VideoFormModal } from "@/components/video/video-form-modal";
import { VideoDetailModal } from "@/components/video/video-detail-modal";
import { ScheduleFormModal } from "@/components/schedule/schedule-form-modal";
import { MissingScheduleDialog } from "@/components/shared/missing-schedule-dialog";
import { Button } from "@/components/ui/button";
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
import type { Platform, Status, VideoItem } from "@/lib/types";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";
import { videoPageSteps } from "@/lib/tour-steps";
import { useTourStore } from "@/hooks/use-tour-store";
import { BookOpen } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useScheduleCheck } from "@/hooks/use-schedule-check";
import type { Schedule } from "@/lib/types";

export default function VideoPage() {
  const [videoItems, setVideoItems] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editVideo, setEditVideo] = useState<VideoItem | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<Status | "all" | "overdue">(
    "all",
  );
  const [filterProject, setFilterProject] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);
  const [projects, setProjects] = useState<any[]>([]);

  // States for Schedule Check Dialog
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleInitialData, setScheduleInitialData] = useState<
    Partial<Schedule>
  >({});
  const [pendingApprovalItem, setPendingApprovalItem] =
    useState<VideoItem | null>(null);

  const {
    checkMissingSchedules,
    isWarningOpen,
    missingPlatforms,
    openWarning,
    closeWarning,
  } = useScheduleCheck();

  const { startTour } = useTourStore();

  useEffect(() => {
    import("@/lib/api").then(({ getProjects }) => {
      getProjects().then(setProjects);
    });
  }, []);

  useEffect(() => {
    loadVideoItems();
  }, [filterStatus, filterProject, page, pageSize]);

  // Subscribe to realtime changes
  useRealtimeSubscription("video_items", () => {
    loadVideoItems();
  });

  const loadVideoItems = async () => {
    try {
      setIsLoading(true);
      const { data, total } = await getVideoItems({
        status: filterStatus !== "all" ? filterStatus : undefined,
        projectId: filterProject !== "all" ? filterProject : undefined,
        page,
        pageSize,
      });
      setVideoItems(data);
      setTotalCount(total);
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
    if (item.posts && item.posts.length > 0) {
      item.posts.forEach((post) => {
        if (post.postUrl) {
          window.open(post.postUrl, "_blank");
        }
      });
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa ý tưởng này?")) return;

    try {
      await deleteVideoItem(id);
      setVideoItems((prev) => prev.filter((v) => v.id !== id));
      toast.success("Đã xóa ý tưởng!");
    } catch (error) {
      toast.error("Xóa ý tưởng thất bại");
      console.error(error);
    }
  };

  // Phê duyệt ý tưởng Logic Gốc (được gọi sau khi đã pass check)
  const executeApproveIdea = async (item: VideoItem) => {
    try {
      const updated = await approveVideoIdea(
        item.id,
        item.idea,
        item.projectId,
        item.projectName,
        item.createdAt || new Date().toISOString(),
        item.platform,
        item.videoDuration,
        item.existingVideoLink,
        item.imageLink,
      );
      setVideoItems((prev) =>
        prev.map((v) => (v.id === item.id ? updated : v)),
      );
      toast.success("Đã phê duyệt ý tưởng!");
    } catch (error) {
      toast.error("Duyệt ý tưởng thất bại");
      console.error(error);
    }
  };

  const handleApproveIdea = async (item: VideoItem) => {
    // 1. Check schedules
    const missing = await checkMissingSchedules(item.projectId, item.platform);

    if (missing.length > 0) {
      setPendingApprovalItem(item);
      openWarning(missing);
      return;
    }

    // 2. No missing schedules -> confirm normally
    if (!confirm("Bạn có chắc chắn muốn phê duyệt ý tưởng này?")) return;
    await executeApproveIdea(item);
  };

  const handleContinueApproval = async () => {
    if (pendingApprovalItem) {
      await executeApproveIdea(pendingApprovalItem);
      setPendingApprovalItem(null);
    }
  };

  const handleAddSchedule = () => {
    if (pendingApprovalItem) {
      setScheduleInitialData({
        projectId: pendingApprovalItem.projectId,
        projectName: pendingApprovalItem.projectName,
        platform:
          missingPlatforms[0] || (pendingApprovalItem.platform[0] as Platform),
      });
      setIsScheduleModalOpen(true);
      closeWarning();
    }
  };

  const handleApproveContent = async (item: VideoItem) => {
    if (!confirm("Bạn có chắc chắn muốn phê duyệt nội dung này?")) return;
    try {
      await schedulePost(item);

      const updated = await approveVideoContent(item.id);
      setVideoItems((prev) =>
        prev.map((v) => (v.id === item.id ? updated : v)),
      );
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
          description: `Lên lịch đăng bài: "${item.idea}" vào ${item.postingTime}`,
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
          prev.map((v) => (v.id === editVideo.id ? updated : v)),
        );

        if (updated.postingTime) {
          const oldTime = editVideo.postingTime?.trim() || "";
          const newTime = updated.postingTime.trim();

          if (oldTime !== newTime) {
            await schedulePost(updated);
          }
        }

        toast.success("Đã cập nhật video!");
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

          accountIds: data.accountIds,
          expectedPostDate: data.postingTime || "",
        } as Omit<VideoItem, "id" | "createdAt" | "updatedAt">);

        setVideoItems((prev) => [newVideo, ...prev]);
        toast.success("Đã tạo ý tưởng mới!");
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
        <div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                id="tour-guide-btn"
                variant="outline"
                onClick={() => startTour(videoPageSteps)}
                className="gap-2 bg-white/60 hover:bg-white text-blue-600 border-blue-200 shadow-sm"
              >
                <BookOpen className="h-4 w-4" />
                Hướng dẫn
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Xem hướng dẫn quy trình tạo Video Shorts
            </TooltipContent>
          </Tooltip>
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
        onReload={loadVideoItems}
        isLoading={isLoading}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      <VideoFormModal
        isOpen={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        onSave={handleSaveVideo}
        onApproveIdea={handleApproveIdea}
        onApprove={handleApproveContent}
        editVideo={editVideo}
        isSaving={isSaving}
        onViewDetail={(item) => {
          setIsFormModalOpen(false);
          setSelectedVideo(item);
          setIsDetailModalOpen(true);
        }}
      />

      <VideoDetailModal
        isOpen={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        content={selectedVideo}
        onEdit={handleEditClick}
      />

      <MissingScheduleDialog
        isOpen={isWarningOpen}
        onClose={() => {
          closeWarning();
          setPendingApprovalItem(null);
        }}
        missingPlatforms={missingPlatforms as string[]}
        onAddSchedule={handleAddSchedule}
        // onContinue={handleContinueApproval}
      />

      <ScheduleFormModal
        isOpen={isScheduleModalOpen}
        onOpenChange={setIsScheduleModalOpen}
        projects={projects}
        initialData={scheduleInitialData}
        onSuccess={() => {
          setPendingApprovalItem(null);
          closeWarning();
        }}
      />
    </div>
  );
}
