import { NextResponse } from "next/server";
import {
  generateContentImage,
  type ImageGenAction,
} from "@/lib/ai/image-generator";
import { webhookErrorMessage } from "@/lib/webhook";

/**
 * Tạo/sửa ảnh đính kèm — chạy HOÀN TOÀN TRONG APP bằng GLM Image (z-ai-web-dev-sdk),
 * miễn phí, trả URL ảnh về ngay trong response. Thay thế cho webhook n8n bên ngoài
 * (đã chết, fire-and-forget nên UI không bao giờ nhận được kết quả).
 *
 * Contract giữ nguyên với client:
 *   body: { type: "create-image" | "edit-image", topic, content, require, imageUrl?, platform? }
 *   response: { success: true, imageUrl, engine } | { error }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const type = body?.type as ImageGenAction | undefined;
    if (type !== "create-image" && type !== "edit-image") {
      return NextResponse.json(
        { error: "type phải là 'create-image' hoặc 'edit-image'" },
        { status: 400 }
      );
    }

    const requirement: string = (body?.require ?? body?.topic ?? "").toString().trim();
    if (!requirement) {
      return NextResponse.json(
        { error: "Thiếu nội dung yêu cầu (require)" },
        { status: 400 }
      );
    }

    const imageUrl =
      type === "edit-image" && typeof body?.imageUrl === "string" && body.imageUrl
        ? body.imageUrl
        : undefined;

    if (type === "edit-image" && !imageUrl) {
      // Không có ảnh gốc để edit → chuyển thành tạo mới từ yêu cầu chữ.
      // (Giữ hành vi mềm: không chặn user, chỉ gen từ prompt.)
    }

    const result = await generateContentImage({
      action: type,
      topic: typeof body?.topic === "string" ? body.topic : undefined,
      content: typeof body?.content === "string" ? body.content : undefined,
      requirement,
      imageUrl,
      platform: typeof body?.platform === "string" ? body.platform : undefined,
    });

    return NextResponse.json({
      success: true,
      imageUrl: result.url,
      prompt: result.prompt,
      engine: "glm-image (z-ai, miễn phí)",
    });
  } catch (error) {
    console.error("edit-media (GLM in-app) lỗi:", error);
    return NextResponse.json(
      { error: webhookErrorMessage(error) },
      { status: 500 }
    );
  }
}
