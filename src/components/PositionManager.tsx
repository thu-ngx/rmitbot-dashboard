import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import {
  MapPin,
  Save,
  Trash2,
  Navigation,
  Play,
  Square,
  RefreshCw,
} from "lucide-react";
import { positionService } from "@/services/positionService";
import type { SavedPosition } from "@/types";

interface PositionManagerProps {
  isConnected: boolean;
  disabled?: boolean;
}

export function PositionManager({ isConnected, disabled = false }: PositionManagerProps) {
  const [positions, setPositions] = useState<SavedPosition[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [newPositionName, setNewPositionName] = useState("");
  const [currentNavigatingIndex, setCurrentNavigatingIndex] = useState<number>(-1);

  // Load positions on mount
  useEffect(() => {
    if (isConnected) {
      loadPositions();
    }
  }, [isConnected]);

  const loadPositions = async () => {
    setIsLoading(true);
    try {
      const loadedPositions = await positionService.getPositions();
      setPositions(loadedPositions);
    } catch (error) {
      toast.error("Failed to load positions");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePosition = async () => {
    if (!newPositionName.trim()) {
      toast.error("Please enter a position name");
      return;
    }

    setIsSaving(true);
    try {
      const result = await positionService.savePosition(newPositionName.trim());
      if (result.success) {
        toast.success(`Position "${newPositionName}" saved`);
        setNewPositionName("");
        await loadPositions();
      } else {
        toast.error(result.message || "Failed to save position");
      }
    } catch (error) {
      toast.error("Error saving position");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePosition = async (name: string) => {
    try {
      const success = await positionService.deletePosition(name);
      if (success) {
        toast.success(`Position "${name}" deleted`);
        await loadPositions();
        selectedPositions.delete(name);
        setSelectedPositions(new Set(selectedPositions));
      } else {
        toast.error("Failed to delete position");
      }
    } catch (error) {
      toast.error("Error deleting position");
      console.error(error);
    }
  };

  const handleNavigateToSingle = async (name: string) => {
    setIsNavigating(true);
    try {
      toast.info(`Navigating to ${name}...`);
      const success = await positionService.navigateToPosition(
        name,
        (feedback) => {
          console.log("Navigation feedback:", feedback);
        }
      );
      if (success) {
        toast.success(`Reached ${name}`);
      } else {
        toast.error(`Failed to reach ${name}`);
      }
    } catch (error) {
      toast.error("Navigation error");
      console.error(error);
    } finally {
      setIsNavigating(false);
    }
  };

  const handleNavigateSelected = async () => {
    if (selectedPositions.size === 0) {
      toast.error("No positions selected");
      return;
    }

    const selectedNames = Array.from(selectedPositions);
    setIsNavigating(true);
    setCurrentNavigatingIndex(0);

    try {
      toast.info(`Navigating through ${selectedNames.length} positions...`);
      const success = await positionService.navigateThroughPositions(
        selectedNames,
        (feedback) => {
          if (feedback.current_index !== undefined) {
            setCurrentNavigatingIndex(feedback.current_index);
            toast.info(`At position ${feedback.current_index + 1}/${selectedNames.length}`);
          }
        }
      );
      if (success) {
        toast.success("Completed all positions!");
      } else {
        toast.error("Navigation sequence failed");
      }
    } catch (error) {
      toast.error("Navigation error");
      console.error(error);
    } finally {
      setIsNavigating(false);
      setCurrentNavigatingIndex(-1);
    }
  };

  const toggleSelection = (name: string) => {
    const newSelected = new Set(selectedPositions);
    if (newSelected.has(name)) {
      newSelected.delete(name);
    } else {
      newSelected.add(name);
    }
    setSelectedPositions(newSelected);
  };

  return (
    <Card className="bg-slate-800/30 border-slate-700/50 h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Position Manager
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {positions.length} saved
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={loadPositions}
              disabled={!isConnected || isLoading}
              className="h-7 w-7 p-0"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
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
            className="h-8 text-xs"
            onKeyPress={(e) => e.key === "Enter" && handleSavePosition()}
          />
          <Button
            size="sm"
            onClick={handleSavePosition}
            disabled={!isConnected || disabled || isSaving || !newPositionName.trim()}
            className="h-8 px-3 bg-green-600 hover:bg-green-700"
          >
            {isSaving ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <>
                <Save className="w-3 h-3 mr-1" />
                Save
              </>
            )}
          </Button>
        </div>

        {/* Navigation Controls */}
        {selectedPositions.size > 0 && (
          <div className="flex gap-2">
            {!isNavigating ? (
              <Button
                size="sm"
                onClick={handleNavigateSelected}
                disabled={!isConnected || disabled}
                className="flex-1 h-8 bg-blue-600 hover:bg-blue-700"
              >
                <Play className="w-3 h-3 mr-1" />
                Navigate Selected ({selectedPositions.size})
              </Button>
            ) : (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setIsNavigating(false)}
                className="flex-1 h-8"
              >
                <Square className="w-3 h-3 mr-1" />
                Stop Navigation
              </Button>
            )}
          </div>
        )}

        {/* Position List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {positions.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No saved positions
              <p className="text-[10px] mt-1">Drive to a location and save it</p>
            </div>
          ) : (
            positions.map((pos, index) => {
              const isSelected = selectedPositions.has(pos.name);
              const isCurrentlyNavigating = isNavigating && currentNavigatingIndex === index;

              return (
                <div
                  key={pos.id}
                  className={`flex items-center gap-2 p-2 rounded border transition-all group ${
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
                    className="h-4 w-4"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate">
                      {pos.name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      x: {pos.x.toFixed(2)}, y: {pos.y.toFixed(2)}, θ: {pos.theta.toFixed(2)}
                    </div>
                  </div>

                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      onClick={() => handleNavigateToSingle(pos.name)}
                      disabled={!isConnected || disabled || isNavigating}
                      className="h-6 px-2 bg-blue-600/80 hover:bg-blue-600 text-[10px]"
                    >
                      <Navigation className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeletePosition(pos.name)}
                      disabled={!isConnected || disabled || isNavigating}
                      className="h-6 w-6 p-0 hover:bg-red-500/20 text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
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