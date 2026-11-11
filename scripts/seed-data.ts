import { supabase } from "@/lib/supabase"

const seedProjects = [
  { id: "1", name: "SUPER APP", color: "#3b82f6", description: "Multi-purpose super app platform" },
  { id: "2", name: "HỆ THỐNG ECOOP", color: "#22c55e", description: "E-commerce cooperative system" },
  { id: "3", name: "APEC BCI", color: "#eab308", description: "Business and Commerce Initiative" },
  { id: "4", name: "APEC TECH", color: "#f97316", description: "Technology division" },
  { id: "5", name: "LIFE CARE", color: "#8b5cf6", description: "Healthcare and wellness services" },
]

const seedUsers = [
  { id: "user_1", email: "admin@example.com", name: "Admin User", role: "admin" as const, is_active: true },
  { id: "user_2", email: "editor1@example.com", name: "Content Editor 1", role: "editor" as const, is_active: true },
  { id: "user_3", email: "editor2@example.com", name: "Content Editor 2", role: "editor" as const, is_active: true },
  { id: "user_4", email: "viewer@example.com", name: "Content Viewer", role: "viewer" as const, is_active: true },
]

const seedSettings = [
  { key: "google_sheet_url", value: "https://docs.google.com/spreadsheets/d/example", description: "Google Sheet URL for sync" },
  { key: "google_api_key", value: "AIza...example", description: "Google API Key" },
  { key: "auto_sync_enabled", value: "true", description: "Enable automatic sync" },
  { key: "sync_interval_minutes", value: "5", description: "Sync interval in minutes" },
  { key: "notification_email", value: "notifications@example.com", description: "System notification email" },
]

const seedAIConfig = {
  model_name: "gpt-4",
  system_prompt:
    "Bạn là chuyên gia sáng tạo nội dung video ngắn cho mạng xã hội. Tạo kịch bản hấp dẫn, caption sáng tạo và lời kêu gọi hành động hiệu quả.",
  max_tokens: 2000,
  temperature: 0.7,
  is_active: true,
}

const seedNotificationSettings = [
  { user_id: "user_1", email: "admin@example.com", notify_on_approve: true, notify_on_publish: true, notify_on_error: true },
  { user_id: "user_2", email: "editor1@example.com", notify_on_approve: true, notify_on_publish: true, notify_on_error: true },
  { user_id: "user_3", email: "editor2@example.com", notify_on_approve: true, notify_on_publish: true, notify_on_error: false },
  { user_id: "user_4", email: "viewer@example.com", notify_on_approve: false, notify_on_publish: true, notify_on_error: false },
]

const seedSchedules = [
  { id: "sch_1", project_id: "1", project_name: "SUPER APP", platform: "Facebook Post" as const, frequency: "10 phút/lần", posting_days: "Mỗi ngày", posting_time: "12:30" },
  { id: "sch_2", project_id: "1", project_name: "SUPER APP", platform: "Facebook Reels" as const, frequency: "Tuần", posting_days: "Thứ 2, Thứ 6", posting_time: "08:00" },
  { id: "sch_3", project_id: "1", project_name: "SUPER APP", platform: "Youtube Shorts" as const, frequency: "Ngày", posting_days: "Mỗi ngày", posting_time: "19:30" },
  { id: "sch_4", project_id: "2", project_name: "HỆ THỐNG ECOOP", platform: "Facebook Post" as const, frequency: "10 phút/lần", posting_days: "Mỗi ngày", posting_time: "11:00" },
  { id: "sch_5", project_id: "2", project_name: "HỆ THỐNG ECOOP", platform: "Facebook Reels" as const, frequency: "Tháng", posting_days: "Ngày 5, ngày 20", posting_time: "07:30" },
  { id: "sch_6", project_id: "2", project_name: "HỆ THỐNG ECOOP", platform: "Youtube Shorts" as const, frequency: "Ngày", posting_days: "Mỗi ngày", posting_time: "18:00" },
  { id: "sch_7", project_id: "3", project_name: "APEC BCI", platform: "Facebook Post" as const, frequency: "Tuần", posting_days: "Thứ 2, Thứ 5", posting_time: "21:00" },
  { id: "sch_8", project_id: "3", project_name: "APEC BCI", platform: "Facebook Reels" as const, frequency: "Tuần", posting_days: "Thứ 3, Thứ 7", posting_time: "09:00" },
  { id: "sch_9", project_id: "4", project_name: "APEC TECH", platform: "Facebook Post" as const, frequency: "Tháng", posting_days: "Ngày 10, ngày 25, ngày 27", posting_time: "11:00" },
  { id: "sch_10", project_id: "4", project_name: "APEC TECH", platform: "Facebook Reels" as const, frequency: "Tuần", posting_days: "Thứ 4, Chủ nhật", posting_time: "13:00" },
  { id: "sch_11", project_id: "4", project_name: "APEC TECH", platform: "Youtube Shorts" as const, frequency: "Tuần", posting_days: "Thứ 3, Thứ 6", posting_time: "20:30" },
  { id: "sch_12", project_id: "5", project_name: "LIFE CARE", platform: "Facebook Post" as const, frequency: "Tuần", posting_days: "Thứ 3, Thứ 6", posting_time: "14:00" },
  { id: "sch_13", project_id: "5", project_name: "LIFE CARE", platform: "Facebook Reels" as const, frequency: "Tháng", posting_days: "Ngày 8, ngày 22", posting_time: "07:00" },
  { id: "sch_14", project_id: "5", project_name: "LIFE CARE", platform: "Youtube Shorts" as const, frequency: "3 ngày/lần", posting_days: "Ngày lẻ", posting_time: "07:00" },
]

