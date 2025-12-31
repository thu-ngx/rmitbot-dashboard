import { Button } from "./ui/button.tsx";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  RotateCw,
  Square,
  MoveUpRight,
  MoveUpLeft,
  MoveDownRight,
  MoveDownLeft,
} from "lucide-react";

interface ControlButtonsProps {
  onCommand: (command: string) => void;
  disabled?: boolean;
}

export function ControlButtons({
  onCommand,
  disabled = false,
}: ControlButtonsProps) {
  return (
    <div className="space-y-4">
      {/* Directional Controls with Diagonals */}
      <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
        <Button
          size="lg"
          variant="secondary"
          onClick={() => onCommand("forward-left")}
          disabled={disabled}
          className="h-14 bg-purple-600 hover:bg-purple-700 text-white"
        >
          <MoveUpLeft className="w-5 h-5" />
        </Button>
        <Button
          size="lg"
          variant="secondary"
          onClick={() => onCommand("forward")}
          disabled={disabled}
          className="h-14 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <ArrowUp className="w-5 h-5" />
        </Button>
        <Button
          size="lg"
          variant="secondary"
          onClick={() => onCommand("forward-right")}
          disabled={disabled}
          className="h-14 bg-purple-600 hover:bg-purple-700 text-white"
        >
          <MoveUpRight className="w-5 h-5" />
        </Button>

        <Button
          size="lg"
          variant="secondary"
          onClick={() => onCommand("left")}
          disabled={disabled}
          className="h-14 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Button
          size="lg"
          variant="destructive"
          onClick={() => onCommand("stop")}
          disabled={disabled}
          className="h-14"
        >
          <Square className="w-5 h-5" />
        </Button>
        <Button
          size="lg"
          variant="secondary"
          onClick={() => onCommand("right")}
          disabled={disabled}
          className="h-14 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <ArrowRight className="w-5 h-5" />
        </Button>

        <Button
          size="lg"
          variant="secondary"
          onClick={() => onCommand("backward-left")}
          disabled={disabled}
          className="h-14 bg-purple-600 hover:bg-purple-700 text-white"
        >
          <MoveDownLeft className="w-5 h-5" />
        </Button>
        <Button
          size="lg"
          variant="secondary"
          onClick={() => onCommand("backward")}
          disabled={disabled}
          className="h-14 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <ArrowDown className="w-5 h-5" />
        </Button>
        <Button
          size="lg"
          variant="secondary"
          onClick={() => onCommand("backward-right")}
          disabled={disabled}
          className="h-14 bg-purple-600 hover:bg-purple-700 text-white"
        >
          <MoveDownRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Rotation Controls */}
      <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
        <Button
          size="lg"
          variant="secondary"
          onClick={() => onCommand("rotate-left")}
          disabled={disabled}
          className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Rotate Left
        </Button>
        <Button
          size="lg"
          variant="secondary"
          onClick={() => onCommand("rotate-right")}
          disabled={disabled}
          className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <RotateCw className="w-4 h-4 mr-2" />
          Rotate Right
        </Button>
      </div>
    </div>
  );
}
