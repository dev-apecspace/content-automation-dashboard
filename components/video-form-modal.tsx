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
  Lightbulb,
  Folder,
  Film,
  Monitor,
  Clock,
  MessageSquare,
  Upload,
  X,
  CheckCircle2,
  Image as ImageIcon,
  Play,
  CheckCircle,
  Sparkles,
  DollarSign,
} from "lucide-react";
import { getProjects, getAIModels } from "@/lib/api";
import { VideoItem, Project, AIModel } from "@/lib/types";
import { uploadImageFile, uploadVideoFile } from "@/app/api/cloudinary";
import { AiRequirementDialog } from "./ai-requirement-dialog";
import { getContentItemById } from "@/lib/api/content-items";
import { getVideoItemById } from "@/lib/api/video-items";
import { toast } from "sonner";
import { calculateVideoCost } from "@/lib/utils/cost";

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
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [modelsList, setModelsList] = useState<AIModel[]>([]);

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
    caption: "",
    callToAction: "",
    topic: "",
    targetAudience: "",
    researchNotes: "",
  });

  const [newImageLink, setNewImageLink] = useState("");

  // Load Projects and AI Models
  useEffect(() => {
    async function fetchData() {
      try {
        const [realProjects, models] = await Promise.all([
          getProjects(),
          getAIModels(),
        ]);
        setProjects(realProjects);
        setModelsList(models);
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
        caption: "",
        callToAction: "",
        topic: "",
        targetAudience: "",
        researchNotes: "",
      });
      setNewImageLink("");
    }
  }, [editVideo, isOpen]);

  // Cost Calculation
  const calculateEstimatedCost = () => {
    if (!formData.videoDuration || formData.videoDuration <= 0) return null;

    const duration = formData.videoDuration;

    const videoModel = modelsList.find(
      (m) => m.modelType === "video" && m.isActive
    );
    const audioModel = modelsList.find(
      (m) => m.modelType === "audio" && m.isActive
    );

    return calculateVideoCost(videoModel, audioModel, duration);
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
    setFormData((prev) => {
      const currentPlatforms: any[] = Array.isArray(prev.platform)
        ? prev.platform
        : [];

      const p = platform;

      const updated = currentPlatforms.includes(p)
        ? currentPlatforms.filter((item) => item !== p)
        : [...currentPlatforms, p];
      return { ...prev, platform: updated };
    });
  };

  // ------------------- AI HANDLERS -------------------
  const [aiPromptOpen, setAiPromptOpen] = useState(false);
  const [aiPromptType, setAiPromptType] = useState<
    "caption" | "schedule" | "image" | "video-edit" | null
  >(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleEditWithAI = (type: "schedule" | "video-edit") => {
    setAiPromptType(type);
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
      if (aiPromptType === "schedule") {
        const payload = {
          type: "schedule",
          content: formData.postingTime, // Though reschedule might not use content, preserving structure
          projectId: formData.projectId,
          platform: formData.platform?.[0] || "Facebook Reels", // Assumes main platform
          id: editVideo?.id, // Use 'id' as requested for edit-content-text
        };

        const res = await fetch("/api/webhook/edit-content-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("API request failed");

        toast.success("AI đã xử lý xong!");
        setAiPromptOpen(false);

        // Load refresh data
        if (editVideo?.id) {
          const updatedItem = await getVideoItemById(editVideo.id);
          if (updatedItem) {
            setFormData((prev) => ({
              ...prev,
              postingTime: updatedItem.postingTime,
              expectedPostDate:
                updatedItem.postingTime && updatedItem.postingTime.includes(" ")
                  ? updatedItem.postingTime
                      .split(" ")[0]
                      .split("/")
                      .reverse()
                      .join("-")
                  : prev.expectedPostDate,
            }));
          }
        }
      } else if (aiPromptType === "video-edit") {
        const payload = {
          type: "video-edit",
          projectId: formData.projectId,
          platform: formData.platform?.[0], // Assuming single or first platform
          id: editVideo?.id,
          require: requirement,
          topic: formData.topic,
          targetAudience: formData.targetAudience,
          researchNotes: formData.researchNotes,
          videoDuration: duration || formData.videoDuration, // Prioritize user input duration
        };

        await fetch("/api/webhook/edit-media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        toast.success("Đã gửi yêu cầu sửa video! Vui lòng đợi kết quả.");
        setAiPromptOpen(false);
      }
    } catch (error) {
      console.error("Lỗi gửi webhook AI:", error);
      toast.error("Gửi yêu cầu thất bại, vui lòng thử lại.");
    } finally {
      setIsAiLoading(false);
    }
  };

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
      setFormData((prev) => ({ ...prev, existingVideoLink: url }));
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

  const handleRemoveVideo = () => {
    setFormData((prev) => ({ ...prev, existingVideoLink: "" }));
  };

  const updatePostingTime = (date: string, time: string) => {
    if (date && time) {
      const [year, month, day] = date.split("-");
      const formatted = `${day}/${month}/${year} ${time}`;
      setFormData((prev) => ({ ...prev, postingTime: formatted }));
    }
  };

  const handleSubmit = () => {
    const dataToSave: Partial<VideoItem> = {
      ...formData,
    };
    onSave(dataToSave);
  };

  const handleClose = () => {
    onClose?.() || onOpenChange?.(false);
  };

  const currentStatus = editVideo?.status || "idea";
  const canEditIdeaFields = currentStatus === "idea";
  const canEditContentApprovalFields =
    currentStatus === "awaiting_content_approval" ||
    currentStatus === "content_approved" ||
    currentStatus === "post_removed";

  const isIdeaValid =
    canEditIdeaFields &&
    !!formData.idea?.trim() &&
    !!formData.projectId &&
    Array.isArray(formData.platform) &&
    formData.platform.length > 0 &&
    formData.videoDuration !== undefined &&
    formData.videoDuration > 0;

  const isApprovalValid =
    canEditContentApprovalFields &&
    !!formData.postingTime &&
    !!formData.caption?.trim();

  const isFormValid = isIdeaValid || isApprovalValid;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange || handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white/80 backdrop-blur-2xl border-white/60 shadow-2xl rounded-[32px] p-0">
        {/* Vibrant Gradient Background Layer */}
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
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
            )}
            <div>
              <DialogTitle className="text-2xl font-bold text-slate-900 tracking-wide">
                {editVideo ? "Chỉnh sửa video" : "Tạo video mới"}
              </DialogTitle>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                {canEditIdeaFields && "Giai đoạn: Ý tưởng ban đầu"}
                {canEditContentApprovalFields && "Giai đoạn: Duyệt nội dung"}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-6 py-6 px-6">
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
                  placeholder="Mô tả ý tưởng video của bạn..."
                  rows={3}
                  required
                  className="border-white/60 bg-white/50 focus:bg-white/80 focus:border-amber-400 focus:ring-amber-100 rounded-xl resize-none transition-all duration-200 shadow-sm"
                />
              </div>

              {/* Dự án & Tiêu đề */}
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
              </div>

              {/* Nền tảng */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-base font-semibold text-gray-700">
                  <Monitor className="w-4 h-4 text-blue-500" />
                  Nền tảng <span className="text-red-500">*</span>
                </Label>
                <div className="flex flex-wrap gap-4 p-4 border border-white/60 bg-white/40 backdrop-blur-md rounded-2xl shadow-sm">
                  {["Facebook Reels", "Youtube Shorts"].map((platform) => (
                    <div key={platform} className="flex items-center gap-2">
                      <Checkbox
                        id={platform}
                        checked={
                          Array.isArray(formData.platform)
                            ? formData.platform.includes(platform as any)
                            : false
                        }
                        onCheckedChange={() => handlePlatformToggle(platform)}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 border-slate-300"
                      />
                      <label
                        htmlFor={platform}
                        className="text-sm font-medium cursor-pointer text-slate-700"
                      >
                        {platform}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Thời lượng */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-base font-semibold text-slate-700">
                    <Clock className="w-4 h-4 text-amber-500" />
                    Thời lượng (giây) <span className="text-red-500">*</span>
                  </Label>
                  {estimatedCost && (
                    <div className="text-sm font-medium text-gray-700 px-3 flex items-center gap-1.5">
                      ${estimatedCost.total.toFixed(2)} (~
                      {(estimatedCost.total * 26000).toLocaleString("vi-VN")}đ)
                    </div>
                  )}
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
                  placeholder="0"
                  className="border-white/60 bg-white/50 focus:bg-white/80 focus:border-amber-400 rounded-xl h-11 shadow-sm"
                />
              </div>

              {/* Ảnh */}
              <div className="space-y-4 bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl shadow-sm p-6 hover:bg-white/60 transition-all duration-300">
                <Label className="flex items-center gap-2 text-base font-semibold text-slate-700">
                  <ImageIcon className="w-4 h-4 text-emerald-500" />
                  Ảnh (tùy chọn)
                </Label>

                <div className="flex gap-3">
                  <Input
                    placeholder="Dán link ảnh..."
                    value={newImageLink}
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
                          .getElementById("file-upload-idea-image")
                          ?.click()
                      }
                    >
                      <Upload className="w-4 h-4" />
                    </Button>
                    <input
                      id="file-upload-idea-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {formData.imageLink && (
                  <div className="relative group inline-block rounded-xl overflow-hidden shadow-md border border-white/60">
                    <img
                      src={formData.imageLink}
                      alt="Preview"
                      className="max-h-64 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
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
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700">
                  Ghi chú (tùy chọn)
                </Label>
                <Textarea
                  value={formData.researchNotes || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      researchNotes: e.target.value,
                    }))
                  }
                  placeholder="Ghi chú về video..."
                  rows={2}
                  className="border-white/60 bg-white/50 focus:bg-white/80 focus:border-slate-400 rounded-xl resize-none shadow-sm"
                />
              </div>
            </div>
          )}

          {canEditContentApprovalFields && (
            <div className="space-y-6">
              {/* Thời gian đăng */}
              <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl shadow-sm p-6 hover:bg-white/60 transition-all duration-300">
                <Label className="flex items-center justify-between text-base font-semibold text-slate-700 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    Thời gian đăng <span className="text-red-500">*</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditWithAI("schedule")}
                    className="h-8 text-xs bg-amber-50 text-amber-600 hover:text-amber-800 hover:bg-amber-100 border border-amber-200 rounded-lg shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    AI xếp lịch
                  </Button>
                </Label>
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

              {/* Tiêu đề & Video link */}
              {formData.platform?.includes("Youtube Shorts") && (
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-base font-semibold text-slate-700">
                    <Film className="w-4 h-4 text-indigo-500" />
                    Tiêu đề <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.title || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Nhập tiêu đề video..."
                    className="border-white/60 bg-white/50 focus:bg-white/80 focus:border-indigo-400 rounded-xl h-11 shadow-sm"
                  />
                </div>
              )}

              <div className="space-y-3">
                <Label className="flex items-center justify-between text-base font-semibold text-slate-700">
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-red-500" />
                    Video sẽ đăng
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditWithAI("video-edit")}
                    className="h-8 text-xs bg-indigo-50 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 border border-indigo-200 rounded-lg shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    Sửa video
                  </Button>
                </Label>
                <Input
                  value={formData.videoLink || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      videoLink: e.target.value,
                    }))
                  }
                  placeholder="https://..."
                  className="border-white/60 bg-white/50 focus:bg-white/80 focus:border-red-400 rounded-xl h-11 shadow-sm"
                />
              </div>

              {/* Caption */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-base font-semibold text-slate-700">
                  <MessageSquare className="w-4 h-4 text-purple-500" />
                  Caption <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  value={formData.caption || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      caption: e.target.value,
                    }))
                  }
                  placeholder="Nhập caption cho video..."
                  rows={4}
                  required
                  className="border-white/60 bg-white/50 focus:bg-white/80 focus:border-purple-400 rounded-xl resize-none shadow-sm custom-scrollbar"
                />
              </div>

              {/* Ảnh */}
              <div className="space-y-4 bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl shadow-sm p-6 hover:bg-white/60 transition-all duration-300">
                <Label className="flex items-center gap-2 text-base font-semibold text-slate-700">
                  <ImageIcon className="w-4 h-4 text-emerald-500" />
                  Ảnh (tùy chọn)
                </Label>

                <div className="flex gap-3">
                  <Input
                    placeholder="Dán link ảnh..."
                    value={newImageLink}
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
                        document.getElementById("file-upload-video")?.click()
                      }
                    >
                      <Upload className="w-4 h-4" />
                    </Button>
                    <input
                      id="file-upload-video"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {formData.imageLink && (
                  <div className="relative group inline-block rounded-xl overflow-hidden shadow-md border border-white/60">
                    <img
                      src={formData.imageLink}
                      alt="Preview"
                      className="max-h-64 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
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
          {/* Duyệt ý tưởng */}
          {canEditIdeaFields && editVideo && (
            <Button
              onClick={() => onApproveIdea?.(editVideo)}
              disabled={isLoading || isSaving || !isIdeaValid}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-200/50 rounded-xl px-8"
            >
              {isSaving || isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang duyệt...
                </span>
              ) : (
                "Duyệt ý tưởng"
              )}
            </Button>
          )}
          {/* Duyệt nội dung */}
          {formData.status === "awaiting_content_approval" && (
            <Button
              onClick={() => onApprove?.(formData as VideoItem)}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white shadow-lg cursor-pointer"
            >
              <CheckCircle className="h-4 w-4" />
              {isLoading ? "Đang duyệt..." : "Duyệt"}
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={
              isLoading ||
              isSaving ||
              !isFormValid ||
              (!canEditIdeaFields && !canEditContentApprovalFields)
            }
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg cursor-pointer"
          >
            {isSaving || isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang lưu...
              </span>
            ) : editVideo ? (
              "Cập nhật"
            ) : (
              "Tạo mới"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
