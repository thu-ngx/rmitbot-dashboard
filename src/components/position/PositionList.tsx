import { PositionListItem } from "./PositionListItem";
import type { SavedPosition } from "@/types";

interface PositionListProps {
  positions: SavedPosition[];
  selectedPositions: Set<string>;
  selectedOrder: string[];
  currentNavigatingIndex: number;
  isNavigating: boolean;
  isConnected: boolean;
  deletingName: string | null;
  onToggleSelect: (name: string) => void;
  onDelete: (name: string) => void;
}

export function PositionList({
  positions,
  selectedPositions,
  selectedOrder,
  currentNavigatingIndex,
  isNavigating,
  isConnected,
  deletingName,
  onToggleSelect,
  onDelete,
}: PositionListProps) {
  if (positions.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        No saved positions
        <p className="text-xs mt-1 text-slate-500">
          Drive to a location and save it
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[50vh] lg:max-h-none">
      {positions.map((position) => {
        const isSelected = selectedPositions.has(position.name);
        const selectionIndex = selectedOrder.indexOf(position.name);
        const orderNumber = selectionIndex !== -1 ? selectionIndex + 1 : null;
        const isCurrentTarget =
          isNavigating &&
          currentNavigatingIndex !== -1 &&
          selectedOrder[currentNavigatingIndex] === position.name;

        return (
          <PositionListItem
            key={position.id}
            position={position}
            isSelected={isSelected}
            orderNumber={orderNumber}
            isCurrentTarget={isCurrentTarget}
            disabled={!isConnected || isNavigating}
            isDeleting={deletingName === position.name}
            onToggleSelect={() => onToggleSelect(position.name)}
            onDelete={() => onDelete(position.name)}
          />
        );
      })}
    </div>
  );
}
