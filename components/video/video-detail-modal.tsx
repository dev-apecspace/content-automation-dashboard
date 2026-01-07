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
  Maximize2,
  SquareUser,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FeatureCard } from "@/components/ui/feature-card";
import { InfoCard } from "@/components/ui/info-card";
import { SectionLabel } from "@/components/ui/section-label";
import { BackgroundStyle } from "@/components/ui/background-style";
import {
  platformColors,
  statusConfig,
  type VideoItem,
  AIModel,
  CostLog,
  Account,
  Post,
} from "@/lib/types";
import { Project } from "@/lib/types";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { AccountService } from "@/lib/services/account-service";
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
  getAllUsers,
} from "@/lib/api";
import type { User as UserType } from "@/lib/api/users";
import { triggerEngagementTracker } from "@/lib/utils/engagement";

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
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [userList, setUserList] = useState<UserType[]>([]);

  useEffect(() => {
    setCurrentItem(content ?? item ?? null);
  }, [content, item]);

  // Load AI Models
  useEffect(() => {
    async function fetchModels() {
      try {
        const [models, accounts] = await Promise.all([
          getAIModels(),
          AccountService.getAccounts(),
        ]);
        setModelsList(models);
        setAllAccounts(accounts);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    }
    fetchModels();
  }, [isOpen]);

  // Load Users
  useEffect(() => {
    async function fetchUsers() {
      try {
        const users = await getAllUsers();
        setUserList(users);
      } catch (error) {
        console.error("Error loading users:", error);
      }
    }
    fetchUsers();
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

  const handleRefreshEngagement = async () => {
    setIsSpinning(true);

    try {
      await triggerEngagementTracker(currentItem.id);
      updatedItem();
      toast.success("Tương tác đã được cập nhật!");
    } catch (error: any) {
      console.error("Lỗi khi gọi AI:", error);
      toast.error(error.message);
    } finally {
      setIsSpinning(false);
    }
  };

  const handleRemovePost = async (post: Post) => {
    confirm("Bạn có chắc chắn muốn xóa bài đăng này?");
    setIsLoading(true);
    try {
      const response = await fetch("/api/webhook/remove-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: currentItem.id,
          postId: post.id,
          platform: post.platform,
          accountId: post.accountId,
          postUrl: post.postUrl,
        }),
      });
      if (!response.ok) {
        toast.error("Xóa bài đăng thất bại");
        throw new Error(await response.text());
      } else {
        await createActivityLog("remove-post", "video", currentItem.id, {
          userId: "user_1",
          description: `Xóa bài đăng: ${currentItem.idea} (${post.platform})`,
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange || onClose}>
      <DialogContent
        className="w-[1200px] max-w-[95vw] h-[90vh] p-0 gap-0 overflow-hidden flex flex-col"
        showCloseButton={true}
      >
        <BackgroundStyle />

        <DialogHeader className="p-8 pb-0 shrink-0 relative z-10 space-y-6">
          <DialogTitle className="text-2xl font-bold leading-tight pr-8 text-slate-900 tracking-wide">
            {currentItem.idea}
          </DialogTitle>
          <div className="space-y-3">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                variant="outline"
                className={cn(
                  "border-slate-200 bg-white text-slate-700 px-3 py-1",
                  statusConfig[currentItem.status].className
                )}
              >
                {statusConfig[currentItem.status].label}
              </Badge>
              <Badge
                variant="outline"
                style={{
                  backgroundColor: project?.color
                    ? `${project.color}15`
                    : undefined,
                  color: project?.color,
                  borderColor: project?.color
                    ? `${project.color}40`
                    : undefined,
                }}
                className="backdrop-blur-sm px-3 py-1"
              >
                {currentItem.projectName}
              </Badge>
              {Array.isArray(currentItem.platform) && (
                <>
                  {currentItem.platform.map((p) => (
                    <Badge
                      key={p}
                      variant="outline"
                      className={cn(
                        "backdrop-blur-sm px-3 py-1 flex items-center gap-1",
                        platformColors[p] ||
                          "bg-slate-50 text-slate-700 border-slate-200"
                      )}
                    >
                      {p}
                    </Badge>
                  ))}
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 relative z-10 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
            {/* Left Column (Metadata, AI, Stats, Posts) */}
            <div className="lg:col-span-5 space-y-6">
              {/* General Info */}
              <FeatureCard
                title="Thông tin chung"
                icon={Target}
                colorTheme="blue"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-2 rounded-full bg-blue-50 shadow-sm text-blue-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <SectionLabel>Thời gian đăng</SectionLabel>
                    <p className="text-md font-medium text-slate-900">
                      {currentItem.postingTime || "-"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="p-2 rounded-full bg-amber-50 shadow-sm text-amber-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <SectionLabel>Thời lượng</SectionLabel>
                    <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-white text-slate-700 border border-slate-200 text-sm font-medium shadow-sm">
                      {currentItem.videoDuration
                        ? `${currentItem.videoDuration}s`
                        : "-"}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 mb-4">
                  <div className="p-2 rounded-full bg-green-50 shadow-sm text-green-600 mt-1">
                    <SquareUser className="h-5 w-5" />
                  </div>
                  <div>
                    <SectionLabel>Tài khoản sẽ đăng</SectionLabel>
                    {currentItem.accountIds &&
                    currentItem.accountIds.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {allAccounts
                          .filter((acc) =>
                            (currentItem.accountIds || []).includes(acc.id)
                          )
                          .map((acc) => (
                            <Button
                              key={acc.id}
                              variant="outline"
                              size="sm"
                              className={`
                                                  h-auto py-1.5 px-3 text-sm font-medium rounded-lg border shadow-sm transition-all
                                                  ${
                                                    acc.channelLink
                                                      ? "cursor-pointer hover:-translate-y-0.5"
                                                      : "cursor-default"
                                                  }
                                                  bg-green-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300
                                              `}
                              onClick={() => {
                                if (acc.channelLink) {
                                  window.open(acc.channelLink, "_blank");
                                }
                              }}
                            >
                              <span>{acc.channelName}</span>
                              <span className="text-[10px] font-normal text-emerald-600/70 ml-1.5 opacity-80">
                                • {acc.platform}
                              </span>
                              {acc.channelLink && (
                                <Link className="w-3 h-3 ml-2 opacity-60" />
                              )}
                            </Button>
                          ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 italic mt-1">
                        Chưa chọn tài khoản
                      </p>
                    )}
                  </div>
                </div>

                {/* Cost Display */}
                {estimatedCost && !estimatedCost.isAvailable ? (
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-emerald-50 shadow-sm text-emerald-600">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <SectionLabel>Chi phí</SectionLabel>
                      <div className="inline-flex items-center gap-2">
                        <span className="font-medium text-slate-900 text-lg">
                          ${estimatedCost.total.toFixed(3)}
                        </span>
                        <span className="text-slate-500 text-sm">
                          (~
                          {(estimatedCost.total * 26000).toLocaleString(
                            "vi-VN"
                          )}
                          đ)
                        </span>
                      </div>
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
                            {(estimatedCost.breakdown.details.video.edit > 0 ||
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
                                    estimatedCost.breakdown.details.video.edit +
                                    estimatedCost.breakdown.details.audio.edit
                                  ).toFixed(3)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                ) : estimatedCost?.isAvailable ? (
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-white/60 shadow-sm text-blue-600">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <SectionLabel>Chi phí</SectionLabel>
                      <div className="font-medium text-blue-700 text-lg">
                        Video có sẵn
                      </div>
                    </div>
                  </div>
                ) : null}
              </FeatureCard>

              {/* Posts List */}
              <FeatureCard
                title="Danh sách bài đăng"
                icon={Globe}
                colorTheme="indigo"
              >
                <div className="space-y-3">
                  {currentItem.posts && currentItem.posts.length > 0 ? (
                    <div className="space-y-3">
                      {currentItem.posts.map((post) => (
                        <div
                          key={post.id}
                          className="flex flex-col gap-2 p-3 rounded-xl bg-blue-50/50 border border-blue-100 transition-all hover:bg-blue-50"
                        >
                          <div className="flex items-center justify-between gap-2">
                            {(() => {
                              const account = allAccounts.find(
                                (a) => a.id === post.accountId
                              );
                              return (
                                <span className="font-semibold text-sm text-slate-900 flex-1 truncate">
                                  {account ? (
                                    post.postUrl ? (
                                      <div className="flex items-center gap-2">
                                        <a
                                          href={post.postUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`hover:underline flex items-center gap-1.5 ${
                                            post.status === "removed"
                                              ? "text-gray-400 line-through"
                                              : "hover:text-blue-600"
                                          }`}
                                        >
                                          {account.channelName}
                                          <Link className="h-3.5 w-3.5 opacity-60" />
                                        </a>
                                        {post.status &&
                                          post.status !== "published" && (
                                            <span
                                              className={`text-[10px] px-1.5 py-0.5 rounded border capitalize ${
                                                post.status === "removed"
                                                  ? "bg-gray-100 text-gray-500 border-gray-200"
                                                  : "bg-blue-50 text-blue-600 border-blue-200"
                                              }`}
                                            >
                                              {post.status}
                                            </span>
                                          )}
                                      </div>
                                    ) : (
                                      account.channelName
                                    )
                                  ) : (
                                    post.platform
                                  )}
                                </span>
                              );
                            })()}

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full cursor-pointer"
                              onClick={() => handleRemovePost(post)}
                              title="Xóa bài đăng này"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex gap-3 text-xs text-slate-500 font-medium">
                            <span>Views: {post.views || 0}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300 transform translate-y-2"></span>
                            <span>Likes: {post.reactions || 0}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300 transform translate-y-2"></span>
                            <span>Cmts: {post.comments || 0}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300 transform translate-y-2"></span>
                            <span>Shares: {post.shares || 0}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-slate-500 italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      Chưa có bài đăng nào
                    </div>
                  )}
                </div>
              </FeatureCard>

              {/* Interaction & Stats */}
              <FeatureCard
                title="Hiệu quả"
                icon={BarChart3}
                colorTheme="teal"
                action={
                  currentItem.posts &&
                  currentItem.posts.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefreshEngagement}
                      className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer h-8 px-2"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 mr-1.5 ${
                          isSpinning ? "animate-spin" : ""
                        }`}
                      />
                      Cập nhật
                    </Button>
                  )
                }
              >
                <div className="grid grid-cols-4 gap-3 text-center mb-4">
                  {/* Stat Items */}
                  {[
                    {
                      icon: Eye,
                      color: "text-black-600",
                      bg: "bg-gray-200",
                      label: "Views",
                      value: (items: any[]) =>
                        items.reduce((acc, p) => acc + (p.views || 0), 0),
                    },
                    {
                      icon: ThumbsUp,
                      color: "text-blue-600",
                      bg: "bg-blue-100",
                      label: "Likes",
                      value: (items: any[]) =>
                        items.reduce((acc, p) => acc + (p.reactions || 0), 0),
                    },
                    {
                      icon: MessageCircle,
                      color: "text-green-600",
                      bg: "bg-green-100",
                      label: "Cmts",
                      value: (items: any[]) =>
                        items.reduce((acc, p) => acc + (p.comments || 0), 0),
                    },
                    {
                      icon: Share2,
                      color: "text-orange-600",
                      bg: "bg-orange-100",
                      label: "Shares",
                      value: (items: any[]) =>
                        items.reduce((acc, p) => acc + (p.shares || 0), 0),
                    },
                  ].map((stat, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center"
                    >
                      <div
                        className={`w-8 h-8 rounded-full ${stat.bg} flex items-center justify-center mb-1 ${stat.color}`}
                      >
                        <stat.icon className="h-4 w-4" />
                      </div>
                      <div className="text-lg font-bold text-slate-900">
                        {stat.value(currentItem.posts || [])}
                      </div>
                      <div className="text-xs text-slate-500">{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div className="text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/80 text-xs text-slate-500">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Cập nhật:{" "}
                      {currentItem.posts?.[0]?.statsAt
                        ? formatDate(currentItem.posts[0].statsAt)
                        : "Chưa có dữ liệu"}
                    </span>
                  </div>
                </div>
              </FeatureCard>

              {/* AI Analysis */}
              <FeatureCard
                title="Phân tích AI"
                icon={BarChart3}
                colorTheme="purple"
              >
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-full bg-purple-50 shadow-sm mt-1 text-slate-600">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <SectionLabel className="mb-1">Chủ đề</SectionLabel>
                      <p className="text-slate-800 text-sm leading-relaxed">
                        {currentItem.topic || (
                          <span className="text-slate-400 italic">
                            Chưa xác định
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="w-full h-px bg-slate-200/50" />

                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-full bg-blue-50 shadow-sm mt-1 text-slate-600">
                      <Target className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <SectionLabel className="mb-1">
                        Đối tượng tiếp cận
                      </SectionLabel>
                      <p className="text-slate-800 text-sm leading-relaxed line-clamp-4">
                        {currentItem.targetAudience || (
                          <span className="text-slate-400 italic">
                            Chưa xác định
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="w-full h-px bg-slate-200/50" />

                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-full bg-blue-50 shadow-sm mt-1 text-slate-600">
                      <Target className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <SectionLabel className="mb-1">
                        Lưu ý nghiên cứu
                      </SectionLabel>
                      <p className="text-slate-800 text-sm leading-relaxed line-clamp-4">
                        {currentItem.researchNotes || (
                          <span className="text-slate-400 italic">
                            Chưa xác định
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </FeatureCard>

              {/* System Info */}
              <div className="grid grid-cols-2 gap-4">
                <InfoCard className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-full bg-slate-100 shadow-sm text-slate-600">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="overflow-hidden">
                    <SectionLabel className="text-[10px]">
                      Người duyệt
                    </SectionLabel>
                    <div className="font-medium text-slate-900 truncate text-sm">
                      {userList.find((u) => u.id === currentItem.approvedBy)
                        ?.name ||
                        currentItem.approvedBy ||
                        "-"}
                    </div>
                  </div>
                </InfoCard>
                <InfoCard className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-full bg-slate-100 shadow-sm text-slate-600">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="overflow-hidden">
                    <SectionLabel className="text-[10px]">
                      Thời gian duyệt
                    </SectionLabel>
                    <div className="font-medium text-slate-900 truncate text-sm">
                      {formatDate(currentItem.approvedAt)}
                    </div>
                  </div>
                </InfoCard>
                <InfoCard className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-full bg-slate-100 shadow-sm text-slate-600">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="overflow-hidden">
                    <SectionLabel className="text-[10px]">
                      Ngày tạo
                    </SectionLabel>
                    <div className="font-medium text-slate-900 truncate text-sm">
                      {formatDate(currentItem.createdAt)}
                    </div>
                  </div>
                </InfoCard>
                <InfoCard className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-full bg-slate-100 shadow-sm text-slate-600">
                    <RefreshCw className="h-4 w-4" />
                  </div>
                  <div className="overflow-hidden">
                    <SectionLabel className="text-[10px]">
                      Cập nhật
                    </SectionLabel>
                    <div className="font-medium text-slate-900 truncate text-sm">
                      {formatDate(currentItem.updatedAt)}
                    </div>
                  </div>
                </InfoCard>
              </div>
            </div>

            {/* Right Column (Caption & Video) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Video Title - Only for Youtube Shorts */}
              {Array.isArray(currentItem.platform) &&
                currentItem.platform.includes("Youtube Shorts") && (
                  <FeatureCard
                    title="Tiêu đề Video"
                    icon={FileText}
                    colorTheme="rose"
                  >
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 shadow-inner">
                      <p className="text-slate-800 text-base font-medium leading-relaxed">
                        {currentItem.title || "Chưa có tiêu đề"}
                      </p>
                    </div>
                  </FeatureCard>
                )}

              {/* Caption */}
              <FeatureCard
                title="Caption"
                icon={Captions}
                colorTheme="amber"
                className="flex flex-col"
              >
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 shadow-inner min-h-[150px]">
                  <p className="text-slate-800 whitespace-pre-wrap leading-relaxed text-base font-normal">
                    {currentItem.caption || "Chưa có caption"}
                  </p>
                </div>
              </FeatureCard>

              {/* Video Player */}
              <FeatureCard
                title="Video"
                icon={Play}
                colorTheme="rose"
                className="flex flex-col"
              >
                {currentItem.videoLink ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="p-1.5 rounded-full bg-blue-50 text-blue-600">
                        <Link className="h-4 w-4" />
                      </div>
                      <a
                        href={currentItem.videoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline hover:text-blue-700 truncate flex-1"
                      >
                        {currentItem.videoLink}
                      </a>
                    </div>
                    <div className="bg-black rounded-xl overflow-hidden shadow-lg border border-slate-200 aspect-video relative group">
                      <video
                        src={currentItem.videoLink}
                        controls
                        className="w-full h-full"
                      >
                        Trình duyệt của bạn không hỗ trợ thẻ video.
                      </video>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    Chưa có video
                  </div>
                )}
              </FeatureCard>

              {/* Thumbnail Image */}
              <FeatureCard
                title="Thumbnail"
                icon={ImageIcon}
                colorTheme="purple"
                className="flex flex-col"
              >
                {currentItem.imageLink ? (
                  <div className="relative group rounded-xl overflow-hidden shadow-sm border border-slate-200 aspect-video bg-slate-100 hover:shadow-md transition-all max-w-md mx-auto">
                    <img
                      src={currentItem.imageLink}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                    <a
                      href={currentItem.imageLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-[2px]"
                    >
                      <div className="bg-white/20 p-2 rounded-full backdrop-blur-md">
                        <Maximize2 className="w-6 h-6" />
                      </div>
                    </a>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    Chưa có thumbnail
                  </div>
                )}
              </FeatureCard>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onEdit?.(currentItem)}
            className="mr-auto bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 shadow-sm"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Chỉnh sửa
          </Button>

          <div className="flex gap-2">
            {currentItem.status === "idea" && (
              <Button
                onClick={() => onApprove?.(currentItem)}
                disabled={isLoading}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white border-none shadow-lg shadow-cyan-500/20"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isLoading ? "Đang duyệt..." : "Duyệt ý tưởng"}
              </Button>
            )}

            {currentItem.status === "awaiting_content_approval" && (
              <Button
                onClick={() => onApprove?.(currentItem)}
                disabled={isLoading}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white border-none shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isLoading ? "Đang duyệt..." : "Duyệt video"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
