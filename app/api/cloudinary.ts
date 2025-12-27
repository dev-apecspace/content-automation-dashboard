const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

if (!CLOUD_NAME || !UPLOAD_PRESET) {
  console.error("Missing environment variables for Cloudinary");
}

export const uploadImageFile = async (file: File): Promise<string | null> => {
  if (!file.type.startsWith("image/")) {
    alert("Chỉ được upload file ảnh!");
    return null;
  }

  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    alert("Kích thước ảnh không được vượt quá 10MB");
    return null;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) throw new Error("Upload failed");

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Lỗi upload Cloudinary:", error);
    alert("Upload ảnh thất bại, vui lòng thử lại");
    return null;
  }
};

export const uploadVideoFile = async (file: File): Promise<string | null> => {
  if (!file.type.startsWith("video/")) {
    alert("Chỉ được upload file video!");
    return null;
  }

  const MAX_SIZE = 100 * 1024 * 1024; // 100MB
  if (file.size > MAX_SIZE) {
    alert("Kích thước video không được vượt quá 100MB");
    return null;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) throw new Error("Upload failed");

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Lỗi upload video Cloudinary:", error);
    alert("Upload video thất bại, vui lòng thử lại");
    return null;
  }
};