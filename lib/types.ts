export type Platform =
  | "Facebook Post"
  | "Facebook Reels"
  | "Youtube Shorts"
  | "Tiktok Carousel"
  | "Tiktok Video";

export const platformColors: Record<string, string> = {
  "Facebook Post": "bg-blue-500 text-blue-100 border-blue-300",
  "Facebook Reels": "bg-blue-100 text-blue-700 border-blue-300",
  "Youtube Shorts": "bg-red-500 text-white border-red-300",
  "Tiktok Carousel": "bg-black text-white border-gray-600",
  "Tiktok Video": "bg-black text-white border-gray-600",
  Tiktok: "bg-black text-white border-gray-600",
};

export type AccountPlatform = "Facebook" | "Youtube" | "Tiktok";

export const accountPlatformColors: Record<AccountPlatform, string> = {
  Facebook: "bg-blue-600 text-white border-blue-400",
  Youtube: "bg-red-600 text-white border-red-400",
  Tiktok: "bg-black text-white border-gray-600",
};

export interface Account {
  id: string;
  platform: AccountPlatform;
  channelId: string;
  channelName: string;
  channelLink?: string;
  token: string;
  clientId?: string;
  clientSecret?: string;
  projectId?: string;
  projectName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

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

export interface Post {
  id: string;
  itemId: string;
  itemType: "content" | "video";
  platform: string;
  postUrl?: string;
  publishedAt?: string;
  status: "published" | "removed";
  statsAt?: string;
  views?: number;
  reactions?: number;
  comments?: number;
  shares?: number;
  createdAt: string;
  updatedAt: string;
  accountId?: string;
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
  postingTime?: string; // Dự kiến đăng
  callToAction?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  expectedPostDate: string;
  accountIds?: string[];
  posts?: Post[];
}

export interface ContentItem extends BaseContentItem {
  platform: Platform;
  contentType: string;
  imageLinks?: string[];
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
}

export type ModelType = "video" | "image" | "audio" | "text";

export interface AIModel {
  id: number;
  name: string;
  modelType: ModelType;
  costPerUnit: number;
  unitType: "per_second" | "per_megapixel" | "per_run";
  currency?: string;
  isActive?: boolean;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type ItemType = "video" | "content";

export type CostType = "generate" | "edit";

export interface CostLog {
  id: number;
  itemId: string;
  itemType: ItemType;
  costType: CostType;
  amount: number;
  currency?: string;
  description?: string | null;
  aiModelId?: number | null;
  loggedAt?: string;
  aiModels?: AIModel;
}

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
    video: { cost: number; count: number; duration: number }; // duration in seconds
    image: { cost: number; count: number };
    audio: { cost: number; count: number };
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
  | "remove-post"
  | "login"
  | "logout"
  | "visit_page"
  | "unauthorized_access";

export type EntityType =
  | "content"
  | "schedule"
  | "project"
  | "user"
  | "settings"
  | "video"
  | "auth"
  | "page"
  | "security";

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

export const activityTypeConfig: Record<
  ActivityType,
  { label: string; className: string }
> = {
  create: {
    label: "Tạo mới",
    className: "bg-blue-700 text-blue-100",
  },
  update: {
    label: "Cập nhật",
    className: "bg-yellow-500 text-yellow-100",
  },
  delete: {
    label: "Xóa",
    className: "bg-orange-700 text-orange-100",
  },
  approve: {
    label: "Phê duyệt",
    className: "bg-cyan-700 text-cyan-100",
  },
  publish: {
    label: "Đăng bài",
    className: "bg-green-700 text-green-100",
  },
  schedule: {
    label: "Tạo lịch",
    className: "bg-pink-700 text-pink-100",
  },
  "remove-post": {
    label: "Xóa bài đăng",
    className: "bg-red-700 text-red-100",
  },
  login: {
    label: "Đăng nhập",
    className: "bg-green-600 text-green-100",
  },
  logout: {
    label: "Đăng xuất",
    className: "bg-slate-700 text-slate-100",
  },
  visit_page: {
    label: "Truy cập trang",
    className: "bg-indigo-100 text-indigo-600",
  },
  unauthorized_access: {
    label: "Truy cập trái phép",
    className: "bg-red-500 text-white",
  },
};

export const entityTypeConfig: Record<
  EntityType,
  { label: string; className: string }
> = {
  content: {
    label: "Nội dung",
    className: "bg-indigo-700 text-indigo-100",
  },
  schedule: {
    label: "Lịch đăng",
    className: "bg-cyan-700 text-cyan-100",
  },
  project: {
    label: "Dự án",
    className: "bg-teal-700 text-teal-100",
  },
  user: {
    label: "Người dùng",
    className: "bg-amber-700 text-amber-100",
  },
  settings: {
    label: "Cài đặt",
    className: "bg-gray-700 text-gray-100",
  },
  video: {
    label: "Video",
    className: "bg-rose-700 text-rose-100",
  },
  auth: {
    label: "Xác thực",
    className: "bg-violet-700 text-violet-100",
  },
  page: {
    label: "Trang",
    className: "bg-indigo-600 text-indigo-100",
  },
  security: {
    label: "Bảo mật",
    className: "bg-red-700 text-red-100",
  },
};
