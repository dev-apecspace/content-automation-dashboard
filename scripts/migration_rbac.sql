-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY, -- slug style id: 'admin', 'editor', etc.
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY, -- e.g. 'users.view'
  label TEXT NOT NULL,
  bg_group TEXT NOT NULL, -- 'group' is a reserved keyword in some contexts, using 'bg_group' or just 'group_name' to be safe, or just quote "group"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id TEXT REFERENCES roles(id) ON DELETE CASCADE,
  permission_id TEXT REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

-- Seed Default Roles
INSERT INTO roles (id, name, description) VALUES
('admin', 'Admin', 'Quản trị viên hệ thống, có toàn quyền'),
('editor', 'Editor', 'Biên tập viên, có thể tạo và sửa nội dung'),
('viewer', 'Viewer', 'Người xem, chỉ được xem dữ liệu')
ON CONFLICT (id) DO NOTHING;

-- Seed Permissions (Matches lib/constants/permissions.ts)
INSERT INTO permissions (id, label, bg_group) VALUES
-- Users
('users.view', 'Xem danh sách người dùng', 'Users'),
('users.create', 'Tạo người dùng mới', 'Users'),
('users.edit', 'Chỉnh sửa người dùng', 'Users'),
('users.delete', 'Xóa người dùng', 'Users'),
-- Roles
('roles.view', 'Xem danh sách vai trò', 'Roles'),
('roles.create', 'Tạo vai trò mới', 'Roles'),
('roles.edit', 'Chỉnh sửa vai trò', 'Roles'),
('roles.delete', 'Xóa vai trò', 'Roles'),
-- Content
('content.view', 'Xem nội dung', 'Content'),
('content.create', 'Tạo nội dung', 'Content'),
('content.edit', 'Sửa nội dung', 'Content'),
('content.delete', 'Xóa nội dung', 'Content'),
('content.approve', 'Duyệt nội dung', 'Content'),
-- Videos
('videos.view', 'Xem video list', 'Videos'),
('videos.create', 'Tạo video post', 'Videos'),
('videos.edit', 'Sửa video', 'Videos'),
('videos.delete', 'Xóa video', 'Videos'),
-- Projects
('projects.view', 'Xem dự án', 'Projects'),
('projects.create', 'Tạo dự án', 'Projects'),
('projects.edit', 'Sửa dự án', 'Projects'),
('projects.delete', 'Xóa dự án', 'Projects'),
-- Accounts
('accounts.view', 'Xem tài khoản', 'Accounts'),
('accounts.create', 'Thêm tài khoản', 'Accounts'),
('accounts.edit', 'Sửa tài khoản', 'Accounts'),
('accounts.delete', 'Xóa tài khoản', 'Accounts'),
-- Schedule
('schedule.view', 'Xem lịch đăng', 'Schedule'),
('schedule.create', 'Tạo lịch đăng', 'Schedule'),
('schedule.edit', 'Sửa lịch đăng', 'Schedule')
ON CONFLICT (id) DO NOTHING;

-- Assign Permissions to Admin (All permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'admin', id FROM permissions
ON CONFLICT DO NOTHING;

-- Assign Default Permissions to Editor (Example subset)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'editor', id FROM permissions 
WHERE id LIKE 'content.%' OR id LIKE 'videos.%' OR id LIKE 'projects.view' OR id LIKE 'schedule.%'
ON CONFLICT DO NOTHING;

-- Assign Default Permissions to Viewer (Read only)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'viewer', id FROM permissions 
WHERE id LIKE '%.view'
ON CONFLICT DO NOTHING;
