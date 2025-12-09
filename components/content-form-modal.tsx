"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ContentItem, Platform } from "@/lib/types"
import { projects } from "@/lib/mock-data"

interface ContentFormModalProps {
  isOpen: boolean
  onClose?: () => void
  onOpenChange?: (open: boolean) => void
  onSave: (item: Partial<ContentItem>) => void
  editContent?: ContentItem | null
  editItem?: ContentItem | null
  isSaving?: boolean
  isLoading?: boolean
}

const platforms: Platform[] = ["Facebook Post", "Facebook Reels", "Youtube Shorts"]

export function ContentFormModal({ 
  isOpen, 
  onClose, 
  onOpenChange,
  onSave, 
  editItem,
  editContent,
  isLoading,
  isSaving
}: ContentFormModalProps) {
  const [formData, setFormData] = useState<Partial<ContentItem>>({
    status: "cho_duyet",
    idea: "",
    projectId: "",
    projectName: "",
    platform: "Facebook Post",
    existingVideoLink: "",
    videoDuration: 5,
    imageLink: "",
    topic: "",
    targetAudience: "",
    researchNotes: "",
    expectedPostDate: "",
    postingTime: "",
  })

  const currentEdit = editContent || editItem

  useEffect(() => {
    if (currentEdit) {
      setFormData(currentEdit)
    } else {
      setFormData({
        status: "cho_duyet",
        idea: "",
        projectId: "",
        projectName: "",
        platform: "Facebook Post",
        existingVideoLink: "",
        videoDuration: 5,
        imageLink: "",
        topic: "",
        targetAudience: "",
        researchNotes: "",
        expectedPostDate: "",
        postingTime: "",
      })
    }
  }, [currentEdit, isOpen])

  const handleProjectChange = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    setFormData((prev) => ({
      ...prev,
      projectId,
      projectName: project?.name || "",
    }))
  }

  const handleClose = () => {
    if (onOpenChange) {
      onOpenChange(false)
    } else if (onClose) {
      onClose()
    }
  }

  const handleSubmit = () => {
    onSave(formData)
    handleClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange || onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{currentEdit ? "Chỉnh sửa nội dung" : "Thêm nội dung mới"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="idea">Ý tưởng *</Label>
              <Input
                id="idea"
                value={formData.idea}
                onChange={(e) => setFormData((prev) => ({ ...prev, idea: e.target.value }))}
                placeholder="Nhập ý tưởng nội dung"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic">Chủ đề</Label>
              <Input
                id="topic"
                value={formData.topic}
                onChange={(e) => setFormData((prev) => ({ ...prev, topic: e.target.value }))}
                placeholder="Nhập chủ đề"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dự án *</Label>
              <Select value={formData.projectId} onValueChange={handleProjectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn dự án" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nền tảng *</Label>
              <Select
                value={formData.platform}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, platform: v as Platform }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="videoLink">Link video có sẵn</Label>
              <Input
                id="videoLink"
                value={formData.existingVideoLink}
                onChange={(e) => setFormData((prev) => ({ ...prev, existingVideoLink: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="videoDuration">Thời lượng video (giây)</Label>
              <Input
                id="videoDuration"
                type="number"
                value={formData.videoDuration}
                onChange={(e) => setFormData((prev) => ({ ...prev, videoDuration: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageLink">Link ảnh</Label>
            <Input
              id="imageLink"
              value={formData.imageLink}
              onChange={(e) => setFormData((prev) => ({ ...prev, imageLink: e.target.value }))}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetAudience">Đối tượng tiếp cận</Label>
            <Textarea
              id="targetAudience"
              value={formData.targetAudience}
              onChange={(e) => setFormData((prev) => ({ ...prev, targetAudience: e.target.value }))}
              placeholder="Mô tả đối tượng mục tiêu (tuổi, giới tính, nghề nghiệp...)"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="researchNotes">Lưu ý nghiên cứu</Label>
            <Textarea
              id="researchNotes"
              value={formData.researchNotes}
              onChange={(e) => setFormData((prev) => ({ ...prev, researchNotes: e.target.value }))}
              placeholder="Ghi chú nghiên cứu, tham khảo..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expectedPostDate">Ngày đăng dự kiến</Label>
              <Input
                id="expectedPostDate"
                type="date"
                value={formData.expectedPostDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, expectedPostDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postingTime">Giờ đăng</Label>
              <Input
                id="postingTime"
                type="time"
                value={formData.postingTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, postingTime: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading || isSaving}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || isSaving} className="bg-[#1a365d] hover:bg-[#2a4a7d] disabled:opacity-50">
            {isSaving || isLoading ? "Đang lưu..." : currentEdit ? "Cập nhật" : "Thêm mới"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
