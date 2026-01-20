import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface MissingScheduleAlertProps {
  missingPlatforms: string[];
  onAddSchedule: () => void;
}

export const MissingScheduleAlert: React.FC<MissingScheduleAlertProps> = ({
  missingPlatforms,
  onAddSchedule,
}) => {
  if (missingPlatforms.length === 0) return null;

  return (
    <Alert
      variant="destructive"
      className="mt-2 py-2 bg-orange-50 text-orange-800 border-orange-200"
    >
      <AlertDescription className="ml-2 text-xs">
        <div className="mb-2">
          Chưa có lịch đăng tự động cho:{" "}
          <br />
          <strong>{missingPlatforms.join(", ")}</strong>
          <br /> <br />
          Vui lòng thêm lịch đăng hoặc sử dụng chế độ "Đăng thủ công".
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs border-orange-300 text-orange-700 hover:bg-orange-100 hover:text-orange-900 bg-white/50"
          onClick={onAddSchedule}
        >
          <Plus className="w-3 h-3 mr-1" />
          Thêm lịch đăng
        </Button>
      </AlertDescription>
    </Alert>
  );
};
