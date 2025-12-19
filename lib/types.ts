export type Platform = "Facebook Post" | "Facebook Reels" | "Youtube Shorts";

export const platformColors: Record<Platform, string> = {
  "Facebook Post": "bg-blue-500 text-blue-100 border-blue-300",
  "Facebook Reels": "bg-blue-100 text-blue-700 border-blue-300",
  "Youtube Shorts": "bg-red-500 text-white border-red-300",
};

export const contentTypes = [
  { value: "product", label: "Sản phẩm" },
  { value: "brand", label: "Brand" },
  { value: "other", label: "Khác" },
];

export type Frequency = "Tuần" | "Ngày" | "Tháng" | "3 ngày/lần";

export type ActiveTab =
  | "bai-viet"
  | "video"
  | "lich-dang"
  | "du-an"
  | "huong-dan"
  | "cai-dat"
  | "nhat-ky";

export type Status =
  | "idea"
  | "idea_approved"
  | "ai_generating_content"
  | "awaiting_content_approval"
  | "content_approved"
  | "posted_successfully"
  | "ai_editing_media"
  | "media_edited"
  | "removing_post"
  | "post_removed"
  | "error";

export const statusConfig: Record<
  Status,
  { label: string; className: string }
> = {
  idea: {
    label: "Ý tưởng",
    className: "bg-yellow-100 text-yellow-700 border-yellow-300",
  },
  idea_approved: {
    label: "Đã duyệt ý tưởng",
    className: "bg-green-100 text-green-700 border-green-300",
  },
  ai_generating_content: {
    label: "AI đang tạo nội dung",
    className: "bg-sky-100 text-sky-700 border-sky-300",
  },
  awaiting_content_approval: {
    label: "Chờ duyệt nội dung",
    className: "bg-orange-100 text-orange-700 border-orange-300",
  },
  content_approved: {
    label: "Đã duyệt nội dung",
    className: "bg-green-100 text-green-700 border-green-300",
  },
  posted_successfully: {
    label: "Đã đăng thành công",
    className: "bg-green-600 text-white border-green-700",
  },
  ai_editing_media: {
    label: "AI đang sửa media",
    className: "bg-sky-100 text-sky-700 border-sky-300",
  },
  media_edited: {
    label: "Đã sửa media",
    className: "bg-green-100 text-green-700 border-green-300",
  },
  removing_post: {
    label: "Xóa post",
    className: "bg-red-100 text-red-700 border-red-300",
  },
  post_removed: {
    label: "Đã xóa post",
    className: "bg-gray-100 text-gray-700 border-gray-300",
  },
  error: {
    label: "Lỗi",
    className: "bg-red-100 text-red-700 border-red-300",
  },
};

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface Schedule {
  id: string;
  projectId: string;
  projectName: string;
  platform: Platform;
  frequency: Frequency;
  postingDays: string;
  postingTime: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface BaseContentItem {
  id: string;
  status: Status;
  idea: string;
  projectId: string;
  projectName: string;
  topic?: string;
  targetAudience?: string;
  researchNotes?: string;
  postUrl?: string;
  postingTime?: string;
  callToAction?: string;
  approvedBy?: string;
  approvedAt?: string;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  reactions?: number;
  comments?: number;
  shares?: number;
  statsAt?: string;
  expectedPostDate: string;
}

export interface ContentItem extends BaseContentItem {
  platform: "Facebook Post";
  contentType: string;
  imageLink?: string;
  editRequest?: string; // Không lưu db
  caption?: string;
}

export interface VideoItem extends BaseContentItem {
  platform: Platform[];
  videoDuration?: number;
  existingVideoLink?: string;
  imageLink?: string;
  videoLink?: string;
  title?: string;
  caption?: string;
  views?: number;
}

// Inteface for Model Configuration
export interface ModelConfig {
  id: string;
  type: "video" | "audio" | "image";
  name: string;
  cost: number;
  unit: "per_second" | "per_megapixel" | "per_run";
}

export const DEFAULT_MODELS: ModelConfig[] = [
  {
    id: "kling-2.5",
    type: "video",
    name: "Kling 2.5 Turbo Pro",
    cost: 0.07,
    unit: "per_second",
  },
  {
    id: "mmaudio-v2",
    type: "audio",
    name: "mmaudio-v2",
    cost: 0.001,
    unit: "per_second",
  },
  {
    id: "flux-1-krea",
    type: "image",
    name: "FLUX.1 Krea [dev]",
    cost: 0.025,
    unit: "per_megapixel",
  },
];

// Dashboard Types
export interface DashboardStats {
  totalProjects: number;
  totalPosts: number; // status !== 'post_removed'
  pendingApprovals: number; // awaiting_content_approval + idea (if needed)
  scheduledPosts: number; // posted_successfully but in future? Or simply 'posted_successfully' count for now or distinct status?
  // Let's stick to status counts for now
  totalViews: number; // derived from video views
  totalReactions: number;
}

// Detailed Analytics Types
export interface PlatformDistribution {
  platform: Platform | "Other";
  count: number;
  percentage: number;
}

export interface StatusDistribution {
  status: Status;
  count: number;
  label: string;
}

export interface ProjectStats {
  projectId: string;
  projectName: string;
  total: number;
  posted: number;
  waiting: number; // content_approved
  pending: number; // idea or awaiting_content_approval
}

export interface ContentStats {
  totalItems: number;
  pendingApproval: number;
  readyToPost: number;
  overdue: number;
  byPlatform: PlatformDistribution[];
  byStatus: StatusDistribution[];
  byProject: ProjectStats[];
  topPerforming: ContentItem[];
}

export interface VideoStats {
  totalVideos: number;
  totalViews: number;
  avgDuration: number;
  pendingApproval: number;
  readyToPost: number;
  overdue: number;
  posted: number;
  byPlatform: PlatformDistribution[]; // Some videos are multi-platform
  byProject: ProjectStats[];
  topPerforming: VideoItem[];
}

// Cost Analytics Types
export interface CostStats {
  totalCost: number;
  byType: {
    video: number;
    image: number;
    audio: number;
  };
  dailyCosts: {
    date: string;
    cost: number;
  }[];
}

export interface ScheduleStats {
  week: number;
  month: number;
  year: number;
}

export interface DetailedDashboardData extends DashboardData {
  contentStats: ContentStats;
  videoStats: VideoStats;
  costStats: CostStats;
}

export interface ChartDataPoint {
  date: string;
  views: number;
  reactions: number;
  comments: number;
  shares: number;
  posts: number;
}

export type ActivityType =
  | "create"
  | "update"
  | "delete"
  | "approve"
  | "publish"
  | "schedule"
  | "remove-post";

export type EntityType =
  | "content"
  | "schedule"
  | "project"
  | "user"
  | "settings"
  | "video";

export interface ActivityLog {
  id: number;
  user_id: string | null;
  activity_type: ActivityType;
  entity_type: EntityType;
  entity_id: string;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  description: string | null;
  created_at: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recentActivity: ActivityLog[];
  performanceHistory: ChartDataPoint[];
}
