"use client";

import { useState, useEffect } from "react";
import { ProjectsTab } from "@/components/projects-tab";
import {
  getProjects,
  getContentItems,
  getSchedules,
  getVideoItems,
} from "@/lib/api";
import { toast } from "sonner";
import type { Project, ContentItem, Schedule, VideoItem } from "@/lib/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [videoItems, setVideoItems] = useState<VideoItem[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [projectsData, contentData, videoData, schedulesData] =
        await Promise.all([
          getProjects(),
          getContentItems(),
          getVideoItems(),
          getSchedules(),
        ]);
      setProjects(projectsData);
      setContentItems(contentData);
      setVideoItems(videoData);
      setSchedules(schedulesData);
    } catch (error) {
      toast.error("Failed to load data");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ProjectsTab
        projects={projects}
        contentItems={contentItems}
        videoItems={videoItems}
        schedules={schedules}
        onUpdateProjects={setProjects}
        isLoading={isLoading}
      />
    </div>
  );
}
