import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UiState = {
  /** Index of the currently active story within an open story viewer */
  activeStoryIndex: number;
  /** Index of the user's story reel tray being viewed */
  activeStoryReelIndex: number;
  /** Whether the bottom tab bar is visible (hidden when in fullscreen content) */
  tabBarVisible: boolean;
  /** Whether any modal is currently open */
  activeModalId: string | null;
  /**
   * A search query queued by another screen (e.g. tapping a #hashtag or
   * @mention in a caption) for the Search screen to pick up on next focus,
   * then clear. Null when nothing is queued.
   */
  pendingSearchQuery: string | null;
};

type UiActions = {
  setActiveStoryIndex(index: number): void;
  setActiveStoryReelIndex(index: number): void;
  setTabBarVisible(visible: boolean): void;
  openModal(id: string): void;
  closeModal(): void;
  resetStoryViewer(): void;
  setPendingSearchQuery(query: string): void;
  clearPendingSearchQuery(): void;
};

// ---------------------------------------------------------------------------
// Store — intentionally NOT persisted (pure transient UI state)
// ---------------------------------------------------------------------------

export const useUiStore = create<UiState & UiActions>()((set) => ({
  activeStoryIndex: 0,
  activeStoryReelIndex: 0,
  tabBarVisible: true,
  activeModalId: null,
  pendingSearchQuery: null,

  setActiveStoryIndex(index) {
    set({ activeStoryIndex: index });
  },

  setActiveStoryReelIndex(index) {
    set({ activeStoryReelIndex: index });
  },

  setTabBarVisible(visible) {
    set({ tabBarVisible: visible });
  },

  openModal(id) {
    set({ activeModalId: id });
  },

  closeModal() {
    set({ activeModalId: null });
  },

  resetStoryViewer() {
    set({ activeStoryIndex: 0, activeStoryReelIndex: 0 });
  },

  setPendingSearchQuery(query) {
    set({ pendingSearchQuery: query });
  },

  clearPendingSearchQuery() {
    set({ pendingSearchQuery: null });
  },
}));

// ---------------------------------------------------------------------------
// Selector hooks
// ---------------------------------------------------------------------------

export const useActiveStoryIndex = () =>
  useUiStore((s) => s.activeStoryIndex);

export const useTabBarVisible = () =>
  useUiStore((s) => s.tabBarVisible);

export const useActiveModalId = () =>
  useUiStore((s) => s.activeModalId);

export const usePendingSearchQuery = () =>
  useUiStore((s) => s.pendingSearchQuery);
