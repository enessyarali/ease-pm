import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  dark: boolean;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      dark: false,
      toggle: () => set((state) => ({ dark: !state.dark })),
    }),
    {
      name: 'ease-gitlab-theme',
    }
  )
);
