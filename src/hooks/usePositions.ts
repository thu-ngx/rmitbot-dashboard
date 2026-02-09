import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRosConnection } from "@/hooks/useRosConnection";
import { positionService } from "@/services/positionService";
import type { SavedPosition } from "@/types";

export function usePositions(isConnected: boolean) {
  const { ros } = useRosConnection();

  // State for positions list
  const [positions, setPositions] = useState<SavedPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // State for saving
  const [isSaving, setIsSaving] = useState(false);

  // State for deleting
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingName, setDeletingName] = useState<string | null>(null);

  // Fetch positions on mount/connection
  useEffect(() => {
    if (!isConnected) {
      setPositions([]);
      return;
    }

    setIsLoading(true);
    positionService
      .getPositions(ros)
      .then(setPositions)
      .catch((err) => {
        setError(err);
        console.error("[usePositions] Failed to fetch:", err);
      })
      .finally(() => setIsLoading(false));
  }, [isConnected, ros]);

  const refetch = async () => {
    if (!isConnected) return;

    setIsLoading(true);
    try {
      const data = await positionService.getPositions(ros);
      setPositions(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error("[usePositions] Refetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const addPosition = (position: SavedPosition) => {
    setPositions((prev) => [...prev, position]);
  };

  const removePosition = (name: string) => {
    setPositions((prev) => prev.filter((p) => p.name !== name));
  };

  const savePosition = async (name: string) => {
    setIsSaving(true);
    try {
      const result = await positionService.savePosition(ros, name);
      if (result.success) {
        toast.success(`Position "${name}" saved`);
        if (result.position) {
          addPosition(result.position);
        }
      } else {
        toast.error(result.message || "Failed to save position");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error saving position";
      console.error("[usePositions] savePosition error:", error);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const deletePosition = async (name: string) => {
    setIsDeleting(true);
    setDeletingName(name);

    try {
      const success = await positionService.deletePosition(ros, name);
      if (success) {
        toast.success(`Position "${name}" deleted`);
        removePosition(name);
      } else {
        toast.error("Failed to delete position");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error deleting position";
      console.error("[usePositions] deletePosition error:", error);
      toast.error(message);
    } finally {
      setIsDeleting(false);
      setDeletingName(null);
    }
  };

  return {
    positions,
    isLoading,
    error,
    isSaving,
    isDeleting,
    deletingName,
    refetch,
    savePosition,
    deletePosition,
  };
}
