"use client"

import { useState, useEffect } from "react"
import { ContentTable } from "@/components/content-table"
import { ContentFormModal } from "@/components/content-form-modal"
import { ContentDetailModal } from "@/components/content-detail-modal"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getContentItems, createActivityLog } from "@/lib/api"
import { toast } from "sonner"
import type { ContentItem } from "@/lib/types"

export default function ContentPage() {
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [editContent, setEditContent] = useState<ContentItem | null>(null)
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null)
  const [filterStatus, setFilterStatus] = useState<"cho_duyet" | "da_dang_thanh_cong" | "dang_xu_ly" | "loi" | "all">("all")
  const [filterProject, setFilterProject] = useState<string>("all")

  useEffect(() => {
    loadContentItems()
  }, [filterStatus, filterProject])

  const loadContentItems = async () => {
    try {
      setIsLoading(true)
      const data = await getContentItems({
        status: filterStatus !== "all" ? (filterStatus as any) : undefined,
        projectId: filterProject !== "all" ? filterProject : undefined,
      })
      setContentItems(data)
    } catch (error) {
      toast.error("Failed to load content items")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateClick = () => {
    setEditContent(null)
    setIsFormModalOpen(true)
  }

  const handleEditClick = (item: ContentItem) => {
    setEditContent(item)
    setIsFormModalOpen(true)
  }

  const handleViewClick = (item: ContentItem) => {
    setSelectedContent(item)
    setIsDetailModalOpen(true)
  }

  const handleDeleteContent = async (id: string) => {
    try {
      const { deleteContentItem } = await import("@/lib/api")
      await deleteContentItem(id)
      setContentItems((prev) => prev.filter((c) => c.id !== id))
      toast.success("Content deleted!")

      await createActivityLog("delete", "content", id, {
        userId: "user_1",
        description: "Deleted content item",
      })
    } catch (error) {
      toast.error("Failed to delete content")
      console.error(error)
    }
  }

  const handleApproveContent = async (item: ContentItem) => {
    try {
      const { approveContent } = await import("@/lib/api")
      const updated = await approveContent(item.id, "user_1")
      setContentItems((prev) => prev.map((c) => (c.id === item.id ? updated : c)))
      toast.success("Content approved!")

      await createActivityLog("approve", "content", item.id, {
        userId: "user_1",
        newValues: { status: "da_dang_thanh_cong" },
        description: `Approved: ${item.idea}`,
      })
    } catch (error) {
      toast.error("Failed to approve content")
      console.error(error)
    }
  }

  const handleSaveContent = async (data: Partial<ContentItem>) => {
    try {
      setIsSaving(true)

      if (editContent) {
        const { updateContentItem } = await import("@/lib/api")
        const updated = await updateContentItem(editContent.id, data)
        setContentItems((prev) => prev.map((c) => (c.id === editContent.id ? updated : c)))
        toast.success("Content updated!")

        await createActivityLog("update", "content", editContent.id, {
          userId: "user_1",
          newValues: data,
          description: `Updated: ${data.idea || editContent.idea}`,
        })
      } else {
        const { createContentItem } = await import("@/lib/api")
        const newContent = await createContentItem({
          ...data,
          status: "cho_duyet",
          idea: data.idea || "",
          projectId: data.projectId || "",
          projectName: data.projectName || "",
          platform: "Facebook Post",
          imageLink: data.imageLink || "",
          topic: data.topic || "",
          targetAudience: data.targetAudience || "",
          researchNotes: data.researchNotes || "",
          expectedPostDate: data.expectedPostDate || "",
          postingTime: data.postingTime || "",
        } as Omit<ContentItem, "id" | "createdAt" | "updatedAt">)

        setContentItems((prev) => [...prev, newContent])
        toast.success("Content created!")

        await createActivityLog("create", "content", newContent.id, {
          userId: "user_1",
          newValues: { idea: newContent.idea, status: "cho_duyet" },
          description: `Created: ${newContent.idea}`,
        })
      }

      setEditContent(null)
      setIsFormModalOpen(false)
    } catch (error) {
      toast.error("Failed to save content")
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản Lý Bài Viết</h1>
          <p className="text-gray-600 mt-1">Quản lý bài viết Facebook (ảnh + nội dung text)</p>
        </div>
        <Button onClick={handleCreateClick} className="gap-2">
          <Plus className="h-4 w-4" />
          Tạo Bài Viết
        </Button>
      </div>

      <ContentTable
        data={contentItems}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        filterProject={filterProject}
        onProjectFilterChange={setFilterProject}
        onViewDetails={handleViewClick}
        onEdit={handleEditClick}
        onDelete={handleDeleteContent}
        onApprove={handleApproveContent}
        onAdd={handleCreateClick}
      />

      <ContentFormModal
        isOpen={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        onSave={handleSaveContent}
        editContent={editContent}
        isSaving={isSaving}
      />

      <ContentDetailModal
        isOpen={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        content={selectedContent}
      />
    </div>
  )
}
