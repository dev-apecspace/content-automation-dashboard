"use client";

import { useState, useEffect } from "react";
import { ProjectsTab } from "@/components/projects/projects-tab";
import {
  getProjects,
  getContentItems,
  getSchedules,
  getVideoItems,
} from "@/lib/api";
import { toast } from "sonner";
import type {
  Project,
  ContentItem,
  Schedule,
  VideoItem,
  Account,
} from "@/lib/types";
import { AccountService } from "@/lib/services/account-service";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [videoItems, setVideoItems] = useState<VideoItem[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [
        projectsData,
        contentData,
        videoData,
        schedulesData,
        accountsData,
      ] = await Promise.all([
        getProjects(),
        getContentItems({ pageSize: 1000 }),
        getVideoItems({ pageSize: 1000 }),
        getSchedules(),
        AccountService.getAccounts(),
      ]);
      setProjects(projectsData);
      setContentItems(contentData.data || []);
      setVideoItems(videoData.data || []);
      setSchedules(schedulesData);
      setAccounts(accountsData);
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
        accounts={accounts}
        onUpdateProjects={setProjects}
        isLoading={isLoading}
      />
    </div>
  );
}
