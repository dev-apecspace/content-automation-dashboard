import { getSchedulesByProjectId } from "@/lib/api/schedules";
import { Platform } from "@/lib/types";
import { useCallback, useState } from "react";
import { toast } from "sonner";

export const useScheduleCheck = () => {
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [missingPlatforms, setMissingPlatforms] = useState<Platform[]>([]);

  const openWarning = (platforms: Platform[]) => {
    setMissingPlatforms(platforms);
    setIsWarningOpen(true);
  };

  const closeWarning = () => {
    setIsWarningOpen(false);
    setMissingPlatforms([]);
  };

  const checkMissingSchedules = useCallback(
    async (projectId: string, platforms: Platform[]): Promise<Platform[]> => {
      if (!projectId || !platforms || platforms.length === 0) return [];

      try {
        const schedules = await getSchedulesByProjectId(projectId);

        // Find platforms that are selected but NOT in the schedules list
        const missing = platforms.filter(
          (p) => !schedules.some((s) => s.platform === p && s.isActive),
        );

        return missing;
      } catch (error) {
        console.error("Error checking schedules:", error);
        // On error, we might fallback to empty to avoid blocking, or throw
        toast.error("Không thể kiểm tra lịch đăng hiện tại");
        return [];
      }
    },
    [],
  );

  return {
    checkMissingSchedules,
    isWarningOpen,
    missingPlatforms,
    openWarning,
    closeWarning,
  };
};
