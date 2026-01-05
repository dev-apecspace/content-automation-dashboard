import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Clock,
  Upload,
  X,
  CheckCircle2,
  Image as ImageIcon,
  Play,
  CheckCircle,
  Sparkles,
  DollarSign,
  SquareUser,
  Target,
  FileText,
  Captions,
  Calendar,
  RefreshCw,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getProjects, getAIModels } from "@/lib/api";
import { VideoItem, Project, AIModel, statusConfig } from "@/lib/types";
import { uploadImageFile, uploadVideoFile } from "@/app/api/cloudinary";
import { AiRequirementDialog } from "@/components/shared/ai-requirement-dialog";
import { getVideoItemById } from "@/lib/api/video-items";
import { toast } from "sonner";
import { calculateVideoCost } from "@/lib/utils/cost";
import { AccountService } from "@/lib/services/account-service";
import { Account, AccountPlatform } from "@/lib/types";
import { AccountSelector } from "@/components/shared/account-selector";
import { BackgroundStyle } from "@/components/ui/background-style";
import { FeatureCard } from "@/components/ui/feature-card";
import { SectionLabel } from "@/components/ui/section-label";
import { InfoCard } from "@/components/ui/info-card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface VideoFormModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  onSave: (item: Partial<VideoItem>) => void;
  onApproveIdea?: (item: VideoItem) => void;
  onApprove?: (item: VideoItem) => void;
  editVideo?: VideoItem | null;
  isSaving?: boolean;
  isLoading?: boolean;
  onViewDetail?: (item: VideoItem) => void;
}

