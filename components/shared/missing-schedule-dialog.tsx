import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle } from "lucide-react";

interface MissingScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  missingPlatforms: string[];
  onAddSchedule: () => void;
}

export const MissingScheduleDialog: React.FC<MissingScheduleDialogProps> = ({
  isOpen,
  onClose,
  missingPlatforms,
  onAddSchedule,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border-white/60 shadow-2xl rounded-2xl">
        <DialogHeader className="p-0">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="w-6 h-6" />
            <DialogTitle className="text-xl font-bold">
              Chưa có lịch đăng
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-slate-500 mb-2">
            Dự án này chưa có lịch đăng tự động cho các nền tảng sau:
          </p>
          <ul className="list-disc list-inside space-y-1 bg-amber-50 p-4 rounded-lg border border-amber-100">
            {missingPlatforms.map((p) => (
              <li key={p} className="text-amber-900 font-medium text-sm">
                {p}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-slate-500">
            Bạn cần thêm lịch đăng để AI có thể tự động xếp lịch.
          </p>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-end pr-0 pb-0">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button
            onClick={() => {
              onAddSchedule();
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            Thêm lịch đăng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
