import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, RefreshCw } from "lucide-react";

import { PositionList } from "./PositionList";
import { SavePositionForm } from "./SavePositionForm";
import { NavigationControls } from "./NavigationControls";

import {
  usePositions,
  useSavePosition,
  useDeletePosition,
} from "@/hooks/usePositions";
import { useSelectionStore } from "@/stores/selectionStore";
import { useNavigationStore } from "@/stores/navigationStore";

interface PositionManagerProps {
  isConnected: boolean;
}

export function PositionManager({ isConnected }: PositionManagerProps) {
  // React Query
  const {
    data: positions = [],
    isLoading,
    refetch,
  } = usePositions(isConnected);
  const savePositionMutation = useSavePosition();
  const deletePositionMutation = useDeletePosition();

  // Zustand stores
  const { selectedPositions, selectedOrder, toggleSelection, clearSelection } =
    useSelectionStore();
  const {
    isNavigating,
    currentIndex,
    status: navigationStatus,
    startNavigation,
    cancelNavigation,
  } = useNavigationStore();

  const handleSavePosition = (name: string) => {
    savePositionMutation.mutate(name);
  };

  const handleDeletePosition = (name: string) => {
    deletePositionMutation.mutate(name);
  };

  const handleNavigate = async () => {
    if (selectedOrder.length === 0) {
      toast.error("No positions selected");
      return;
    }

    try {
      toast.info(`Navigating through ${selectedOrder.length} positions...`);
      await startNavigation(selectedOrder);
      toast.success("Navigation completed!");
      clearSelection();
    } catch {
      toast.error("Navigation failed");
    }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2 text-white">
            <MapPin className="w-4 h-4" />
            Position Manager
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-xs text-slate-300 border-slate-600"
            >
              {positions.length} saved
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => refetch()}
              disabled={!isConnected || isLoading}
              className="h-7 w-7 p-0 hover:bg-slate-700/50"
            >
              <RefreshCw
                className={`w-3 h-3 text-slate-300 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3 overflow-hidden">
        <SavePositionForm
          disabled={!isConnected}
          isSaving={savePositionMutation.isPending}
          onSave={handleSavePosition}
        />

        <NavigationControls
          selectedCount={selectedPositions.size}
          isNavigating={isNavigating}
          isConnected={isConnected}
          navigationStatus={navigationStatus}
          onNavigate={handleNavigate}
          onCancel={cancelNavigation}
        />

        <PositionList
          positions={positions}
          selectedPositions={selectedPositions}
          selectedOrder={selectedOrder}
          currentNavigatingIndex={currentIndex}
          isNavigating={isNavigating}
          isConnected={isConnected}
          deletingName={
            deletePositionMutation.isPending
              ? (deletePositionMutation.variables ?? null)
              : null
          }
          onToggleSelect={toggleSelection}
          onDelete={handleDeletePosition}
        />
      </CardContent>
    </Card>
  );
}
