export type Platform = "Facebook Post" | "Facebook Reels" | "Youtube Shorts";

export const platformColors: Record<Platform, string> = {
  "Facebook Post": "bg-blue-100 text-blue-700 border-blue-300",
  "Facebook Reels": "bg-pink-100 text-pink-700 border-pink-300",
  "Youtube Shorts": "bg-red-100 text-red-700 border-red-300",
};

export const contentTypes = [
  { value: "product", label: "Sản phẩm" },
  { value: "brand", label: "Brand" },
  { value: "other", label: "Khác" }
];

export type Frequency =
  | "10 phút/lần"
  | "Tuần"
  | "Ngày"
  | "Tháng"
  | "3 ngày/lần";

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
    className: "bg-gray-100 text-gray-700 border-gray-300",
  },
  idea_approved: {
    label: "Đã duyệt ý tưởng",
    className: "bg-blue-100 text-blue-700 border-blue-300",
  },
  ai_generating_content: {
    label: "AI đang tạo nội dung",
    className: "bg-purple-100 text-purple-700 border-purple-300",
  },
  awaiting_content_approval: {
    label: "Chờ duyệt nội dung",
    className: "bg-orange-100 text-orange-700 border-orange-300",
  },
  content_approved: {
    label: "Đã duyệt nội dung",
    className: "bg-indigo-100 text-indigo-700 border-indigo-300",
  },
  posted_successfully: {
    label: "Đã đăng thành công",
    className: "bg-green-100 text-green-700 border-green-300",
  },
  ai_editing_media: {
    label: "AI đang sửa media",
    className: "bg-yellow-100 text-yellow-700 border-yellow-300",
  },
  media_edited: {
    label: "Đã sửa media",
    className: "bg-teal-100 text-teal-700 border-teal-300",
  },
  removing_post: {
    label: "Xóa post",
    className: "bg-red-100 text-red-700 border-red-300",
  },
  post_removed: {
    label: "Đã xóa post",
    className: "bg-black-100 text-black-700 border-black-300",
  },
  error: { label: "Lỗi", className: "bg-red-100 text-red-700 border-red-300" },
};

export interface Project {
  id: string;
  name: string;
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
}

export interface ContentItem {
  id: string;
  status: Status;
  idea: string;
  projectId: string;
  projectName: string;
  platform: "Facebook Post";
  contentType: string;
  imageLink?: string;
  topic?: string;
  targetAudience?: string;
  researchNotes?: string;
  postingTime?: string;
  caption?: string;
  postUrl? :string;
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
}

export interface VideoItem {
  id: string;
  status: Status;
  idea: string;
  projectId: string;
  projectName: string;
  platform: "Facebook Reels" | "Youtube Shorts";
  existingVideoLink?: string;
  videoDuration?: number;
  imageLink?: string;
  topic?: string;
  targetAudience?: string;
  researchNotes?: string;
  expectedPostDate?: string;
  postingTime?: string;
  script?: {
    scene: number;
    description: string;
    dialogue: string;
  }[];
  caption?: string;
  postUrl?: string;
  callToAction?: string;
  approvedBy?: string;
  approvedAt?: string;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}
