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
  DollarSign,
  Maximize2,
  SquareUser,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FeatureCard } from "@/components/ui/feature-card";
import { InfoCard } from "@/components/ui/info-card";
import { SectionLabel } from "@/components/ui/section-label";
import { BackgroundStyle } from "@/components/ui/background-style";
import {
  contentTypes,
  statusConfig,
  ContentItem,
  AIModel,
  Project,
  platformColors,
  CostLog,
  Account,
  Post,
} from "@/lib/types";
import { AccountService } from "@/lib/services/account-service";
import { format, set } from "date-fns";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { getContentItemById } from "@/lib/api/content-items";
import { se } from "date-fns/locale";
import {
  createActivityLog,
  getVideoItemById,
  getAIModels,
  getProjects,
  getCostLogsByItem,
  getAllUsers,
} from "@/lib/api";
import type { User as UserType } from "@/lib/api/users";
import {
  calculateImageCost,
  calculateTotalCostFromLogs,
  analyzeCostLogs,
} from "@/lib/utils/cost";
import { triggerEngagementTracker } from "@/lib/utils/engagement";

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
  const [modelsList, setModelsList] = useState<AIModel[]>([]);
  const [costLogs, setCostLogs] = useState<CostLog[]>([]);
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [userList, setUserList] = useState<UserType[]>([]);

  useEffect(() => {
    setCurrentItem(content ?? item ?? null);
  }, [content, item]);

  // Load Accounts
  useEffect(() => {
    async function fetchAccounts() {
      try {
        const accounts = await AccountService.getAccounts();
        setAllAccounts(accounts);
      } catch (error) {
        console.error("Error loading accounts:", error);
      }
    }
    fetchAccounts();
  }, []);

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

  // Load Cost Logs
  useEffect(() => {
    async function fetchLogs() {
      if (!currentItem?.id) return;
      try {
        const logs = await getCostLogsByItem(currentItem.id, "content");
        setCostLogs(logs);
      } catch (error) {
        console.error("Error loading cost logs:", error);
      }
    }
    fetchLogs();
  }, [currentItem]);

  if (!currentItem) return null;

  const project = projectList.find((p) => p.id === currentItem.projectId);

  const selectedAccounts = allAccounts.filter((acc) =>
    (currentItem.accountIds || []).includes(acc.id)
  );

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
    if (!confirm("Bạn có chắc chắn muốn xóa bài đăng này?")) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/webhook/remove-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          itemId: currentItem.id,
          accountId: post.accountId,
          platform: post.platform,
          postUrl: post.postUrl,
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

  // Cost Calculation Logic
  const calculateEstimatedCost = () => {
    if (!currentItem) return null;

    // Check if there is an image to calculate cost for
    if (!currentItem.imageLinks) return null;

    // Use Cost Logs if available
    if (costLogs.length > 0) {
      const analysis = analyzeCostLogs(costLogs);
      return {
        total: analysis.totalCost,
        breakdown: analysis,
        isReal: true,
      };
    }

    // Else if image exists but no logs => "Available" (Cost = 0 or specific flag)
    if (currentItem.imageLinks && currentItem.imageLinks.length > 0) {
      // User requested: "không có thì hiển thị text ảnh/video có sẵn"
      // Return a flag to show text instead of price
      return {
        total: 0,
        isAvailable: true,
      };
    }

    /* Fallback to estimated (disabled as per user request to show "Available" if no logs)
    const imageModel = modelsList.find((m) => m.modelType === "image");
    if (!imageModel) return null;
    const cost = calculateImageCost(imageModel);
    return {
      total: cost,
    };
    */
    return null;
  };

  const estimatedCost = calculateEstimatedCost();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange || onClose}>
      <DialogContent className="" showCloseButton={true}>
        <BackgroundStyle />

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
                      : undefined, // 10% opacity
                    color: project?.color,
                    borderColor: project?.color
                      ? `${project.color}40`
                      : undefined,
                  }}
                  className="backdrop-blur-sm px-3 py-1"
                >
                  {currentItem.projectName}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn("backdrop-blur-sm px-3 py-1", {
                    "bg-purple-50 text-purple-700 border-purple-200":
                      currentItem.contentType === "product",
                    "bg-indigo-50 text-indigo-700 border-indigo-200":
                      currentItem.contentType === "brand",
                    "bg-slate-50 text-slate-700 border-slate-200":
                      currentItem.contentType === "other" ||
                      !currentItem.contentType,
                  })}
                >
                  {contentTypes.find(
                    (type) => type.value === currentItem.contentType
                  )?.label ||
                    currentItem.contentType ||
                    "Khác"}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    "backdrop-blur-sm px-3 py-1 flex items-center gap-1",
                    platformColors[currentItem.platform] ||
                      "bg-slate-50 text-slate-700 border-slate-200"
                  )}
                >
                  {/* We could use icons here if we want content type icons */}
                  {currentItem.platform}
                </Badge>
              </div>
            </div>
          </DialogHeader>

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

                <div className="flex items-start gap-4 mb-4">
                  <div className="p-2 rounded-full bg-green-50 shadow-sm text-green-600 mt-1">
                    <SquareUser className="h-5 w-5" />
                  </div>
                  <div>
                    <SectionLabel>Tài khoản sẽ đăng</SectionLabel>
                    {currentItem.accountIds &&
                    currentItem.accountIds.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedAccounts.map((acc) => (
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
                      {estimatedCost.isReal && estimatedCost.breakdown && (
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
                          {estimatedCost.breakdown.details.image.edit > 0 && (
                            <div className="flex justify-between gap-4">
                              <span>
                                Chỉnh sửa (
                                {
                                  estimatedCost.breakdown.details.image
                                    .editCount
                                }{" "}
                                lần):
                              </span>
                              <span>
                                $
                                {estimatedCost.breakdown.details.image.edit.toFixed(
                                  3
                                )}
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
                        Ảnh có sẵn
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
                            <span>View: {post.views || 0}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300 transform translate-y-2"></span>
                            <span>Like: {post.reactions || 0}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300 transform translate-y-2"></span>
                            <span>Cmt: {post.comments || 0}</span>
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
                <div className="grid grid-cols-3 gap-3 text-center mb-4">
                  {/* Stat Items */}
                  {[
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
                      color: "text-purple-600",
                      bg: "bg-purple-100",
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
                      <SectionLabel className="mb-1">Đối tượng</SectionLabel>
                      <p className="text-slate-800 text-sm leading-relaxed">
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
                    <div className="p-1.5 rounded-full bg-green-50 shadow-sm mt-1 text-slate-600">
                      <Notebook className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <SectionLabel className="mb-1">Lưu ý</SectionLabel>
                      <p className="text-slate-800 text-sm leading-relaxed">
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

            {/* Right Column (Caption & Images) */}
            <div className="lg:col-span-7 space-y-6">
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

              {/* Attachments */}

              <FeatureCard
                title={`Files đính kèm (${
                  currentItem.imageLinks?.length || 0
                })`}
                icon={Link}
                colorTheme="rose"
                className="flex flex-col"
              >
                {currentItem.imageLinks && currentItem.imageLinks.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {currentItem.imageLinks.map((link, index) => (
                      <div
                        key={index}
                        className="relative group rounded-xl overflow-hidden shadow-sm border border-white/60 aspect-video bg-slate-100 hover:shadow-md transition-all"
                      >
                        <img
                          src={link}
                          alt={`Attachment ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-[2px]"
                        >
                          <div className="bg-white/20 p-2 rounded-full backdrop-blur-md">
                            <Maximize2 className="w-6 h-6" />
                          </div>
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    Không có ảnh đính kèm
                  </div>
                )}
              </FeatureCard>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6 border-t border-slate-200/50 pt-6">
            <Button
              variant="outline"
              onClick={() => onEdit?.(currentItem)}
              className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 shadow-sm"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Button>

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
