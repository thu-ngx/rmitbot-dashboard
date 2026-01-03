import { Play, Square, CheckCircle, Navigation, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import type { Position } from "../types";

interface PathQueueProps {
  positions: Position[];
  isNavigating: boolean;
  currentPositionIndex: number;
  onStart: () => void;
  onStop: () => void;
  onSkip: () => void;
  onGoTo: (index: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  disabled?: boolean;
}

export function PathQueue({
  positions,
  isNavigating,
  currentPositionIndex,
  onStart,
  onStop,
  onSkip,
  onGoTo,
  onRemove,
  onClear,
  disabled = false,
}: PathQueueProps) {
  return (
    <Card
      className={`bg-slate-800/30 border-slate-700/50 flex-1 flex flex-col ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <div className="p-2 border-b border-slate-700/50 flex items-center justify-between">
        <h3 className="text-[10px] uppercase text-slate-300 tracking-wider font-medium">
          Navigation Queue
        </h3>
        {isNavigating && (
          <Badge
            variant="outline"
            className="text-[8px] bg-blue-500/20 border-blue-400/50 text-blue-300"
          >
            Active
          </Badge>
        )}
      </div>

      <CardContent className="p-2 flex-1 flex flex-col gap-2 overflow-hidden">
        {/* Controls */}
        <div className="flex gap-1">
          {!isNavigating ? (
            <Button
              onClick={onStart}
              disabled={disabled || positions.length === 0}
              className="flex-1 bg-green-600 hover:bg-green-700 h-7 text-[10px]"
            >
              <Play className="w-3 h-3 mr-1" /> Start Navigation
            </Button>
          ) : (
            <Button
              onClick={onStop}
              variant="destructive"
              className="flex-1 h-7 text-[10px]"
            >
              <Square className="w-3 h-3 mr-1" /> Stop
            </Button>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-1">
          {positions.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-[10px]">
              No positions in queue
            </div>
          ) : (
            positions.map((pos, index) => {
              const isActive = index === currentPositionIndex && isNavigating;
              const isPast = index < currentPositionIndex;

              return (
                <div
                  key={pos.id}
                  className={`flex items-center gap-1 p-1.5 rounded border transition-all group 
                  ${
                    isActive
                      ? "bg-blue-500/20 border-blue-400/50"
                      : isPast
                      ? "bg-green-500/10 border-green-500/20 opacity-60"
                      : "bg-slate-800/40 border-slate-700/40"
                  }`}
                >
                  {/* Status Icon */}
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-medium 
                    ${
                      isActive
                        ? "bg-blue-500 text-white animate-pulse"
                        : isPast
                        ? "bg-green-600 text-white"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {isActive ? (
                      <Navigation className="w-2.5 h-2.5" />
                    ) : isPast ? (
                      <CheckCircle className="w-2.5 h-2.5" />
                    ) : (
                      index + 1
                    )}
                  </div>

                  <div className="flex-1 min-w-0 ml-1">
                    <div className="text-[10px] text-white truncate font-medium">
                      {pos.name}
                    </div>
                    <div className="text-[8px] text-slate-400">
                      ({pos.x.toFixed(0)}, {pos.y.toFixed(0)})
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {isActive && (
                      <Button
                        size="sm"
                        onClick={onSkip}
                        className="h-5 px-1.5 bg-green-600 hover:bg-green-700 text-[8px]"
                      >
                        Done <CheckCircle className="w-2 h-2 ml-1" />
                      </Button>
                    )}
                    {!isNavigating && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => onGoTo(index)}
                          className="h-5 px-1.5 bg-blue-600/80 hover:bg-blue-600 text-[8px] opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Go
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onRemove(pos.id)}
                          variant="ghost"
                          className="h-5 w-5 p-0 hover:bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {positions.length > 0 && !isNavigating && (
          <Button
            size="sm"
            variant="outline"
            onClick={onClear}
            className="w-full h-6 text-[9px] border-slate-600/50 text-slate-300"
          >
            Clear All
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
