"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  Edit,
  Edit2,
  Clock,
  Link,
  User,
  Calendar,
  Globe,
  MessageCircle,
  Share2,
  ThumbsUp,
  BarChart3,
  Target,
  Notebook,
  FileText,
  Captions,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { contentTypes, statusConfig, type ContentItem } from "@/lib/types";
import { projects } from "@/lib/mock-data";
import { format, set } from "date-fns";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { getContentItemById } from "@/lib/api/content-items";
import { se } from "date-fns/locale";
import { createActivityLog } from "@/lib/api";

interface ContentDetailModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  item?: ContentItem | null;
  content?: ContentItem | null;
  onApprove?: (item: ContentItem) => void;
  onEdit?: (item: ContentItem) => void;
}

export function ContentDetailModal({
  isOpen,
  onClose,
  onOpenChange,
  item,
  content,
  onApprove,
  onEdit,
}: ContentDetailModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentItem, setCurrentItem] = useState<ContentItem | null>(
    content ?? item ?? null
  );

  useEffect(() => {
    setCurrentItem(content ?? item ?? null);
  }, [content, item]);

  if (!currentItem) return null;

  const project = projects.find((p) => p.id === currentItem.projectId);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy HH:mm");
    } catch {
      return dateStr;
    }
  };

  const updatedItem = async () => {
    if (!content) return;

    const item = await getContentItemById(content.id);
    setCurrentItem(item);
  };

  const triggerEngagementTracker = async () => {
    setIsSpinning(true);

    try {
      const res = await fetch("/api/webhook/engagement-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postType: "content" }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Lỗi gọi AI lấy tương tác");
      } else {
        updatedItem();
        toast.success("Tương tác đã được cập nhật!");
      }
    } catch (error: any) {
      console.error("Lỗi khi gọi AI:", error);
      toast.error(error.message);
    } finally {
      setIsSpinning(false);
    }
  };

  const handleRemovePost = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/webhook/remove-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postUrl: currentItem.postUrl,
          platform: currentItem.platform,
          project: currentItem.projectName,
        }),
      });
      if (!response.ok) {
        toast.error("Xóa bài đăng thất bại");
        throw new Error(await response.text());
      } else {
        updatedItem();

        await createActivityLog("remove-post", "content", currentItem.id, {
          userId: "user_1",
          description: `Xóa bài đăng: ${currentItem.idea}`,
        });

        toast.success("Đã xóa bài đăng thành công");
      }
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Glassmorphism helper classes (Light Mode)
  const glassCardClass =
    "bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl shadow-sm hover:bg-white/60 transition-all duration-300";
  const glassTextClass = "text-slate-900";
  const glassTextMutedClass = "text-slate-600";
  const glassLabelClass =
    "text-slate-500 text-xs uppercase tracking-wider font-semibold";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange || onClose}>
      <DialogContent
        className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white/80 backdrop-blur-2xl border-white/60 shadow-2xl rounded-[32px] p-0 sm:max-w-5xl [&>button]:text-slate-600 [&>button]:hover:text-slate-900"
        showCloseButton={true}
      >
        {/* Vibrant Gradient Background Layer (Lighter/Pastel for Light Mode) */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#a8c0ff]/40 via-[#3f2b96]/10 to-[#ffafbd]/40 blur-3xl pointer-events-none" />

        <div className="p-8 relative z-10">
          <DialogHeader className="space-y-6">
            <DialogTitle className="text-2xl font-bold leading-tight pr-8 text-slate-900 tracking-wide">
              {currentItem.idea}
            </DialogTitle>
            <div className="space-y-3">
              {/* Các badge */}
              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  variant="outline"
                  className={cn(
                    "border-slate-200/60 bg-white/50 text-slate-700 backdrop-blur-sm px-3 py-1"
                  )}
                >
                  {statusConfig[currentItem.status].label}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-slate-200/60 bg-white/50 text-slate-700 backdrop-blur-sm px-3 py-1"
                >
                  {currentItem.projectName}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-slate-200/60 bg-white/50 text-slate-700 backdrop-blur-sm px-3 py-1"
                >
                  {contentTypes.find(
                    (type) => type.value === currentItem.contentType
                  )?.label || currentItem.contentType}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-slate-200/60 bg-white/50 text-slate-700 backdrop-blur-sm px-3 py-1 flex items-center gap-1"
                >
                  {/* We could use icons here if we want content type icons */}
                  {currentItem.platform}
                </Badge>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="info" className="w-full mt-8">
            <TabsList className="bg-slate-100/50 border border-white/50 p-1 rounded-xl w-full max-w-md mx-auto grid grid-cols-3 mb-8 shadow-inner">
              <TabsTrigger
                value="info"
                className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500 rounded-lg transition-all"
              >
                Thông tin
              </TabsTrigger>
              <TabsTrigger
                value="interaction"
                className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500 rounded-lg transition-all"
              >
                Tương tác
              </TabsTrigger>
              <TabsTrigger
                value="ai"
                className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500 rounded-lg transition-all"
              >
                AI Phân tích
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Thông tin */}
            <TabsContent
              value="info"
              className="space-y-6 focus-visible:outline-none"
            >
              <div className={cn(glassCardClass, "p-6")}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-2 rounded-full bg-white/60 shadow-sm text-blue-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={glassLabelClass}>Thời gian đăng</p>
                    <p className="text-lg font-medium text-slate-900">
                      {currentItem.postingTime || "-"}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Captions className="h-5 w-5 text-slate-500" />
                    <h4 className="font-semibold text-slate-900">Caption</h4>
                  </div>
                  <div className="bg-white/50 rounded-xl p-4 border border-white/60 shadow-inner">
                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {currentItem.caption || "Chưa có caption"}
                    </p>
                  </div>
                </div>

                {currentItem.imageLink && (
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-2 rounded-full bg-white/60 shadow-sm mt-1 text-blue-600">
                      <Link className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className={cn(glassLabelClass, "mb-2")}>
                        Ảnh đính kèm
                      </div>
                      <a
                        href={currentItem.imageLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 hover:underline break-all text-sm mb-3 block truncate"
                      >
                        {currentItem.imageLink}
                      </a>
                      <img
                        src={currentItem.imageLink}
                        alt="Preview"
                        className="max-h-[380px]"
                      />
                    </div>
                  </div>
                )}

                {currentItem.postUrl && (
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-white/60 shadow-sm text-blue-600">
                      <Globe className="h-4 w-4" />
                    </div>
                    <div>
                      <div className={glassLabelClass}>Link bài đăng</div>
                      <a
                        href={currentItem.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                      >
                        Truy cập bài viết
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={cn(glassCardClass, "p-4 flex items-center gap-4")}
                >
                  <div className="p-2 rounded-full bg-white/60 shadow-sm text-slate-600">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <div className={glassLabelClass}>Người duyệt</div>
                    <div className="font-medium text-slate-900">
                      {currentItem.approvedBy || "-"}
                    </div>
                  </div>
                </div>
                <div
                  className={cn(glassCardClass, "p-4 flex items-center gap-4")}
                >
                  <div className="p-2 rounded-full bg-white/60 shadow-sm text-slate-600">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <div className={glassLabelClass}>Thời gian duyệt</div>
                    <div className="font-medium text-slate-900">
                      {formatDate(currentItem.approvedAt)}
                    </div>
                  </div>
                </div>
                <div
                  className={cn(glassCardClass, "p-4 flex items-center gap-4")}
                >
                  <div className="p-2 rounded-full bg-white/60 shadow-sm text-slate-600">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <div className={glassLabelClass}>Thời gian tạo</div>
                    <div className="font-medium text-slate-900">
                      {formatDate(currentItem.createdAt)}
                    </div>
                  </div>
                </div>
                <div
                  className={cn(glassCardClass, "p-4 flex items-center gap-4")}
                >
                  <div className="p-2 rounded-full bg-white/60 shadow-sm text-slate-600">
                    <RefreshCw className="h-4 w-4" />
                  </div>
                  <div>
                    <div className={glassLabelClass}>Cập nhật cuối</div>
                    <div className="font-medium text-slate-900">
                      {formatDate(currentItem.updatedAt)}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: Lượt tương tác */}
            <TabsContent
              value="interaction"
              className="mt-6 focus-visible:outline-none"
            >
              <div className={cn(glassCardClass, "p-6")}>
                <div className="flex items-center justify-between mb-8 border-b border-slate-200/50 pb-4">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-6 w-6 text-slate-800" />
                    <span className="text-xl font-bold text-slate-900">
                      Thống kê hiệu quả
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={triggerEngagementTracker}
                    className="text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${
                        isSpinning ? "animate-spin" : ""
                      }`}
                    />
                    Cập nhật
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-6 text-center">
                  <div className="p-6 rounded-2xl bg-white/60 border border-white/60 shadow-sm hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3 text-blue-600">
                      <ThumbsUp className="h-6 w-6" />
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-1">
                      {currentItem.reactions ?? 0}
                    </div>
                    <div className="text-sm text-slate-500">Reactions</div>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/60 border border-white/60 shadow-sm hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3 text-green-600">
                      <MessageCircle className="h-6 w-6" />
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-1">
                      {currentItem.comments ?? 0}
                    </div>
                    <div className="text-sm text-slate-500">Comments</div>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/60 border border-white/60 shadow-sm hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3 text-purple-600">
                      <Share2 className="h-6 w-6" />
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-1">
                      {currentItem.shares ?? 0}
                    </div>
                    <div className="text-sm text-slate-500">Shares</div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 mt-8 text-slate-400 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Dữ liệu cập nhật lúc:{" "}
                    {currentItem.statsAt
                      ? formatDate(currentItem.statsAt)
                      : "Chưa có dữ liệu"}
                  </span>
                </div>
              </div>
            </TabsContent>

            {/* Tab 3: AI phân tích */}
            <TabsContent
              value="ai"
              className="space-y-6 mt-6 focus-visible:outline-none"
            >
              <div className={cn(glassCardClass, "p-6 space-y-6")}>
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-full bg-white/60 shadow-sm mt-1 text-slate-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className={cn(glassLabelClass, "mb-1")}>Chủ đề</h4>
                    <p className="text-slate-800 text-base leading-relaxed">
                      {currentItem.topic || "Chưa xác định"}
                    </p>
                  </div>
                </div>

                <div className="w-full h-px bg-slate-200/50" />

                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-full bg-white/60 shadow-sm mt-1 text-slate-600">
                    <Target className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className={cn(glassLabelClass, "mb-1")}>
                      Đối tượng tiếp cận
                    </h4>
                    <p className="text-slate-800 text-base leading-relaxed">
                      {currentItem.targetAudience || "Chưa xác định"}
                    </p>
                  </div>
                </div>

                <div className="w-full h-px bg-slate-200/50" />

                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-full bg-white/60 shadow-sm mt-1 text-slate-600">
                    <Notebook className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className={cn(glassLabelClass, "mb-1")}>
                      Lưu ý nghiên cứu
                    </h4>
                    <p className="text-slate-800 text-base leading-relaxed">
                      {currentItem.researchNotes || "Chưa có ghi chú"}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-10 border-t border-slate-200/50 pt-6">
            <Button
              variant="outline"
              onClick={() => onEdit?.(currentItem)}
              className="bg-white/50 hover:bg-white/80 border-slate-200 text-slate-700 hover:text-slate-900 backdrop-blur-sm"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Button>
            {currentItem.status === "posted_successfully" && (
              <Button
                variant="outline"
                onClick={handleRemovePost}
                disabled={isLoading}
                className="bg-red-50 hover:bg-red-100 border-red-200 text-red-600 hover:text-red-700 backdrop-blur-sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isLoading ? "Đang xóa..." : "Xóa bài đăng"}
              </Button>
            )}
            {currentItem.status === "awaiting_content_approval" && (
              <Button
                onClick={() => onApprove?.(currentItem)}
                disabled={isLoading}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white border-none shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isLoading ? "Đang duyệt..." : "Duyệt bài"}
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
