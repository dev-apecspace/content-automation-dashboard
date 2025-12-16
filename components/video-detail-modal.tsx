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
  Clock,
  Link,
  User,
  Calendar,
  Globe,
  Play,
  BarChart3,
  RefreshCw,
  Trash2,
  Eye,
  Film,
  MessageCircle,
  Target,
  Notebook,
  FileText,
  Captions,
  ThumbsUp,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { statusConfig, type VideoItem } from "@/lib/types";
import { projects } from "@/lib/mock-data";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { createActivityLog, getVideoItemById } from "@/lib/api";

interface VideoDetailModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  item?: VideoItem | null;
  content?: VideoItem | null;
  onApprove?: (item: VideoItem) => void;
  onEdit?: (item: VideoItem) => void;
}

export function VideoDetailModal({
  isOpen,
  onClose,
  onOpenChange,
  item,
  content,
  onApprove,
  onEdit,
}: VideoDetailModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentItem, setCurrentItem] = useState<VideoItem | null>(
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

    const item = await getVideoItemById(content.id);
    console.log("==== item: ", item);
    setCurrentItem(item);
  };

  const triggerEngagementTracker = async () => {
    setIsSpinning(true);

    try {
      const res = await fetch("/api/webhook/engagement-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postType: "video" }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Lỗi gọi AI lấy tương tác");
      } else {
        console.log("==== res: ", res);
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
          platform: currentItem.platform[0],
          project: currentItem.projectName,
        }),
      });
      if (!response.ok) {
        toast.error("Xóa bài đăng thất bại");
        throw new Error(await response.text());
      } else {
        await createActivityLog("remove-post", "video", currentItem.id, {
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange || onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <DialogTitle className="font-bold leading-tight pr-8">
            {currentItem.idea}
          </DialogTitle>
          <div className="space-y-3">
            {/* Các badge */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "border",
                  statusConfig[currentItem.status].className
                )}
              >
                {statusConfig[currentItem.status].label}
              </Badge>
              <Badge
                variant="outline"
                style={{
                  backgroundColor: `${project?.color}20`,
                  borderColor: project?.color,
                  color: project?.color,
                }}
              >
                {currentItem.projectName}
              </Badge>
              {Array.isArray(currentItem.platform) && (
                <>
                  {currentItem.platform.map((p) => (
                    <Badge
                      key={p}
                      variant="outline"
                      className="border-pink-300 text-pink-700"
                    >
                      {p}
                    </Badge>
                  ))}
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Thông tin</TabsTrigger>
            <TabsTrigger value="interaction">Thống kê</TabsTrigger>
            <TabsTrigger value="ai">AI phân tích</TabsTrigger>
          </TabsList>

          {/* Tab 1: Thông tin */}
          <TabsContent value="info" className="space-y-6 mt-6">
            <Card>
              <CardContent className="space-y-6">
                {/* Tiêu đề & Thời lượng */}
                <div className="flex items-start gap-3">
                  <Film className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <div className="text-sm text-muted-foreground">Tiêu đề</div>
                    <p className="font-medium">{currentItem.title || "-"}</p>
                  </div>
                </div>

                {/* Thời gian đăng */}
                <div className="flex items-center gap-4 pb-4 border-b">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Thời gian đăng
                    </p>
                    <p className="text-base font-medium">
                      {currentItem.postingTime || "-"}
                    </p>
                  </div>
                </div>

                {/* Caption */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Captions className="h-5 w-5 text-muted-foreground" />
                    <h4 className="font-semibold">Caption</h4>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {currentItem.caption || "Chưa có caption"}
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Thời lượng
                    </div>
                    <p className="font-medium">
                      {currentItem.videoDuration
                        ? `${currentItem.videoDuration}s`
                        : "-"}
                    </p>
                  </div>
                </div>

                {/* Video links */}
                {/* {currentItem.existingVideoLink && (
                  <div className="flex items-start gap-3">
                    <Play className="h-5 w-5 text-muted-foreground mt-1" />
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">
                        Link video có sẵn
                      </div>
                      <a
                        href={currentItem.existingVideoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline break-all"
                      >
                        {currentItem.existingVideoLink}
                      </a>
                    </div>
                  </div>
                )} */}

                {currentItem.videoLink && (
                  <div className="flex items-start gap-3">
                    <Play className="h-5 w-5 text-muted-foreground mt-1" />
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">
                        Video
                      </div>
                      <a
                        href={currentItem.videoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline break-all"
                      >
                        {currentItem.videoLink}
                      </a>
                    </div>
                  </div>
                )}

                {/* Ảnh */}
                {currentItem.imageLink && (
                  <div className="flex items-start gap-3">
                    <Eye className="h-5 w-5 text-muted-foreground mt-1" />
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">
                        Ảnh thumbnail
                      </div>
                      <a
                        href={currentItem.imageLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline break-all"
                      >
                        {currentItem.imageLink}
                      </a>
                      <img
                        src={currentItem.imageLink}
                        alt="Preview"
                        className="max-w-full h-72 mt-3 rounded-lg border border-gray-300 shadow-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Post URL */}
                {currentItem.postUrl && (
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground mt-1" />
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">
                        Link bài đăng
                      </div>
                      <a
                        href={currentItem.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Xem bài đăng
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Người duyệt
                    </div>
                    <div className="font-medium">
                      {currentItem.approvedBy || "-"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Thời gian duyệt
                    </div>
                    <div className="font-medium">
                      {formatDate(currentItem.approvedAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Thời gian tạo
                    </div>
                    <div className="font-medium">
                      {formatDate(currentItem.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Cập nhật cuối
                    </div>
                    <div className="font-medium">
                      {formatDate(currentItem.updatedAt)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Lượt tương tác */}
          <TabsContent value="interaction" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" /> Lượt tương tác
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={triggerEngagementTracker}
                    className="cursor-pointer"
                  >
                    <RefreshCw
                      className={`h-4 w-4 text-blue-500 ${
                        isSpinning ? "animate-spin" : ""
                      }`}
                    />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="p-4 border rounded-lg">
                    <Eye className="h-8 w-8 mx-auto text-black mb-2" />
                    <div className="text-2xl font-bold">
                      {currentItem.views ?? 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Views</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <ThumbsUp className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                    <div className="text-2xl font-bold">
                      {currentItem.reactions ?? 0}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Reactions
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <MessageCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
                    <div className="text-2xl font-bold">
                      {currentItem.comments ?? 0}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Comments
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <Share2 className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                    <div className="text-2xl font-bold">
                      {currentItem.shares ?? 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Shares</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Thời gian thống kê
                    </div>
                    <div className="font-medium">
                      {currentItem.statsAt
                        ? formatDate(currentItem.statsAt)
                        : "Chưa có dữ liệu"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: AI phân tích */}
          <TabsContent value="ai" className="space-y-6 mt-6">
            <Card>
              <CardContent className="space-y-6">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                      Chủ đề
                    </h4>
                    <p className="text-sm">
                      {currentItem.topic || "Chưa xác định"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-muted-foreground mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                      Đối tượng tiếp cận
                    </h4>
                    <p className="text-sm">
                      {currentItem.targetAudience || "Chưa xác định"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Notebook className="h-5 w-5 text-muted-foreground mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                      Lưu ý nghiên cứu
                    </h4>
                    <p className="text-sm">
                      {currentItem.researchNotes || "Chưa có ghi chú"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-8">
          {currentItem.status === "posted_successfully" && (
            <Button
              variant="outline"
              onClick={handleRemovePost}
              disabled={isLoading}
              className="text-red-500 hover:text-red-600 hover:bg-red-100 border-red-400 cursor-pointer"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
              {isLoading ? "Đang xóa..." : "Xóa bài đăng"}
            </Button>
          )}
          {currentItem.status === "awaiting_content_approval" && (
            <Button
              onClick={() => onApprove?.(currentItem)}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isLoading ? "Đang duyệt..." : "Duyệt"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
