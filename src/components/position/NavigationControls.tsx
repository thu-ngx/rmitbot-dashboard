import { Button } from "@/components/ui/button";
import { Play, Square } from "lucide-react";

interface NavigationControlsProps {
  selectedCount: number;
  isNavigating: boolean;
  isConnected: boolean;
  navigationStatus: string;
  onNavigate: () => void;
  onCancel: () => void;
}

export function NavigationControls({
  selectedCount,
  isNavigating,
  isConnected,
  navigationStatus,
  onNavigate,
  onCancel,
}: NavigationControlsProps) {
  if (selectedCount === 0 && !isNavigating) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Navigation Status */}
      {isNavigating && navigationStatus && (
        <div className="p-2 bg-blue-900/30 border border-blue-700/50 rounded text-xs text-blue-300">
          {navigationStatus}
        </div>
      )}

      {/* Navigation Buttons */}
      {selectedCount > 0 && (
        <div className="flex gap-2">
          {!isNavigating ? (
            <Button
              size="sm"
              onClick={onNavigate}
              disabled={!isConnected}
              className="flex-1 h-8 bg-blue-600 hover:bg-blue-700 text-white border-0 text-xs"
            >
              <Play className="w-3 h-3 mr-1" />
              Navigate ({selectedCount})
            </Button>
          ) : (
            <Button
              size="sm"
              variant="destructive"
              onClick={onCancel}
              className="flex-1 h-8 text-xs"
            >
              <Square className="w-3 h-3 mr-1" />
              Stop
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
