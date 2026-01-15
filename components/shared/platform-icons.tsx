import { AccountPlatform, ContentPlatform, VideoPlatform } from "@/lib/types";
import {
  Facebook,
  Youtube,
  Instagram,
  Linkedin,
  Twitter,
  User,
} from "lucide-react";

// Custom Tiktok Icon (SVG)
export const TiktokIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

// Custom Zalo Icon (SVG)
export const ZaloIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    className={className}
  >
    <path
      fill="#2962ff"
      d="M15,36V6.827l-1.211-0.811C8.64,8.083,5,13.112,5,19v10c0,7.732,6.268,14,14,14h10	c4.722,0,8.883-2.348,11.417-5.931V36H15z"
    ></path>
    <path
      fill="#eee"
      d="M29,5H19c-1.845,0-3.601,0.366-5.214,1.014C10.453,9.25,8,14.528,8,19	c0,6.771,0.936,10.735,3.712,14.607c0.216,0.301,0.357,0.653,0.376,1.022c0.043,0.835-0.129,2.365-1.634,3.742	c-0.162,0.148-0.059,0.419,0.16,0.428c0.942,0.041,2.843-0.014,4.797-0.877c0.557-0.246,1.191-0.203,1.729,0.083	C20.453,39.764,24.333,40,28,40c4.676,0,9.339-1.04,12.417-2.916C42.038,34.799,43,32.014,43,29V19C43,11.268,36.732,5,29,5z"
    ></path>
    <path
      fill="#2962ff"
      d="M36.75,27C34.683,27,33,25.317,33,23.25s1.683-3.75,3.75-3.75s3.75,1.683,3.75,3.75	S38.817,27,36.75,27z M36.75,21c-1.24,0-2.25,1.01-2.25,2.25s1.01,2.25,2.25,2.25S39,24.49,39,23.25S37.99,21,36.75,21z"
    ></path>
    <path
      fill="#2962ff"
      d="M31.5,27h-1c-0.276,0-0.5-0.224-0.5-0.5V18h1.5V27z"
    ></path>
    <path
      fill="#2962ff"
      d="M27,19.75v0.519c-0.629-0.476-1.403-0.769-2.25-0.769c-2.067,0-3.75,1.683-3.75,3.75	S22.683,27,24.75,27c0.847,0,1.621-0.293,2.25-0.769V26.5c0,0.276,0.224,0.5,0.5,0.5h1v-7.25H27z M24.75,25.5	c-1.24,0-2.25-1.01-2.25-2.25S23.51,21,24.75,21S27,22.01,27,23.25S25.99,25.5,24.75,25.5z"
    ></path>
    <path
      fill="#2962ff"
      d="M21.25,18h-8v1.5h5.321L13,26h0.026c-0.163,0.211-0.276,0.463-0.276,0.75V27h7.5	c0.276,0,0.5-0.224,0.5-0.5v-1h-5.321L21,19h-0.026c0.163-0.211,0.276-0.463,0.276-0.75V18z"
    ></path>
  </svg>
);

// Custom Threads Icon (SVG)
export const ThreadsIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 192 192"
    fill="currentColor"
    className={className}
  >
    <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6855C105.707 61.7381 111.932 64.1366 115.961 68.814C118.893 72.2193 120.854 76.925 121.825 82.8638C114.511 81.6207 106.601 81.2385 98.145 81.7233C74.3247 83.0954 59.0111 96.9879 60.0396 116.292C60.5615 126.084 65.4397 134.508 73.775 140.011C80.8224 144.663 89.899 146.938 99.3323 146.423C111.79 145.74 121.563 140.987 128.381 132.296C133.559 125.696 136.834 117.143 138.28 106.366C144.217 109.949 148.617 114.664 151.047 120.332C155.179 129.967 155.42 145.8 142.501 158.708C131.182 170.016 117.576 174.908 97.0135 175.059C74.2042 174.89 56.9538 167.575 45.7381 153.317C35.2355 139.966 29.8077 120.682 29.6052 96C29.8077 71.3178 35.2355 52.0336 45.7381 38.6827C56.9538 24.4249 74.2039 17.11 97.0132 16.9405C119.988 17.1113 137.539 24.4614 149.184 38.788C154.894 45.8136 159.199 54.6488 162.037 64.9503L178.184 60.6422C174.744 47.9622 169.331 37.0357 161.965 27.974C147.036 9.60668 125.202 0.195148 97.0695 0H96.9569C68.8816 0.19447 47.2921 9.6418 32.7883 28.0793C19.8819 44.4864 13.2244 67.3157 13.0007 95.9325L13 96L13.0007 96.0675C13.2244 124.684 19.8819 147.514 32.7883 163.921C47.2921 182.358 68.8816 191.806 96.9569 192H97.0695C122.03 191.827 139.624 185.292 154.118 170.811C173.081 151.866 172.51 128.119 166.26 113.541C161.776 103.087 153.227 94.5962 141.537 88.9883ZM98.4405 129.507C88.0005 130.095 77.1544 125.409 76.6196 115.372C76.2232 107.93 81.9158 99.626 99.0812 98.6368C101.047 98.5234 102.976 98.468 104.871 98.468C111.106 98.468 116.939 99.0737 122.242 100.233C120.264 124.935 108.662 128.946 98.4405 129.507Z" />
  </svg>
);

