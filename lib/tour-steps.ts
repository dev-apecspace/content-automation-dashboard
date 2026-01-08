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

export const videoPageSteps: TourStep[] = [
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
    targetId: "tour-video-filters",
    title: "Bộ lọc thông minh",
    description:
      "Lọc danh sách video theo Trạng thái (Idea, Producing...) hoặc theo Dự án để dễ dàng quản lý tiến độ.",
    placement: "bottom",
  },
  {
    targetId: "tour-video-add-btn",
    title: "Tạo Video Mới",
    description:
      "Bấm nút này để thêm ý tưởng video mới.\n" +
      "Bạn có thể nhập ý tưởng thủ công, hoặc upload video đã làm xong để đăng ngay.",
    placement: "bottom",
  },
  {
    targetId: "tour-video-ai-btn",
    title: "AI Gợi ý Ý tưởng",
    description:
      "Bí ý tưởng? Click để AI gợi ý các chủ đề phù hợp với dự án của bạn.",
    placement: "bottom",
  },
  {
    targetId: "tour-video-reload-btn",
    title: "Làm mới dữ liệu",
    description: "Cập nhật lại trạng thái mới nhất của các video từ hệ thống.",
    placement: "bottom",
  },
  {
    targetId: "tour-video-status",
    title: "Theo dõi Trạng thái",
    description:
      "Mỗi video sẽ đi qua các bước:\n" +
      "- 🟡 Ý tưởng: Cần duyệt để bắt đầu tạo nội dung.\n" +
      "- 🟠 Chờ duyệt nội dung: Video đã làm xong, chờ duyệt.\n" +
      "- 🟢 Đã duyệt/Đăng: Sẵn sàng lên sóng.",
    placement: "right",
  },
  {
    targetId: "tour-video-platforms",
    title: "Nền tảng",
    description:
      "Hiển thị các nền tảng sẽ đăng video.\n" +
      "⚠️ Lưu ý: Một Ý TƯỞNG có chủ đích đăng trên nhiều nền tảng (VD: Reels + TikTok) sẽ hiển thị gộp ở đây. Khi DUYỆT Ý TƯỞNG, hệ thống sẽ tách thành 2 dòng riêng để quản lý riêng biệt.",
    placement: "bottom",
  },
  {
    targetId: "tour-video-actions",
    title: "Thao tác nhanh",
    description:
      "Các hành động chính:\n" +
      "- 👁️ Xem chi tiết\n" +
      "- ✏️ Chỉnh sửa thông tin\n" +
      "- ✅ Duyệt (Ý tưởng/nội dung)\n" +
      "- 🗑️ Xóa ý tưởng",
    placement: "left",
  },
];

export const videoFormSteps: TourStep[] = [
  {
    targetId: "tour-video-context",
    title: "Thông tin Video",
    description:
      "Thiết lập các thông tin cơ bản:\n" +
      "- Dự án: Video thuộc dự án nào.\n" +
      "- Nền tảng: Chọn 1 hoặc nhiều nền tảng.\n⚠️ Lưu ý: Nếu chọn video này cho nhiều nền tảng, khi 'Duyệt ý tưởng', hệ thống sẽ tự động tách thành các video riêng biệt cho từng nền tảng.",
    placement: "left",
  },
  {
    targetId: "tour-video-duration",
    title: "Thời lượng",
    description:
      "Nhập thời lượng dự kiến (giây) để hệ thống ước tính chi phí (nếu dùng AI/thuê ngoài) hoặc để quản lý video ngắn.",
    placement: "right",
  },
  {
    targetId: "tour-video-time-section",
    title: "Thời gian & Chế độ đăng",
    description:
      "Thiết lập thời gian đăng bài (Lên lịch) hoặc chọn chế độ 'Đăng ngay'.",
    placement: "left",
  },
  {
    targetId: "tour-video-account",
    title: "Chọn kênh đăng",
    description:
      "Chọn các tài khoản mạng xã hội (Pages/Channels) mà video này sẽ xuất hiện.",
    placement: "left",
  },
  {
    targetId: "tour-video-idea-input",
    title: "Nội dung & Kịch bản",
    description:
      "Nhập ý tưởng quay, kịch bản chi tiết cho video tại đây. Nội dung này sẽ được dùng để sản xuất video, viết title và caption.",
    placement: "left",
  },
  {
    targetId: "tour-video-caption",
    title: "Caption (Mô tả)",
    description:
      "Nội dung văn bản sẽ đăng kèm video.",
    placement: "left",
  },
  {
    targetId: "tour-video-input",
    title: "Video File/Link",
    description:
      "Tải video lên hoặc dán link video. Đây là thành phần quan trọng nhất để có thể đăng bài.",
    placement: "left",
  },
  {
    targetId: "tour-video-save-btn",
    title: "Lưu nháp",
    description:
      "Chỉ cần có 'Ý tưởng', 'Dự án', 'Nền tảng', và 'Thời lượng' (mặc định 5s), bạn có thể lưu lại để tiếp tục chỉnh sửa sau.",
    placement: "top",
  },
  {
    targetId: "tour-video-process-btn",
    title: "Xử lý & Xuất bản",
    description:
      "Để nút này sáng lên (Lên lịch/Đăng ngay), bạn CẦN điền đủ:\n" +
      "- Dự án, Nền tảng, Thời lượng\n" +
      "- Chế độ đăng (Chọn giờ nếu lên lịch)\n" +
      "- Tài khoản đăng\n" +
      "- Caption & Video\n" +
      "- Title (nếu là Youtube)",
    placement: "top",
  },
];
