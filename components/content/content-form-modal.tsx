import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Lightbulb,
  Folder,
  Monitor,
  Sparkles,
  Image,
  Calendar,
  Clock,
  MessageSquare,
  Upload,
  Plus,
  X,
  CheckCircle2,
  Maximize2,
  DollarSign,
  Users,
  SquareUser,
  Target,
  FileText,
  Notebook,
  User,
  RefreshCw,
  BarChart3,
  Captions,
  Eye,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { getProjects, getAIModels } from "@/lib/api";
import { AccountService } from "@/lib/services/account-service";
import {
  ContentItem,
  contentTypes,
  Project,
  AIModel,
  Account,
  Platform,
  AccountPlatform,
  statusConfig,
} from "@/lib/types";
import { calculateImageCost } from "@/lib/utils/cost";
import { uploadImageFile } from "@/app/api/cloudinary";
import { AiRequirementDialog } from "@/components/shared/ai-requirement-dialog";
import { getContentItemById } from "@/lib/api/content-items";
import { toast } from "sonner";
import { AccountSelector } from "@/components/shared/account-selector";
import { FeatureCard } from "@/components/ui/feature-card";
import { InfoCard } from "@/components/ui/info-card";
import { SectionLabel } from "@/components/ui/section-label";
import { BackgroundStyle } from "@/components/ui/background-style";
import { cn } from "@/lib/utils";

interface ContentFormModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  onSave: (item: Partial<ContentItem>) => void;
  editContent?: ContentItem | null;
  editItem?: ContentItem | null;
  isSaving?: boolean;
  isLoading?: boolean;
  onViewDetail?: (item: ContentItem) => void;
}

// ==================== HELPER ====================
const getAccountPlatform = (
  contentPlatform: string
): AccountPlatform | null => {
  if (contentPlatform.includes("Facebook")) return "Facebook";
  if (contentPlatform.includes("Youtube")) return "Youtube";
  if (contentPlatform.includes("Tiktok")) return "Tiktok";
  return null;
};

