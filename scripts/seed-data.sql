-- ========== SEED DATA FOR CONTENT AUTOMATION DASHBOARD ==========
-- Insert sample data into all tables
-- Execute this after creating the database schema

-- ========== PROJECTS ==========
INSERT INTO projects (id, name, color, description, created_at, updated_at) VALUES
  ('1', 'SUPER APP', '#3b82f6', 'Multi-purpose super app platform', NOW(), NOW()),
  ('2', 'HỆ THỐNG ECOOP', '#22c55e', 'E-commerce cooperative system', NOW(), NOW()),
  ('3', 'APEC BCI', '#eab308', 'Business and Commerce Initiative', NOW(), NOW()),
  ('4', 'APEC TECH', '#f97316', 'Technology division', NOW(), NOW()),
  ('5', 'LIFE CARE', '#8b5cf6', 'Healthcare and wellness services', NOW(), NOW());

-- ========== USERS ==========
INSERT INTO users (id, email, name, role, is_active, created_at, updated_at) VALUES
  ('user_1', 'admin@example.com', 'Admin User', 'admin', true, NOW(), NOW()),
  ('user_2', 'editor1@example.com', 'Content Editor 1', 'editor', true, NOW(), NOW()),
  ('user_3', 'editor2@example.com', 'Content Editor 2', 'editor', true, NOW(), NOW()),
  ('user_4', 'viewer@example.com', 'Content Viewer', 'viewer', true, NOW(), NOW());

-- ========== SETTINGS ==========
INSERT INTO settings (key, value, description, updated_at, updated_by) VALUES
  ('google_sheet_url', 'https://docs.google.com/spreadsheets/d/example', 'Google Sheet URL for sync', NOW(), 'user_1'),
  ('google_api_key', 'AIza...example', 'Google API Key', NOW(), 'user_1'),
  ('auto_sync_enabled', 'true', 'Enable automatic sync', NOW(), 'user_1'),
  ('sync_interval_minutes', '5', 'Sync interval in minutes', NOW(), 'user_1'),
  ('notification_email', 'notifications@example.com', 'System notification email', NOW(), 'user_1');

-- ========== AI CONFIG ==========
INSERT INTO ai_config (model_name, system_prompt, max_tokens, temperature, is_active, created_at, updated_at) VALUES
  ('gpt-4', 'Bạn là chuyên gia sáng tạo nội dung video ngắn cho mạng xã hội. Tạo kịch bản hấp dẫn, caption sáng tạo và lời kêu gọi hành động hiệu quả.', 2000, 0.7, true, NOW(), NOW());

-- ========== NOTIFICATION SETTINGS ==========
INSERT INTO notification_settings (user_id, email, notify_on_approve, notify_on_publish, notify_on_error, created_at, updated_at) VALUES
  ('user_1', 'admin@example.com', true, true, true, NOW(), NOW()),
  ('user_2', 'editor1@example.com', true, true, true, NOW(), NOW()),
  ('user_3', 'editor2@example.com', true, true, false, NOW(), NOW()),
  ('user_4', 'viewer@example.com', false, true, false, NOW(), NOW());