// Custom X Icon (SVG)
export const XIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1024 1024"
    className={className}
  >
    <g
      fill="none"
      fillRule="evenodd"
      stroke="none"
      strokeWidth="1"
      transform="translate(112 112)"
    >
      <path
        fill="#000"
        d="M711.111 800H88.89C39.8 800 0 760.2 0 711.111V88.89C0 39.8 39.8 0 88.889 0H711.11C760.2 0 800 39.8 800 88.889V711.11C800 760.2 760.2 800 711.111 800"
      />
      <path
        fill="#FFF"
        fillRule="nonzero"
        d="M628 623H484.942L174 179h143.058zm-126.012-37.651h56.96L300.013 216.65h-56.96z"
      />
      <path
        fill="#FFF"
        fillRule="nonzero"
        d="M219.296885 623 379 437.732409 358.114212 410 174 623z"
      />
      <path
        fill="#FFF"
        fillRule="nonzero"
        d="M409 348.387347 429.212986 377 603 177 558.330417 177z"
      />
    </g>
  </svg>
);

export const accountPlatformIcons: Record<AccountPlatform, React.ReactNode> = {
  Facebook: <Facebook className="w-5 h-5 text-blue-600" />,
  Youtube: <Youtube className="w-5 h-5 text-red-600" />,
  Tiktok: <TiktokIcon className="w-5 h-5 text-black" />,
  Zalo: <ZaloIcon className="w-5 h-5 text-blue-500" />,
  Instagram: <Instagram className="w-5 h-5 text-pink-600" />,
  Linkedin: <Linkedin className="w-5 h-5 text-blue-700" />,
  X: <XIcon className="w-5 h-5" />,
  Threads: <ThreadsIcon className="w-5 h-5 text-black" />,
};

export const contentPlatformIcons: Record<ContentPlatform, React.ReactNode> = {
  "Facebook Post": <Facebook className="w-4 h-4 text-blue-600" />,
  "Instagram Post": <Instagram className="w-4 h-4 text-pink-600" />,
  "Threads Post": <ThreadsIcon className="w-4 h-4 text-black" />,
  "Zalo Post": <ZaloIcon className="w-4 h-4 text-blue-500" />,
  "Youtube Post": <Youtube className="w-4 h-4 text-red-600" />,
  "Tiktok Carousel": <TiktokIcon className="w-4 h-4 text-black" />,
  "X Tweet": <XIcon className="w-4 h-4" />,
  "Linkedin Post": <Linkedin className="w-4 h-4 text-blue-700" />,
};

export const videoPlatformIcons: Record<VideoPlatform, React.ReactNode> = {
  "Facebook Reels": <Facebook className="w-4 h-4 text-blue-600" />,
  "Instagram Reels": <Instagram className="w-4 h-4 text-pink-600" />,
  "Threads Video": <ThreadsIcon className="w-4 h-4 text-black" />,
  "Zalo Video": <ZaloIcon className="w-4 h-4 text-blue-500" />,
  "Youtube Shorts": <Youtube className="w-4 h-4 text-red-600" />,
  "Tiktok Video": <TiktokIcon className="w-4 h-4 text-black" />,
  "X Tweet Video": <XIcon className="w-4 h-4" />,
  "LinkedIn Video": <Linkedin className="w-4 h-4 text-blue-700" />,
};

export const getPlatformIcon = (platform: string) => {
  return (
    accountPlatformIcons[platform as AccountPlatform] || (
      <User className="w-5 h-5" />
    )
  );
};
