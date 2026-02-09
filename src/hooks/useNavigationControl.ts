import { useState } from "react";
import { toast } from "sonner";
import { useRosConnection } from "@/hooks/useRosConnection";
import { positionService } from "@/services/positionService";

export function useNavigationControl() {
  const { ros } = useRosConnection();
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [status, setStatus] = useState("");

  const startNavigation = async (positionNames: string[]) => {
    const total = positionNames.length;
    setIsNavigating(true);
    setCurrentIndex(0);
    setStatus(`Starting navigation through ${total} positions...`);

    try {
      const result = await positionService.navigateThroughPositions(
        ros,
        positionNames,
        (feedback) => {
          // Parse feedback to update current index
          const match = feedback.match(/position (\d+)\/(\d+)/);
          if (match) {
            const idx = parseInt(match[1]) - 1; // Convert to 0-based index
            setCurrentIndex(idx);
            setStatus(feedback);
          } else {
            setStatus(feedback);
          }
        },
      );

      if (result.success) {
        setStatus("Navigation completed!");
        toast.success("Navigation completed!");
      } else {
        setStatus(`Navigation failed: ${result.message}`);
        toast.error("Navigation failed");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Navigation error";
      setStatus(message);
      console.error("[useNavigationControl]", error);
      toast.error(message);
      throw error;
    } finally {
      setIsNavigating(false);
      setCurrentIndex(-1);
    }
  };

  const cancelNavigation = () => {
    positionService.cancelNavigation(ros);
    setIsNavigating(false);
    setCurrentIndex(-1);
    setStatus("Navigation cancelled");
    toast.info("Navigation cancelled");
  };

  return {
    isNavigating,
    currentIndex,
    status,
    startNavigation,
    cancelNavigation,
  };
}