-- ========== SCHEDULES ==========
INSERT INTO schedules (id, project_id, project_name, platform, frequency, posting_days, posting_time, is_active, created_at, updated_at) VALUES
  ('sch_1', '1', 'SUPER APP', 'Facebook Post', '10 phút/lần', 'Mỗi ngày', '12:30', true, NOW(), NOW()),
  ('sch_2', '1', 'SUPER APP', 'Facebook Reels', 'Tuần', 'Thứ 2, Thứ 6', '08:00', true, NOW(), NOW()),
  ('sch_3', '1', 'SUPER APP', 'Youtube Shorts', 'Ngày', 'Mỗi ngày', '19:30', true, NOW(), NOW()),
  ('sch_4', '2', 'HỆ THỐNG ECOOP', 'Facebook Post', '10 phút/lần', 'Mỗi ngày', '11:00', true, NOW(), NOW()),
  ('sch_5', '2', 'HỆ THỐNG ECOOP', 'Facebook Reels', 'Tháng', 'Ngày 5, ngày 20', '07:30', true, NOW(), NOW()),
  ('sch_6', '2', 'HỆ THỐNG ECOOP', 'Youtube Shorts', 'Ngày', 'Mỗi ngày', '18:00', true, NOW(), NOW()),
  ('sch_7', '3', 'APEC BCI', 'Facebook Post', 'Tuần', 'Thứ 2, Thứ 5', '21:00', true, NOW(), NOW()),
  ('sch_8', '3', 'APEC BCI', 'Facebook Reels', 'Tuần', 'Thứ 3, Thứ 7', '09:00', true, NOW(), NOW()),
  ('sch_9', '4', 'APEC TECH', 'Facebook Post', 'Tháng', 'Ngày 10, ngày 25, ngày 27', '11:00', true, NOW(), NOW()),
  ('sch_10', '4', 'APEC TECH', 'Facebook Reels', 'Tuần', 'Thứ 4, Chủ nhật', '13:00', true, NOW(), NOW()),
  ('sch_11', '4', 'APEC TECH', 'Youtube Shorts', 'Tuần', 'Thứ 3, Thứ 6', '20:30', true, NOW(), NOW()),
  ('sch_12', '5', 'LIFE CARE', 'Facebook Post', 'Tuần', 'Thứ 3, Thứ 6', '14:00', true, NOW(), NOW()),
  ('sch_13', '5', 'LIFE CARE', 'Facebook Reels', 'Tháng', 'Ngày 8, ngày 22', '07:00', true, NOW(), NOW()),
  ('sch_14', '5', 'LIFE CARE', 'Youtube Shorts', '3 ngày/lần', 'Ngày lẻ', '07:00', true, NOW(), NOW());

-- ========== CONTENT ITEMS (Facebook Posts Only) ==========
INSERT INTO content_items (
  id, status, idea, project_id, project_name, platform, 
  image_link, topic, target_audience, research_notes, 
  expected_post_date, posting_time, caption, call_to_action, 
  created_at, updated_at
) VALUES
  (
    'content_1', 'cho_duyet', 'Giới thiệu sản phẩm mới', '5', 'LIFE CARE', 'Facebook Post', 
    '', 'Sản phẩm mới', 'Age: 18-45, male/female',
    'Lưu ý: Nhấn mạnh tính năng độc đáo',
    '2025-11-28', '12:00', 
    'LIFE CARE ra mắt sản phẩm chăm sóc sức khỏe mới! #LIFECARE #SucKhoe',
    'Tìm hiểu thêm ngay!',
    NOW(), NOW()
  ),
  (
    'content_2', 'cho_duyet', 'SUPER APP - Ứng dụng toàn năng', '1', 'SUPER APP', 'Facebook Post',
    '', 'Ứng dụng', 'Age: 18-45, male/female',
    'Nhấn mạnh đa năng, tiện lợi',
    '2025-11-29', '10:00', 
    'SUPER APP - Giải pháp toàn diện cho cuộc sống! Download ngay #SUPERAPP',
    'Tải ứng dụng miễn phí!',
    NOW(), NOW()
  ),
  (
    'content_3', 'da_dang_thanh_cong', 'ECOOP - Nền tảng hợp tác kinh doanh', '2', 'HỆ THỐNG ECOOP', 'Facebook Post',
    '', 'Nền tảng ECOOP', 'Age: 18-65',
    'Tập trung vào lợi ích cộng đồng',
    '2025-12-02', '11:00',
    'Cộng đồng ECOOP - Cùng phát triển bền vững! #ECOOP #KinhDoanh',
    'Tham gia cộng đồng!',
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'
  );

