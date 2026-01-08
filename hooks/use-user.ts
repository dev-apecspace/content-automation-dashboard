import { create } from "zustand";
import { getMyProfile } from "@/actions/auth-actions";
import { User } from "@/lib/api/users";

interface UserState {
  user: Partial<User> | null;
  isLoading: boolean;
  fetchUser: () => Promise<void>;
  setUser: (user: Partial<User> | null) => void;
}

export const useUser = create<UserState>((set) => ({
  user: null,
  isLoading: false,
  fetchUser: async () => {
    set({ isLoading: true });
    try {
      const user = await getMyProfile();
      set({ user });
    } catch (error) {
      console.error("Failed to fetch user profile", error);
      set({ user: null });
    } finally {
      set({ isLoading: false });
    }
  },
  setUser: (user) => set({ user }),
}));
