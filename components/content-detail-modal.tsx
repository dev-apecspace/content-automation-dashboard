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
              <Badge
                variant="outline"
                className="border-emerald-300 text-emerald-700"
              >
                {contentTypes.find(
                  (type) => type.value === currentItem.contentType
                )?.label || currentItem.contentType}
              </Badge>
              <Badge
                variant="outline"
                className="border-blue-300 text-blue-700"
              >
                {currentItem.platform}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Thông tin</TabsTrigger>
            <TabsTrigger value="interaction">Lượt tương tác</TabsTrigger>
            <TabsTrigger value="ai">AI phân tích</TabsTrigger>
          </TabsList>

          {/* Tab 1: Thông tin */}
          <TabsContent value="info" className="space-y-6 mt-6">
            <Card>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
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

                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Captions className="h-5 w-5 text-muted-foreground" />
                    <h4 className="font-semibold">Caption</h4>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {currentItem.caption || "Chưa có caption"}
                  </p>
                </div>
                {currentItem.imageLink && (
                  <div className="flex items-start gap-3">
                    <Link className="h-5 w-5 text-muted-foreground mt-1" />
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">
                        Ảnh
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

                {currentItem.postUrl && (
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground mt-1" />
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">
                        Link post
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
                <div className="grid grid-cols-3 gap-4 text-center">
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
          <Button
            variant="outline"
            onClick={() => onEdit?.(currentItem)}
            className="text-blue-600 border-blue-200 hover:bg-blue-50 cursor-pointer"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Chỉnh sửa
          </Button>
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
