// Types matching the Google Sheets structure

export type ContentStatus = "cho_duyet" | "da_dang_thanh_cong" | "dang_xu_ly" | "loi"

export type Platform = "Facebook Post" | "Facebook Reels" | "Youtube Shorts"

export type Frequency = "10 phút/lần" | "Tuần" | "Ngày" | "Tháng" | "3 ngày/lần"

export interface Project {
  id: string
  name: string
  color: string
}

export interface Schedule {
  id: string
  projectId: string
  projectName: string
  platform: Platform
  frequency: Frequency
  postingDays: string
  postingTime: string
}

export interface ContentItem {
  id: string
  status: ContentStatus
  idea: string
  projectId: string
  projectName: string
  platform: "Facebook Post"
  imageLink?: string
  topic?: string
  targetAudience?: string
  researchNotes?: string
  expectedPostDate?: string
  postingTime?: string
  caption?: string
  callToAction?: string
  approvedBy?: string
  approvedAt?: string
  publishedAt?: string
  createdAt?: string
  updatedAt?: string
}

export interface VideoItem {
  id: string
  status: ContentStatus
  idea: string
  projectId: string
  projectName: string
  platform: "Facebook Reels" | "Youtube Shorts"
  existingVideoLink?: string
  videoDuration?: number
  imageLink?: string
  topic?: string
  targetAudience?: string
  researchNotes?: string
  expectedPostDate?: string
  postingTime?: string
  script?: {
    scene: number
    description: string
    dialogue: string
  }[]
  caption?: string
  callToAction?: string
  approvedBy?: string
  approvedAt?: string
  publishedAt?: string
  createdAt?: string
  updatedAt?: string
}

export type ActiveTab = "bai-viet" | "video" | "lich-dang" | "du-an" | "huong-dan" | "cai-dat" | "nhat-ky"
