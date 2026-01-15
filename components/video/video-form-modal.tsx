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
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  Layers,
  CalendarClock,
  Folder,
  BookOpen,
} from "lucide-react";
import { useTourStore } from "@/hooks/use-tour-store";
import { videoFormSteps } from "@/lib/tour-steps";
import { Badge } from "@/components/ui/badge";
import { getProjects, getAIModels } from "@/lib/api";
import {
  VideoItem,
  Project,
  AIModel,
  statusConfig,
  Platform,
  VideoPlatform,
  VIDEO_PLATFORMS,
} from "@/lib/types";
import { uploadImageFile, uploadVideoFile } from "@/app/api/cloudinary";
import { AiRequirementDialog } from "@/components/shared/ai-requirement-dialog";
import {
  getVideoItemById,
  postVideoNow,
  updateVideoItem,
  createVideoItem,
  approveVideoContent,
} from "@/lib/api/video-items";
import { formatManualPostTimestamp, formatPostDate } from "@/lib/utils/date";
import { toast } from "sonner";
import { calculateVideoCost } from "@/lib/utils/cost";
import { AccountService } from "@/lib/services/account-service";
import { Account, AccountPlatform } from "@/lib/types";
import { AccountSelector } from "@/components/shared/account-selector";
import { BackgroundStyle } from "@/components/ui/background-style";
import { FeatureCard } from "@/components/ui/feature-card";
import { SectionLabel } from "@/components/ui/section-label";
import { InfoCard } from "@/components/ui/info-card";
import { cn, countCharacters } from "@/lib/utils";
import { format } from "date-fns";
import { MultiSelect, Option } from "@/components/ui/multi-select";
import { videoPlatformIcons } from "@/components/shared/platform-icons";

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
  const [modelsList, setModelsList] = useState<AIModel[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const { startTour } = useTourStore();

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
  const [postMode, setPostMode] = useState<"schedule" | "now">("schedule");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const projectColorMap = React.useMemo(() => {
    return projects.reduce((acc, p) => {
      acc[p.id] = p.color;
      return acc;
    }, {} as Record<string, string>);
  }, [projects]);

  // Permissions Logic
  const currentStatus = editVideo?.status || "idea";
  const canEditIdeaFields = currentStatus === "idea";
  const canEditContentApprovalFields =
    currentStatus === "awaiting_content_approval" ||
    currentStatus === "content_approved" ||
    currentStatus === "post_removed";

  const isManualMode = formData.idea?.includes("Nội dung được tạo thủ công");

  const isReadyToPostOrSchedule =
    !!formData.idea?.trim() &&
    !!formData.projectId &&
    !!formData.platform &&
    formData.platform.length > 0 &&
    !!formData.accountIds &&
    formData.accountIds.length > 0 &&
    !!formData.videoDuration &&
    formData.videoDuration > 0 &&
    !!formData.caption?.trim() &&
    !!formData.videoLink &&
    (formData.platform.includes("Youtube Shorts")
      ? !!formData.title?.trim()
      : true) &&
    (postMode === "now" || !!formData.postingTime);

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
        platform: Array.isArray(editVideo.platform)
          ? (editVideo.platform as VideoPlatform[])
          : [editVideo.platform as unknown as VideoPlatform],
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
        videoDuration: 5,
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
        platform:
          (formData.platform as VideoPlatform[])?.[0] || "Facebook Reels",
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

  // ------------------- XỬ LÝ PLATFORM -------------------
  const platformOptions: Option[] = VIDEO_PLATFORMS.map((p) => ({
    label: p,
    value: p,
    icon: videoPlatformIcons[p],
  }));

  const handlePlatformChange = (values: string[]) => {
    if (!canEditIdeaFields) return;

    setFormData((prev) => ({
      ...prev,
      platform: values as VideoPlatform[],
    }));
  };

  const mapVideoPlatformToAccountPlatform = (
    videoPlatform: VideoPlatform
  ): AccountPlatform | null => {
    if (videoPlatform === "Facebook Reels") return "Facebook";
    if (videoPlatform === "Youtube Shorts") return "Youtube";
    if (videoPlatform === "Tiktok Video") return "Tiktok";
    if (videoPlatform === "Zalo Video") return "Zalo";
    if (videoPlatform === "Instagram Reels") return "Instagram";
    if (videoPlatform === "LinkedIn Video") return "Linkedin";
    if (videoPlatform === "Threads Video") return "Threads";
    if (videoPlatform === "X Tweet Video") return "X";
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

  const processSingleItem = async (
    id: string | undefined,
    data: Partial<VideoItem>,
    mode: "now" | "schedule"
  ) => {
    let itemId = id;
    let itemData = { ...data };

    // Nếu chọn Đăng ngay, tự động set thời gian là hiện tại
    if (mode === "now") {
      itemData.postingTime = formatPostDate();
    }

    // 1. Create or Update Item
    if (itemId) {
      const updated = await updateVideoItem(itemId, itemData);
      itemData = updated;
    } else {
      const created = await createVideoItem(itemData as any);
      itemId = created.id;
      itemData = created;
    }

    if (!itemId) throw new Error("Không lấy được ID video");

    // 2. Action based on mode
    if (mode === "now") {
      await postVideoNow(itemId);
    } else {
      // Schedule
      const scheduleRes = await fetch("/api/webhook/schedule-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posting_time: itemData.postingTime,
          platform: itemData.platform?.[0], // Should be single platform now
        }),
      });

      if (!scheduleRes.ok) {
        throw new Error(
          "Lỗi gọi webhook lên lịch: " + (await scheduleRes.text())
        );
      }

      await approveVideoContent(itemId);
    }
  };

  const handleProcessContent = async (mode: "now" | "schedule") => {
    setIsSubmitting(true);
    try {
      const platforms = (formData.platform as VideoPlatform[]) || [];
      const isManual = formData.idea?.includes("Nội dung được tạo thủ công");

      if (isManual && platforms.length > 1) {
        // --- MULTI-PLATFORM SPLIT LOGIC ---
        await Promise.all(
          platforms.map(async (platform, index) => {
            // For the first platform, reuse the existing ID if editing
            // For subsequent platforms, force create new (id = undefined)
            const targetId = index === 0 ? editVideo?.id : undefined;

            // Filter accounts for THIS platform
            const targetPlatformType =
              mapVideoPlatformToAccountPlatform(platform);
            const targetAccountIds =
              formData.accountIds?.filter((accId) => {
                const acc = accounts.find((a) => a.id === accId);
                return acc?.platform === targetPlatformType;
              }) || [];

            const singlePlatformData = {
              ...formData,
              platform: [platform],
              accountIds: targetAccountIds,
            };

            await processSingleItem(targetId, singlePlatformData, mode);
          })
        );
        toast.success(
          mode === "now"
            ? "Đã đăng video lên các nền tảng!"
            : "Đã lên lịch đăng video cho các nền tảng!"
        );
      } else {
        // --- ORIGINAL SINGLE LOGIC ---
        await processSingleItem(editVideo?.id, formData, mode);
        toast.success(
          mode === "now" ? "Đang đăng video..." : "Đã lên lịch đăng video!"
        );
      }

      handleClose();
    } catch (error: any) {
      console.error(error);
      toast.error(`Thất bại: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange || handleClose}>
      <DialogContent
        className="w-[1200px] max-w-[95vw] h-[90vh] p-0 gap-0 overflow-hidden flex flex-col"
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest(".tour-overlay-container")) {
            e.preventDefault();
          }
        }}
      >
        <BackgroundStyle />

        {/* Header */}
        <DialogHeader className="pl-6 pr-12 py-4 shrink-0 relative z-10 bg-blue-50/80 border-b-2 border-slate-300 backdrop-blur-md">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-lg font-bold leading-tight text-blue-800 tracking-wide flex items-center gap-8">
              {editVideo ? "Chỉnh sửa Video" : "Tạo Video Mới"}
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-orange-200 bg-white text-slate-700 px-2.5 py-0.5 text-xs font-normal"
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
                      "border-slate-200 bg-white text-slate-700 px-2.5 py-0.5 text-xs font-normal",
                      statusConfig[editVideo.status]?.className
                    )}
                  >
                    {statusConfig[editVideo.status]?.label}
                  </Badge>
                )}
              </div>
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => startTour(videoFormSteps)}
              className="gap-2 bg-white/60 hover:bg-white text-blue-600 border-blue-200 shadow-sm ml-auto"
            >
              <BookOpen className="h-4 w-4" />
              Hướng dẫn
            </Button>
          </div>
        </DialogHeader>

        <div className="px-8 my-4 relative z-10 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-5 space-y-6">
              {/* General Info */}
              <FeatureCard
                title="Thông tin chung"
                icon={Target}
                colorTheme="blue"
              >
                <div className="space-y-6">
                  {/* --- SECTION 1: NGỮ CẢNH (Context) --- */}
                  <div
                    id="tour-video-context"
                    className="p-4 bg-indigo-50/80 rounded-xl border-2 border-indigo-300 space-y-4"
                  >
                    <div className="flex items-center gap-2 mb-2 text-indigo-900 font-semibold border-b-2 border-indigo-300 pb-2">
                      <Folder className="w-4 h-4" />
                      <span>Ngữ cảnh</span>
                    </div>

                    {/* Project */}
                    <div>
                      <SectionLabel className="mb-2 text-indigo-900">
                        Dự án <span className="text-red-500">*</span>
                      </SectionLabel>
                      <Select
                        value={formData.projectId}
                        onValueChange={handleProjectChange}
                        disabled={!canEditIdeaFields}
                      >
                        <SelectTrigger className="bg-white border-indigo-200 text-indigo-900 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-500">
                          <SelectValue placeholder="Chọn dự án" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Platform */}
                    <div>
                      <SectionLabel className="mb-2 text-indigo-900">
                        Nền tảng
                      </SectionLabel>
                      <MultiSelect
                        options={platformOptions}
                        selected={(formData.platform as string[]) || []}
                        onChange={handlePlatformChange}
                        placeholder="Chọn nền tảng"
                        disabled={!canEditIdeaFields}
                        className={cn(
                          "bg-white border-2 border-indigo-200",
                          !canEditIdeaFields && "bg-slate-100 text-slate-500"
                        )}
                      />
                    </div>

                    {/* Duration */}
                    <div id="tour-video-duration">
                      <SectionLabel className="mb-2 text-indigo-900">
                        Thời lượng (giây)
                      </SectionLabel>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-indigo-100 shadow-sm text-indigo-600">
                          <Clock className="h-4 w-4" />
                        </div>
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
                          disabled={!canEditIdeaFields}
                          className="h-9 flex-1 bg-white border-indigo-200 text-indigo-900 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* --- SECTION 2: LỊCH ĐĂNG & TÀI KHOẢN (Publishing) --- */}
                  <div className="p-4 bg-green-50/80 rounded-xl border-2 border-green-300 space-y-4">
                    <div className="flex items-center gap-2 mb-2 text-green-900 font-semibold border-b-2 border-green-300 pb-2">
                      <Calendar className="w-4 h-4" />
                      <span>Lịch đăng & Tài khoản</span>
                    </div>

                    {/* Time & Mode Group */}
                    <div id="tour-video-time-section" className="space-y-4">
                      {/* Post Mode Selection */}
                      <div
                        className={cn(
                          "bg-white/60 p-3 rounded-lg border-2 border-green-200",
                          (!canEditIdeaFields || !isManualMode) &&
                            "opacity-60 cursor-not-allowed"
                        )}
                      >
                        <Label className="mb-2 block font-medium text-green-900 text-sm">
                          Chế độ đăng
                        </Label>
                        <RadioGroup
                          value={postMode}
                          onValueChange={(v) =>
                            setPostMode(v as "schedule" | "now")
                          }
                          className="flex gap-6"
                          disabled={!canEditIdeaFields || !isManualMode}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="schedule"
                              id="mode-schedule-video"
                              className="text-green-600 border-green-400"
                            />
                            <Label
                              htmlFor="mode-schedule-video"
                              className="cursor-pointer text-green-800"
                            >
                              Lên lịch
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="now"
                              id="mode-now-video"
                              className="text-green-600 border-green-400"
                            />
                            <Label
                              htmlFor="mode-now-video"
                              className="cursor-pointer text-green-800"
                            >
                              Đăng ngay
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Posting Time Inputs */}
                      {(postMode === "schedule" || !canEditIdeaFields) && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <SectionLabel className="text-green-900">
                              Thời gian
                            </SectionLabel>
                            {(canEditContentApprovalFields ||
                              (canEditIdeaFields && isManualMode)) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleEditWithAI(
                                    "schedule",
                                    formData.postingTime
                                  )
                                }
                                disabled={
                                  (!formData.idea && !formData.title) ||
                                  !editVideo?.id
                                }
                                className="h-6 text-[12px] px-2 text-green-700 hover:bg-green-100 hover:text-green-800 cursor-pointer disabled:text-slate-400 disabled:cursor-not-allowed"
                              >
                                <Sparkles className="w-3 h-3 mr-1" /> AI xếp
                                lịch
                              </Button>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <div className="flex-1">
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
                                disabled={
                                  !(
                                    canEditContentApprovalFields ||
                                    (canEditIdeaFields && isManualMode)
                                  )
                                }
                                className="h-9 bg-white border-green-200 text-green-900 focus:ring-green-500/20 disabled:bg-slate-100 disabled:text-slate-500"
                              />
                            </div>
                            <div className="w-120px">
                              <Input
                                type="time"
                                value={
                                  formData.postingTime?.split(" ")[1] || ""
                                }
                                onChange={(e) =>
                                  updatePostingTime(
                                    formData.expectedPostDate || "",
                                    e.target.value
                                  )
                                }
                                disabled={
                                  !(
                                    canEditContentApprovalFields ||
                                    (canEditIdeaFields && isManualMode)
                                  )
                                }
                                className="h-9 bg-white border-green-200 text-green-900 focus:ring-green-500/20 disabled:bg-slate-100 disabled:text-slate-500"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Accounts */}
                    <div id="tour-video-account">
                      <SectionLabel className="mb-2 text-green-900">
                        Tài khoản đăng
                      </SectionLabel>
                      <div
                        className={
                          !canEditContentApprovalFields && !isManualMode
                            ? "opacity-70 pointer-events-none"
                            : ""
                        }
                      >
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
                          disabled={
                            !canEditContentApprovalFields && !isManualMode
                          }
                          projectColors={projectColorMap}
                        />
                      </div>
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

              {!canEditIdeaFields && (
                <FeatureCard
                  title="Phân tích AI"
                  icon={Sparkles}
                  colorTheme="indigo"
                >
                  <div className="space-y-4">
                    {/* Topic */}
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-full bg-purple-50 shadow-sm mt-1 text-slate-600">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <SectionLabel className="mb-1">Chủ đề</SectionLabel>
                        <Textarea
                          disabled
                          value={formData.topic || "Chưa xác định"}
                          className="min-h-[60px] bg-slate-100/50 border-slate-200 text-slate-600 resize-none disabled:cursor-not-allowed"
                        />
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
                        <Textarea
                          disabled
                          value={formData.targetAudience || "Chưa xác định"}
                          className="min-h-[60px] bg-slate-100/50 border-slate-200 text-slate-600 resize-none disabled:cursor-not-allowed"
                        />
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
                        <Textarea
                          disabled
                          value={formData.researchNotes || "Chưa có ghi chú"}
                          className="min-h-[60px] bg-slate-100/50 border-slate-200 text-slate-600 resize-none disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                </FeatureCard>
              )}

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
              {/* Idea (Moved from Left Column) */}
              <FeatureCard
                id="tour-video-idea-input"
                title="Ý tưởng"
                icon={FileText}
                colorTheme="amber"
              >
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Switch
                      id="manual-mode-video"
                      checked={formData.idea?.includes(
                        "Nội dung được tạo thủ công"
                      )}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          const timestamp = formatManualPostTimestamp();
                          setFormData((prev) => {
                            // Enforce single platform if manual mode is enabled
                            const currentPlatforms = Array.isArray(
                              prev.platform
                            )
                              ? prev.platform
                              : [];
                            const newPlatforms =
                              currentPlatforms.length > 1
                                ? [currentPlatforms[0]]
                                : currentPlatforms;

                            return {
                              ...prev,
                              platform: newPlatforms,
                              idea: `${timestamp} - Nội dung được tạo thủ công`,
                            };
                          });
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            idea: "",
                          }));
                        }
                      }}
                    />
                    <Label
                      htmlFor="manual-mode-video"
                      className="text-sm font-medium text-slate-700 cursor-pointer"
                    >
                      Đăng thủ công (Không cần AI tạo nội dung). Lưu ý: Chỉ được
                      chọn 1 nền tảng.
                    </Label>
                  </div>
                  <Textarea
                    value={formData.idea || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        idea: e.target.value,
                      }))
                    }
                    placeholder="Nhập ý tưởng video..."
                    disabled={
                      !canEditIdeaFields ||
                      formData.idea?.includes("Nội dung được tạo thủ công")
                    }
                    className="min-h-[60px] bg-white disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
              </FeatureCard>

              {/* Title (Specific to Youtube) */}
              {formData.platform?.includes("Youtube Shorts") && (
                <FeatureCard
                  title="Tiêu đề Video"
                  icon={FileText}
                  colorTheme="rose"
                >
                  <Input
                    value={formData.title || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Nhập tiêu đề video..."
                    disabled={!canEditContentApprovalFields && !isManualMode}
                    className="bg-white disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </FeatureCard>
              )}

              {/* Caption */}
              <FeatureCard
                id="tour-video-caption"
                title="Caption"
                icon={Captions}
                colorTheme="blue"
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
                <Textarea
                  value={formData.caption || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      caption: e.target.value,
                    }))
                  }
                  placeholder="Nhập caption..."
                  disabled={!canEditContentApprovalFields && !isManualMode}
                  className="bg-white min-h-[200px] disabled:bg-slate-100 disabled:text-slate-500"
                />
                <div className="text-right text-xs text-slate-600  font-medium pt-2">
                  {countCharacters(formData.caption)} ký tự
                </div>
              </FeatureCard>

              {/* Video Media */}
              <FeatureCard
                id="tour-video-input"
                title="Video"
                icon={Play}
                colorTheme="rose"
                className="flex flex-col"
              >
                <div className="space-y-4">
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
                      disabled={
                        !(canEditIdeaFields || canEditContentApprovalFields)
                      }
                      className="flex-1 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                    />
                    <label>
                      <Button
                        type="button"
                        variant="outline"
                        className="bg-white disabled:bg-slate-100 disabled:text-slate-500"
                        onClick={() =>
                          document.getElementById("video-upload")?.click()
                        }
                        disabled={
                          !(canEditIdeaFields || canEditContentApprovalFields)
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
                        disabled={
                          !(canEditIdeaFields || canEditContentApprovalFields)
                        }
                      />
                    </label>
                  </div>

                  {formData.videoLink ? (
                    <div className="relative group rounded-xl overflow-hidden shadow-lg border border-slate-200 aspect-video bg-black">
                      <video
                        src={formData.videoLink}
                        controls
                        className="w-full h-full"
                      />
                      {(canEditIdeaFields || canEditContentApprovalFields) && (
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
              {/* <FeatureCard
                title="Thumbnail"
                icon={ImageIcon}
                colorTheme="purple"
                className="flex flex-col"
              >
                <div className="space-y-4">
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
                      disabled={
                        !(canEditIdeaFields || canEditContentApprovalFields)
                      }
                      className="flex-1 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                    />
                    <label>
                      <Button
                        type="button"
                        variant="outline"
                        className="bg-white disabled:bg-slate-100 disabled:text-slate-500"
                        onClick={() =>
                          document.getElementById("image-upload")?.click()
                        }
                        disabled={
                          !(canEditIdeaFields || canEditContentApprovalFields)
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
                        disabled={
                          !(canEditIdeaFields || canEditContentApprovalFields)
                        }
                      />
                    </label>
                  </div>

                  {formData.imageLink ? (
                    <div className="relative group rounded-xl overflow-hidden shadow-lg border border-slate-200 aspect-video bg-slate-100">
                      <img
                        src={formData.imageLink}
                        alt="Thumbnail w-full h-full object-cover"
                      />
                      {(canEditIdeaFields || canEditContentApprovalFields) && (
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
              </FeatureCard> */}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-3 bg-blue-50/80 border-t-2 border-slate-300 backdrop-blur-md">
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

          <div id="tour-video-actions" className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSaving || isLoading || isSubmitting}
            >
              Hủy
            </Button>

            {canEditIdeaFields ? (
              <>
                {/* Nút Cập nhật / Lưu nháp */}
                <Button
                  id="tour-video-save-btn"
                  onClick={handleSubmit}
                  disabled={
                    isSaving ||
                    !formData.idea ||
                    !formData.projectId ||
                    !formData.videoDuration
                  }
                  className="bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-all"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Lưu nháp
                    </>
                  )}
                </Button>

                {/* Nút Action chính (Post Now, Schedule, Approve Idea) */}
                {isReadyToPostOrSchedule ? (
                  <Button
                    id="tour-video-process-btn"
                    onClick={() => handleProcessContent(postMode)}
                    disabled={isSubmitting}
                    className={cn(
                      "shadow-md text-white px-6 min-w-[140px]",
                      postMode === "now"
                        ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        {postMode === "now" ? "Đang đăng..." : "Đang xử lý..."}
                      </>
                    ) : (
                      <>{postMode === "now" ? "Đăng ngay" : "Lên lịch đăng"}</>
                    )}
                  </Button>
                ) : (
                  onApproveIdea && (
                    <Button
                      id="tour-video-process-btn"
                      onClick={() => editVideo && onApproveIdea(editVideo)}
                      variant="default"
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                    >
                      Duyệt ý tưởng
                    </Button>
                  )
                )}
              </>
            ) : (
              <>
                <Button
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSaving ? "Đang cập nhật..." : "Cập nhật"}
                </Button>

                {onApprove && canEditContentApprovalFields && (
                  <Button
                    onClick={() => editVideo && onApprove(editVideo)}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"
                  >
                    {isLoading ? "Đang xử lý..." : "Duyệt Video"}
                  </Button>
                )}
              </>
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
