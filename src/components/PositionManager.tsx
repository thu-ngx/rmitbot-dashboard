import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import {
  MapPin,
  Save,
  Trash2,
  Navigation,
  Play,
  Square,
  RefreshCw,
} from "lucide-react";
import { usePosition } from "@/hooks/usePosition";

interface PositionManagerProps {
  isConnected: boolean;
  disabled?: boolean;
}

export function PositionManager({
  isConnected,
  disabled = false,
}: PositionManagerProps) {
  const {
    positions,
    selectedPositions,
    isLoading,
    isSaving,
    isNavigating,
    newPositionName,
    currentNavigatingIndex,
    navigationStatus,
    setNewPositionName,
    loadPositions,
    handleSavePosition,
    handleDeletePosition,
    handleNavigateToSingle,
    handleNavigateSelected,
    handleCancelNavigation,
    toggleSelection,
  } = usePosition({ isConnected });

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
              onClick={loadPositions}
              disabled={!isConnected || isLoading}
              className="h-7 w-7 p-0 hover:bg-slate-700/50"
            >
              <RefreshCw
                className={`w-3 h-3 text-slate-300 ${
                  isLoading ? "animate-spin" : ""
                }`}
              />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3 overflow-hidden">
        {/* Save New Position */}
        <div className="flex gap-2">
          <Input
            placeholder="Position name..."
            value={newPositionName}
            onChange={(e) => setNewPositionName(e.target.value)}
            disabled={!isConnected || disabled || isSaving}
            className="h-8 text-xs bg-slate-800/50 border-slate-700 text-slate-200 placeholder:text-slate-500"
            onKeyPress={(e) => e.key === "Enter" && handleSavePosition()}
          />
          <Button
            size="sm"
            onClick={handleSavePosition}
            disabled={
              !isConnected || disabled || isSaving || !newPositionName.trim()
            }
            className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white border-0 whitespace-nowrap"
          >
            {isSaving ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <>
                <Save className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Save</span>
              </>
            )}
          </Button>
        </div>

        {/* Navigation Status */}
        {isNavigating && navigationStatus && (
          <div className="p-2 bg-blue-900/30 border border-blue-700/50 rounded text-xs text-blue-300">
            {navigationStatus}
          </div>
        )}

        {/* Navigation Controls */}
        {selectedPositions.size > 0 && (
          <div className="flex gap-2">
            {!isNavigating ? (
              <Button
                size="sm"
                onClick={handleNavigateSelected}
                disabled={!isConnected || disabled}
                className="flex-1 h-8 bg-blue-600 hover:bg-blue-700 text-white border-0 text-xs"
              >
                <Play className="w-3 h-3 mr-1" />
                Navigate ({selectedPositions.size})
              </Button>
            ) : (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleCancelNavigation}
                className="flex-1 h-8 text-xs"
              >
                <Square className="w-3 h-3 mr-1" />
                Stop
              </Button>
            )}
          </div>
        )}

        {/* Position List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[50vh] lg:max-h-none">
          {positions.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No saved positions
              <p className="text-xs mt-1 text-slate-500">
                Drive to a location and save it
              </p>
            </div>
          ) : (
            positions.map((pos, index) => {
              const isSelected = selectedPositions.has(pos.name);
              const isCurrentlyNavigating =
                isNavigating && currentNavigatingIndex === index;

              return (
                <div
                  key={pos.id}
                  className={`flex items-center gap-2 p-3 rounded border transition-all group ${
                    isCurrentlyNavigating
                      ? "bg-blue-500/20 border-blue-400/50"
                      : isSelected
                      ? "bg-slate-700/50 border-slate-600"
                      : "bg-slate-800/40 border-slate-700/40 hover:bg-slate-700/30"
                  }`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelection(pos.name)}
                    disabled={!isConnected || disabled || isNavigating}
                    className="h-4 w-4 border-slate-500 shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="text-sm md:text-base font-medium text-slate-200 truncate">
                      {pos.name}
                    </div>
                    <div className="text-xs md:text-sm text-slate-400 font-mono">
                      x: {pos.x.toFixed(2)}, y: {pos.y.toFixed(2)}, θ:{" "}
                      {pos.theta.toFixed(2)}
                    </div>
                  </div>

                  <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleNavigateToSingle(pos.name)}
                      disabled={!isConnected || disabled || isNavigating}
                      className="h-8 w-8 p-0 bg-blue-600/80 hover:bg-blue-600 text-white"
                      title="Navigate to this position"
                    >
                      <Navigation className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeletePosition(pos.name)}
                      disabled={!isConnected || disabled || isNavigating}
                      className="h-8 w-8 p-0 hover:bg-red-500/20 text-red-400"
                      title="Delete position"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
