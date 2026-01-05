"use client";

import { useState, useEffect } from "react";
import { ContentTable } from "@/components/content/content-table";
import { ContentFormModal } from "@/components/content/content-form-modal";
import { ContentDetailModal } from "@/components/content/content-detail-modal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  getContentItems,
  createContentItem,
  updateContentItem,
  deleteContentItem,
  approveIdea,
  approveContent,
} from "@/lib/api/content-items";
import { createActivityLog } from "@/lib/api/activity-logs";
import { toast } from "sonner";
import type { ContentItem } from "@/lib/types";
import type { Status } from "@/lib/types";
import { usePermissions } from "@/hooks/use-permissions";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";

export default function ContentPage() {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editContent, setEditContent] = useState<ContentItem | null>(null);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(
    null
  );
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [filterProject, setFilterProject] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);
  const { hasPermission } = usePermissions();

  useEffect(() => {
    loadContentItems();
  }, [filterStatus, filterProject, page, pageSize]);

  // Subscribe to realtime changes
  useRealtimeSubscription("content_items", () => {
    loadContentItems();
  });

  const loadContentItems = async () => {
    try {
      setIsLoading(true);
      const { data, total } = await getContentItems({
        status: filterStatus !== "all" ? filterStatus : undefined,
        projectId: filterProject !== "all" ? filterProject : undefined,
        page,
        pageSize,
      });
      setContentItems(data);
      setTotalCount(total);
    } catch (error) {
      toast.error("Không tải được danh sách bài viết");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClick = () => {
    setEditContent(null);
    setIsFormModalOpen(true);
  };

  const handleEditClick = (item: ContentItem) => {
    setEditContent(item);
    setIsFormModalOpen(true);
    setIsDetailModalOpen(false);
  };

  const handleViewClick = (item: ContentItem) => {
    setSelectedContent(item);
    setIsDetailModalOpen(true);
  };

  const handleViewImage = (item: ContentItem) => {
    if (item.imageLinks && item.imageLinks.length > 0) {
      window.open(item.imageLinks[0], "_blank");
    } else {
      toast.error("Không có link ảnh");
    }
  };

  const handleViewPost = (item: ContentItem) => {
    if (item.posts && item.posts.length > 0) {
      item.posts.forEach((post) => {
        if (post.postUrl) {
          window.open(post.postUrl, "_blank");
        }
      });
    } else {
      toast.error("Không có link bài đăng");
    }
  };

  const handleDeleteContent = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa ý tưởng này?")) return;

    try {
      await deleteContentItem(id);
      setContentItems((prev) => prev.filter((c) => c.id !== id));
      toast.success("Đã xóa ý tưởng thành công!");
    } catch (error) {
      toast.error("Xóa ý tưởng thất bại");
      console.error(error);
    }
  };

  // Phê duyệt ý tưởng
  const handleApproveIdea = async (item: ContentItem) => {
    if (!confirm("Bạn có chắc chắn muốn phê duyệt ý tưởng này?")) return;

    try {
      const updated = await approveIdea(
        item.id,
        "user_1",
        item.idea,
        item.projectId,
        item.contentType,
        item.imageLinks || []
      );
      setContentItems((prev) =>
        prev.map((c) => (c.id === item.id ? updated : c))
      );
      toast.success("Đã phê duyệt ý tưởng!");
    } catch (error) {
      toast.error("Phê duyệt ý tưởng thất bại");
      console.error(error);
    }
  };

  // Tạo lịch đăng bài
  const schedulePost = async (item: ContentItem) => {
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
        toast.error("Lên lịch đăng bài thất bại");
        throw new Error(await response.text());
      } else {
        toast.success(`Đã lên lịch đăng bài lúc ${item.postingTime}`);

        // Tạo activity log cho việc schedule
        await createActivityLog("schedule", "content", item.id, {
          userId: "user_1",
          description: `Lên lịch đăng bài: ${item.idea} vào ${item.postingTime}`,
        });
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  // Phê duyệt nội dung
  const handleApproveContent = async (item: ContentItem) => {
    if (!confirm("Bạn có chắc chắn muốn phê duyệt nội dung này?")) return;

    try {
      // Gọi hàm tạo lịch đăng
      await schedulePost(item);

      const updated = await approveContent(item.id, "user_1");
      setContentItems((prev) =>
        prev.map((c) => (c.id === item.id ? updated : c))
      );
    } catch (error) {
      toast.error("Phê duyệt nội dung thất bại");
      console.error(error);
    }
  };

  const handleSaveContent = async (data: Partial<ContentItem>) => {
    try {
      setIsSaving(true);

      if (editContent) {
        const updated = await updateContentItem(editContent.id, data);
        setContentItems((prev) =>
          prev.map((c) => (c.id === editContent.id ? updated : c))
        );

        if (updated.postingTime) {
          const oldTime = editContent.postingTime?.trim() || "";
          const newTime = updated.postingTime.trim();

          if (oldTime !== newTime) {
            await schedulePost(updated);
          }
        }

        toast.success("Cập nhật bài viết thành công!");
      } else {
        const newContent = await createContentItem({
          ...data,
          status: "idea" as Status,
          idea: data.idea || "",
          projectId: data.projectId || "",
          projectName: data.projectName || "",
          platform: data.platform || "Facebook Post",
          contentType: data.contentType || "",
          imageLinks: data.imageLinks || undefined,
          topic: data.topic || null,
          targetAudience: data.targetAudience || null,
          researchNotes: data.researchNotes || null,
          postingTime: data.postingTime || null,
          caption: data.caption || null,
          callToAction: data.callToAction || null,
        } as Omit<ContentItem, "id" | "createdAt" | "updatedAt">);

        setContentItems((prev) => [...prev, newContent]);
        toast.success("Tạo bài viết thành công!");
      }

      setEditContent(null);
      setIsFormModalOpen(false);
    } catch (error) {
      toast.error("Lưu bài viết thất bại");
      console.error(error);
    } finally {
      setIsSaving(false);
      loadContentItems();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-600 drop-shadow-sm pb-1">
            Quản Lý Bài Viết
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Quản lý bài viết cho các nền tảng mạng xã hội
          </p>
        </div>
      </div>

      <ContentTable
        data={contentItems}
        isLoading={isLoading}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        filterProject={filterProject}
        onProjectFilterChange={setFilterProject}
        onViewDetails={handleViewClick}
        onEdit={handleEditClick}
        onDelete={handleDeleteContent}
        onApproveIdea={handleApproveIdea}
        onApproveContent={handleApproveContent}
        onViewImage={handleViewImage}
        onViewPost={handleViewPost}
        onAdd={handleCreateClick}
        onReload={loadContentItems}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      <ContentFormModal
        isOpen={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        onSave={handleSaveContent}
        editContent={editContent}
        isSaving={isSaving}
        onViewDetail={handleViewClick}
      />

      <ContentDetailModal
        isOpen={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        content={selectedContent}
        onEdit={handleEditClick}
        onApproveIdea={handleApproveIdea}
      />
    </div>
  );
}
