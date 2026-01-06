"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  Edit2,
  Trash2,
  Plus,
  Image,
  ExternalLink,
  CheckCircle,
  X,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContentItem, Project } from "@/lib/types";
import { platformColors, statusConfig, type Status } from "@/lib/types";
import { useEffect, useState } from "react";
import { getProjects } from "@/lib/api";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";
import { PaginationControl } from "@/components/ui/pagination-control";

interface ContentTableProps {
  data: ContentItem[];
  isLoading?: boolean;
  onViewDetails: (item: ContentItem) => void;
  onEdit: (item: ContentItem) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onApproveIdea?: (item: ContentItem) => void;
  onApproveContent?: (item: ContentItem) => void;
  onViewImage?: (item: ContentItem) => void;
  onViewPost?: (item: ContentItem) => void;
  filterStatus: Status | "all";
  onFilterChange: (status: Status | "all") => void;
  filterProject: string;
  onProjectFilterChange: (projectId: string) => void;
  onReload?: () => void;
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function ContentTable({
  data,
  onViewDetails,
  onEdit,
  onDelete,
  onAdd,
  onApproveIdea,
  onApproveContent,
  onViewImage,
  onViewPost,
  filterStatus,
  onFilterChange,
  filterProject,
  onProjectFilterChange,
  onReload,
  isLoading,
  page,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
}: ContentTableProps) {
  const allStatuses: Status[] = Object.keys(statusConfig) as Status[];
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const { hasPermission } = usePermissions();

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

  const triggerAiSearchIdeas = async () => {
    if (!confirm("Bạn có chắc chắn muốn gọi AI tạo ý tưởng?")) return;

    setLoading(true);
    try {
      const res = await fetch("/api/webhook/ai-search-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postType: "content" }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Lỗi gọi AI tạo ý tưởng");
      }

      toast.success("AI đang tạo ý tưởng...");
    } catch (error: any) {
      console.error("Lỗi khi gọi AI:", error);
      toast.error(error.message || "Không thể tạo ý tưởng bằng AI lúc này");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/60 shadow-sm rounded-xl p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">
              Trạng thái:
            </span>
            <Select
              value={filterStatus}
              onValueChange={(v) => onFilterChange(v as Status | "all")}
            >
              <SelectTrigger className="w-[220px] bg-white/60 border-white/60 focus:ring-indigo-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {allStatuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {statusConfig[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">Dự án:</span>
            <Select value={filterProject} onValueChange={onProjectFilterChange}>
              <SelectTrigger className="w-[180px] bg-white/60 border-white/60 focus:ring-indigo-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {hasPermission("content.create") && (
            <Button
              onClick={onAdd}
              className="ml-auto bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white shadow-md shadow-indigo-200 border-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm ý tưởng
            </Button>
          )}
          {hasPermission("content.create") && (
            <Button
              onClick={triggerAiSearchIdeas}
              disabled={loading}
              className={`flex items-center gap-2 font-medium transition-all duration-200 cursor-pointer border-0 shadow-md ${
                loading
                  ? "bg-gray-100 text-gray-400"
                  : "bg-gradient-to-r from-amber-200 to-yellow-400 hover:from-amber-300 hover:to-yellow-500 text-amber-900"
              }`}
            >
              {loading ? <>✨ Đang tạo...</> : <>✨ AI tạo ý tưởng</>}
            </Button>
          )}
          {onReload && (
            <Button
              variant="outline"
              size="icon"
              onClick={onReload}
              className="bg-white/40 p-1.5 rounded-lg border border-white/60 shadow-sm backdrop-blur-sm cursor-pointer"
              title="Làm mới"
              disabled={isLoading}
            >
              <RefreshCw
                className={cn(
                  "h-4 w-4 text-slate-600",
                  isLoading && "animate-spin"
                )}
              />
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <Card className="bg-white/60 backdrop-blur-xl border-white/60 shadow-lg rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-gray-200 backdrop-blur-sm">
              <tr>
                <th className="text-left p-4 font-semibold text-sm text-slate-600">
                  Trạng thái
                </th>
                <th className="text-left p-4 font-semibold text-sm text-slate-600">
                  Ý tưởng
                </th>
                <th className="text-left p-4 font-semibold text-sm text-slate-600">
                  Dự án
                </th>
                <th className="text-left p-4 font-semibold text-sm text-slate-600">
                  Nền tảng
                </th>
                <th className="text-left p-4 font-semibold text-sm text-slate-600">
                  Thời gian đăng
                </th>
                <th className="text-left p-4 font-semibold text-sm text-slate-600">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40">
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-12 text-center text-slate-500 font-medium"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                        <Image className="w-6 h-6 text-slate-400" />
                      </div>
                      Không có dữ liệu
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-indigo-50/30 transition-colors"
                  >
                    {/* Trạng thái */}
                    <td className="p-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          "border shadow-sm bg-white/50 backdrop-blur-sm py-1",
                          statusConfig[item.status].className
                        )}
                      >
                        {statusConfig[item.status].label}
                      </Badge>
                    </td>
                    {/* Ý tưởng */}
                    <td
                      className="p-4 font-medium text-slate-700 max-w-[250px] truncate"
                      title={item.idea}
                    >
                      {item.idea}
                    </td>
                    {/* Dự án */}
                    <td className="p-4">
                      {(() => {
                        const projectColor =
                          projects.find((p) => p.id === item.projectId)
                            ?.color || "#6B7280";

                        return (
                          <Badge
                            variant="outline"
                            className="bg-white/50 backdrop-blur-sm shadow-sm"
                            style={{
                              backgroundColor: `${projectColor}15`,
                              color: projectColor,
                              borderColor: `${projectColor}40`,
                            }}
                          >
                            {item.projectName}
                          </Badge>
                        );
                      })()}
                    </td>
                    {/* Nền tảng  */}
                    <td className="p-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          "border shadow-sm bg-white/50 backdrop-blur-sm",
                          platformColors[item.platform]
                        )}
                      >
                        {item.platform}
                      </Badge>
                    </td>
                    {/* Thời gian đăng */}
                    <td className="p-4 text-sm tracking-tight">
                      <span>{item.postingTime || ""}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1 flex-wrap">
                        {/* Xem chi tiết */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onViewDetails(item)}
                          title="Xem chi tiết"
                          className="hover:bg-white/60 hover:text-indigo-600"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* Chỉnh sửa */}
                        {hasPermission("content.edit") &&
                          (item.status === "idea" ||
                            item.status === "awaiting_content_approval" ||
                            item.status === "content_approved" ||
                            item.status === "post_removed") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEdit(item)}
                              title="Chỉnh sửa"
                              className="hover:bg-white/60 hover:text-indigo-600"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}

                        {/* Phê duyệt ý tưởng */}
                        {hasPermission("content.approve") &&
                          item.status === "idea" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onApproveIdea?.(item)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Phê duyệt ý tưởng"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}

                        {/* Phê duyệt nội dung */}
                        {hasPermission("content.approve") &&
                          item.status === "awaiting_content_approval" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onApproveContent?.(item)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Phê duyệt nội dung"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}

                        {/* Xem ảnh */}
                        {item.imageLinks &&
                          item.imageLinks.length > 0 &&
                          (!item.posts || item.posts.length === 0) &&
                          onViewImage && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onViewImage(item)}
                              title={`Xem ${item.imageLinks.length} ảnh`}
                              className="hover:bg-white/60 hover:text-indigo-600 w-auto px-2"
                            >
                              <Image className="h-4 w-4" />
                              {item.imageLinks.length > 1 && (
                                <span className="ml-1 text-[10px] font-bold">
                                  {item.imageLinks.length}
                                </span>
                              )}
                            </Button>
                          )}

                        {/* Xem post */}
                        {item.status === "posted_successfully" &&
                          item.posts &&
                          item.posts.length > 0 &&
                          onViewPost && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onViewPost(item)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title={`Xem post\nReactions: ${(
                                item.posts || []
                              ).reduce(
                                (acc, p) => acc + (p.reactions || 0),
                                0
                              )}\nComments: ${(item.posts || []).reduce(
                                (acc, p) => acc + (p.comments || 0),
                                0
                              )}\nShares: ${(item.posts || []).reduce(
                                (acc, p) => acc + (p.shares || 0),
                                0
                              )}`}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}

                        {/* Xóa ý tưởng */}
                        {hasPermission("content.delete") &&
                          item.status === "idea" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDelete(item.id)}
                              className="text-red-400 hover:text-red-600 hover:bg-red-50"
                              title="Xóa ý tưởng"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="border-t border-gray-200">
            <PaginationControl
              currentPage={page}
              pageSize={pageSize}
              totalCount={totalCount}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
