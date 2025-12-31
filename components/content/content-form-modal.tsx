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

interface ContentFormModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  onSave: (item: Partial<ContentItem>) => void;
  editContent?: ContentItem | null;
  editItem?: ContentItem | null;
  isSaving?: boolean;
  isLoading?: boolean;
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white/80 backdrop-blur-2xl border-white/60 shadow-2xl rounded-[32px] p-0">
          {/* Vibrant Gradient Background Layer (Matches Detail Modal) */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#a8c0ff]/40 via-[#3f2b96]/10 to-[#ffafbd]/40 blur-3xl pointer-events-none" />

          <DialogHeader className="border-b border-white/40 pb-6 pt-6 px-6 bg-white/40 sticky top-0 z-10 backdrop-blur-md">
            <div className="flex items-center gap-4">
              {canEditIdeaFields && (
                <div className="p-3 bg-white/60 rounded-2xl shadow-sm border border-white/60">
                  <Lightbulb className="w-6 h-6 text-amber-500" />
                </div>
              )}
              {canEditContentApprovalFields && (
                <div className="p-3 bg-white/60 rounded-2xl shadow-sm border border-white/60">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
              )}
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-900 tracking-wide">
                  {editContent ? "Chỉnh sửa nội dung" : "Tạo nội dung mới"}
                </DialogTitle>
                <p className="text-sm text-slate-500 mt-1 font-medium">
                  {canEditIdeaFields && "Giai đoạn: Ý tưởng ban đầu"}
                  {canEditContentApprovalFields && "Giai đoạn: Duyệt nội dung"}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="grid gap-6 py-6 px-6">
            {/* ==================== GIAI ĐOẠN Ý TƯỞNG ==================== */}
            {canEditIdeaFields && (
              <div className="space-y-6">
                {/* Ý tưởng */}
                <div className="space-y-3">
                  <Label
                    htmlFor="idea"
                    className="flex items-center gap-2 text-base font-semibold text-slate-700"
                  >
                    <Lightbulb className="w-4 h-4 text-amber-500" />Ý tưởng{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="idea"
                    value={formData.idea || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, idea: e.target.value }))
                    }
                    placeholder="Mô tả ý tưởng nội dung của bạn..."
                    rows={3}
                    required
                    className="border-white/60 bg-white/50 focus:bg-white/80 focus:border-amber-400 focus:ring-amber-100 rounded-xl resize-none transition-all duration-200 shadow-sm"
                  />
                </div>

                {/* Dự án & Nền tảng */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-base font-semibold text-slate-700">
                      <Folder className="w-4 h-4 text-blue-500" />
                      Dự án <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.projectId}
                      onValueChange={handleProjectChange}
                      required
                    >
                      <SelectTrigger className="border-white/60 bg-white/50 focus:bg-white/80 focus:ring-blue-100 rounded-xl h-11 shadow-sm">
                        <SelectValue placeholder="Chọn dự án" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-white/60 bg-white/90 backdrop-blur-xl shadow-lg">
                        {projects.map((p) => (
                          <SelectItem
                            key={p.id}
                            value={p.id}
                            className="focus:bg-blue-50 cursor-pointer rounded-lg"
                          >
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-base font-semibold text-slate-700">
                      <Monitor className="w-4 h-4 text-blue-500" />
                      Nền tảng
                    </Label>
                    <div className="relative">
                      <Select
                        value={formData.platform}
                        onValueChange={(v) =>
                          setFormData((prev) => ({
                            ...prev,
                            platform: v as any,
                          }))
                        }
                      >
                        <SelectTrigger className="border-white/60 bg-white/50 focus:bg-white/80 focus:ring-blue-100 rounded-xl h-11 shadow-sm">
                          <SelectValue placeholder="Chọn nền tảng" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-white/60 bg-white/90 backdrop-blur-xl shadow-lg">
                          <SelectItem
                            value="Facebook Post"
                            className="focus:bg-blue-50 cursor-pointer rounded-lg"
                          >
                            Facebook Post
                          </SelectItem>
                          <SelectItem
                            value="Tiktok Carousel"
                            className="focus:bg-blue-50 cursor-pointer rounded-lg"
                          >
                            Tiktok Carousel
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Loại content */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-base font-semibold text-slate-700">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    Loại content <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.contentType}
                    onValueChange={(v) =>
                      setFormData((prev) => ({ ...prev, contentType: v }))
                    }
                    required
                  >
                    <SelectTrigger className="border-white/60 bg-white/50 focus:bg-white/80 focus:ring-purple-100 rounded-xl h-11 shadow-sm">
                      <SelectValue placeholder="Chọn loại content" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-white/60 bg-white/90 backdrop-blur-xl shadow-lg">
                      {contentTypes.map((type) => (
                        <SelectItem
                          key={type.value}
                          value={type.value}
                          className="focus:bg-purple-50 cursor-pointer rounded-lg"
                        >
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Ảnh (idea phase) */}
                <div className="space-y-4 bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl shadow-sm p-6 hover:bg-white/60 transition-all duration-300">
                  <Label className="flex items-center gap-2 text-base font-semibold text-slate-700">
                    <Image className="w-4 h-4 text-slate-500" />
                    Ảnh (tùy chọn)
                  </Label>

                  {/* Input dán link */}
                  <div className="flex gap-3">
                    <Input
                      placeholder="Dán link ảnh..."
                      value={newImageLink}
                      onChange={(e) => {
                        setNewImageLink(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleReplaceImageLink();
                        }
                      }}
                      className="flex-1 border-white/60 bg-white/50 focus:bg-white/80 focus:border-indigo-400 rounded-xl shadow-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleReplaceImageLink}
                      disabled={!newImageLink.trim()}
                      className="text-indigo-600 hover:bg-indigo-50"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <label>
                      <Button
                        type="button"
                        variant="outline"
                        className="bg-white/50 border-indigo-200 text-indigo-600 hover:bg-white/80 hover:border-indigo-300 rounded-xl shadow-sm"
                        onClick={() =>
                          document.getElementById("file-upload-idea")?.click()
                        }
                      >
                        <Upload className="w-4 h-4" />
                      </Button>
                      <input
                        id="file-upload-idea"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Hiển thị danh sách ảnh */}
                  {formData.imageLinks && formData.imageLinks.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                      {formData.imageLinks.map((link, index) => (
                        <div
                          key={index}
                          className="relative group rounded-xl overflow-hidden shadow-md border border-white/60 aspect-video bg-slate-100"
                        >
                          <img
                            src={link}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <a
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 bg-white/20 backdrop-blur-md border border-white/50 text-white rounded-full hover:bg-white/40 transition-colors"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="p-2 bg-white/20 backdrop-blur-md border border-white/50 text-red-500 rounded-full hover:bg-white/40 transition-colors"
                              title="Xóa"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Input Yêu cầu sửa ảnh */}
                  <div className="pt-2">
                    <Label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                      Yêu cầu sửa ảnh (tùy chọn)
                    </Label>
                    <Textarea
                      placeholder={
                        formData.imageLinks && formData.imageLinks.length > 0
                          ? "Nhập yêu cầu chỉnh sửa các ảnh này (VD: Xóa phông, đổi màu áo...)"
                          : "Mô tả ảnh bạn muốn tạo..."
                      }
                      value={imageEditRequest}
                      onChange={(e) => setImageEditRequest(e.target.value)}
                      rows={2}
                      className="border-white/60 bg-white/50 focus:bg-white/80 focus:border-purple-400 rounded-xl resize-none shadow-sm text-sm"
                    />

                    {/* Cost Display for Idea Phase */}
                    {estimatedCost && (
                      <div className="mt-2 text-right">
                        {estimatedCost.isFree ? (
                          <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                            Miễn phí (Ảnh có sẵn)
                          </span>
                        ) : (
                          <span className="text-sm font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                            Ước tính:{" "}
                            <span className="text-slate-900 font-bold">
                              ${estimatedCost.total.toFixed(3)}
                            </span>{" "}
                            <span className="text-xs text-slate-500 font-normal">
                              (~
                              {(estimatedCost.total * 26000).toLocaleString(
                                "vi-VN"
                              )}
                              đ)
                            </span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== GIAI ĐOẠN DUYỆT NỘI DUNG ==================== */}
            {canEditContentApprovalFields && (
              <div className="space-y-6">
                {/* Thời gian đăng & Tài khoản */}
                <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl shadow-sm p-6 hover:bg-white/60 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="flex items-center gap-2 text-base font-semibold text-slate-700">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      Thời gian đăng <span className="text-red-500">*</span>
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleEditWithAI("schedule", formData.postingTime)
                      }
                      className="bg-white/50 border-blue-200 text-blue-700 hover:bg-white/90 shadow-sm rounded-lg text-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                      AI Xếp lịch
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Ngày đăng
                      </label>
                      <div className="relative">
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
                          className="border-white/60 bg-white/50 focus:bg-white/80 focus:border-blue-400 rounded-xl h-11 shadow-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Giờ đăng
                      </label>
                      <Input
                        type="time"
                        value={formData.postingTime?.split(" ")[1] || ""}
                        onChange={(e) =>
                          updatePostingTime(
                            formData.expectedPostDate || "",
                            e.target.value
                          )
                        }
                        className="border-white/60 bg-white/50 focus:bg-white/80 focus:border-blue-400 rounded-xl h-11 shadow-sm"
                      />
                    </div>
                  </div>
                  {/* Tài khoản sẽ đăng */}
                  <div className="mt-6 border-b border-slate-200/50">
                    <Label className="flex items-center gap-2 text-base font-semibold text-slate-700 mb-3">
                      <SquareUser className="w-4 h-4 text-green-600" />
                      Tài khoản sẽ đăng
                    </Label>

                    <div className="mb-4">
                      <AccountSelector
                        accounts={filteredAccounts}
                        selectedIds={formData.accountIds || []}
                        onChange={(ids) =>
                          setFormData((prev) => ({ ...prev, accountIds: ids }))
                        }
                        currentProjectId={formData.projectId}
                        placeholder={
                          filteredAccounts.length === 0
                            ? "Không có tài khoản phù hợp (Hãy kiểm tra Nền tảng)"
                            : "Chọn tài khoản đăng..."
                        }
                      />
                      {(formData.accountIds || []).length === 0 &&
                        filteredAccounts.length > 0 && (
                          <p className="text-sm text-red-500 italic mt-1 ml-1">
                            * Vui lòng chọn ít nhất 1 tài khoản
                          </p>
                        )}
                    </div>
                  </div>
                </div>

                {/* Caption */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <Label className="flex items-center gap-2 text-base font-semibold text-slate-700">
                      <MessageSquare className="w-4 h-4 text-indigo-600" />
                      Caption <span className="text-red-500">*</span>
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleEditWithAI("caption", formData.caption)
                      }
                      className="bg-indigo-50/50 border-indigo-200 text-indigo-700 hover:bg-indigo-100/50 shadow-sm rounded-lg text-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                      AI Viết lại
                    </Button>
                  </div>
                  <Textarea
                    value={formData.caption || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        caption: e.target.value,
                      }))
                    }
                    placeholder="Nhập nội dung caption cho bài đăng..."
                    rows={6}
                    required
                    className="border-white/60 bg-white/50 focus:bg-white/80 focus:border-indigo-400 rounded-xl resize-none shadow-sm text-slate-700 custom-scrollbar"
                  />
                </div>

                {/* Ảnh sẽ đăng */}
                <div className="space-y-4 bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl shadow-sm p-6 hover:bg-white/60 transition-all duration-300">
                  <Label className="flex items-center justify-between text-base font-semibold text-slate-700">
                    <div className="flex items-center gap-2">
                      <Image className="w-4 h-4 text-emerald-600" />
                      Ảnh bài đăng
                    </div>
                    {estimatedCost && estimatedCost.total > 0 && (
                      <div className="text-sm font-medium text-gray-700 px-3 flex items-center gap-1.5 bg-white/50 rounded-lg border border-white/60 py-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />$
                        {estimatedCost.total.toFixed(3)}
                        <span className="text-slate-500 text-xs font-normal">
                          (~
                          {(estimatedCost.total * 26000).toLocaleString(
                            "vi-VN"
                          )}
                          đ)
                        </span>
                      </div>
                    )}
                  </Label>

                  <div className="flex gap-3">
                    <Input
                      placeholder="Dán link ảnh..."
                      value={newImageLink}
                      onChange={(e) => {
                        setNewImageLink(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleReplaceImageLink();
                        }
                      }}
                      className="flex-1 border-white/60 bg-white/50 focus:bg-white/80 focus:border-emerald-500 rounded-xl shadow-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleReplaceImageLink}
                      disabled={!newImageLink.trim()}
                      className="text-indigo-600 hover:bg-indigo-50"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <label>
                      <Button
                        type="button"
                        variant="outline"
                        className="bg-white/50 border-emerald-200 text-emerald-600 hover:bg-white/80 hover:border-emerald-300 rounded-xl shadow-sm"
                        onClick={() =>
                          document
                            .getElementById("file-upload-approval")
                            ?.click()
                        }
                      >
                        <Upload className="w-4 h-4" />
                      </Button>
                      <input
                        id="file-upload-approval"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Hiển thị ảnh ngay lập tức */}
                  {formData.imageLinks && formData.imageLinks.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {formData.imageLinks.map((link, index) => (
                        <div
                          key={index}
                          className="relative group rounded-xl overflow-hidden shadow-lg border border-white/60 aspect-video"
                        >
                          <img
                            src={link}
                            alt={`Ảnh đăng ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button
                              onClick={() => handleEditWithAI("image")} // AI edit might need to know WHICH image. For now, opens generic dialog.
                              className="p-2 bg-white/20 backdrop-blur-md border border-white/50 text-white rounded-full hover:bg-white/40 transition-colors"
                              title="AI chỉnh sửa"
                            >
                              <Sparkles className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveImage(index)}
                              className="p-2 bg-white/20 backdrop-blur-md border border-white/50 text-red-500 rounded-full hover:bg-white/40 transition-colors"
                              title="Xóa"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Không có quyền chỉnh sửa */}
            {!canEditIdeaFields && !canEditContentApprovalFields && (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-slate-400">
                <div className="p-4 bg-slate-50 rounded-full">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <p className="font-medium">
                  Không thể chỉnh sửa ở trạng thái hiện tại
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-white/40 p-6 bg-white/40 backdrop-blur-sm sticky bottom-0 z-10">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading || isSaving}
              className="cursor-pointer bg-white/50 hover:bg-white/80 border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl px-6 backdrop-blur-sm"
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isLoading ||
                isSaving ||
                !isFormValid ||
                (!canEditIdeaFields && !canEditContentApprovalFields)
              }
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-200/50 rounded-xl px-8"
            >
              {isSaving || isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang lưu...
                </span>
              ) : editContent ? (
                "Cập nhật"
              ) : (
                "Thêm mới"
              )}
            </Button>
          </DialogFooter>
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
