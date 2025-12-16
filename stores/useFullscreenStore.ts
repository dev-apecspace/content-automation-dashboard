import { create } from "zustand";

interface FullscreenStore {
  imageSrc: string | null;
  open: (src: string) => void;
  close: () => void;
}

export const useFullscreen = create<FullscreenStore>((set) => ({
  imageSrc: null,
  open: (src) => set({ imageSrc: src }),
  close: () => set({ imageSrc: null }),
}));