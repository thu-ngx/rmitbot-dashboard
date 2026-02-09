import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, RefreshCw } from "lucide-react";

import { PositionList } from "./PositionList";
import { SavePositionForm } from "./SavePositionForm";
import { NavigationControls } from "./NavigationControls";

import { usePositions } from "@/hooks/usePositions";
import { useNavigationQueue } from "@/hooks/useNavigationQueue";
import { useNavigationControl } from "@/hooks/useNavigationControl";

interface PositionManagerProps {
  isConnected: boolean;
}

export function PositionManager({ isConnected }: PositionManagerProps) {
  const {
    positions,
    isLoading,
    isSaving,
    deletingName,
    refetch,
    savePosition,
    deletePosition,
  } = usePositions(isConnected);

  const selection = useNavigationQueue();
  const navigation = useNavigationControl();

  const handleSave = async (name: string) => {
    await savePosition(name);
  };

  const handleDelete = async (name: string) => {
    await deletePosition(name);
    selection.removeFromSelection(name);
  };

  const handleNavigate = async () => {
    if (selection.selectedOrder.length === 0) {
      toast.error("No positions selected");
      return;
    }

    try {
      await navigation.startNavigation(selection.selectedOrder);
      selection.clearSelection();
    } catch {
      // Error already handled in useNavigationControl
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
          isSaving={isSaving}
          onSave={handleSave}
        />

        <NavigationControls
          selectedCount={selection.selectedPositions.size}
          isNavigating={navigation.isNavigating}
          isConnected={isConnected}
          navigationStatus={navigation.status}
          onNavigate={handleNavigate}
          onCancel={navigation.cancelNavigation}
        />

        <PositionList
          positions={positions}
          selectedPositions={selection.selectedPositions}
          selectedOrder={selection.selectedOrder}
          currentNavigatingIndex={navigation.currentIndex}
          isNavigating={navigation.isNavigating}
          isConnected={isConnected}
          deletingName={deletingName}
          onToggleSelect={selection.toggleSelection}
          onDelete={handleDelete}
        />
      </CardContent>
    </Card>
  );
}
