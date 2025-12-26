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
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
} from "@/lib/api";
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
      const targetUrl = post.postUrl;
      const response = await fetch("/api/webhook/remove-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postUrl: targetUrl,
          platform: post.platform,
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

  // Cost Calculation Logic
  const calculateEstimatedCost = () => {
    if (!currentItem) return null;

    // Check if there is an image to calculate cost for
    if (!currentItem.imageLink) return null;

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
    if (currentItem.imageLink) {
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
                    "border-slate-200/60 bg-white/50 text-slate-700 backdrop-blur-sm px-3 py-1",
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

                {/* --- Accounts Display --- */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-2 rounded-full bg-white/60 shadow-sm text-green-600 mt-1">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className={glassLabelClass}>Tài khoản sẽ đăng</h4>
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

                {/* Cost Display */}
                {estimatedCost && !estimatedCost.isAvailable ? (
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-2 rounded-full bg-white/60 shadow-sm text-emerald-600">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <div className={glassLabelClass}>Chi phí</div>
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
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-2 rounded-full bg-white/60 shadow-sm text-blue-600">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <div className={glassLabelClass}>Chi phí</div>
                      <div className="font-medium text-blue-700 text-lg">
                        Ảnh có sẵn
                      </div>
                    </div>
                  </div>
                ) : null}

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

                {/* Post URL List */}
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-full bg-white/60 shadow-sm text-blue-600 mt-1">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className={glassLabelClass}>Bài đăng</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRefreshEngagement}
                        className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer"
                        title="Cập nhật tương tác"
                      >
                        <RefreshCw
                          className={`h-3.5 w-3.5 ${
                            isSpinning ? "animate-spin" : ""
                          }`}
                        />
                      </Button>
                    </div>
                    {currentItem.posts && currentItem.posts.length > 0 ? (
                      <div className="flex flex-col gap-2 mt-1">
                        {currentItem.posts.map((post) => (
                          <div
                            key={post.id}
                            className="flex flex-col gap-1 p-2 rounded-lg bg-blue-50/50 border border-blue-100"
                          >
                            <div className="flex items-center justify-between gap-2">
                              {(() => {
                                const account = allAccounts.find(
                                  (a) => a.id === post.accountId
                                );
                                return (
                                  <span className="font-semibold text-xs text-slate-800 flex-1 truncate">
                                    {account ? (
                                      post.postUrl ? (
                                        <a
                                          href={post.postUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="hover:text-blue-600 hover:underline flex items-center gap-1"
                                        >
                                          {account.channelName}
                                          <Link className="h-3 w-3 opacity-50" />
                                        </a>
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
                                className="h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                onClick={() => handleRemovePost(post)}
                                title="Xóa bài đăng này"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            <div className="flex gap-2 text-[10px] text-gray-500">
                              <span>Views: {post.views || 0}</span>
                              <span>Likes: {post.reactions || 0}</span>
                              <span>Cmt: {post.comments || 0}</span>
                              <span>Share: {post.shares || 0}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 italic mt-1">
                        Chưa có bài đăng
                      </p>
                    )}
                  </div>
                </div>
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
                    onClick={handleRefreshEngagement}
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

                <div className="grid grid-cols-3 gap-6 text-center">
                  <div className="p-6 rounded-2xl bg-white/60 border border-white/60 shadow-sm hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3 text-blue-600">
                      <ThumbsUp className="h-6 w-6" />
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-1">
                      {(currentItem.posts || []).reduce(
                        (acc, p) => acc + (p.reactions || 0),
                        0
                      )}
                    </div>
                    <div className="text-sm text-slate-500">Reactions</div>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/60 border border-white/60 shadow-sm hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3 text-green-600">
                      <MessageCircle className="h-6 w-6" />
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-1">
                      {(currentItem.posts || []).reduce(
                        (acc, p) => acc + (p.comments || 0),
                        0
                      )}
                    </div>
                    <div className="text-sm text-slate-500">Comments</div>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/60 border border-white/60 shadow-sm hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3 text-purple-600">
                      <Share2 className="h-6 w-6" />
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-1">
                      {(currentItem.posts || []).reduce(
                        (acc, p) => acc + (p.shares || 0),
                        0
                      )}
                    </div>
                    <div className="text-sm text-slate-500">Shares</div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 mt-8 text-slate-400 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Dữ liệu cập nhật lúc:{" "}
                    {currentItem.posts?.[0]?.statsAt
                      ? formatDate(currentItem.posts[0].statsAt)
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
                      {currentItem.topic || (
                        <span className="text-slate-400 italic">
                          Chưa xác định
                        </span>
                      )}
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
                      {currentItem.targetAudience || (
                        <span className="text-slate-400 italic">
                          Chưa xác định
                        </span>
                      )}
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
                      {currentItem.researchNotes || (
                        <span className="text-slate-400 italic">
                          Chưa có ghi chú
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6 border-t border-slate-200/50 pt-6">
            <Button
              variant="outline"
              onClick={() => onEdit?.(currentItem)}
              className="bg-white/50 hover:bg-white/80 border-slate-200 text-slate-700 hover:text-slate-900 backdrop-blur-sm"
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
