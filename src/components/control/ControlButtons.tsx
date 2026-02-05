import { Button } from "@/components/ui/button";
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
  type LucideIcon,
} from "lucide-react";

interface ControlButtonsProps {
  onCommand: (command: string) => void;
  disabled?: boolean;
}

// Button configuration types
type ButtonColor = "blue" | "purple" | "indigo";

interface DirectionButton {
  command: string;
  icon: LucideIcon;
  color: ButtonColor;
}

interface RotationButton extends DirectionButton {
  label: string;
}

// Button configurations
const DIRECTION_GRID: DirectionButton[][] = [
  [
    { command: "forward-left", icon: MoveUpLeft, color: "purple" },
    { command: "forward", icon: ArrowUp, color: "blue" },
    { command: "forward-right", icon: MoveUpRight, color: "purple" },
  ],
  [
    { command: "left", icon: ArrowLeft, color: "blue" },
    { command: "stop", icon: Square, color: "blue" }, // Stop handled separately
    { command: "right", icon: ArrowRight, color: "blue" },
  ],
  [
    { command: "backward-left", icon: MoveDownLeft, color: "purple" },
    { command: "backward", icon: ArrowDown, color: "blue" },
    { command: "backward-right", icon: MoveDownRight, color: "purple" },
  ],
];

const DIRECTION_BUTTONS = DIRECTION_GRID.flat();

const ROTATION_BUTTONS: RotationButton[] = [
  { command: "rotate-left", icon: RotateCcw, color: "indigo", label: "Left" },
  { command: "rotate-right", icon: RotateCw, color: "indigo", label: "Right" },
];

const COLOR_CLASSES: Record<ButtonColor, string> = {
  blue: "bg-blue-600/80 hover:bg-blue-700",
  purple: "bg-purple-600/80 hover:bg-purple-700",
  indigo: "bg-indigo-600/80 hover:bg-indigo-700",
};

export function ControlButtons({
  onCommand,
  disabled = false,
}: ControlButtonsProps) {
  // Create hold-to-move handlers
  const createHoldHandlers = (command: string) => ({
    onMouseDown: () => !disabled && onCommand(command),
    onMouseUp: () => !disabled && onCommand("stop"),
    onMouseLeave: () => !disabled && onCommand("stop"),
    onTouchStart: (e: React.TouchEvent) => {
      e.preventDefault();
      if (!disabled) onCommand(command);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      e.preventDefault();
      if (!disabled) onCommand("stop");
    },
  });

  return (
    <div className="space-y-2">
      {/* Directional Controls Grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {DIRECTION_BUTTONS.map((btn) => {
          const Icon = btn.icon;
          const isStop = btn.command === "stop";

          if (isStop) {
            return (
              <Button
                key={btn.command}
                size="sm"
                variant="destructive"
                onClick={() => onCommand("stop")}
                disabled={disabled}
                className="h-11 select-none"
              >
                <Icon className="w-4 h-4" />
              </Button>
            );
          }

          return (
            <Button
              key={btn.command}
              size="sm"
              variant="secondary"
              disabled={disabled}
              className={`h-11 ${COLOR_CLASSES[btn.color]} text-white border-0 select-none`}
              {...createHoldHandlers(btn.command)}
            >
              <Icon className="w-4 h-4" />
            </Button>
          );
        })}
      </div>

      {/* Rotation Controls */}
      <div className="grid grid-cols-2 gap-1.5">
        {ROTATION_BUTTONS.map((btn) => {
          const Icon = btn.icon;
          return (
            <Button
              key={btn.command}
              size="sm"
              variant="secondary"
              disabled={disabled}
              className={`h-8 ${COLOR_CLASSES[btn.color]} text-white border-0 text-[10px] select-none`}
              {...createHoldHandlers(btn.command)}
            >
              <Icon className="w-3 h-3 mr-1" />
              {btn.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
