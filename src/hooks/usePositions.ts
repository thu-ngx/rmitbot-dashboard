import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { positionService } from "@/services/positionService";
import { useSelectionStore } from "@/stores/selectionStore";

const POSITIONS_QUERY_KEY = ["positions"] as const;

/**
 * Query hook for fetching positions
 */
export function usePositions(isConnected: boolean) {
  return useQuery({
    queryKey: POSITIONS_QUERY_KEY,
    queryFn: () => positionService.getPositions(),
    enabled: isConnected,
    staleTime: 30_000, // Consider fresh for 30 seconds
    retry: 2,
    retryDelay: 1000,
  });
}

/**
 * Mutation hook for saving a new position
 */
export function useSavePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => positionService.savePosition(name),
    onSuccess: (result, name) => {
      if (result.success) {
        toast.success(`Position "${name}" saved`);
        queryClient.invalidateQueries({ queryKey: POSITIONS_QUERY_KEY });
      } else {
        toast.error(result.message || "Failed to save position");
      }
    },
    onError: (error: Error) => {
      console.error("Error saving position:", error);
      toast.error(error.message || "Error saving position");
    },
  });
}

/**
 * Mutation hook for deleting a position
 */
export function useDeletePosition() {
  const queryClient = useQueryClient();
  const removeFromSelection = useSelectionStore(
    (state) => state.removeFromSelection,
  );

  return useMutation({
    mutationFn: (name: string) => positionService.deletePosition(name),
    onSuccess: (success, name) => {
      if (success) {
        toast.success(`Position "${name}" deleted`);
        removeFromSelection(name);
        queryClient.invalidateQueries({ queryKey: POSITIONS_QUERY_KEY });
      } else {
        toast.error("Failed to delete position");
      }
    },
    onError: (error: Error) => {
      console.error("Error deleting position:", error);
      toast.error(error.message || "Error deleting position");
    },
  });
}
