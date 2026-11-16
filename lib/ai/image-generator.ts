import ZAI from "z-ai-web-dev-sdk";

export type ImageGenAction = "create-image" | "edit-image";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

/** Kích thước GLM Image hỗ trợ (Facebook feed dùng square/portrait là chủ yếu). */
const SUPPORTED_SIZES = [
  "1024x1024",
  "768x1344",
  "864x1152",
  "1344x768",
  "1152x864",
  "1440x720",
  "720x1440",
] as const;

export type ImageGenSize = (typeof SUPPORTED_SIZES)[number];

/**
 * Tạo/sửa ảnh nội dung bằng GLM Image (z-ai-web-dev-sdk) — chạy hoàn toàn trong app,
 * MIỄN PHÍ, thay thế webhook n8n bên ngoài (đã chết, trước đây tính $0.025/ảnh).
 *
 * - create-image: dựng prompt từ topic + caption + yêu cầu của user.
 * - edit-image:   SDK có API edit ảnh thật (ảnh gốc + prompt) → giữ bối cảnh ảnh,
 *                 chỉ thay đổi theo yêu cầu; không có ảnh gốc thì tạo mới từ chữ.
 * - Ảnh trả về base64 → upload Cloudinary (unsigned preset) để có URL bền vĩnh viễn
 *   (ảnh sẽ được đăng Facebook sau này nên không thể lưu data URL trong DB).
 */
export async function generateContentImage(opts: {
  action: ImageGenAction;
  topic?: string;
  content?: string;
  requirement: string;
  imageUrl?: string;
  platform?: string;
  size?: ImageGenSize;
}): Promise<{ url: string; prompt: string }> {
  const size = opts.size ?? "1024x1024";
  if (!SUPPORTED_SIZES.includes(size)) {
    throw new Error(`Kích thước ảnh không hỗ trợ: ${size}`);
  }

  const zai = await ZAI.create();

  let prompt = buildImagePrompt(opts);

  // edit-image: API edit thật của upstream (giữ bối cảnh ảnh gốc, chỉ thay đổi
  // theo yêu cầu). Lưu ý: type của SDK khai báo `image?: string` nhưng upstream
  // thực tế đòi `images: [{ url }]` (đã probe + verify 2026-11-16) — SDK spread
  // body nguyên vẹn nên truyền field bổ sung qua spread + cast.
  let base64: string | undefined;
  if (opts.action === "edit-image" && opts.imageUrl) {
    const editResponse = await zai.images.generations.edit({
      prompt,
      size,
      ...( { images: [{ url: opts.imageUrl }] } ),
    } as Parameters<typeof zai.images.generations.edit>[0]);
    base64 = editResponse.data?.[0]?.base64;
    if (!base64) {
      throw new Error("AI không trả về dữ liệu ảnh chỉnh sửa (base64 rỗng)");
    }
  } else {
    const response = await zai.images.generations.create({ prompt, size });
    base64 = response.data?.[0]?.base64;
    if (!base64) {
      throw new Error("AI không trả về dữ liệu ảnh (base64 rỗng)");
    }
  }

  const url = await uploadBase64ToCloudinary(base64);
  return { url, prompt };
}

/** Dựng prompt tạo ảnh mới từ ngữ cảnh nội dung + yêu cầu. */
function buildImagePrompt(opts: {
  action: ImageGenAction;
  topic?: string;
  content?: string;
  requirement: string;
  platform?: string;
}): string {
  const platformHint = opts.platform
    ? `Ảnh minh họa cho bài đăng ${opts.platform} — bố cục rõ, dễ đọc khi lướt feed.`
    : "Ảnh minh họa bài đăng mạng xã hội — bố cục rõ, dễ đọc khi lướt feed.";

  return [
    opts.requirement.trim(),
    opts.topic ? `Chủ đề: ${opts.topic}.` : "",
    opts.content?.trim()
      ? `Bối cảnh nội dung bài viết (chỉ lấy ý chính hình ảnh, không ghim chữ dài vào ảnh): ${opts.content.slice(0, 500)}`
      : "",
    platformHint,
    "Chất lượng cao, chi tiết, màu sắc hài hòa, không chứa chữ sai chính tả.",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Upload base64 PNG lên Cloudinary bằng unsigned preset (cùng cấu hình với
 * app/api/cloudinary.ts nhưng chạy server-side — không alert/refresh UI).
 */
async function uploadBase64ToCloudinary(base64: string): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error("Thiếu NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / UPLOAD_PRESET — không lưu được ảnh sinh ra");
  }

  const buffer = Buffer.from(base64, "base64");
  if (buffer.length === 0) {
    throw new Error("Dữ liệu ảnh nhận về rỗng");
  }

  const formData = new FormData();
  formData.append(
    "file",
    new Blob([new Uint8Array(buffer)], { type: "image/png" }),
    `ai-image-${Date.now()}.png`
  );
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("Upload Cloudinary lỗi:", res.status, detail.slice(0, 300));
    throw new Error("Upload ảnh lên Cloudinary thất bại (ảnh AI đã tạo nhưng không lưu được)");
  }

  const data = (await res.json()) as { secure_url?: string };
  if (!data.secure_url) {
    throw new Error("Cloudinary không trả về secure_url");
  }
  return data.secure_url;
}
