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
import { Sparkles } from "lucide-react";

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
}

export const AiRequirementDialog: React.FC<AiRequirementDialogProps> = ({
  isOpen,
  onClose,
  type,
  initialRequirement = "",
  hasImage = false,
  onConfirm,
  isLoading,
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
      <DialogContent className="max-w-md bg-white mx-3">
        <DialogHeader>
          <DialogTitle>Yêu cầu cho AI</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {type === "image" && (
            <div className="space-y-3">
              <Label>Bạn muốn làm gì?</Label>
              <RadioGroup
                value={imageAction}
                onValueChange={(v: "create" | "edit") => setImageAction(v)}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="edit" id="edit-mode" />
                  <Label
                    htmlFor="edit-mode"
                    className="cursor-pointer font-normal"
                  >
                    Chỉnh sửa ảnh hiện tại
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="create" id="create-mode" />
                  <Label
                    htmlFor="create-mode"
                    className="cursor-pointer font-normal"
                  >
                    Tạo ảnh hoàn toàn mới
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}
          {type !== "schedule" && (
            <div className="space-y-2 mt-4">
              <Label>
                {type === "image" && imageAction === "create"
                  ? "Mô tả ảnh bạn muốn tạo:"
                  : type === "image" && imageAction === "edit"
                  ? "Yêu cầu chỉnh sửa ảnh:"
                  : type === "video-edit"
                  ? "Yêu cầu sửa video:"
                  : "Bạn muốn AI sửa như thế nào?"}
              </Label>
              <Textarea
                placeholder={
                  type === "image" && imageAction === "create"
                    ? "VD: Một thành phố tương lai, cyberpunk..."
                    : type === "image" && imageAction === "edit"
                    ? "VD: Ngắn gọn hơn, giọng văn vui vẻ, đổi màu ảnh..."
                    : type === "video-edit"
                    ? "VD: Cắt ngắn, thêm hiệu ứng, đổi nhạc nền..."
                    : "Nhập yêu cầu..."
                }
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
                className="min-h-[100px]"
                required
              />
            </div>
          )}
          {type === "video-edit" && (
            <div className="space-y-2">
              <Label>Thời lượng video (giây):</Label>
              <Input
                type="number"
                placeholder="VD: 30"
                value={duration}
                required
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-yellow-400 hover:bg-yellow-500 text-white cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang gửi...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-1" />
                Gửi yêu cầu
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