// ==================== COMPONENT ====================
export const ContentFormModal: React.FC<ContentFormModalProps> = ({
  isOpen,
  onClose,
  onOpenChange,
  onSave,
  editContent,
  isSaving,
  isLoading,
  onViewDetail,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [modelsList, setModelsList] = useState<AIModel[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [formData, setFormData] = useState<Partial<ContentItem>>({
    idea: "",
    projectId: "",
    platform: "Facebook Post",
    contentType: "",
    imageLinks: undefined,
    expectedPostDate: "",
    postingTime: "",
    caption: "",
    accountIds: [],
  });

  const [newImageLink, setNewImageLink] = useState(""); // Dán link thủ công
  const [imageEditRequest, setImageEditRequest] = useState(""); // Yêu cầu sửa ảnh (idea phase)

  // ------------------- AI DIALOG STATE -------------------
  const [aiPromptOpen, setAiPromptOpen] = useState(false);
  const [aiPromptType, setAiPromptType] = useState<
    "caption" | "schedule" | "image" | null
  >(null);
  const [aiPromptContent, setAiPromptContent] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // ------------------- QUYỀN & VALIDATION (Moved up for dependencies) -------------------
  const currentStatus = editContent?.status || "idea";
  const canEditIdeaFields = currentStatus === "idea";
  const canEditContentApprovalFields =
    currentStatus === "awaiting_content_approval" ||
    currentStatus === "content_approved" ||
    currentStatus === "post_removed";

  const isIdeaValid =
    canEditIdeaFields &&
    !!formData.idea?.trim() &&
    !!formData.projectId &&
    !!formData.contentType;

  const isApprovalValid =
    canEditContentApprovalFields &&
    !!formData.imageLinks &&
    formData.imageLinks.length > 0 &&
    !!formData.postingTime &&
    !!formData.caption?.trim();

  const isFormValid = isIdeaValid || isApprovalValid;

  // ------------------- LOAD PROJECTS & MODELS -------------------
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

  // ------------------- KHI MỞ MODAL ĐỂ EDIT -------------------
  useEffect(() => {
    if (editContent) {
      const currentImage = editContent.imageLinks;

      setFormData({
        ...editContent,
        imageLinks: currentImage,
        expectedPostDate:
          editContent.postingTime && editContent.postingTime.includes("/")
            ? editContent.postingTime
                .split(" ")[0]
                .split("/")
                .reverse()
                .join("-")
            : "",
      });
    } else {
      // Reset form khi tạo mới
      setFormData({
        idea: "",
        projectId: "",
        platform: "Facebook Post",
        contentType: "",
        imageLinks: undefined,
        expectedPostDate: "",
        postingTime: "",
        caption: "",
        accountIds: [],
      });
      setImageEditRequest("");
    }
    setNewImageLink("");
  }, [editContent, isOpen]);

  // ------------------- XỬ LÝ DỰ ÁN -------------------
  const handleProjectChange = (value: string) => {
    const project = projects.find((p) => p.id === value);
    setFormData((prev) => ({
      ...prev,
      projectId: value,
      projectName: project?.name || "",
    }));
  };

  // ------------------- XỬ LÝ ẢNH (nhiều ảnh) -------------------
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Upload từng file
    const newLinks: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = await uploadImageFile(file);
      if (url) newLinks.push(url);
    }

    if (newLinks.length > 0) {
      setFormData((prev) => ({
        ...prev,
        imageLinks: [...(prev.imageLinks || []), ...newLinks],
      }));
    }
  };

  const handleReplaceImageLink = () => {
    if (newImageLink.trim()) {
      setFormData((prev) => ({
        ...prev,
        imageLinks: [...(prev.imageLinks || []), newImageLink.trim()],
      }));
      setNewImageLink("");
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      imageLinks: (prev.imageLinks || []).filter(
        (_, index) => index !== indexToRemove
      ),
    }));
  };

  // ------------------- XỬ LÝ ACCOUNT SELECTION -------------------
  const filteredAccounts = accounts.filter((acc) => {
    // 1. Filter by Platform (Show ALL accounts with this platform, regardless of project)
    if (!formData.platform) return false;
    const requiredPlatform = getAccountPlatform(formData.platform);
    return acc.platform === requiredPlatform;
  });

  const handleAccountToggle = (accountId: string) => {
    setFormData((prev) => {
      const currentIds = prev.accountIds || [];
      if (currentIds.includes(accountId)) {
        return {
          ...prev,
          accountIds: currentIds.filter((id) => id !== accountId),
        };
      } else {
        return {
          ...prev,
          accountIds: [...currentIds, accountId],
        };
      }
    });
  };

  // ------------------- COST CALCULATION -------------------
  const calculateEstimatedCost = () => {
    // Only calculate if currently in Idea/Detail phase editing
    if (!canEditIdeaFields && !canEditContentApprovalFields) return null;

    const imageModel = modelsList.find(
      (m) => m.modelType === "image" && m.isActive
    );

    if (!imageModel) return null;

    // RULE:
    // 1. Has Image + No Req => Free (User used own/existing image)
    // 2. Has Image + Has Req => Paid (Edit)
    // 3. No Image => Paid (Generate)

    if (formData.imageLinks && !imageEditRequest?.trim()) {
      return {
        total: 0,
        modelName: imageModel.name,
        isFree: true,
      };
    }

    const cost = calculateImageCost(imageModel);

    return {
      total: cost,
      modelName: imageModel.name,
      isFree: false,
    };
  };

  const estimatedCost = calculateEstimatedCost();

  // ------------------- GỘP NGÀY GIỜ -------------------
  const updatePostingTime = (date: string, time: string) => {
    if (date && time) {
      const [year, month, day] = date.split("-");
      const formatted = `${day}/${month}/${year} ${time}`;
      setFormData((prev) => ({ ...prev, postingTime: formatted }));
    }
  };

  // ------------------- GỌI AI CHỈNH SỬA (OPEN DIALOG) -------------------
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
      // Logic chung cho payload
      let finalType = aiPromptType as string;
      if (aiPromptType === "image") {
        finalType = imageAction === "create" ? "create-image" : "edit-image";
      }

      const payload = {
        type: finalType,
        topic: formData.topic,
        content: formData.caption,
        contentType: formData.contentType,
        imageUrl:
          finalType === "edit-image" || aiPromptType === "image"
            ? formData.imageLinks?.[0]
            : undefined,
        projectId: formData.projectId,
        id: editContent?.id,
        require: requirement,
        platform: formData.platform,
      };

      // --- LOGIC RIÊNG CHO IMAGE ---
      if (aiPromptType === "image") {
        // Gọi webhook Image (Fire-and-forget UI, nhưng await request để đảm bảo gửi thành công)
        await fetch("/api/webhook/edit-media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        toast.success("Đã gửi yêu cầu chỉnh sửa ảnh! Vui lòng đợi kết quả.");
        setAiPromptOpen(false);
      }
      // --- LOGIC RIÊNG CHO TEXT (Caption/Schedule) ---
      else {
        // Gọi webhook Text
        const res = await fetch("/api/webhook/edit-content-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("API request failed");

        // Sau khi success alert/toast
        toast.success("AI đã xử lý xong!");
        setAiPromptOpen(false);

        // Load lại dữ liệu từ DB để cập nhật form
        if (editContent?.id) {
          const updatedItem = await getContentItemById(editContent.id);
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
              // Cập nhật các trường khác nếu cần thiết
              idea: updatedItem.idea,
            }));
          }
        }
      }
    } catch (error) {
      console.error("Lỗi gửi webhook:", error);
      toast.error("Gửi yêu cầu thất bại, vui lòng thử lại.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // ------------------- SUBMIT -------------------
  const handleSubmit = () => {
    const dataToSave: Partial<ContentItem> = {
      ...formData,
    };
    onSave(dataToSave);
  };

  const handleClose = () => {
    onClose?.() || onOpenChange?.(false);
  };

  // ------------------- RENDER -------------------
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange || handleClose}>
        <DialogContent className="" showCloseButton={true}>
          <BackgroundStyle />

          <div className="p-8 relative z-10">
            <DialogHeader className="space-y-6">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-2xl font-bold leading-tight pr-8 text-slate-900 tracking-wide">
                  {editContent ? "Chỉnh sửa nội dung" : "Tạo nội dung mới"}
                </DialogTitle>
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge
                    variant="outline"
                    className="border-slate-200 bg-white text-slate-700 px-3 py-1"
                  >
                    {canEditIdeaFields && "Giai đoạn: Ý tưởng"}
                    {canEditContentApprovalFields &&
                      "Giai đoạn: Duyệt nội dung"}
                    {!canEditIdeaFields &&
                      !canEditContentApprovalFields &&
                      "Chế độ xem"}
                  </Badge>
                  {editContent?.status && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "border-slate-200 bg-white text-slate-700 px-3 py-1",
                        statusConfig[editContent.status].className
                      )}
                    >
                      {statusConfig[editContent.status].label}
                    </Badge>
                  )}
                </div>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
              {/* ==================== LEFT COLUMN ==================== */}
              <div className="lg:col-span-5 space-y-6">
                {/* 1. THÔNG TIN CHUNG (INPUTS) */}
                <FeatureCard
                  title="Thông tin chung"
                  icon={Target}
                  colorTheme="blue"
                >
                  {/* Dự án */}
                  <div className="mb-4">
                    <SectionLabel className="mb-2">
                      Dự án <span className="text-red-500">*</span>
                    </SectionLabel>
                    <Select
                      value={formData.projectId}
                      onValueChange={handleProjectChange}
                      disabled={!canEditIdeaFields}
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
                    </Select>
                  </div>

                  {/* Nền tảng & Loại Content */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <SectionLabel className="mb-2">Nền tảng</SectionLabel>
                      <Select
                        value={formData.platform}
                        onValueChange={(v) =>
                          setFormData((prev) => ({
                            ...prev,
                            platform: v as any,
                          }))
                        }
                        disabled={!canEditIdeaFields}
                      >
                        <SelectTrigger className="bg-white border-slate-200">
                          <SelectValue placeholder="Nền tảng" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Facebook Post">
                            Facebook Post
                          </SelectItem>
                          <SelectItem value="Tiktok Carousel">
                            Tiktok Carousel
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <SectionLabel className="mb-2">Loại Content</SectionLabel>
                      <Select
                        value={formData.contentType}
                        onValueChange={(v) =>
                          setFormData((prev) => ({ ...prev, contentType: v }))
                        }
                        disabled={!canEditIdeaFields}
                      >
                        <SelectTrigger className="bg-white border-slate-200">
                          <SelectValue placeholder="Loại" />
                        </SelectTrigger>
                        <SelectContent>
                          {contentTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Thời gian & Account (Only Show if Approval or View) */}
                  {(canEditContentApprovalFields || !canEditIdeaFields) && (
                    <>
                      <div className="w-full h-px bg-slate-200/50 my-4" />

                      {/* Thời gian đăng */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <SectionLabel>
                            Thời gian đăng{" "}
                            <span className="text-red-500">*</span>
                          </SectionLabel>
                          {canEditContentApprovalFields && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleEditWithAI(
                                  "schedule",
                                  formData.postingTime
                                )
                              }
                              className="h-6 text-[14px] px-2 text-blue-600 hover:bg-blue-50 cursor-pointer"
                            >
                              <Sparkles className="w-3 h-3 mr-1" /> AI xếp lịch
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
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
                            disabled={!canEditContentApprovalFields}
                            className="bg-white border-slate-200"
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
                            disabled={!canEditContentApprovalFields}
                            className="bg-white border-slate-200"
                          />
                        </div>
                      </div>

                      {/* Tài khoản */}
                      <div>
                        <SectionLabel className="mb-2">
                          Tài khoản đăng
                        </SectionLabel>
                        {canEditContentApprovalFields ? (
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
                            placeholder={
                              filteredAccounts.length === 0
                                ? "Không có tk phù hợp"
                                : "Chọn tài khoản"
                            }
                          />
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {(formData.accountIds || []).map((id) => {
                              const acc = accounts.find((a) => a.id === id);
                              return acc ? (
                                <Badge
                                  key={id}
                                  variant="secondary"
                                  className="bg-green-50 text-green-700 border-green-200"
                                >
                                  {acc.channelName}
                                </Badge>
                              ) : null;
                            })}
                            {(!formData.accountIds ||
                              formData.accountIds.length === 0) && (
                              <span className="text-sm text-slate-400 italic">
                                Chưa chọn tài khoản
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </FeatureCard>

                {/* 2. PHÂN TÍCH AI (READ ONLY - Lấy từ editContent) */}
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
                          {editContent?.topic || (
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
                          {editContent?.targetAudience || (
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
                          {editContent?.researchNotes || (
                            <span className="text-slate-400 italic">
                              Chưa xác định
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </FeatureCard>

                {/* 3. SYSTEM INFO */}
                {editContent && (
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
                          {editContent.createdAt
                            ? new Date(
                                editContent.createdAt
                              ).toLocaleDateString("vi-VN")
                            : "-"}
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
                          {editContent.updatedAt
                            ? new Date(
                                editContent.updatedAt
                              ).toLocaleDateString("vi-VN")
                            : "-"}
                        </div>
                      </div>
                    </InfoCard>
                  </div>
                )}
              </div>

              {/* ==================== RIGHT COLUMN ==================== */}
              <div className="lg:col-span-7 space-y-6">
                {/* 1. NỘI DUNG (IDEA / CAPTION) */}
                <FeatureCard
                  title={
                    canEditIdeaFields ? "Ý tưởng" : "Caption"
                  }
                  icon={canEditIdeaFields ? Lightbulb : Captions}
                  colorTheme="amber"
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
                  {canEditIdeaFields ? (
                    <div className="space-y-2">
                      <Textarea
                        id="idea"
                        value={formData.idea || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            idea: e.target.value,
                          }))
                        }
                        placeholder="Mô tả ý tưởng nội dung của bạn..."
                        rows={6}
                        className="bg-slate-50 border-slate-200 resize-none focus:bg-white"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Textarea
                        value={formData.caption || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            caption: e.target.value,
                          }))
                        }
                        placeholder="Nhập nội dung caption cho bài đăng..."
                        rows={12}
                        disabled={!canEditContentApprovalFields}
                        className="bg-slate-50 border-slate-200 resize-none focus:bg-white custom-scrollbar"
                      />
                    </div>
                  )}
                </FeatureCard>

                {/* 2. MEDIA (IMAGES) */}
                <FeatureCard
                  title="Ảnh đính kèm"
                  icon={Image}
                  colorTheme="rose"
                  action={
                    estimatedCost &&
                    estimatedCost.total > 0 && (
                      <div className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                        Chi phí:{" "}
                        <span className="text-slate-900">
                          ${estimatedCost.total.toFixed(3)}
                        </span>
                      </div>
                    )
                  }
                >
                  {/* Input (Only if editable) */}
                  {(canEditIdeaFields || canEditContentApprovalFields) && (
                    <div className="flex gap-2 mb-4">
                      <Input
                        placeholder="Dán link ảnh..."
                        value={newImageLink}
                        onChange={(e) => setNewImageLink(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleReplaceImageLink();
                          }
                        }}
                        className="flex-1 bg-white border-slate-200"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleReplaceImageLink}
                        disabled={!newImageLink.trim()}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <div className="relative">
                        <Button
                          type="button"
                          variant="outline"
                          className="text-teal-600 border-teal-200 hover:bg-teal-50"
                          onClick={() =>
                            document
                              .getElementById("file-upload-input")
                              ?.click()
                          }
                        >
                          <Upload className="w-4 h-4" />
                        </Button>
                        <input
                          id="file-upload-input"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>
                    </div>
                  )}

                  {/* Image Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {(formData.imageLinks || []).map((link, index) => (
                      <div
                        key={index}
                        className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100"
                      >
                        <img
                          src={link}
                          alt=""
                          className="w-full h-full object-cover"
                        />

                        {/* Actions Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <a
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 bg-white/20 hover:bg-white/40 backdrop-blur rounded-full text-white cursor-pointer"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </a>
                          {(canEditIdeaFields ||
                            canEditContentApprovalFields) && (
                            <>
                              <button
                                onClick={() => handleEditWithAI("image")} // Note: Currently generic
                                className="p-1.5 bg-white/20 hover:bg-white/40 backdrop-blur rounded-full text-white"
                                title="AI Sửa"
                              >
                                <Sparkles className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRemoveImage(index)}
                                className="p-1.5 bg-red-500/80 hover:bg-red-500 backdrop-blur rounded-full text-white"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Empty State */}
                    {(!formData.imageLinks ||
                      formData.imageLinks.length === 0) && (
                      <div className="col-span-full py-8 text-center text-slate-400 italic border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        Chưa có hình ảnh nào
                      </div>
                    )}
                  </div>

                  {/* Image Edit Request (Idea Phase) */}
                  {canEditIdeaFields && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <SectionLabel className="mb-2">
                        Yêu cầu sửa ảnh (Tùy chọn)
                      </SectionLabel>
                      <Textarea
                        placeholder="Mô tả yêu cầu chỉnh sửa hoặc tạo ảnh..."
                        value={imageEditRequest}
                        onChange={(e) => setImageEditRequest(e.target.value)}
                        rows={2}
                        className="bg-white border-slate-200 text-sm"
                      />
                    </div>
                  )}
                </FeatureCard>
              </div>
            </div>

            <DialogFooter className="-mx-6">
              {editContent && onViewDetail ? (
                <Button
                  variant="ghost"
                  onClick={() => onViewDetail(editContent as ContentItem)}
                  className="mr-auto text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Xem chi tiết
                </Button>
              ) : (
                <div></div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSaving || isLoading}
                >
                  Hủy bỏ
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    isSaving ||
                    isLoading ||
                    !isFormValid ||
                    (!canEditIdeaFields && !canEditContentApprovalFields)
                  }
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
                >
                  {isSaving
                    ? "Đang lưu..."
                    : editContent
                    ? "Cập nhật"
                    : "Tạo mới"}
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========== AI REQUIREMENT DIALOG ========== */}
      <AiRequirementDialog
        isOpen={aiPromptOpen}
        onClose={() => setAiPromptOpen(false)}
        type={aiPromptType}
        initialRequirement={aiPromptType === "image" ? imageEditRequest : ""}
        hasImage={!!formData.imageLinks}
        onConfirm={handleConfirmAiEdit}
        isLoading={isAiLoading}
      />
    </>
  );
};