const seedContentItems = [
  {
    id: "1",
    status: "cho_duyet" as const,
    idea: "Nước uống",
    project_id: "5",
    project_name: "LIFE CARE",
    platform: "Facebook Reels" as const,
    video_duration: 5,
    target_audience: "Age: 18-45, male/female, students/office workers/young professionals",
    research_notes: "Competitive analysis of existing e-commerce apps (e.g. Shopee, Lazada)",
    expected_post_date: "2025-11-28",
    posting_time: "12:00",
    caption: "Uống nước đúng cách - Bí quyết sức khỏe mỗi ngày! #LIFECARE #SucKhoe",
    call_to_action: "Đặt hàng ngay hôm nay để nhận ưu đãi đặc biệt!",
    script: [
      { scene: 1, description: "Cảnh mở đầu với ly nước tươi mát", dialogue: "Bạn có biết uống nước đúng cách giúp tăng năng lượng?" },
      { scene: 2, description: "Hiển thị sản phẩm LIFE CARE", dialogue: "LIFE CARE mang đến giải pháp nước uống hoàn hảo cho bạn!" },
    ],
  },
  {
    id: "2",
    status: "cho_duyet" as const,
    idea: "App thương mại điện tử",
    project_id: "1",
    project_name: "SUPER APP",
    platform: "Facebook Reels" as const,
    video_duration: 5,
    topic: "App thương mại điện tử",
    target_audience: "Age: 18-45, male/female, students/office workers/young professionals",
    research_notes: "Competitive analysis of existing e-commerce apps (e.g. Shopee, Lazada)",
  },
  {
    id: "3",
    status: "da_dang_thanh_cong" as const,
    idea: "Xe bán hàng lưu động",
    project_id: "2",
    project_name: "HỆ THỐNG ECOOP",
    platform: "Facebook Reels" as const,
    video_duration: 5,
    topic: "Xe bán hàng lưu động",
    target_audience: "Age: 18-45, Gender: All, Occupation: Office workers, students",
    research_notes: "Research current trends in mobile vending (food truck, coffee cart)",
    expected_post_date: "2025-12-02",
    posting_time: "19:00",
    caption: "Xe bán hàng lưu động ECOOP - Giải pháp kinh doanh linh hoạt! #ECOOP #KinhDoanh",
    call_to_action: "Liên hệ ngay để được tư vấn!",
    approved_by: "user_1",
    script: [{ scene: 1, description: "Cảnh xe bán hàng ECOOP", dialogue: "Khám phá mô hình kinh doanh lưu động cùng ECOOP!" }],
  },
  {
    id: "4",
    status: "cho_duyet" as const,
    idea: "Vật lý trị liệu",
    project_id: "5",
    project_name: "LIFE CARE",
    platform: "Facebook Reels" as const,
    video_duration: 5,
    topic: "Vật lý trị liệu",
    target_audience: "Age 30-65+, individuals recovering from injuries/surgeries",
    research_notes: "Common conditions treated by physical therapy, benefits",
    expected_post_date: "2025-12-01",
    posting_time: "19:00",
  },
  {
    id: "5",
    status: "da_dang_thanh_cong" as const,
    idea: "Xe bán hàng lưu động",
    project_id: "2",
    project_name: "HỆ THỐNG ECOOP",
    platform: "Youtube Shorts" as const,
    video_duration: 5,
    topic: "Xe bán hàng lưu động",
    target_audience: "Age: 18-45, Gender: All, Occupation: Office workers, students",
    research_notes: "Research current trends in mobile vending (food truck, coffee cart)",
    expected_post_date: "2025-11-30",
    posting_time: "10:00",
    caption: "Khởi nghiệp cùng ECOOP! #ECOOP #KhoiNghiep",
    call_to_action: "Đăng ký ngay để nhận ưu đãi!",
    approved_by: "user_1",
    script: [{ scene: 1, description: "Giới thiệu xe bán hàng", dialogue: "Bạn muốn khởi nghiệp với vốn nhỏ? Xem ngay!" }],
  },
  {
    id: "6",
    status: "cho_duyet" as const,
    idea: "App thương mại điện tử",
    project_id: "1",
    project_name: "SUPER APP",
    platform: "Youtube Shorts" as const,
    video_duration: 5,
    topic: "App thương mại điện tử",
    target_audience: "Age: 18-45, male/female, students/office workers/young professionals",
    research_notes: "Competitive analysis of existing e-commerce apps",
    expected_post_date: "2025-11-27",
    posting_time: "14:00",
  },
]

