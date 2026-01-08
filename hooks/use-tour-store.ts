import { create } from "zustand";

export interface TourStep {
  targetId: string;
  title: string;
  description: string;
  placement?: "top" | "bottom" | "left" | "right";
}

interface TourState {
  isOpen: boolean;
  steps: TourStep[];
  currentStep: number;
  startTour: (steps: TourStep[]) => void;
  closeTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
}

export const useTourStore = create<TourState>((set, get) => ({
  isOpen: false,
  steps: [],
  currentStep: 0,
  startTour: (steps) => set({ isOpen: true, steps, currentStep: 0 }),
  closeTour: () => set({ isOpen: false, currentStep: 0 }),
  nextStep: () => {
    const { currentStep, steps } = get();
    if (currentStep < steps.length - 1) {
      set({ currentStep: currentStep + 1 });
    }
  },
  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 });
    }
  },
}));
