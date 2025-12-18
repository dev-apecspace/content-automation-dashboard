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
} from "lucide-react";
import { getProjects, getSetting } from "@/lib/api";
import {
  ContentItem,
  contentTypes,
  Project,
  ModelConfig,
  DEFAULT_MODELS,
} from "@/lib/types";
import { useFullscreen } from "@/stores/useFullscreenStore";
import { uploadImageFile } from "@/app/api/cloudinary";
import { AiRequirementDialog } from "./ai-requirement-dialog";
import { getContentItemById } from "@/lib/api/content-items";
import { toast } from "sonner";

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
  const { open } = useFullscreen();

  // ------------------- STATE -------------------
  const [projects, setProjects] = useState<Project[]>([]);
  const [modelsList, setModelsList] = useState<ModelConfig[]>([]);

  const [formData, setFormData] = useState<Partial<ContentItem>>({
    idea: "",
    projectId: "",
    platform: "Facebook Post",
    contentType: "",
    imageLink: undefined,
    expectedPostDate: "",
    postingTime: "",
    caption: "",
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

  // ------------------- LOAD PROJECTS & MODELS -------------------
  useEffect(() => {
    async function fetchData() {
      try {
        const [realProjects, modelRegistry] = await Promise.all([
          getProjects(),
          getSetting("ai_models_registry"),
        ]);
        setProjects(realProjects);

        if (modelRegistry && modelRegistry.value) {
          try {
            const parsed = JSON.parse(modelRegistry.value);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setModelsList(parsed);
            } else {
              setModelsList(DEFAULT_MODELS);
            }
          } catch {
            setModelsList(DEFAULT_MODELS);
          }
        } else {
          setModelsList(DEFAULT_MODELS);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setModelsList(DEFAULT_MODELS);
      }
    }
    fetchData();
  }, []);

  // ------------------- KHI MỞ MODAL ĐỂ EDIT -------------------
  useEffect(() => {
    if (editContent) {
      const currentImage = editContent.imageLink;

      setFormData({
        ...editContent,
        imageLink: currentImage,
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
        imageLink: undefined,
        expectedPostDate: "",
        postingTime: "",
        caption: "",
      });
      setImageEditRequest("");
      setNewImageLink("");
    }
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

  // ------------------- XỬ LÝ ẢNH (chỉ 1 ảnh) -------------------
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const url = await uploadImageFile(file);
    if (url) {
      setFormData((prev) => ({ ...prev, imageLink: url }));
    }
  };

  const handleReplaceImageLink = () => {
    if (newImageLink.trim()) {
      setFormData((prev) => ({ ...prev, imageLink: newImageLink.trim() }));
      setNewImageLink("");
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, imageLink: undefined }));
  };

  // ------------------- COST CALCULATION -------------------
  const calculateEstimatedCost = () => {
    // Only calculate if image link is present or being uploaded/requested
    // Actually, if it's "Content Approval" phase and there is an image, we can show value.
    // Or if user is in "Idea" phase and intends to generate image.

    // Let's assume cost is relevant if there is an imageLink or user just wants to see potential cost?
    // User request: "thêm ước tính chi phí tạo ảnh cho content."
    // Usually means the cost of generating ONE image.

    const imageModel =
      modelsList.find((m) => m.type === "image") ||
      DEFAULT_MODELS.find((m) => m.type === "image");

    if (!imageModel) return null;

    let cost = 0;
    if (imageModel.unit === "per_megapixel") {
      cost = imageModel.cost * 1; // Default 1MP
    } else if (imageModel.unit === "per_run") {
      cost = imageModel.cost;
    }

    return {
      total: cost,
      modelName: imageModel.name,
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
            ? formData.imageLink
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

  // ------------------- QUYỀN & VALIDATION -------------------
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
    !!formData.imageLink &&
    !!formData.postingTime &&
    !!formData.caption?.trim();

  const isFormValid = isIdeaValid || isApprovalValid;

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
                    <Input
                      value={formData.platform}
                      disabled
                      className="bg-slate-50/50 border-white/60 text-slate-500 cursor-not-allowed rounded-xl h-11 shadow-sm"
                    />
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
                    Ảnh tham khảo (tùy chọn)
                  </Label>

                  {/* Input dán link */}
                  <div className="flex gap-3">
                    <Input
                      placeholder="Dán link ảnh..."
                      value={newImageLink}
                      onChange={(e) => {
                        const value = e.target.value.trim();
                        setNewImageLink(value);
                        // Tự động cập nhật ảnh nếu link hợp lệ
                        if (value) {
                          setFormData((prev) => ({
                            ...prev,
                            imageLink: value,
                          }));
                        }
                      }}
                      className="flex-1 border-white/60 bg-white/50 focus:bg-white/80 focus:border-indigo-400 rounded-xl shadow-sm"
                    />
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
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Hiển thị ảnh ngay khi có link */}
                  {formData.imageLink && (
                    <div className="relative group inline-block rounded-xl overflow-hidden shadow-md border border-white/60">
                      <img
                        src={formData.imageLink}
                        alt="Preview"
                        className="max-h-64 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleEditWithAI("image")}
                          className="p-3 bg-white/20 backdrop-blur-md border border-white/50 text-white rounded-full hover:bg-white/40 transition-colors"
                          title="AI chỉnh sửa"
                        >
                          <Sparkles className="w-5 h-5" />
                        </button>
                        <button
                          onClick={handleRemoveImage}
                          className="p-3 bg-white/20 backdrop-blur-md border border-white/50 text-red-500 rounded-full hover:bg-white/40 transition-colors"
                          title="Xóa"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==================== GIAI ĐOẠN DUYỆT NỘI DUNG ==================== */}
            {canEditContentApprovalFields && (
              <div className="space-y-6">
                {/* Thời gian đăng */}
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
                      Ảnh bài đăng <span className="text-red-500">*</span>
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
                      value={newImageLink || formData.imageLink}
                      onChange={(e) => {
                        const value = e.target.value.trim();
                        setNewImageLink(value);
                        if (value) {
                          setFormData((prev) => ({
                            ...prev,
                            imageLink: value,
                          }));
                        }
                      }}
                      className="flex-1 border-white/60 bg-white/50 focus:bg-white/80 focus:border-emerald-500 rounded-xl shadow-sm"
                    />
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
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Hiển thị ảnh ngay lập tức */}
                  {formData.imageLink && (
                    <div className="relative group inline-block rounded-xl overflow-hidden shadow-lg border border-white/60">
                      <img
                        src={formData.imageLink}
                        alt="Ảnh đăng"
                        className="max-h-96 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleEditWithAI("image")}
                          className="p-3 bg-white/20 backdrop-blur-md border border-white/50 text-white rounded-full hover:bg-white/40 transition-colors"
                          title="AI chỉnh sửa"
                        >
                          <Sparkles className="w-5 h-5" />
                        </button>
                        <button
                          onClick={handleRemoveImage}
                          className="p-3 bg-white/20 backdrop-blur-md border border-white/50 text-red-500 rounded-full hover:bg-white/40 transition-colors"
                          title="Xóa"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
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
        hasImage={!!formData.imageLink}
        onConfirm={handleConfirmAiEdit}
        isLoading={isAiLoading}
      />
    </>
  );
};