export async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...")

    // 1. Projects
    console.log("📌 Seeding projects...")
    const { error: projectsError } = await supabase.from("projects").insert(seedProjects)
    if (projectsError) throw projectsError
    console.log("✅ Projects seeded")

    // 2. Users
    console.log("👥 Seeding users...")
    const { error: usersError } = await supabase.from("users").insert(seedUsers)
    if (usersError) throw usersError
    console.log("✅ Users seeded")

    // 3. Settings
    console.log("⚙️ Seeding settings...")
    const { error: settingsError } = await supabase.from("settings").insert(
      seedSettings.map((s) => ({
        ...s,
        updated_by: "user_1",
      }))
    )
    if (settingsError) throw settingsError
    console.log("✅ Settings seeded")

    // 4. AI Config
    console.log("🤖 Seeding AI config...")
    const { error: aiError } = await supabase.from("ai_config").insert(seedAIConfig)
    if (aiError) throw aiError
    console.log("✅ AI config seeded")

    // 5. Notification Settings
    console.log("🔔 Seeding notification settings...")
    const { error: notifyError } = await supabase.from("notification_settings").insert(seedNotificationSettings)
    if (notifyError) throw notifyError
    console.log("✅ Notification settings seeded")

    // 6. Schedules
    console.log("📅 Seeding schedules...")
    const { error: schedulesError } = await supabase.from("schedules").insert(seedSchedules)
    if (schedulesError) throw schedulesError
    console.log("✅ Schedules seeded")

    // 7. Content Items and Script Scenes
    console.log("📝 Seeding content items...")
    for (const content of seedContentItems) {
      const { script, ...contentData } = content
      const { error: contentError } = await supabase.from("content_items").insert(contentData)
      if (contentError) throw contentError

      if (script && script.length > 0) {
        const scriptData = script.map((s) => ({
          content_item_id: content.id,
          scene_number: s.scene,
          description: s.description,
          dialogue: s.dialogue,
        }))
        const { error: scriptError } = await supabase.from("script_scenes").insert(scriptData)
        if (scriptError) throw scriptError
      }
    }
    console.log("✅ Content items seeded")

    console.log("\n✨ Database seeding completed successfully!")
  } catch (error) {
    console.error("❌ Error seeding database:", error)
    throw error
  }
}
