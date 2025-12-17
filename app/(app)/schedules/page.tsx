"use client";

import { useState, useEffect } from "react";
import { ScheduleTab } from "@/components/schedule-tab";
import {
  getSchedules,
  getProjects,
  getContentItems,
  getVideoItems,
} from "@/lib/api";
import { toast } from "sonner";
import type { Schedule, Project } from "@/lib/types";

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [contentItems, setContentItems] = useState<any[]>([]);
  const [videoItems, setVideoItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [schedulesData, projectsData, contentData, videoData] =
        await Promise.all([
          getSchedules(),
          getProjects(),
          getContentItems(),
          getVideoItems(),
        ]);
      setSchedules(schedulesData);
      setProjects(projectsData);
      setContentItems(contentData);
      setVideoItems(videoData);
    } catch (error) {
      toast.error("Failed to load schedules");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Lịch Đăng</h1>
        <p className="text-gray-600 mt-1">
          Quản lý lịch đăng nội dung trên các nền tảng
        </p>
      </div>

      <ScheduleTab
        schedules={schedules}
        projects={projects}
        contentItems={contentItems}
        videoItems={videoItems}
        isLoading={isLoading}
        onUpdate={setSchedules}
      />
    </div>
  );
}