export const VideoFormModal: React.FC<VideoFormModalProps> = ({
  isOpen,
  onClose,
  onOpenChange,
  onSave,
  onApproveIdea,
  onApprove,
  editVideo,
  isSaving,
  isLoading,
  onViewDetail,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [modelsList, setModelsList] = useState<AIModel[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [formData, setFormData] = useState<Partial<VideoItem>>({
    idea: "",
    projectId: "",
    platform: ["Facebook Reels"],
    title: "",
    videoDuration: undefined,
    existingVideoLink: "",
    videoLink: "",
    imageLink: undefined,
    postingTime: "",
    expectedPostDate: "", // Added to keep date separate
    caption: "",
    callToAction: "",
    topic: "",
    targetAudience: "",
    researchNotes: "",
    accountIds: [],
  });

  const [newImageLink, setNewImageLink] = useState("");

  const [aiPromptOpen, setAiPromptOpen] = useState(false);
  const [aiPromptType, setAiPromptType] = useState<
    "caption" | "schedule" | "image" | null
  >(null);
  const [aiPromptContent, setAiPromptContent] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Permissions Logic
  const currentStatus = editVideo?.status || "idea";
  const canEditIdeaFields = currentStatus === "idea";
  const canEditContentApprovalFields =
    currentStatus === "awaiting_content_approval" ||
    currentStatus === "content_approved" ||
    currentStatus === "post_removed";

  // Data Loading
  useEffect(() => {
    async function fetchData() {
      try {
        const [realProjects, models, accountsData] = await Promise.all([
          getProjects(),
          getAIModels(),
          AccountService.getAccounts(),
        ]);
        setProjects(realProjects);
        setModelsList(models);
        setAccounts(accountsData);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (editVideo) {
      setFormData({
        ...editVideo,
        expectedPostDate:
          editVideo.postingTime && editVideo.postingTime.includes("/")
            ? editVideo.postingTime.split(" ")[0].split("/").reverse().join("-")
            : "",
      });
    } else {
      setFormData({
        idea: "",
        projectId: "",
        platform: ["Facebook Reels"],
        title: "",
        videoDuration: undefined,
        existingVideoLink: "",
        videoLink: "",
        imageLink: undefined,
        postingTime: "",
        expectedPostDate: "",
        caption: "",
        callToAction: "",
        topic: "",
        targetAudience: "",
        researchNotes: "",
        accountIds: [],
      });
      setNewImageLink("");
    }
  }, [editVideo, isOpen]);

  const handleEditWithAI = (
    type: "caption" | "schedule" | "image",
    content?: string
  ) => {
    setAiPromptType(type);
    setAiPromptContent(content || "");
    setAiPromptOpen(true);
  };

  const handleConfirmAiEdit = async (
    requirement: string,
    imageAction?: "create" | "edit",
    duration?: number
  ) => {
    if (!aiPromptType) return;

    setIsAiLoading(true);
    try {
      const payload = {
        type: aiPromptType, // "caption" | "schedule" | "image"
        topic: formData.topic,
        content: formData.caption,
        contentType: "Video", // Explicitly Video
        projectId: formData.projectId,
        id: editVideo?.id,
        require: requirement,
        platform: formData.platform?.[0] || "Facebook Reels",
      };

      const res = await fetch("/api/webhook/edit-content-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("API request failed");

      toast.success("AI đã xử lý xong!");
      setAiPromptOpen(false);

      if (editVideo?.id) {
        const updatedItem = await getVideoItemById(editVideo.id);
        if (updatedItem) {
          setFormData((prev) => ({
            ...prev,
            caption: updatedItem.caption,
            postingTime: updatedItem.postingTime,
            expectedPostDate:
              updatedItem.postingTime && updatedItem.postingTime.includes(" ")
                ? updatedItem.postingTime
                    .split(" ")[0]
                    .split("/")
                    .reverse()
                    .join("-")
                : prev.expectedPostDate,
            idea: updatedItem.idea,
          }));
        }
      }
    } catch (error) {
      console.error("Lỗi gửi webhook:", error);
      toast.error("Gửi yêu cầu thất bại, vui lòng thử lại.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Cost Calculation
  const calculateEstimatedCost = () => {
    // Only calculate if in Idea phase
    if (!canEditIdeaFields) return null;

    if (formData.videoLink) {
      return {
        total: 0,
        modelName: "Video có sẵn",
        isFree: true,
      };
    }

    if (!formData.videoDuration || formData.videoDuration <= 0) return null;

    const duration = formData.videoDuration;
    const videoModel = modelsList.find(
      (m) => m.modelType === "video" && m.isActive
    );
    const audioModel = modelsList.find(
      (m) => m.modelType === "audio" && m.isActive
    );

    return {
      ...calculateVideoCost(videoModel, audioModel, duration),
      isFree: false,
    };
  };

  const estimatedCost = calculateEstimatedCost();

  const handleProjectChange = (value: string) => {
    const project = projects.find((p) => p.id === value);
    setFormData((prev) => ({
      ...prev,
      projectId: value,
      projectName: project?.name || "",
    }));
  };

  const handlePlatformToggle = (platform: string) => {
    if (!canEditIdeaFields) return; // Prevent toggle if readonly logic fails (though input is hidden)
    setFormData((prev) => {
      const currentPlatforms: any[] = Array.isArray(prev.platform)
        ? prev.platform
        : [];
      const updated = currentPlatforms.includes(platform)
        ? currentPlatforms.filter((item) => item !== platform)
        : [...currentPlatforms, platform];
      return { ...prev, platform: updated };
    });
  };

  const mapVideoPlatformToAccountPlatform = (
    videoPlatform: string
  ): AccountPlatform | null => {
    if (videoPlatform === "Facebook Reels") return "Facebook";
    if (videoPlatform === "Youtube Shorts") return "Youtube";
    if (videoPlatform === "Tiktok Video") return "Tiktok";
    return null;
  };

  const filteredAccounts = accounts.filter((acc) => {
    if (!formData.platform || formData.platform.length === 0) return false;
    const requiredPlatforms = formData.platform
      .map(mapVideoPlatformToAccountPlatform)
      .filter(Boolean) as AccountPlatform[];
    return requiredPlatforms.includes(acc.platform);
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const url = await uploadImageFile(file);
    if (url) {
      setFormData((prev) => ({ ...prev, imageLink: url }));
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const url = await uploadVideoFile(file);
    if (url) {
      setFormData((prev) => ({ ...prev, videoLink: url }));
    }
  };

  const updatePostingTime = (date: string, time: string) => {
    if (date && time) {
      const [year, month, day] = date.split("-");
      const formatted = `${day}/${month}/${year} ${time}`;
      setFormData((prev) => ({ ...prev, postingTime: formatted }));
    }
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  const handleClose = () => {
    onClose?.() || onOpenChange?.(false);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy HH:mm");
    } catch {
      return dateStr;
    }
  };

  // Render Helpers
  const renderEditableOrReadonly = (
    canEdit: boolean,
    editComponent: React.ReactNode,
    readonlyValue: React.ReactNode,
    placeholder: string = "Chưa có thông tin"
  ) => {
    if (canEdit) return editComponent;
    return (
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 shadow-inner min-h-[44px] flex items-center">
        <div className="text-slate-800 text-sm font-medium leading-relaxed w-full">
          {readonlyValue || (
            <span className="text-slate-400 italic">{placeholder}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange || handleClose}>
      <DialogContent className="">
        <BackgroundStyle />

        {/* Header */}
        <div className="px-8 pt-6 pb-4 relative z-10">
          <DialogHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold leading-tight pr-8 text-slate-900 tracking-wide">
                {editVideo ? "Chỉnh sửa Video" : "Tạo Video Mới"}
              </DialogTitle>
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  variant="outline"
                  className="border-slate-200 bg-white text-slate-700 px-3 py-1"
                >
                  {canEditIdeaFields && "Giai đoạn: Ý tưởng"}
                  {canEditContentApprovalFields && "Giai đoạn: Duyệt nội dung"}
                  {!canEditIdeaFields &&
                    !canEditContentApprovalFields &&
                    "Chế độ xem"}
                </Badge>
                {editVideo?.status && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "border-slate-200 bg-white text-slate-700 px-3 py-1",
                      statusConfig[editVideo.status]?.className
                    )}
                  >
                    {statusConfig[editVideo.status]?.label}
                  </Badge>
                )}
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-5 space-y-6">
              {/* General Info */}
              <FeatureCard
                title="Thông tin chung"
                icon={Target}
                colorTheme="blue"
              >
                <div className="space-y-4">
                  {/* Project */}
                  <div className="mb-4">
                    <SectionLabel className="mb-2">
                      Dự án <span className="text-red-500">*</span>
                    </SectionLabel>
                    {renderEditableOrReadonly(
                      canEditIdeaFields,
                      <Select
                        value={formData.projectId}
                        onValueChange={handleProjectChange}
                      >
                        <SelectTrigger className="bg-white border-slate-200">
                          <SelectValue placeholder="Chọn dự án" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>,
                      formData.projectName ? (
                        <div>
                          {formData.projectName}
                        </div>
                      ) : null,
                      "Chưa chọn dự án"
                    )}
                  </div>

                  {/* Platform */}
                  <div className="mb-4">
                    <SectionLabel className="mb-2">Nền tảng</SectionLabel>
                    {renderEditableOrReadonly(
                      canEditIdeaFields,
                      <div className="flex flex-wrap gap-3">
                        {[
                          "Facebook Reels",
                          "Youtube Shorts",
                          "Tiktok Video",
                        ].map((p) => (
                          <div
                            key={p}
                            className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
                          >
                            <Checkbox
                              id={`p-${p}`}
                              checked={formData.platform?.includes(p)}
                              onCheckedChange={() => handlePlatformToggle(p)}
                              className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                            <Label
                              htmlFor={`p-${p}`}
                              className="text-sm cursor-pointer font-medium text-slate-700"
                            >
                              {p}
                            </Label>
                          </div>
                        ))}
                      </div>,
                      <div className="flex flex-wrap gap-2">
                        {formData.platform?.map((p) => (
                          <span
                            key={p}
                          >
                            {p}
                          </span>
                        ))}
                      </div>,
                      "Chưa chọn nền tảng"
                    )}
                  </div>

                  {/* Idea */}
                  <div>
                    <SectionLabel>Ý tưởng</SectionLabel>
                    {renderEditableOrReadonly(
                      canEditIdeaFields,
                      <Textarea
                        value={formData.idea || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            idea: e.target.value,
                          }))
                        }
                        placeholder="Nhập ý tưởng video..."
                        className="min-h-[100px] bg-white"
                      />,
                      formData.idea
                    )}
                  </div>

                  {/* Posting Time */}
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-blue-50 shadow-sm text-blue-600">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <SectionLabel>Thời gian đăng</SectionLabel>
                        {canEditContentApprovalFields && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleEditWithAI("schedule", formData.postingTime)
                            }
                            className="h-6 text-[14px] px-2 text-blue-600 hover:bg-blue-50 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 mr-1" /> AI xếp lịch
                          </Button>
                        )}
                      </div>
                      {renderEditableOrReadonly(
                        canEditContentApprovalFields,
                        <div className="flex gap-2">
                          <Input
                            type="date"
                            value={formData.expectedPostDate || ""}
                            onChange={(e) => {
                              setFormData((prev) => ({
                                ...prev,
                                expectedPostDate: e.target.value,
                              }));
                              updatePostingTime(
                                e.target.value,
                                formData.postingTime?.split(" ")[1] || ""
                              );
                            }}
                            className="h-9 bg-white"
                          />
                          <Input
                            type="time"
                            value={formData.postingTime?.split(" ")[1] || ""}
                            onChange={(e) =>
                              updatePostingTime(
                                formData.expectedPostDate || "",
                                e.target.value
                              )
                            }
                            className="h-9 bg-white"
                          />
                        </div>,
                        formData.postingTime,
                        "Chưa đặt lịch"
                      )}
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-amber-50 shadow-sm text-amber-600">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <SectionLabel>Thời lượng (giây)</SectionLabel>
                      {renderEditableOrReadonly(
                        canEditIdeaFields,
                        <Input
                          type="number"
                          value={formData.videoDuration || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              videoDuration: e.target.value
                                ? parseInt(e.target.value)
                                : undefined,
                            }))
                          }
                          placeholder="VD: 60"
                          className="h-9 bg-white"
                        />,
                        formData.videoDuration
                          ? `${formData.videoDuration}s`
                          : null,
                        "Chưa có thời lượng"
                      )}
                    </div>
                  </div>

                  {/* Accounts */}
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-full bg-green-50 shadow-sm text-green-600 mt-1">
                      <SquareUser className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <SectionLabel>Tài khoản</SectionLabel>
                      {renderEditableOrReadonly(
                        canEditContentApprovalFields,
                        <AccountSelector
                          accounts={filteredAccounts}
                          selectedIds={formData.accountIds || []}
                          onChange={(ids) =>
                            setFormData((prev) => ({
                              ...prev,
                              accountIds: ids,
                            }))
                          }
                          currentProjectId={formData.projectId}
                          placeholder="Chọn tài khoản..."
                        />,
                        <div className="flex flex-wrap gap-2">
                          {filteredAccounts
                            .filter((acc) =>
                              formData.accountIds?.includes(acc.id)
                            )
                            .map((acc) => (
                              <span
                                key={acc.id}
                                className="px-2 py-1 bg-green-50 text-emerald-700 text-xs rounded border border-emerald-200"
                              >
                                {acc.channelName} ({acc.platform})
                              </span>
                            ))}
                          {(!formData.accountIds ||
                            formData.accountIds.length === 0) && (
                            <span className="text-slate-400 italic text-sm">
                              Chưa chọn tài khoản
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cost Display */}
                  {canEditIdeaFields && estimatedCost && (
                    <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <div className="p-2 rounded-full bg-emerald-50 shadow-sm text-emerald-600">
                        <DollarSign className="h-5 w-5" />
                      </div>
                      <div>
                        <SectionLabel>Chi phí ước tính</SectionLabel>
                        {estimatedCost.isFree ? (
                          <span className="text-emerald-600 font-medium text-sm">
                            Miễn phí (Video có sẵn)
                          </span>
                        ) : (
                          <div className="flex items-baseline gap-2">
                            <span className="font-bold text-slate-900">
                              ${estimatedCost.total.toFixed(3)}
                            </span>
                            <span className="text-slate-500 text-xs">
                              (~
                              {(estimatedCost.total * 26000).toLocaleString(
                                "vi-VN"
                              )}
                              đ)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </FeatureCard>

              <FeatureCard
                title="Phân tích AI"
                icon={Sparkles}
                colorTheme="purple"
              >
                <div className="space-y-4">
                  {/* Topic */}
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-full bg-purple-50 shadow-sm mt-1 text-slate-600">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <SectionLabel className="mb-1">Chủ đề</SectionLabel>
                      {renderEditableOrReadonly(
                        false,
                        null,
                        formData.topic,
                        "Chưa xác định"
                      )}
                    </div>
                  </div>
                  <div className="w-full h-px bg-slate-200/50" />
                  {/* Target Audience */}
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-full bg-blue-50 shadow-sm mt-1 text-slate-600">
                      <Target className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <SectionLabel className="mb-1">
                        Đối tượng mục tiêu
                      </SectionLabel>
                      {renderEditableOrReadonly(
                        false,
                        null,
                        formData.targetAudience,
                        "Chưa xác định"
                      )}
                    </div>
                  </div>
                  <div className="w-full h-px bg-slate-200/50" />
                  {/* Research Notes */}
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-full bg-blue-50 shadow-sm mt-1 text-slate-600">
                      <Target className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <SectionLabel className="mb-1">
                        Lưu ý nghiên cứu
                      </SectionLabel>
                      {renderEditableOrReadonly(
                        false,
                        null,
                        formData.researchNotes,
                        "Chưa có ghi chú"
                      )}
                    </div>
                  </div>
                </div>
              </FeatureCard>

              {/* System Info (Static) */}
              {editVideo && (
                <div className="grid grid-cols-2 gap-4">
                  <InfoCard className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-full bg-slate-100 shadow-sm text-slate-600">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="overflow-hidden">
                      <SectionLabel className="text-[10px]">
                        Ngày tạo
                      </SectionLabel>
                      <div className="font-medium text-slate-900 truncate text-sm">
                        {formatDate(editVideo.createdAt)}
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
                        {formatDate(editVideo.updatedAt)}
                      </div>
                    </div>
                  </InfoCard>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="lg:col-span-7 space-y-6">
              {/* Title (Specific to Youtube) */}
              {formData.platform?.includes("Youtube Shorts") && (
                <FeatureCard
                  title="Tiêu đề Video"
                  icon={FileText}
                  colorTheme="rose"
                >
                  {renderEditableOrReadonly(
                    canEditContentApprovalFields,
                    <Input
                      value={formData.title || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Nhập tiêu đề video..."
                      className="bg-white"
                    />,
                    formData.title,
                    "Chưa có tiêu đề"
                  )}
                </FeatureCard>
              )}

              {/* Caption */}
              <FeatureCard
                title="Caption"
                icon={Captions}
                colorTheme="amber"
                className="flex flex-col"
                action={
                  canEditContentApprovalFields && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleEditWithAI("caption", formData.caption)
                      }
                      className="text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" /> AI Viết lại
                    </Button>
                  )
                }
              >
                {renderEditableOrReadonly(
                  canEditContentApprovalFields,
                  <Textarea
                    value={formData.caption || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        caption: e.target.value,
                      }))
                    }
                    placeholder="Nhập caption..."
                    className="bg-white min-h-[200px]"
                  />,
                  <p className="whitespace-pre-wrap">{formData.caption}</p>,
                  "Chưa có caption"
                )}
              </FeatureCard>

              {/* Video Media */}
              <FeatureCard
                title="Video"
                icon={Play}
                colorTheme="rose"
                className="flex flex-col"
              >
                <div className="space-y-4">
                  {canEditIdeaFields && (
                    <div className="flex gap-3">
                      <Input
                        placeholder="Dán link video..."
                        value={formData.videoLink || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            videoLink: e.target.value,
                          }))
                        }
                        className="flex-1 bg-white"
                      />
                      <label>
                        <Button
                          type="button"
                          variant="outline"
                          className="bg-white"
                          onClick={() =>
                            document.getElementById("video-upload")?.click()
                          }
                        >
                          <Upload className="w-4 h-4" />
                        </Button>
                        <input
                          id="video-upload"
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={handleVideoUpload}
                        />
                      </label>
                    </div>
                  )}

                  {formData.videoLink ? (
                    <div className="relative group rounded-xl overflow-hidden shadow-lg border border-slate-200 aspect-video bg-black">
                      <video
                        src={formData.videoLink}
                        controls
                        className="w-full h-full"
                      />
                      {canEditIdeaFields && (
                        <button
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, videoLink: "" }))
                          }
                          className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      Chưa có video
                    </div>
                  )}
                </div>
              </FeatureCard>

              {/* Thumbnail Image */}
              <FeatureCard
                title="Thumbnail"
                icon={ImageIcon}
                colorTheme="purple"
                className="flex flex-col"
              >
                <div className="space-y-4">
                  {canEditIdeaFields && (
                    <div className="flex gap-3">
                      <Input
                        placeholder="Dán link ảnh..."
                        value={newImageLink}
                        onChange={(e) => {
                          setNewImageLink(e.target.value);
                          if (e.target.value)
                            setFormData((prev) => ({
                              ...prev,
                              imageLink: e.target.value,
                            }));
                        }}
                        className="flex-1 bg-white"
                      />
                      <label>
                        <Button
                          type="button"
                          variant="outline"
                          className="bg-white"
                          onClick={() =>
                            document.getElementById("image-upload")?.click()
                          }
                        >
                          <Upload className="w-4 h-4" />
                        </Button>
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>
                  )}

                  {formData.imageLink ? (
                    <div className="relative group rounded-xl overflow-hidden shadow-lg border border-slate-200 aspect-video bg-slate-100">
                      <img
                        src={formData.imageLink}
                        alt="Thumbnail w-full h-full object-cover"
                      />
                      {canEditIdeaFields && (
                        <button
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              imageLink: undefined,
                            }));
                            setNewImageLink("");
                          }}
                          className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      Chưa có thumbnail
                    </div>
                  )}
                </div>
              </FeatureCard>
            </div>
          </div>
        </div>

        <DialogFooter className="">
          {editVideo && onViewDetail ? (
            <Button
              variant="ghost"
              onClick={() => onViewDetail(editVideo)}
              className="mr-auto text-slate-600 hover:text-blue-600 hover:bg-blue-50"
            >
              <Eye className="w-4 h-4 mr-2" />
              Xem chi tiết
            </Button>
          ) : (
            <div className="mr-auto"></div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Hủy
            </Button>

            {canEditIdeaFields && (
              <Button
                onClick={handleSubmit}
                disabled={isSaving || !formData.idea || !formData.projectId}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25"
              >
                {isSaving ? "Đang cập nhật..." : "Cập nhật"}
              </Button>
            )}

            {onApproveIdea && canEditIdeaFields && (
              <Button
                onClick={() => editVideo && onApproveIdea(editVideo)}
                variant="default"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
              >
                Duyệt ý tưởng
              </Button>
            )}

            {canEditContentApprovalFields && (
              <Button
                onClick={handleSubmit}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSaving ? "Đang cập nhật..." : "Cập nhật"}
              </Button>
            )}

            {onApprove && canEditContentApprovalFields && (
              <Button
                onClick={() => editVideo && onApprove(editVideo)}
                disabled={isLoading}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"
              >
                {isLoading ? "Đang xử lý..." : "Duyệt Video"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>

      <AiRequirementDialog
        isOpen={aiPromptOpen}
        onClose={() => setAiPromptOpen(false)}
        type={aiPromptType}
        initialRequirement=""
        hasImage={false}
        onConfirm={handleConfirmAiEdit}
        isLoading={isAiLoading}
      />
    </Dialog>
  );
};
