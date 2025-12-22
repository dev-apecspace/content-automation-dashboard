"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { FileSpreadsheet, Video, Calendar, CheckCircle } from "lucide-react"

export function GuideTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Hướng dẫn sử dụng</h2>
        <p className="text-muted-foreground">Tài liệu hướng dẫn chi tiết cho hệ thống</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              Bước 1: Kết nối Sheet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Vào Cài đặt → Google Sheet → Nhập URL Sheet và API Key để kết nối với nguồn dữ liệu.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-pink-600" />
              Bước 2: Thêm nội dung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Vào tab Video hoặc Bài viết + ảnh → Nhấn Thêm nội dung → Điền đầy đủ thông tin.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Bước 3: Lập lịch đăng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Vào tab Lịch đăng → Thiết lập tần suất và thời gian đăng cho từng dự án/nền tảng.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-orange-600" />
              Bước 4: Phê duyệt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Xem trước nội dung AI tạo → Chỉnh sửa nếu cần → Nhấn Phê duyệt để gửi đăng.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Câu hỏi thường gặp</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Làm sao để kết nối Google Sheet?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  1. Vào Google Cloud Console và tạo API Key
                  <br />
                  2. Bật Google Sheets API
                  <br />
                  3. Copy URL Sheet của bạn (đảm bảo chia sẻ quyền xem)
                  <br />
                  4. Vào Cài đặt → Google Sheet và nhập thông tin
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>AI tạo nội dung như thế nào?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  Hệ thống sử dụng AI để phân tích ý tưởng, đối tượng tiếp cận và ghi chú nghiên cứu của bạn. Sau đó tự
                  động tạo kịch bản video, caption và lời kêu gọi hành động phù hợp với từng nền tảng.
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Có thể chỉnh sửa nội dung AI tạo không?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  Có! Bạn có thể xem chi tiết và chỉnh sửa toàn bộ nội dung trước khi phê duyệt. Nhấn vào nút Xem chi
                  tiết → Chỉnh sửa để thay đổi kịch bản, caption hoặc CTA.
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>Làm sao để thay đổi lịch đăng?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  Vào tab Lịch đăng → Nhấn nút sửa bên cạnh lịch cần thay đổi → Cập nhật tần suất, ngày đăng hoặc giờ
                  đăng theo ý muốn.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}
