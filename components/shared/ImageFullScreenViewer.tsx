// components/ui/ImageFullscreenViewer.tsx
import React from "react";
import { X } from "lucide-react";

interface ImageFullscreenViewerProps {
  src: string;
  alt?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageFullscreenViewer: React.FC<ImageFullscreenViewerProps> = ({
  src,
  alt = "Ảnh fullscreen",
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
      onClick={onClose}  // Click nền để đóng
    >
      <div className="relative max-w-full max-h-full p-8">
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-full object-contain"
          onClick={(e) => e.stopPropagation()}  // Ngăn đóng khi click vào ảnh
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-3 bg-white text-black rounded-full hover:bg-gray-200 shadow-lg transition"
          aria-label="Đóng"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};