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
  Edit2,
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
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  platformColors,
  statusConfig,
  type VideoItem,
  AIModel,
  CostLog,
} from "@/lib/types";
import { Project } from "@/lib/types";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import {
  calculateVideoCost,
  calculateTotalCostFromLogs,
  analyzeCostLogs,
} from "@/lib/utils/cost";
import {
  createActivityLog,
  getVideoItemById,
  getAIModels,
  getProjects,
  getCostLogsByItem,
} from "@/lib/api";

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
  const [modelsList, setModelsList] = useState<AIModel[]>([]);
  const [costLogs, setCostLogs] = useState<CostLog[]>([]);
  const [projectList, setProjectList] = useState<Project[]>([]);

  useEffect(() => {
    setCurrentItem(content ?? item ?? null);
  }, [content, item]);

  // Load AI Models
  useEffect(() => {
    async function fetchModels() {
      try {
        const models = await getAIModels();
        setModelsList(models);
      } catch (error) {
        console.error("Error loading models:", error);
      }
    }
    fetchModels();
  }, [isOpen]);

  // Load Projects
  useEffect(() => {
    async function fetchProjects() {
      try {
        const projects = await getProjects();
        setProjectList(projects);
      } catch (error) {
        console.error("Error loading projects:", error);
      }
    }
    fetchProjects();
  }, [isOpen]);

  // Load Cost Logs
  useEffect(() => {
    async function fetchLogs() {
      if (!currentItem?.id) return;
      try {
        const logs = await getCostLogsByItem(currentItem.id, "video");
        setCostLogs(logs);
      } catch (error) {
        console.error("Error loading cost logs:", error);
      }
    }
    fetchLogs();
  }, [currentItem]);

  if (!currentItem) return null;

  const project = projectList.find((p) => p.id === currentItem.projectId);

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

  // Cost Calculation Logic
  const calculateEstimatedCost = () => {
    if (
      !currentItem ||
      !currentItem.videoDuration ||
      currentItem.videoDuration <= 0
    )
      return null;

    // Use Cost Logs if available
    if (costLogs.length > 0) {
      const analysis = analyzeCostLogs(costLogs);
      return {
        total: analysis.totalCost,
        breakdown: analysis, // Pass analysis dict, UI logic will handle it
        isReal: true,
      };
    }

    // Else if video exists but no logs => "Available"
    if (currentItem.videoLink) {
      return {
        total: 0,
        breakdown: "",
        isAvailable: true,
      };
    }

    /* Fallback
    const duration = currentItem.videoDuration;
    const videoModel = modelsList.find((m) => m.modelType === "video");
    const audioModel = modelsList.find((m) => m.modelType === "audio");
    return calculateVideoCost(videoModel, audioModel, duration);
    */
    return null;
  };

  const estimatedCost = calculateEstimatedCost();

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
        {/* Vibrant Gradient Background Layer */}
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
                    "border-slate-200/60 bg-white/50 text-slate-700 backdrop-blur-sm px-3 py-1",
                    statusConfig[currentItem.status].className
                  )}
                >
                  {statusConfig[currentItem.status].label}
                </Badge>
                <Badge
                  variant="outline"
                  style={{
                    backgroundColor: `${project?.color}15`,
                    borderColor: `${project?.color}40`,
                    color: project?.color,
                  }}
                  className="backdrop-blur-sm shadow-sm px-3 py-1"
                >
                  {currentItem.projectName}
                </Badge>
                {Array.isArray(currentItem.platform) && (
                  <>
                    {currentItem.platform.map((p) => (
                      <Badge
                        key={p}
                        variant="outline"
                        className={`border-slate-200/60 bg-white/50 text-slate-700 backdrop-blur-sm px-3 py-1 flex items-center gap-1 ${platformColors[p]}`}
                      >
                        {p}
                      </Badge>
                    ))}
                  </>
                )}
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="info" className="w-full mt-8">
            <TabsList className="bg-slate-100/50 border border-white/50 p-1 rounded-xl w-full max-w-md mx-auto grid grid-cols-3 mb-3 shadow-inner">
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
                Thống kê
              </TabsTrigger>
              <TabsTrigger
                value="ai"
                className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500 rounded-lg transition-all"
              >
                AI phân tích
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Thông tin */}
            <TabsContent
              value="info"
              className="space-y-6 focus-visible:outline-none"
            >
              <div className={cn(glassCardClass, "p-6")}>
                {/* Tiêu đề & Thời lượng */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-2 rounded-full bg-white/60 shadow-sm text-blue-600">
                    <Film className="h-5 w-5" />
                  </div>
                  <div>
                    <div className={glassLabelClass}>Tiêu đề</div>
                    <p className="font-medium text-slate-900 text-lg">
                      {currentItem.title || "-"}
                    </p>
                  </div>
                </div>

                {/* Thời gian đăng */}
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

                {/* Caption */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-full bg-white/60 shadow-sm text-blue-600">
                    <Captions className="h-5 w-5" />
                  </div>
                    <h4 className="font-semibold text-slate-900">Caption</h4>
                  </div>
                  <div className="bg-white/50 rounded-xl p-4 border border-white/60 shadow-inner">
                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {currentItem.caption || "Chưa có caption"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="p-2 rounded-full bg-white/60 shadow-sm text-blue-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <div className={glassLabelClass}>Thời lượng</div>
                    <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/50 text-slate-700 border border-white/60 text-sm font-medium shadow-sm">
                      {currentItem.videoDuration
                        ? `${currentItem.videoDuration}s`
                        : "-"}
                    </div>
                  </div>
                </div>

                {/* Cost Display */}
                {estimatedCost && !estimatedCost.isAvailable ? (
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-2 rounded-full bg-white/60 shadow-sm text-emerald-600">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <div className={glassLabelClass}>
                        {estimatedCost.isReal ? "Chi phí" : "Chi phí"}
                      </div>
                      <div className="inline-flex items-center gap-2">
                        <span className="font-medium text-slate-900 text-lg">
                          ${estimatedCost.total.toFixed(3)}
                        </span>
                        <span className="text-slate-500 text-sm">
                          (~{" "}
                          {(estimatedCost.total * 26000).toLocaleString(
                            "vi-VN"
                          )}{" "}
                          ₫ )
                        </span>
                        {/* Breakdown for Real Log */}
                        {estimatedCost.isReal &&
                          typeof estimatedCost.breakdown === "object" && (
                            <div className="flex flex-col gap-1 mt-1 text-xs text-slate-500">
                              {estimatedCost.breakdown.generateCost > 0 && (
                                <div className="flex justify-between gap-4">
                                  <span>Tạo mới:</span>
                                  <span>
                                    $
                                    {estimatedCost.breakdown.generateCost.toFixed(
                                      3
                                    )}
                                  </span>
                                </div>
                              )}
                              {(estimatedCost.breakdown.details.video.edit >
                                0 ||
                                estimatedCost.breakdown.details.audio.edit >
                                  0) && (
                                <div className="flex justify-between gap-4">
                                  <span>
                                    Chỉnh sửa (
                                    {Math.max(
                                      estimatedCost.breakdown.details.video
                                        .editCount,
                                      estimatedCost.breakdown.details.audio
                                        .editCount
                                    )}{" "}
                                    lần):
                                  </span>
                                  <span>
                                    $
                                    {(
                                      estimatedCost.breakdown.details.video
                                        .edit +
                                      estimatedCost.breakdown.details.audio.edit
                                    ).toFixed(3)}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                ) : estimatedCost?.isAvailable ? (
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-2 rounded-full bg-white/60 shadow-sm text-blue-600">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <div className={glassLabelClass}>Chi phí</div>
                      <div className="font-medium text-blue-700 text-lg">
                        Video có sẵn
                      </div>
                    </div>
                  </div>
                ) : null}

                {currentItem.videoLink && (
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-2 rounded-full bg-white/60 shadow-sm text-red-500">
                      <Play className="h-5 w-5" />
                    </div>
                    <div className="w-full">
                      <div className={cn(glassLabelClass, "mb-2")}>Video</div>
                      <div className="bg-black/5 rounded-xl border border-black/10 overflow-hidden">
                        <div className="p-3 bg-white/40 flex items-center justify-between">
                          <span className="text-sm text-slate-600 truncate max-w-[200px]">
                            {currentItem.videoLink}
                          </span>
                          <a
                            href={currentItem.videoLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-100 transition-colors font-medium"
                          >
                            Xem video
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ảnh */}
                {currentItem.imageLink && (
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-2 rounded-full bg-white/60 shadow-sm mt-1 text-blue-600">
                      <Eye className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className={cn(glassLabelClass, "mb-2")}>
                        Ảnh thumbnail
                      </div>
                      <div className="relative group overflow-hidden rounded-xl shadow-md border border-white/60">
                        <img
                          src={currentItem.imageLink}
                          alt="Preview"
                          className="w-full object-cover max-h-[400px] transition-transform duration-500 group-hover:scale-105"
                        />
                        <a
                          href={currentItem.imageLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4"
                        >
                          <span className="bg-white/90 text-slate-900 px-4 py-2 rounded-full text-sm font-medium shadow-lg backdrop-blur-sm">
                            Xem kích thước đầy đủ
                          </span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Post URL */}
                {currentItem.postUrl && (
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-white/60 shadow-sm text-blue-600">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <div className={glassLabelClass}>Link bài đăng</div>
                      <a
                        href={currentItem.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 hover:underline font-medium flex items-center gap-1"
                      >
                        Xem bài đăng <Share2 className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Metadata */}
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
                    <Clock className="h-4 w-4" />
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
                    <Clock className="h-4 w-4" />
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
              className="focus-visible:outline-none"
            >
              <div className={cn(glassCardClass, "p-6")}>
                <div className="flex items-center justify-between mb-2 border-b border-slate-200/50 pb-4">
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
                    className="text-slate-600 hover:text-slate-900 hover:bg-white/50 cursor-pointer"
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${
                        isSpinning ? "animate-spin" : ""
                      }`}
                    />
                    Cập nhật
                  </Button>
                </div>

                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="p-6 rounded-2xl bg-white/60 border border-white/60 shadow-sm hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-600">
                      <Eye className="h-6 w-6" />
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-1">
                      {currentItem.views ?? 0}
                    </div>
                    <div className="text-sm text-slate-500">Views</div>
                  </div>
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
              className="space-y-6 focus-visible:outline-none"
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

          <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-3 border-t border-slate-200/50 pt-6">
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
                {isLoading ? "Đang duyệt..." : "Duyệt nội dung"}
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
