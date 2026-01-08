import { TourStep } from "@/hooks/use-tour-store";

export const contentPageSteps: TourStep[] = [
  {
    targetId: "tour-guide-btn",
    title: "Hướng dẫn",
    description:
      "Tóm tắt quy trình:\n\n" +
      "1. 💡 Ý tưởng: AI gợi ý (hoặc bạn nhập), bạn duyệt.\n" +
      "2. 📝 Nội dung: AI viết bài, bạn duyệt.\n" +
      "3. 🚀 Đăng bài: Hệ thống tự động đăng.\n\n" +
      "Chỉ cần click 3 nút:\n" +
      "1. ✨AI tạo ý tưởng\n" +
      "2. ✅ Duyệt ý tưởng (khi Trạng thái = 'Ý tưởng')\n" +
      "3. ✅ Duyệt nội dung (khi Trạng thái = 'Chờ duyệt nội dung')",
    placement: "bottom",
  },
  {
    targetId: "tour-filters",
    title: "Bộ lọc thông minh",
    description:
      "Sử dụng các bộ chọn này để lọc nhanh bài viết theo Trạng thái (Idea, Approved...) hoặc theo Dự án.",
    placement: "bottom",
  },
  {
    targetId: "tour-add-btn",
    title: "Tạo ý tưởng mới",
    description:
      "Bấm nút này để mở bảng tạo nội dung.\n" +
      "Bạn có thể chọn quy trình chuẩn (Duyệt 2 vòng) hoặc 'Đăng ngay (Manual Post)' để bỏ qua duyệt.",
    placement: "bottom",
  },
  {
    targetId: "tour-ai-btn",
    title: "AI tạo ý tưởng",
    description:
      "Nếu bạn bí ý tưởng, hãy bấm nút này.\nVới mỗi dự án, trợ lý AI sẽ tạo vài ý tưởng.",
    placement: "bottom",
  },
  {
    targetId: "tour-reload-btn",
    title: "Làm mới dữ liệu",
    description: "Cập nhật lại danh sách bài viết mới nhất từ hệ thống.",
    placement: "bottom",
  },
  {
    targetId: "tour-row-status",
    title: "Trạng thái bài viết",
    description:
      "Nhìn vào trạng thái để biết cần làm gì:\n" +
      "- 🟡 Ý tưởng: Cần duyệt để AI viết bài.\n" +
      "- 🟠 Chờ duyệt nội dung: AI đã viết xong, cần duyệt để đăng.\n" +
      "- 🟢 Đã duyệt: Đã tạo lịch đăng bài, chờ đăng.",
    placement: "right",
  },
  {
    targetId: "tour-row-idea",
    title: "Nội dung ý tưởng",
    description:
      "Tóm tắt nội dung chính của bài viết. \nBạn có thể rê chuột vào để xem đầy đủ.",
    placement: "top",
  },
  {
    targetId: "tour-row-actions-cell",
    title: "Hành động nhanh",
    description:
      "Nơi thực hiện các thao tác: \n- Xem chi tiết \n- Chỉnh sửa \n- Duyệt ý tưởng/Duyệt nội dung \n- Xóa ý tưởng \n\nRê chuột vào từng nút để xem hướng dẫn cụ thể.",
    placement: "left",
  },
];

export const contentFormSteps: TourStep[] = [
  {
    targetId: "tour-content-context",
    title: "Thông tin cơ bản",
    description:
      "Chọn Dự án, Nền tảng (Facebook/Tiktok...), và Loại Content bạn muốn tạo.",
    placement: "right",
  },
  {
    targetId: "tour-content-mode",
    title: "Chế độ đăng",
    description:
      "Bạn có thể chọn 'Lên lịch' để hệ thống tự động đăng vào giờ đã chọn, hoặc 'Đăng ngay' để post lập tức.",
    placement: "left",
  },
  {
    targetId: "tour-content-account",
    title: "Chọn tài khoản",
    description:
      "Chọn các tài khoản mạng xã hội mà bạn muốn đăng bài viết này lên.",
    placement: "left",
  },
  {
    targetId: "tour-content-idea",
    title: "Ý tưởng nội dung",
    description:
      "Nhập ý tưởng thô của bạn ở đây. AI sẽ dùng nó để viết thành bài hoàn chỉnh.",
    placement: "left",
  },
  {
    targetId: "tour-content-caption",
    title: "Nội dung chi tiết",
    description:
      "Sau khi có ý tưởng, nội dung chi tiết sẽ hiện ở đây. Bạn có thể chỉnh sửa hoặc nhờ AI viết lại.",
    placement: "left",
  },
  {
    targetId: "tour-content-media",
    title: "Hình ảnh",
    description:
      "Tải ảnh lên hoặc dán link ảnh. Bạn cũng có thể yêu cầu AI chỉnh sửa ảnh ở đây.",
    placement: "left",
  },
  {
    targetId: "tour-action-save-draft",
    title: "Lưu ý tưởng (Nháp)",
    description:
      "Chỉ cần nhập 'Ý tưởng', 'Dự án', 'Nền tảng', và 'Loại Content' là bạn có thể lưu nháp để xử lý sau.",
    placement: "top",
  },
  {
    targetId: "tour-action-process",
    title: "Đăng bài / Lên lịch",
    description:
      "Để nút này sáng lên, bạn cần nhập đủ: Ý tưởng, Dự án, Nền tảng, Loại Content, Caption, Tài khoản và Thời gian (nếu lên lịch).",
    placement: "top",
  },
];
