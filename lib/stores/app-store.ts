import { create } from "zustand";

import type { AuthUser } from "@/lib/auth";

type AppState = {
  isMobileNavOpen: boolean;
  hasHydrated: boolean;
  currentUser: AuthUser | null;
  walletAddress: string | null;
  openMobileNav: () => void;
  closeMobileNav: () => void;
  toggleMobileNav: () => void;
  signIn: (user: AuthUser) => void;
  signOut: () => void;
  updateWalletAddress: (walletAddress: string) => void;
  setHydrated: (value: boolean) => void;
};

export const useAppStore = create<AppState>()(
  (set) => ({
    isMobileNavOpen: false,
    hasHydrated: false,
    currentUser: null,
    walletAddress: null,
    openMobileNav: () => set({ isMobileNavOpen: true }),
    closeMobileNav: () => set({ isMobileNavOpen: false }),
    toggleMobileNav: () => set((state) => ({ isMobileNavOpen: !state.isMobileNavOpen })),
    signIn: (user) => set({ currentUser: user, walletAddress: user.walletAddress }),
    signOut: () => set({ currentUser: null, walletAddress: null }),
    updateWalletAddress: (walletAddress) =>
      set((state) => ({
        walletAddress,
        currentUser: state.currentUser
          ? {
              ...state.currentUser,
              walletAddress,
              walletLinked: true
            }
          : null
      })),
    setHydrated: (value) => set({ hasHydrated: value })
  })
);