-- ========== VIDEO ITEMS (Facebook Reels & YouTube Shorts) ==========
INSERT INTO video_items (
  id, status, idea, project_id, project_name, platform, existing_video_link, 
  video_duration, image_link, topic, target_audience, research_notes, 
  expected_post_date, posting_time, caption, call_to_action, 
  created_at, updated_at
) VALUES
  (
    'video_1', 'cho_duyet', 'Nước uống - Bí quyết sức khỏe', '5', 'LIFE CARE', 'Facebook Reels', 
    '', 5, '', 'Sức khỏe', 'Age: 18-45, male/female, students/office workers',
    'Tập trung vào lợi ích uống nước đúng cách',
    '2025-11-28', '12:00', 
    'Uống nước đúng cách - Bí quyết sức khỏe mỗi ngày! #LIFECARE #SucKhoe',
    'Đặt hàng ngay hôm nay để nhận ưu đãi đặc biệt!',
    NOW(), NOW()
  ),
  (
    'video_2', 'cho_duyet', 'App thương mại điện tử SUPER APP', '1', 'SUPER APP', 'Facebook Reels',
    '', 5, '', 'App thương mại', 'Age: 18-45, male/female, students/office workers',
    'Phân tích cạnh tranh với Shopee, Lazada',
    NOW(), NOW(), 
    'SUPER APP - Mua sắm thông minh, tiết kiệm hơn! #SUPERAPP #MuaSam',
    'Tải ứng dụng miễn phí ngay!',
    NOW(), NOW()
  ),
  (
    'video_3', 'da_dang_thanh_cong', 'Xe bán hàng lưu động ECOOP', '2', 'HỆ THỐNG ECOOP', 'Facebook Reels',
    '', 5, '', 'Xe bán hàng', 'Age: 18-45, Gender: All, Occupation: Office workers, students',
    'Xu hướng bán hàng lưu động, food truck',
    '2025-12-02', '19:00',
    'Xe bán hàng lưu động ECOOP - Giải pháp kinh doanh linh hoạt! #ECOOP #KinhDoanh',
    'Liên hệ ngay để được tư vấn!',
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'
  ),
  (
    'video_4', 'cho_duyet', 'Vật lý trị liệu - Phục hồi sức khỏe', '5', 'LIFE CARE', 'Facebook Reels',
    '', 5, '', 'Vật lý trị liệu', 'Age 30-65+, individuals recovering from injuries',
    'Các tình trạng điều trị vật lý',
    '2025-12-01', '19:00', 
    'Vật lý trị liệu LIFE CARE - Phục hồi sức khỏe toàn diện! #LIFECARE',
    'Đặt lịch tư vấn miễn phí!',
    NOW(), NOW()
  ),
  (
    'video_5', 'da_dang_thanh_cong', 'Khởi nghiệp cùng ECOOP', '2', 'HỆ THỐNG ECOOP', 'Youtube Shorts',
    '', 5, '', 'Khởi nghiệp', 'Age: 18-45, Gender: All, Occupation: Office workers, students',
    'Hướng dẫn khởi nghiệp với ECOOP',
    '2025-11-30', '10:00',
    'Khởi nghiệp cùng ECOOP! #ECOOP #KhoiNghiep',
    'Đăng ký ngay để nhận ưu đãi!',
    NOW() - INTERVAL '6 days', NOW() - INTERVAL '4 days'
  ),
  (
    'video_6', 'cho_duyet', 'App thương mại - YouTube Shorts', '1', 'SUPER APP', 'Youtube Shorts',
    '', 5, '', 'App thương mại', 'Age: 18-45, male/female, students/office workers',
    'Giới thiệu tính năng app',
    '2025-11-27', '14:00', 
    'SUPER APP - Ứng dụng thương mại #1! #SUPERAPP',
    'Tải ngay hôm nay!',
    NOW(), NOW()
  );

-- ========== SCRIPT SCENES (Video Scripts) ==========
INSERT INTO script_scenes_video (video_item_id, scene_number, description, dialogue, created_at) VALUES
  ('video_1', 1, 'Cảnh mở đầu với ly nước tươi mát', 'Bạn có biết uống nước đúng cách giúp tăng năng lượng?', NOW()),
  ('video_1', 2, 'Hiển thị sản phẩm LIFE CARE', 'LIFE CARE mang đến giải pháp nước uống hoàn hảo cho bạn!', NOW()),
  ('video_3', 1, 'Cảnh xe bán hàng ECOOP', 'Khám phá mô hình kinh doanh lưu động cùng ECOOP!', NOW()),
  ('video_5', 1, 'Giới thiệu xe bán hàng', 'Bạn muốn khởi nghiệp với vốn nhỏ? Xem ngay!', NOW());

