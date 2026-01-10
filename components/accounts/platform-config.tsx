import { AccountPlatform } from "@/lib/types";
import {
  Facebook,
  Youtube,
  Instagram,
  Linkedin,
  Twitter,
  User,
} from "lucide-react";
import { TiktokIcon } from "@/components/ui/icons/tiktok";

// Custom Zalo Icon (SVG)
export const ZaloIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    fill="currentColor"
    className={className}
  >
    <path d="M42.5 19.5c-.3 0-.5.2-.6.4-.3 1.2-.7 3.6-3.8 5.7.5 2.1 2.3 2.9 2.5 2.9.2.1.3.3.3.5s-.2.4-.4.4h-3.4c-.2 0-.4-.1-.5-.3-.2-.5-1.5-3.3-4-4.2-2.3-.8-4.1.3-4.2.3-.2.1-.3.1-.5 0-.1-.1-.1-.3-.1-.4V10c0-.3-.2-.5-.5-.5h-6c-2.8 0-5 2.2-5 5v16c0 2.2 1.4 4.1 3.4 4.7l-1 2.8c-.1.3 0 .6.2.8.2.2.5.2.7.1l6.1-2.9c.5.1 1.1.2 1.6.2 2.8 0 5-2.2 5-5v-.5c.8.6 1.8 1.4 3 2.5 1.7 1.6 2.3 1.9 2.5 2 .1.1.2.1.3.1h3.4c.2 0 .4-.2.4-.4 0-.1 0-.2-.1-.2-.2-.2-1.2-1.3-3.6-3.1 1.6-1.5 2.4-3.5 2.6-5.4 0-.2-.2-.5-.4-.5h-2.9z" />
  </svg>
);

// Custom Threads Icon (SVG)
export const ThreadsIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M19 12a7 7 0 1 1-7-7c1.57 0 3 .5 4 1.5l1 1" />
    <path d="M17 12a3 3 0 1 1-3-3 3 3 0 0 1 3 3v2a3.5 3.5 0 0 1-7 0" />
  </svg>
);

export const accountPlatformIcons: Record<AccountPlatform, React.ReactNode> = {
  Facebook: <Facebook className="w-5 h-5 text-blue-600" />,
  Youtube: <Youtube className="w-5 h-5 text-red-600" />,
  Tiktok: <TiktokIcon className="w-5 h-5 text-black" />,
  Zalo: <ZaloIcon className="w-5 h-5 text-blue-500" />,
  Instagram: <Instagram className="w-5 h-5 text-pink-600" />,
  Linkedin: <Linkedin className="w-5 h-5 text-blue-700" />,
  X: <Twitter className="w-5 h-5 text-black" />,
  Threads: <ThreadsIcon className="w-5 h-5 text-black" />,
};

export const getPlatformIcon = (platform: string) => {
  return (
    accountPlatformIcons[platform as AccountPlatform] || (
      <User className="w-5 h-5" />
    )
  );
};
