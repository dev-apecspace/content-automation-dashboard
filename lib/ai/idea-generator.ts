import ZAI from "z-ai-web-dev-sdk";

export type IdeaPostType = "video" | "content";

/**
 * Sinh ý tưởng nội dung bằng GLM (z-ai-web-dev-sdk) — chạy hoàn toàn trong app,
 * thay thế cho webhook n8n bên ngoài (đã chết). Một LLM call cho cả nhóm ý tưởng
 * của một project để giữ chi phí/độ trễ hợp lý.
 */
export async function generateIdeasForProject(opts: {
  postType: IdeaPostType;
  projectName: string;
  projectDescription?: string | null;
  quantity: number;
}): Promise<string[]> {
  const zai = await ZAI.create();
  const quantity = Math.min(Math.max(1, opts.quantity), 20);

  const kind =
    opts.postType === "video"
      ? "video ngắn dạng Reels/Shorts (15-60 giây, có hook mạnh trong 3 giây đầu)"
      : "bài viết mạng xã hội (caption Facebook, có mở hookers hút, CTA rõ)";

  const system = [
    "Bạn là chuyên gia sáng tạo nội dung mạng xã hội tiếng Việt với hơn 10 năm kinh nghiệm cho các thương hiệu consumer/B2C.",
    `Nhiệm vụ: viết Ý TƯỞNG ${kind}.`,
    "Mỗi ý tưởng là 1-2 câu: góc tiếp cận (angle) + gợi ý cách triển khai, cụ thể đủ để team bắt tay làm ngay.",
    "Các ý tưởng phải KHÁC NHAU về góc tiếp cận (emotional, giáo dục, giải trí, so sánh, behind-the-scenes, UGC, trending, khuyến mãi...).",
    'Chỉ trả về MỘT mảng JSON hợp lệ dạng ["ý tưởng 1", "ý tưởng 2", ...] — không thêm giải thích, không markdown fence.',
    "Viết bằng tiếng Việt tự nhiên, giọng thương hiệu gần gũi, không dùng emoji trong ý tưởng.",
  ].join(" ");

  const user = [
    `Dự án: ${opts.projectName}`,
    opts.projectDescription ? `Mô tả dự án: ${opts.projectDescription}` : "",
    `Số lượng ý tưởng cần tạo: ${quantity}`,
    "Lưu ý: ý tưởng phải bám sát chủ đề dự án và phù hợp nền tảng đăng.",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await zai.chat.completions.create({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    stream: false,
    thinking: { type: "disabled" },
  });

  const raw = response.choices?.[0]?.message?.content ?? "";
  const ideas = parseIdeasJson(raw, quantity);

  if (ideas.length === 0) {
    throw new Error("AI trả về định dạng không hợp lệ (không parse được JSON ý tưởng)");
  }
  return ideas;
}

/** Bóc JSON array từ reply của model (chịu được markdown fence / text thừa). */
function parseIdeasJson(raw: string, expected: number): string[] {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();

  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1);
  }

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((v) => typeof v === "string" && v.trim().length > 0)
        .map((v) => v.trim())
        .slice(0, expected);
    }
  } catch {
    // fallthrough to line-based extraction
  }

  // Fallback: model lỡ trả text thường — lấy từng dòng có nghĩa
  return text
    .split("\n")
    .map((l) => l.replace(/^[\s\-*\d.)"]+|["\s]+$/g, "").trim())
    .filter((l) => l.length > 15)
    .slice(0, expected);
}
