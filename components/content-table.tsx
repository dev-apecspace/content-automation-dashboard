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
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContentItem, Project } from "@/lib/types";
import { platformColors, statusConfig, type Status } from "@/lib/types";
import { useEffect, useState } from "react";
import { getProjects } from "@/lib/api";
import { toast } from "sonner";

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
}: ContentTableProps) {
  const allStatuses: Status[] = Object.keys(statusConfig) as Status[];
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

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

      toast.success("AI đang tạo ý tưởng!");
    } catch (error: any) {
      console.error("Lỗi khi gọi AI:", error);
      toast.error(error.message || "Không thể tạo ý tưởng bằng AI lúc này");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Trạng thái:
            </span>
            <Select
              value={filterStatus}
              onValueChange={(v) => onFilterChange(v as Status | "all")}
            >
              <SelectTrigger className="w-[220px]">
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
            <span className="text-sm font-medium text-muted-foreground">
              Dự án:
            </span>
            <Select value={filterProject} onValueChange={onProjectFilterChange}>
              <SelectTrigger className="w-[180px]">
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
          <Button
            onClick={onAdd}
            className="ml-auto bg-[#1a365d] hover:bg-[#2a4a7d]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm ý tưởng
          </Button>
          <Button
            onClick={triggerAiSearchIdeas}
            disabled={loading}
            className={`flex items-center gap-2 p-3 font-medium transition-all duration-200 cursor-pointer
    ${
      loading
        ? "bg-gray-100 text-gray-400"
        : "bg-amber-100 hover:bg-yellow-300 text-black border border-amber-300 shadow-md"
    }`}
          >
            {loading ? <>✨ Đang tạo...</> : <>✨ AI tạo ý tưởng</>}
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-semibold text-sm">
                  Trạng thái
                </th>
                <th className="text-left p-4 font-semibold text-sm">Ý tưởng</th>
                <th className="text-left p-4 font-semibold text-sm">Dự án</th>
                <th className="text-left p-4 font-semibold text-sm">
                  Nền tảng
                </th>
                <th className="text-left p-4 font-semibold text-sm">
                  Thời gian đăng
                </th>
                <th className="text-left p-4 font-semibold text-sm">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-muted-foreground"
                  >
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t hover:bg-muted/30 transition-colors"
                  >
                    {/* Trạng thái */}
                    <td className="p-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          "border",
                          statusConfig[item.status].className
                        )}
                      >
                        {statusConfig[item.status].label}
                      </Badge>
                    </td>
                    {/* Ý tưởng */}
                    <td
                      className="p-4 font-medium max-w-[200px] truncate"
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
                            style={{
                              backgroundColor: `${projectColor}20`,
                              color: projectColor,
                              borderColor: projectColor,
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
                        className={cn("border", platformColors[item.platform])}
                      >
                        {item.platform}
                      </Badge>
                    </td>
                    {/* Thời gian đăng */}
                    <td className="p-4 text-sm">
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
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* Chỉnh sửa */}
                        {(item.status === "idea" ||
                          item.status === "awaiting_content_approval" ||
                          item.status === "content_approved") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(item)}
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Phê duyệt ý tưởng */}
                        {item.status === "idea" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onApproveIdea?.(item)}
                            className="text-green-600 hover:text-green-700"
                            title="Phê duyệt ý tưởng"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Phê duyệt nội dung */}
                        {item.status === "awaiting_content_approval" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onApproveContent?.(item)}
                            className="text-green-600 hover:text-green-700"
                            title="Phê duyệt nội dung"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Xem ảnh */}
                        {item.imageLink && !item.postUrl && onViewImage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onViewImage(item)}
                            title="Xem ảnh"
                          >
                            <Image className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Xem post */}
                        {item.postUrl && onViewPost && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onViewPost(item)}
                            className="text-blue-600 hover:text-blue-700"
                            title="Xem post"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Xóa ý tưởng */}
                        {item.status === "idea" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(item.id)}
                            className="text-red-600 hover:text-red-700"
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
        </div>
      </Card>
    </div>
  );
}
