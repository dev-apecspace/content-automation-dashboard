import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";

import { Sparkles, DollarSign } from "lucide-react";

interface AiRequirementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: "caption" | "schedule" | "image" | "video-edit" | null;
  initialRequirement?: string;
  hasImage?: boolean; // To determine default action
  onConfirm: (
    requirement: string,
    imageAction?: "create" | "edit",
    duration?: number
  ) => void;
  isLoading: boolean;
  imageCost?: number; // Cost for one image generation
}

export const AiRequirementDialog: React.FC<AiRequirementDialogProps> = ({
  isOpen,
  onClose,
  type,
  initialRequirement = "",
  hasImage = false,
  onConfirm,
  isLoading,
  imageCost, // Receive estimated cost
}) => {
  const [requirement, setRequirement] = useState(initialRequirement);
  const [imageAction, setImageAction] = useState<"create" | "edit">("edit");
  const [duration, setDuration] = useState<string>("");

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setRequirement(initialRequirement);
      setDuration("");
      // Logic for default image action based on existing image
      if (type === "image") {
        setImageAction(hasImage ? "edit" : "create");
      }
    }
  }, [isOpen, initialRequirement, type, hasImage]);

  const handleConfirm = () => {
    const durationNum = duration ? parseInt(duration) : undefined;
    if (type === "image") {
      onConfirm(requirement, imageAction);
    } else if (type === "video-edit") {
      onConfirm(requirement, undefined, durationNum);
    } else {
      onConfirm(requirement);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] lg:max-w-xl bg-white/80 backdrop-blur-2xl border-white/60 shadow-2xl rounded-[32px] p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Decorative Background Gradient */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#FFFBEB]/40 via-[#FEF3C7]/20 to-[#FAFAF9]/40 blur-3xl pointer-events-none" />

        <DialogHeader className="border-b border-white/40 pb-6 pt-6 px-8 bg-white/40 shrink-0 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-300 to-yellow-400 rounded-xl shadow-lg shadow-amber-200/50">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-800 tracking-tight">
                AI Assistant
              </DialogTitle>
              <p className="text-sm text-slate-500 font-medium">
                {type === "image"
                  ? "Sáng tạo & Chỉnh sửa hình ảnh"
                  : type === "schedule"
                  ? "Tối ưu lịch trình đăng bài"
                  : "Chỉnh sửa & Cải thiện Video"}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-6 px-8">
          {type === "image" && (
            <div className="space-y-4">
              <Label className="text-base font-semibold text-slate-700">
                Bạn muốn thực hiện thao tác gì?
              </Label>
              <RadioGroup
                value={imageAction}
                onValueChange={(v: "create" | "edit") => setImageAction(v)}
                className="grid grid-cols-1 gap-3"
              >
                <div
                  className={`relative flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    imageAction === "edit"
                      ? "border-amber-400 bg-amber-50/50 shadow-sm"
                      : "border-slate-100 bg-white/60 hover:bg-white/80 hover:border-slate-200"
                  }`}
                  onClick={() => setImageAction("edit")}
                >
                  <RadioGroupItem
                    value="edit"
                    id="edit-mode"
                    className="border-amber-400 text-amber-500"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="edit-mode"
                      className="text-slate-800 font-semibold cursor-pointer text-sm block mb-1"
                    >
                      Chỉnh sửa ảnh hiện tại
                    </Label>
                    <p className="text-xs text-slate-500 font-normal">
                      Thay đổi chi tiết, màu sắc hoặc phong cách ảnh có sẵn
                    </p>
                  </div>
                </div>

                <div
                  className={`relative flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    imageAction === "create"
                      ? "border-amber-400 bg-amber-50/50 shadow-sm"
                      : "border-slate-100 bg-white/60 hover:bg-white/80 hover:border-slate-200"
                  }`}
                  onClick={() => setImageAction("create")}
                >
                  <RadioGroupItem
                    value="create"
                    id="create-mode"
                    className="border-amber-400 text-amber-500"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="create-mode"
                      className="text-slate-800 font-semibold cursor-pointer text-sm block mb-1"
                    >
                      Tạo ảnh hoàn toàn mới
                    </Label>
                    <p className="text-xs text-slate-500 font-normal">
                      Sáng tạo hình ảnh mới dựa trên mô tả của bạn
                    </p>
                  </div>
                </div>
              </RadioGroup>

              {/* Cost Estimation */}
              {imageCost !== undefined &&
                imageCost > 0 &&
                imageAction === "create" && (
                  <div className="flex items-center gap-3 text-sm text-amber-700 bg-amber-50/80 p-4 rounded-xl border border-amber-100/60 shadow-sm">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <DollarSign className="w-4 h-4 text-amber-600" />
                    </div>
                    <span>
                      Chi phí ước tính:{" "}
                      <strong className="font-bold">${imageCost}</strong>{" "}
                      <span className="text-amber-600/80">
                        (~{(imageCost * 26000).toLocaleString("vi-VN")}đ)
                      </span>
                    </span>
                  </div>
                )}
            </div>
          )}

          {type !== "schedule" && (
            <div className="space-y-3">
              <Label className="text-base font-semibold text-slate-700">
                {type === "image" && imageAction === "create"
                  ? "Mô tả ý tưởng của bạn"
                  : type === "image" && imageAction === "edit"
                  ? "Yêu cầu chỉnh sửa cụ thể"
                  : type === "video-edit"
                  ? "Yêu cầu chỉnh sửa video"
                  : "Hướng dẫn cho AI"}
              </Label>
              <Textarea
                placeholder={
                  type === "image" && imageAction === "create"
                    ? "VD: Một thành phố tương lai rực rỡ ánh đèn neon, phong cách Cyberpunk, chi tiết sắc nét..."
                    : type === "image" && imageAction === "edit"
                    ? "VD: Làm sáng ảnh hơn, thay đổi phông nền sang màu xanh, thêm hiệu ứng mờ ảo..."
                    : type === "video-edit"
                    ? "VD: Thêm hiệu ứng, bỏ nhân vật, đổi góc quay..."
                    : "Nhập yêu cầu chi tiết của bạn..."
                }
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
                className="min-h-[120px] bg-white/50 border-white/60 focus:bg-white/80 focus:border-amber-300 focus:ring-4 focus:ring-amber-100/50 rounded-xl resize-none text-slate-700 placeholder:text-slate-400 shadow-inner p-4 text-sm leading-relaxed"
                required
              />
            </div>
          )}

          {type === "video-edit" && (
            <div className="space-y-3">
              <Label className="text-base font-semibold text-slate-700">
                Thời lượng video mong muốn (giây)
              </Label>
              <Input
                type="number"
                placeholder="VD: 30"
                value={duration}
                required
                onChange={(e) => setDuration(e.target.value)}
                className="h-12 bg-white/50 border-white/60 focus:bg-white/80 focus:border-amber-300 focus:ring-4 focus:ring-amber-100/50 rounded-xl text-slate-700 shadow-sm"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 rounded-xl h-11 border-slate-200 bg-white/50 text-slate-600 hover:bg-white/80 hover:text-slate-800 hover:border-slate-300 font-medium transition-all cursor-pointer"
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 rounded-xl h-11 bg-gradient-to-r from-amber-300 to-yellow-400 hover:from-amber-400 hover:to-yellow-500 text-white shadow-lg shadow-amber-200/50 font-medium transition-all transform active:scale-[0.98] cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Đang xử lý...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Gửi yêu cầu AI
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
