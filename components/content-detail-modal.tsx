"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, Edit2, Calendar, Clock, Users, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ContentItem, ContentStatus, Platform } from "@/lib/types"
import { projects } from "@/lib/mock-data"

interface ContentDetailModalProps {
  isOpen: boolean
  onClose?: () => void
  onOpenChange?: (open: boolean) => void
  item?: ContentItem | null
  content?: ContentItem | null
  onApprove?: (item: ContentItem) => void
  onEdit?: (item: ContentItem) => void
  isLoading?: boolean
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

export function ContentDetailModal({ 
  isOpen, 
  onClose, 
  onOpenChange,
  item,
  content,
  onApprove, 
  onEdit, 
  isLoading 
}: ContentDetailModalProps) {
  const currentItem = content || item
  if (!currentItem) return null

  const project = projects.find((p) => p.id === currentItem.projectId)

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange || onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{currentItem.idea}</DialogTitle>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge variant="outline" className={cn("border", statusConfig[currentItem.status].className)}>
                  {statusConfig[currentItem.status].label}
                </Badge>
                <Badge
                  variant="outline"
                  style={{
                    backgroundColor: `${project?.color}20`,
                    borderColor: project?.color,
                    color: project?.color,
                  }}
                >
                  {currentItem.projectName}
                </Badge>
                <Badge variant="outline" className={cn("border", platformColors[currentItem.platform])}>
                  {currentItem.platform}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
          <Card>
            <CardContent className="p-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Ngày đăng</div>
                <div className="text-sm font-medium">{currentItem.expectedPostDate || "-"}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Giờ đăng</div>
                <div className="text-sm font-medium">{currentItem.postingTime || "-"}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Thời lượng</div>
                <div className="text-sm font-medium">{currentItem.videoDuration}s</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Chủ đề</div>
                <div className="text-sm font-medium truncate">{currentItem.topic || "-"}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Thông tin</TabsTrigger>
            <TabsTrigger value="script">Kịch bản AI</TabsTrigger>
            <TabsTrigger value="caption">Caption & CTA</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">Đối tượng tiếp cận</h4>
                  <p className="text-sm">{currentItem.targetAudience || "Chưa xác định"}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">Lưu ý nghiên cứu</h4>
                  <p className="text-sm">{currentItem.researchNotes || "Chưa có ghi chú"}</p>
                </div>
                {currentItem.existingVideoLink && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">Link video có sẵn</h4>
                    <a
                      href={currentItem.existingVideoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {currentItem.existingVideoLink}
                    </a>
                  </div>
                )}
                {currentItem.imageLink && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">Link ảnh</h4>
                    <a
                      href={currentItem.imageLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {currentItem.imageLink}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="script" className="space-y-4 mt-4">
            {!currentItem.script || currentItem.script.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  Kịch bản chưa được tạo bởi AI
                </CardContent>
              </Card>
            ) : (
              currentItem.script.map((scene) => (
                <Card key={scene.scene}>
                  <CardContent className="p-4 space-y-2">
                    <Badge className="bg-[#1a365d]">Cảnh {scene.scene}</Badge>
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground">Mô tả hình ảnh:</h4>
                      <p className="text-sm mt-1">{scene.description}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground">Lời thoại:</h4>
                      <p className="text-sm mt-1 italic">"{scene.dialogue}"</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="caption" className="space-y-4 mt-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Caption:</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{currentItem.caption || "Chưa có caption"}</p>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Lời kêu gọi hành động (CTA):</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{currentItem.callToAction || "Chưa có CTA"}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-6">
          <Button variant="outline" onClick={() => onEdit?.(currentItem)} disabled={isLoading}>
            <Edit2 className="h-4 w-4 mr-2" />
            Chỉnh sửa
          </Button>
          {currentItem.status === "cho_duyet" && (
            <Button 
              onClick={() => onApprove?.(currentItem)} 
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isLoading ? "Đang phê duyệt..." : "Phê duyệt & Gửi đăng"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
