"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, CheckCircle, Edit2, Trash2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ContentItem, ContentStatus, Platform } from "@/lib/types"
import { projects } from "@/lib/mock-data"

interface ContentTableProps {
  data: ContentItem[]
  onViewDetails: (item: ContentItem) => void
  onApprove: (item: ContentItem) => void
  onEdit: (item: ContentItem) => void
  onDelete: (id: string) => void
  onAdd: () => void
  filterStatus: ContentStatus | "all"
  onFilterChange: (status: ContentStatus | "all") => void
  filterProject: string
  onProjectFilterChange: (projectId: string) => void
}

const statusConfig: Record<ContentStatus, { label: string; className: string }> = {
  cho_duyet: { label: "Chờ duyệt", className: "bg-orange-100 text-orange-700 border-orange-300" },
  da_dang_thanh_cong: { label: "Đã đăng thành công", className: "bg-green-100 text-green-700 border-green-300" },
  dang_xu_ly: { label: "Đang xử lý", className: "bg-blue-100 text-blue-700 border-blue-300" },
  loi: { label: "Lỗi", className: "bg-red-100 text-red-700 border-red-300" },
}

const platformColors: Record<Platform, string> = {
  "Facebook Post": "bg-blue-100 text-blue-700 border-blue-300",
  "Facebook Reels": "bg-pink-100 text-pink-700 border-pink-300",
  "Youtube Shorts": "bg-red-100 text-red-700 border-red-300",
}

export function ContentTable({
  data,
  onViewDetails,
  onApprove,
  onEdit,
  onDelete,
  onAdd,
  filterStatus,
  onFilterChange,
  filterProject,
  onProjectFilterChange,
}: ContentTableProps) {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Trạng thái:</span>
            <Select value={filterStatus} onValueChange={(v) => onFilterChange(v as ContentStatus | "all")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="cho_duyet">Chờ duyệt</SelectItem>
                <SelectItem value="da_dang_thanh_cong">Đã đăng thành công</SelectItem>
                <SelectItem value="dang_xu_ly">Đang xử lý</SelectItem>
                <SelectItem value="loi">Lỗi</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Dự án:</span>
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
          <Button onClick={onAdd} className="ml-auto bg-[#1a365d] hover:bg-[#2a4a7d]">
            <Plus className="h-4 w-4 mr-2" />
            Thêm nội dung
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-semibold text-sm">Trạng thái</th>
                <th className="text-left p-4 font-semibold text-sm">Ý tưởng</th>
                <th className="text-left p-4 font-semibold text-sm">Dự án</th>
                <th className="text-left p-4 font-semibold text-sm">Nền tảng</th>
                <th className="text-left p-4 font-semibold text-sm">Đối tượng tiếp cận</th>
                <th className="text-left p-4 font-semibold text-sm">Ngày đăng dự kiến</th>
                <th className="text-left p-4 font-semibold text-sm">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <Badge variant="outline" className={cn("border", statusConfig[item.status].className)}>
                        {statusConfig[item.status].label}
                      </Badge>
                    </td>
                    <td className="p-4 font-medium max-w-[200px] truncate">{item.idea}</td>
                    <td className="p-4">
                      <Badge
                        variant="outline"
                        style={{
                          backgroundColor: `${projects.find((p) => p.id === item.projectId)?.color}20`,
                          borderColor: projects.find((p) => p.id === item.projectId)?.color,
                          color: projects.find((p) => p.id === item.projectId)?.color,
                        }}
                      >
                        {item.projectName}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className={cn("border", platformColors[item.platform])}>
                        {item.platform}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground max-w-[200px] truncate">
                      {item.targetAudience || "-"}
                    </td>
                    <td className="p-4 text-sm">
                      {item.expectedPostDate ? (
                        <span>
                          {item.expectedPostDate} {item.postingTime}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => onViewDetails(item)} title="Xem chi tiết">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onEdit(item)} title="Chỉnh sửa">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        {item.status === "cho_duyet" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onApprove(item)}
                            className="text-green-600 hover:text-green-700"
                            title="Phê duyệt"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(item.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
  )
}
