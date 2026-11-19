"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ProjectsTab } from "@/components/projects/projects-tab";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type {
  Project,
  ContentItem,
  Schedule,
  VideoItem,
  Account,
} from "@/lib/types";
import type { Customer } from "@/lib/api/business";
import {
  getProjects,
  getContentItems,
  getSchedules,
  getVideoItems,
} from "@/lib/api";
import { AccountService } from "@/lib/services/account-service";

/**
 * Workspace của 1 công ty (URL /{slug}): mọi data scoped theo customer.
 * Admin xem công ty nào cũng qua đây; user khách vào đúng công ty của mình.
 */
export function CompanyWorkspace({
  customer,
  isCustomerUser,
}: {
  customer: Customer;
  isCustomerUser: boolean;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [videoItems, setVideoItems] = useState<VideoItem[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [projectsData, contentData, videoData, schedulesData, accountsData] =
        await Promise.all([
          getProjects(),
          getContentItems({ pageSize: 1000 }),
          getVideoItems({ pageSize: 1000 }),
          getSchedules(),
          AccountService.getAccounts(),
        ]);
      // Scope: chỉ dự án của công ty này (content/video/schedule stats
      // lấy theo project id nên để nguyên, thẻ dự án tự lọc)
      setProjects(
        projectsData.filter((p) => p.customer_id === customer.id)
      );
      setContentItems(contentData.data || []);
      setVideoItems(videoData.data || []);
      setSchedules(schedulesData);
      setAccounts(accountsData);
    } catch {
      toast.error("Không tải được dữ liệu công ty");
    } finally {
      setIsLoading(false);
    }
  }, [customer.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6 p-6">
      {/* Header công ty */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isCustomerUser ? (
              <span>Công ty của bạn</span>
            ) : (
              <>
                <Link
                  href="/companies"
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Chọn công ty khác
                </Link>
              </>
            )}
          </div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            {customer.name}
            {customer.industry && (
              <Badge variant="outline">{customer.industry.name}</Badge>
            )}
            <Badge
              variant="outline"
              className={
                customer.status === "active"
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                  : "border-zinc-500/20 bg-zinc-500/10 text-zinc-500"
              }
            >
              {customer.status === "active" ? "Đang hợp tác" : "Ngừng hợp tác"}
            </Badge>
          </h1>
          <p className="font-mono text-xs text-muted-foreground">
            /{customer.slug}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ProjectsTab
          projects={projects}
          contentItems={contentItems}
          videoItems={videoItems}
          schedules={schedules}
          accounts={accounts}
          onUpdateProjects={setProjects}
        />
      )}
    </div>
  );
}
