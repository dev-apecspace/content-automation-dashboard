// This file is deprecated. Permissions are now managed in the database.
// This constant is kept empty to avoid breaking imports but should not be used.
export const PERMISSIONS = [] as const;

export type PermissionId = string;

// Danh sách quyền NGHIỆP VỤ có thể gán cho gói dịch vụ (khách hàng mua gói
// nhận các quyền này). Quyền kinh doanh (packages/customers/subscriptions/
// industries.*) không bao giờ nằm trong gói — chỉ admin/nhân viên có.
export interface PackagePermissionOption {
  id: string;
  label: string;
}

export interface PackagePermissionGroup {
  group: string;
  perms: PackagePermissionOption[];
}

export const PACKAGE_PERMISSION_GROUPS: PackagePermissionGroup[] = [
  {
    group: "Dự án",
    perms: [
      { id: "projects.view", label: "Xem" },
      { id: "projects.create", label: "Tạo" },
      { id: "projects.edit", label: "Sửa" },
      { id: "projects.delete", label: "Xóa" },
    ],
  },
  {
    group: "Bài viết + ảnh",
    perms: [
      { id: "content.view", label: "Xem" },
      { id: "content.create", label: "Tạo" },
      { id: "content.edit", label: "Sửa" },
      { id: "content.delete", label: "Xóa" },
    ],
  },
  {
    group: "Video",
    perms: [
      { id: "videos.view", label: "Xem" },
      { id: "videos.create", label: "Tạo" },
      { id: "videos.edit", label: "Sửa" },
      { id: "videos.delete", label: "Xóa" },
    ],
  },
  {
    group: "Lịch đăng",
    perms: [
      { id: "schedules.view", label: "Xem" },
      { id: "schedules.create", label: "Tạo" },
      { id: "schedules.edit", label: "Sửa" },
      { id: "schedules.delete", label: "Xóa" },
    ],
  },
  {
    group: "Tài khoản MXH",
    perms: [
      { id: "accounts.view", label: "Xem" },
      { id: "accounts.create", label: "Tạo" },
      { id: "accounts.edit", label: "Sửa" },
      { id: "accounts.delete", label: "Xóa" },
    ],
  },
  {
    group: "Khác",
    perms: [
      { id: "prompts.view", label: "Prompts AI" },
      { id: "users.view", label: "Thành viên" },
    ],
  },
];
