/**
 * Test thật pipeline tạo ảnh AI (GLM Image + Cloudinary):
 *   1. create-image từ prompt chữ → upload Cloudinary → URL
 *   2. edit-image: dùng URL vừa tạo làm ảnh gốc → VLM mô tả → tạo lại → URL
 * Chạy: bun run scripts/test-ai-images.ts
 */
import fs from "fs";
import {
  generateContentImage,
  type ImageGenSize,
} from "../lib/ai/image-generator";

async function main() {
  console.log("=== 1. CREATE-IMAGE (GLM, free) ===");
  const created = await generateContentImage({
    action: "create-image",
    topic: "Quảng cafe rang tay APEC",
    content:
      "Bài viết giới thiệu cà phê rang tay truyền thống, hương vị đậm đà, nguyên liệu từ nông trại Việt Nam.",
    requirement:
      "Ảnh minh họa ly cà phê sữa đá đặt trên bàn gỗ, phía sau là túi hạt cà phê rang, ánh sáng ấm tự nhiên",
    platform: "Facebook Post",
  });
  console.log("URL (create):", created.url);
  console.log("Prompt dùng:", created.prompt.slice(0, 120) + "...");

  console.log("\n=== 2. EDIT-IMAGE (VLM + GLM, free) ===");
  const edited = await generateContentImage({
    action: "edit-image",
    topic: "Quảng cafe rang tay APEC",
    requirement: "Thêm một chiếc ly cà phê nữa bên cạnh, đổi màu nền sang tông xanh mint",
    imageUrl: created.url,
    platform: "Facebook Post",
  });
  console.log("URL (edit):", edited.url);

  console.log("\n=== 3. KIỂM TRA URL REACHABLE ===");
  for (const [label, url] of [
    ["create", created.url],
    ["edit", edited.url],
  ] as const) {
    const res = await fetch(url, { method: "HEAD" });
    const type = res.headers.get("content-type");
    console.log(`${label}: HTTP ${res.status} ${type ?? ""}`);
    if (res.status !== 200 || !type?.startsWith("image/")) {
      throw new Error(`URL ${label} không phải ảnh hợp lệ`);
    }
  }

  // Lưu một bản cục bộ để soi trực quan khi cần
  const imgRes = await fetch(created.url);
  const buf = Buffer.from(await imgRes.arrayBuffer());
  fs.writeFileSync("/tmp/test-ai-image-create.png", buf);
  console.log(`\nĐã lưu bản mẫu: /tmp/test-ai-image-create.png (${buf.length} bytes)`);
  console.log("\n✅ PIPELINE TẠO ẢNH AI HOẠT ĐỘNG HOÀN CHỈNH (0đ chi phí)");
}

main().catch((e) => {
  console.error("\n❌ TEST FAIL:", e instanceof Error ? e.message : e);
  process.exit(1);
});
