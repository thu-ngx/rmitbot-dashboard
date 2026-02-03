import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { SavedPosition } from "@/types";

interface PositionListItemProps {
  position: SavedPosition;
  isSelected: boolean;
  orderNumber: number | null;
  isCurrentTarget: boolean;
  disabled: boolean;
  isDeleting: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
}

export function PositionListItem({
  position,
  isSelected,
  orderNumber,
  isCurrentTarget,
  disabled,
  isDeleting,
  onToggleSelect,
  onDelete,
}: PositionListItemProps) {
  const containerClass = isCurrentTarget
    ? "bg-blue-500/20 border-blue-400/50"
    : isSelected
      ? "bg-slate-700/50 border-slate-600"
      : "bg-slate-800/40 border-slate-700/40 hover:bg-slate-700/30";

  const badgeClass = isCurrentTarget
    ? "bg-blue-500 text-white border-blue-400"
    : "bg-slate-600 text-slate-200 border-slate-500";

  return (
    <div
      className={`flex items-center gap-2 p-3 rounded border transition-all group ${containerClass}`}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggleSelect}
        disabled={disabled}
        className="h-4 w-4 border-slate-500 shrink-0"
      />

      {orderNumber !== null && (
        <Badge
          variant="outline"
          className={`h-6 w-6 p-0 flex items-center justify-center text-xs font-bold shrink-0 ${badgeClass}`}
        >
          {orderNumber}
        </Badge>
      )}

      <div className="flex-1 min-w-0">
        <div className="text-sm md:text-base font-medium text-slate-200 truncate">
          {position.name}
        </div>
        <div className="text-xs md:text-sm text-slate-400 font-mono">
          x: {position.x.toFixed(2)}, y: {position.y.toFixed(2)}, θ:{" "}
          {position.theta.toFixed(2)}
        </div>
      </div>

      <Button
        size="sm"
        variant="ghost"
        onClick={onDelete}
        disabled={disabled || isDeleting}
        className="h-8 w-8 p-0 hover:bg-red-500/20 text-red-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0"
        title="Delete position"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
