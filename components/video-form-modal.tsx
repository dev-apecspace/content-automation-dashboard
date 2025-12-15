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
  Plus,
  X,
  CheckCircle2,
} from "lucide-react";
import { getProjects } from "@/lib/api";
import { VideoItem, Project } from "@/lib/types";
import { uploadImageFile } from "@/app/api/cloudinary";

interface VideoFormModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  onSave: (item: Partial<VideoItem>) => void;
  editVideo?: VideoItem | null;
  isSaving?: boolean;
  isLoading?: boolean;
}

export const VideoFormModal: React.FC<VideoFormModalProps> = ({
  isOpen,
  onClose,
  onOpenChange,
  onSave,
  editVideo,
  isSaving,
  isLoading,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);

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

  useEffect(() => {
    async function fetchProjects() {
      try {
        const realProjects = await getProjects();
        setProjects(realProjects);
      } catch (error) {
        console.error("Error loading projects:", error);
      }
    }
    fetchProjects();
  }, []);

  useEffect(() => {
    if (editVideo) {
      setFormData({
        ...editVideo,
        expectedPostDate: editVideo.postingTime
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
      const currentPlatforms = Array.isArray(prev.platform)
        ? prev.platform
        : [prev.platform as string];
      const updated = currentPlatforms.includes(platform as any)
        ? currentPlatforms.filter((p) => p !== platform)
        : [...currentPlatforms, platform];
      return { ...prev, platform: updated as any };
    });
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

  const handleReplaceImageLink = () => {
    if (newImageLink.trim()) {
      setFormData((prev) => ({ ...prev, imageLink: newImageLink.trim() }));
      setNewImageLink("");
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, imageLink: undefined }));
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
    !!formData.title?.trim();

  const isApprovalValid =
    canEditContentApprovalFields &&
    !!formData.postingTime &&
    !!formData.caption?.trim();

  const isFormValid = isIdeaValid || isApprovalValid;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange || handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-blue-50">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            {canEditIdeaFields && (
              <div className="p-2 bg-amber-100 rounded-lg">
                <Lightbulb className="w-6 h-6 text-amber-600" />
              </div>
            )}
            {canEditContentApprovalFields && (
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            )}
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-800">
                {editVideo ? "Chỉnh sửa video" : "Tạo video mới"}
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                {canEditIdeaFields && "Giai đoạn: Ý tưởng ban đầu"}
                {canEditContentApprovalFields && "Giai đoạn: Duyệt nội dung"}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {canEditIdeaFields && (
            <div className="space-y-6">
              {/* Ý tưởng */}
              <div className="space-y-2">
                <Label
                  htmlFor="idea"
                  className="flex items-center gap-2 text-base font-semibold text-gray-700"
                >
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  Ý tưởng <span className="text-red-500">*</span>
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
                  className="border-2 border-amber-200 focus:border-amber-400 bg-white"
                />
              </div>

              {/* Dự án & Tiêu đề */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-base font-semibold text-gray-700">
                    <Folder className="w-4 h-4 text-blue-500" />
                    Dự án <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={handleProjectChange}
                    required
                  >
                    <SelectTrigger className="border-2 border-blue-200 bg-white">
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

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-base font-semibold text-gray-700">
                    <Film className="w-4 h-4 text-purple-500" />
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
                    placeholder="Tiêu đề video..."
                    className="border-2 border-purple-200 focus:border-purple-400 bg-white"
                  />
                </div>
              </div>

              {/* Nền tảng */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-base font-semibold text-gray-700">
                  <Monitor className="w-4 h-4 text-blue-500" />
                  Nền tảng
                </Label>
                <div className="flex flex-wrap gap-4 p-4 border-2 border-blue-200 rounded-lg bg-white">
                  {["Facebook Reels", "Youtube Shorts"].map((platform) => (
                    <div key={platform} className="flex items-center gap-2">
                      <Checkbox
                        id={platform}
                        checked={Array.isArray(formData.platform)
                          ? formData.platform.includes(platform as any)
                          : false}
                        onCheckedChange={() => handlePlatformToggle(platform)}
                      />
                      <label
                        htmlFor={platform}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {platform}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Thời lượng & Link video */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-base font-semibold text-gray-700">
                    <Clock className="w-4 h-4 text-orange-500" />
                    Thời lượng (giây)
                  </Label>
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
                    className="border-2 border-orange-200 focus:border-orange-400 bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-base font-semibold text-gray-700">
                    <Film className="w-4 h-4 text-indigo-500" />
                    Link video hiện có
                  </Label>
                  <Input
                    value={formData.existingVideoLink || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        existingVideoLink: e.target.value,
                      }))
                    }
                    placeholder="https://..."
                    className="border-2 border-indigo-200 focus:border-indigo-400 bg-white"
                  />
                </div>
              </div>

              {/* Thông tin bổ sung */}
              <div className="space-y-4 p-4 rounded-lg border-2 border-gray-200 bg-gray-50">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Chủ đề (tùy chọn)
                  </Label>
                  <Input
                    value={formData.topic || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, topic: e.target.value }))
                    }
                    placeholder="Chủ đề video..."
                    className="border-2 border-gray-300 bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Đối tượng tiếp cận (tùy chọn)
                  </Label>
                  <Input
                    value={formData.targetAudience || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        targetAudience: e.target.value,
                      }))
                    }
                    placeholder="Đối tượng..."
                    className="border-2 border-gray-300 bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
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
                    className="border-2 border-gray-300 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {canEditContentApprovalFields && (
            <div className="space-y-6">
              {/* Thời gian đăng */}
              <div>
                <Label className="flex items-center gap-2 text-base font-semibold text-gray-700 mb-4">
                  <Clock className="w-4 h-4 text-blue-500" />
                  Thời gian đăng <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Ngày đăng
                    </label>
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
                      className="border-2 border-blue-200 focus:border-blue-400 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
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
                      className="border-2 border-blue-200 focus:border-blue-400 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Caption & CTA */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-base font-semibold text-gray-700">
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
                  className="border-2 border-purple-200 focus:border-purple-400 bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Call to Action (tùy chọn)
                </Label>
                <Input
                  value={formData.callToAction || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      callToAction: e.target.value,
                    }))
                  }
                  placeholder="VD: Like, comment, share..."
                  className="border-2 border-indigo-200 focus:border-indigo-400 bg-white"
                />
              </div>

              {/* Ảnh thumbnail */}
              <div className="space-y-4 p-5 rounded-xl border-2 border-green-200">
                <Label className="flex items-center gap-2 text-base font-semibold text-gray-700">
                  Ảnh thumbnail (tùy chọn)
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
                    className="flex-1 border-2 border-green-300 focus:border-green-500 bg-white"
                  />
                  <label>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-green-600 text-green-600 hover:bg-green-50"
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
                  <div className="relative group inline-block">
                    <img
                      src={formData.imageLink}
                      alt="Preview"
                      className="max-h-64 rounded-lg border-2 border-green-300"
                    />
                    <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={handleRemoveImage}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                        title="Xóa"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {!canEditIdeaFields && !canEditContentApprovalFields && (
            <div className="flex items-center justify-center gap-3 py-8">
              <p className="font-semibold text-orange-600">
                Không thể chỉnh sửa ở trạng thái hiện tại
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4 gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading || isSaving}
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
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
          >
            {isSaving || isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang lưu...
              </span>
            ) : editVideo ? (
              "Cập nhật"
            ) : (
              "Thêm mới"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
