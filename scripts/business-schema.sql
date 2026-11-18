-- ============================================================
-- BUSINESS SCHEMA: cấu trúc kinh doanh cho mô hình bán dịch vụ
-- (Gói dịch vụ, Khách hàng, Ngành hàng, Giao dịch mua gói)
--
-- Cách chạy: Supabase Dashboard → SQL Editor → dán toàn bộ file
-- này → Run. File IDEMPOTENT: chạy lại nhiều lần không gây lỗi,
-- không mất dữ liệu.
-- ============================================================

-- ---------- 1. NGÀNH HÀNG ----------
CREATE TABLE IF NOT EXISTS industries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- 2. GÓI DỊCH VỤ ----------
CREATE TABLE IF NOT EXISTS packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,          -- giá bán (VND)
  duration_days INTEGER NOT NULL DEFAULT 30, -- thời hạn gói (ngày)
  max_projects INTEGER,                      -- giới hạn số dự án (NULL = không giới hạn)
  features TEXT,                             -- tính năng, mỗi dòng một tính năng
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- 3. KHÁCH HÀNG ----------
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  industry_id TEXT REFERENCES industries(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  assigned_to TEXT,                          -- nhân viên phụ trách (users.id), NULL nếu chưa giao
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- 4. GIAO DỊCH MUA GÓI ----------
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL REFERENCES packages(id),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,                             -- tự tính = start_date + duration_days (ghi rõ khi tạo)
  price_paid NUMERIC NOT NULL DEFAULT 0,     -- số tiền thực thu
  payment_status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
  payment_method TEXT,                       -- chuyển khoản / tiền mặt / thẻ ...
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- INDEX ----------
CREATE INDEX IF NOT EXISTS idx_customers_industry ON customers(industry_id);
CREATE INDEX IF NOT EXISTS idx_customers_assigned ON customers(assigned_to);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_package ON subscriptions(package_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- ---------- 5. GÁN DỮ LIỆU HIỆN CÓ VÀO KHÁCH HÀNG ----------
-- Mỗi dự án (và toàn bộ content/video/schedule/accounts của nó) thuộc về
-- 1 khách hàng. Data hiện có của workspace → APEC GLOBAL (khách đầu tiên).
-- Sau này thêm khách mới: tạo khách trong trang Khách hàng, dự án mới
-- chọn khách tương ứng khi tạo/sửa.

-- Cột customer_id trên projects (chạy lại không lỗi)
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL;

-- Index cho cột VỪA thêm (phải đặt SAU ALTER, không thì lỗi 42703
-- column "customer_id" does not exist)
CREATE INDEX IF NOT EXISTS idx_projects_customer ON projects(customer_id);

-- Khách hàng đầu tiên: APEC GLOBAL (id cố định → idempotent)
INSERT INTO customers (id, name, company, status, notes) VALUES
  ('cus-apec-global', 'APEC GLOBAL', 'APEC GLOBAL', 'active',
   'Khách hàng đầu tiên — toàn bộ data hiện tại của workspace thuộc về APEC GLOBAL.')
ON CONFLICT (id) DO NOTHING;

-- Backfill: toàn bộ dự án CHƯA có khách → gán vào APEC GLOBAL
-- (chỉ điền các dòng NULL nên chạy lại an toàn, không ghi đè lựa chọn mới)
UPDATE projects
SET customer_id = 'cus-apec-global'
WHERE customer_id IS NULL;

-- ---------- DỮ LIỆU MẪU (id cố định → chạy lại không trùng) ----------
INSERT INTO industries (id, name, description) VALUES
  ('ind-thoitrang', 'Thời trang', 'Quần áo, phụ kiện, giày dép'),
  ('ind-mypham', 'Mỹ phẩm', 'Chăm sóc da, trang điểm'),
  ('ind-spmien', 'Thực phẩm chức năng', 'Dinh dưỡng, sức khỏe'),
  ('ind-nhahang', 'Nhà hàng / F&B', 'Ẩm thực, đồ uống'),
  ('ind-bds', 'Bất động sản', 'Mua bán, cho thuê'),
  ('ind-giaoduc', 'Giáo dục', 'Khóa học, trung tâm đào tạo')
ON CONFLICT (id) DO NOTHING;

INSERT INTO packages (id, name, description, price, duration_days, max_projects, features) VALUES
  ('pkg-co-ban', 'Gói Cơ bản',
   'Phù hợp cá nhân hoặc shop nhỏ mới bắt đầu',
   990000, 30, 2,
   E'Quản lý 2 dự án\nLên lịch đăng bài Facebook\nHỗ trợ qua email'),
  ('pkg-chuyen-nghiep', 'Gói Chuyên nghiệp',
   'Phù hợp shop, nhãn hàng đang tăng trưởng',
   1990000, 30, 6,
   E'Quản lý 6 dự án\nĐăng Facebook + Reels + Youtube Shorts\nTạo ảnh AI không giới hạn\nHỗ trợ ưu tiên'),
  ('pkg-doanh-nghiep', 'Gói Doanh nghiệp',
   'Dành cho agency và doanh nghiệp lớn',
   4990000, 30, NULL,
   E'Không giới hạn dự án\nĐa nền tảng + báo cáo chi tiết\nTài khoản phụ không giới hạn\nHỗ trợ 24/7')
ON CONFLICT (id) DO NOTHING;