-- ========== ACTIVITY LOGS ==========
INSERT INTO activity_logs (user_id, activity_type, entity_type, entity_id, old_values, new_values, description, created_at) VALUES
  ('user_1', 'create', 'project', '1', NULL, '{"name":"SUPER APP","color":"#3b82f6"}'::jsonb, 'Created new project SUPER APP', NOW() - INTERVAL '10 days'),
  ('user_1', 'create', 'project', '2', NULL, '{"name":"HỆ THỐNG ECOOP","color":"#22c55e"}'::jsonb, 'Created new project HỆ THỐNG ECOOP', NOW() - INTERVAL '9 days'),
  ('user_1', 'create', 'project', '3', NULL, '{"name":"APEC BCI","color":"#eab308"}'::jsonb, 'Created new project APEC BCI', NOW() - INTERVAL '8 days'),
  ('user_1', 'create', 'project', '4', NULL, '{"name":"APEC TECH","color":"#f97316"}'::jsonb, 'Created new project APEC TECH', NOW() - INTERVAL '7 days'),
  ('user_1', 'create', 'project', '5', NULL, '{"name":"LIFE CARE","color":"#8b5cf6"}'::jsonb, 'Created new project LIFE CARE', NOW() - INTERVAL '6 days'),
  
  ('user_2', 'create', 'content', 'content_1', NULL, '{"idea":"Giới thiệu sản phẩm mới","status":"cho_duyet"}'::jsonb, 'Created content: Giới thiệu sản phẩm mới', NOW() - INTERVAL '5 days'),
  ('user_2', 'create', 'content', 'content_2', NULL, '{"idea":"SUPER APP - Ứng dụng toàn năng","status":"cho_duyet"}'::jsonb, 'Created content: SUPER APP', NOW() - INTERVAL '4 days'),
  
  ('user_2', 'create', 'video', 'video_1', NULL, '{"idea":"Nước uống - Bí quyết sức khỏe","status":"cho_duyet"}'::jsonb, 'Created video: Nước uống', NOW() - INTERVAL '5 days'),
  ('user_2', 'create', 'video', 'video_2', NULL, '{"idea":"App thương mại SUPER APP","status":"cho_duyet"}'::jsonb, 'Created video: App thương mại', NOW() - INTERVAL '4 days'),
  ('user_2', 'create', 'video', 'video_3', NULL, '{"idea":"Xe bán hàng lưu động","status":"cho_duyet"}'::jsonb, 'Created video: Xe bán hàng lưu động', NOW() - INTERVAL '6 days'),
  
  ('user_1', 'approve', 'video', 'video_3', '{"status":"cho_duyet"}'::jsonb, '{"status":"da_dang_thanh_cong"}'::jsonb, 'Approved video: Xe bán hàng lưu động', NOW() - INTERVAL '2 days'),
  ('user_1', 'publish', 'video', 'video_3', '{"published_at":null}'::jsonb, jsonb_build_object('published_at', NOW()), 'Published video to ECOOP Reels', NOW() - INTERVAL '1 day'),
  
  ('user_1', 'approve', 'video', 'video_5', '{"status":"cho_duyet"}'::jsonb, '{"status":"da_dang_thanh_cong"}'::jsonb, 'Approved video: Khởi nghiệp ECOOP', NOW() - INTERVAL '4 days'),
  ('user_1', 'publish', 'video', 'video_5', '{"published_at":null}'::jsonb, jsonb_build_object('published_at', NOW()), 'Published video to YouTube', NOW() - INTERVAL '3 days'),
  
  ('user_1', 'update', 'settings', 'google_sheet_url', '{"value":""}'::jsonb, '{"value":"https://docs.google.com/spreadsheets/d/example"}'::jsonb, 'Updated Google Sheet URL', NOW() - INTERVAL '10 days');

-- ========== VERIFY INSERTS ==========
SELECT 'Projects:' as table_name, COUNT(*) as record_count FROM projects
UNION ALL
SELECT 'Users:', COUNT(*) FROM users
UNION ALL
SELECT 'Settings:', COUNT(*) FROM settings
UNION ALL
SELECT 'AI Config:', COUNT(*) FROM ai_config
UNION ALL
SELECT 'Notification Settings:', COUNT(*) FROM notification_settings
UNION ALL
SELECT 'Schedules:', COUNT(*) FROM schedules
UNION ALL
SELECT 'Content Items (FB Posts):', COUNT(*) FROM content_items
UNION ALL
SELECT 'Video Items (Reels/Shorts):', COUNT(*) FROM video_items
UNION ALL
SELECT 'Script Scenes (Video):', COUNT(*) FROM script_scenes_video
UNION ALL
SELECT 'Activity Logs:', COUNT(*) FROM activity_logs;
