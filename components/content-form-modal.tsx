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
} from "lucide-react";
import { getProjects } from "@/lib/api";
import { ContentItem, contentTypes } from "@/lib/types";
import { useFullscreen } from "@/stores/useFullscreenStore";
import { uploadImageFile } from "@/app/api/cloudinary";

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

type Status = "idea" | "awaiting_content_approval" | string;
interface Project {
  id: string;
  name: string;
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

  // ------------------- LOAD PROJECTS -------------------
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

  // ------------------- KHI MỞ MODAL ĐỂ EDIT -------------------
  useEffect(() => {
    if (editContent) {
      const currentImage = editContent.imageLink;

      setFormData({
        ...editContent,
        imageLink: currentImage,
        expectedPostDate: editContent.postingTime
          ? editContent.postingTime.split(" ")[0].split("/").reverse().join("-")
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

  // ------------------- GỘP NGÀY GIỜ -------------------
  const updatePostingTime = (date: string, time: string) => {
    if (date && time) {
      const [year, month, day] = date.split("-");
      const formatted = `${day}/${month}/${year} ${time}`;
      setFormData((prev) => ({ ...prev, postingTime: formatted }));
    }
  };

  // ------------------- GỌI AI CHỈNH SỬA -------------------
  const handleEditWithAI = async (
    type: "caption" | "schedule" | "image",
    content?: string
  ) => {
    try {
      const payload = {
        type,
        content,
        imageUrl: type === "image" ? formData.imageLink : undefined,
        projectId: formData.projectId,
        contentId: editContent?.id,
      };

      await fetch("https://your-n8n-webhook-url.com/webhook/content-ai-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      alert("Đã gửi yêu cầu chỉnh sửa đến AI thành công!");
    } catch (error) {
      console.error("Lỗi gửi webhook:", error);
      alert("Gửi yêu cầu thất bại, vui lòng thử lại.");
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
    currentStatus === "awaiting_content_approval";

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
                {editContent ? "Chỉnh sửa nội dung" : "Tạo nội dung mới"}
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                {canEditIdeaFields && "Giai đoạn: Ý tưởng ban đầu"}
                {canEditContentApprovalFields && "Giai đoạn: Duyệt nội dung"}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* ==================== GIAI ĐOẠN Ý TƯỞNG ==================== */}
          {canEditIdeaFields && (
            <div className="space-y-6">
              {/* Ý tưởng */}
              <div className="space-y-2">
                <Label
                  htmlFor="idea"
                  className="flex items-center gap-2 text-base font-semibold text-gray-700"
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
                  className="border-2 border-amber-200 focus:border-amber-400 bg-white"
                />
              </div>

              {/* Dự án & Nền tảng */}
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
                    <Monitor className="w-4 h-4 text-blue-500" />
                    Nền tảng
                  </Label>
                  <Input
                    value={formData.platform}
                    disabled
                    className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-blue-200 text-gray-700 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Loại content */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-base font-semibold text-gray-700">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  Loại content <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.contentType}
                  onValueChange={(v) =>
                    setFormData((prev) => ({ ...prev, contentType: v }))
                  }
                  required
                >
                  <SelectTrigger className="border-2 border-blue-200 bg-white">
                    <SelectValue placeholder="Chọn loại content" />
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

              {/* Ảnh tham khảo (idea phase) */}
              <div className="space-y-4 bg-gradient-to-br from-indigo-50 to-blue-50 p-5 rounded-xl border-2 border-indigo-200">
                <Label className="flex items-center gap-2 text-base font-semibold text-gray-700">
                  <Image className="w-4 h-4 text-blue-500" />
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
                        setFormData((prev) => ({ ...prev, imageLink: value }));
                      }
                    }}
                    className="flex-1 border-2 border-indigo-300 focus:border-indigo-500 bg-white"
                  />
                  <label>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
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

                {/* Hiển thị ảnh ngay khi có link (ưu tiên formData.imageLink) */}
                {formData.imageLink && (
                  <div className="relative group inline-block">
                    <img
                      src={formData.imageLink}
                      alt="Preview"
                      className="max-h-64 rounded-lg border-2 border-indigo-300"
                    />
                    <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditWithAI("image")}
                        className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                        title="AI chỉnh sửa"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
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

                {/* Yêu cầu sửa ảnh */}
                {formData.imageLink && (
                  <>
                    <Label className="flex items-center gap-2 mt-4 text-base font-semibold text-gray-700">
                      Yêu cầu chỉnh sửa ảnh (tùy chọn)
                    </Label>
                    <Textarea
                      value={imageEditRequest}
                      onChange={(e) => setImageEditRequest(e.target.value)}
                      placeholder="VD: Thêm filter vintage, đổi nền trắng..."
                      rows={2}
                      className="border-2 border-indigo-300 focus:border-indigo-500 bg-white"
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {/* ==================== GIAI ĐOẠN DUYỆT NỘI DUNG ==================== */}
          {canEditContentApprovalFields && (
            <div className="space-y-6">
              {/* Thời gian đăng */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="flex items-center gap-2 text-base font-semibold text-gray-700">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    Thời gian đăng <span className="text-red-500">*</span>
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleEditWithAI("schedule", formData.postingTime)
                    }
                  >
                    <Sparkles className="w-4 h-4 mr-2 text-yellow-300" />
                    Xếp lịch khác
                  </Button>
                </div>
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

              {/* Caption */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <Label className="flex items-center gap-2 text-base font-semibold text-gray-700">
                    <MessageSquare className="w-4 h-4 text-purple-500" />
                    Caption <span className="text-red-500">*</span>
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleEditWithAI("caption", formData.caption)
                    }
                  >
                    <Sparkles className="w-4 h-4 mr-2 text-yellow-300" />
                    AI sửa
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
                  rows={5}
                  required
                  className="border-2 border-purple-200 focus:border-purple-400 bg-white"
                />
              </div>

              {/* Ảnh sẽ đăng */}
              <div className="space-y-4 p-5 rounded-xl border-2 border-green-200">
                <Label className="flex items-center gap-2 text-base font-semibold text-gray-700">
                  <Image className="w-4 h-4 text-green-500" />
                  Ảnh sẽ đăng <span className="text-red-500">*</span>
                </Label>

                <div className="flex gap-3">
                  <Input
                    placeholder="Dán link ảnh..."
                    value={newImageLink}
                    onChange={(e) => {
                      const value = e.target.value.trim();
                      setNewImageLink(value);
                      if (value) {
                        setFormData((prev) => ({ ...prev, imageLink: value }));
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
                        document.getElementById("file-upload-approval")?.click()
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
                  <div className="relative group inline-block">
                    <img
                      src={formData.imageLink}
                      alt="Ảnh đăng"
                      className="max-h-96 rounded-lg border-2 border-green-300"
                    />
                    <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditWithAI("image")}
                        className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                        title="AI chỉnh sửa"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
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

          {/* Không có quyền chỉnh sửa */}
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
            ) : editContent ? (
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
