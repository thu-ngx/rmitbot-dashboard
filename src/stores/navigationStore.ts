import { create } from "zustand";
import { positionService } from "@/services/positionService";
import type { NavigationFeedback } from "@/types";

interface NavigationState {
  isNavigating: boolean;
  currentIndex: number;
  status: string;
  totalPositions: number;
  startNavigation: (
    positionNames: string[],
    onFeedback?: (feedback: NavigationFeedback) => void,
  ) => Promise<void>;
  updateProgress: (index: number, status: string) => void;
  cancelNavigation: () => void;
  reset: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  isNavigating: false,
  currentIndex: -1,
  status: "",
  totalPositions: 0,

  startNavigation: async (positionNames, onFeedback) => {
    const total = positionNames.length;
    set({
      isNavigating: true,
      currentIndex: 0,
      status: `Starting navigation through ${total} positions...`,
      totalPositions: total,
    });

    try {
      const result = await positionService.navigateThroughPositions(
        positionNames,
        (feedback) => {
          const feedbackData = feedback as NavigationFeedback;
          const currentName = feedbackData?.current_position_name;

          if (currentName) {
            const idx = positionNames.indexOf(currentName);
            if (idx !== -1) {
              set({
                currentIndex: idx,
                status: `At position ${idx + 1}/${total}: ${currentName}`,
              });
            } else {
              set({ status: `Navigating: ${currentName}` });
            }
          }

          onFeedback?.(feedbackData);
        },
      );

      if (result.success) {
        set({ status: "Navigation completed!" });
      } else {
        set({ status: `Navigation failed: ${result.message}` });
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Navigation error";
      set({ status: message });
      throw error;
    } finally {
      set({ isNavigating: false, currentIndex: -1 });
    }
  },

  updateProgress: (currentIndex, status) => set({ currentIndex, status }),

  cancelNavigation: () => {
    positionService.cancelNavigation();
    set({
      isNavigating: false,
      currentIndex: -1,
      status: "Navigation cancelled",
    });
  },

  reset: () =>
    set({
      isNavigating: false,
      currentIndex: -1,
      status: "",
      totalPositions: 0,
    }),
}));
