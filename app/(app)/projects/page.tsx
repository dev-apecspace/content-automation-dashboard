"use client"

import { useState, useEffect } from "react"
import { ProjectsTab } from "@/components/projects-tab"
import { getProjects, getContentItems, getSchedules } from "@/lib/api"
import { toast } from "sonner"
import type { Project, ContentItem, Schedule } from "@/lib/types"

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [projectsData, contentData, schedulesData] = await Promise.all([
        getProjects(),
        getContentItems(),
        getSchedules(),
      ])
      setProjects(projectsData)
      setContentItems(contentData)
      setSchedules(schedulesData)
    } catch (error) {
      toast.error("Failed to load data")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Quản Lý Dự Án</h1>
        <p className="text-gray-600 mt-1">Quản lý các dự án và nhóm nội dung</p>
      </div>

      <ProjectsTab
        projects={projects}
        contentItems={contentItems}
        schedules={schedules}
        onUpdateProjects={setProjects}
        isLoading={isLoading}
      />
    </div>
  )
}
