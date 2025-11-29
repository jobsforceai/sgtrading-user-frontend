import { create } from 'zustand';

interface UIState {
  isProfileSidebarOpen: boolean;
  setIsProfileSidebarOpen: (isOpen: boolean) => void;
  openProfileSidebar: () => void;
  closeProfileSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isProfileSidebarOpen: false,
  setIsProfileSidebarOpen: (isOpen) => set({ isProfileSidebarOpen: isOpen }),
  openProfileSidebar: () => set({ isProfileSidebarOpen: true }),
  closeProfileSidebar: () => set({ isProfileSidebarOpen: false }),
}));
