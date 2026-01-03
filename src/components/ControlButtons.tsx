import { Button } from './ui/button';
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
  MoveDownLeft
} from 'lucide-react';

interface ControlButtonsProps {
  onCommand: (command: string) => void;
  disabled?: boolean;
}

export function ControlButtons({ onCommand, disabled = false }: ControlButtonsProps) {
  return (
    <div className="space-y-2">
      {/* Directional Controls with Diagonals */}
      <div className="grid grid-cols-3 gap-1.5">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onCommand('forward-left')}
          disabled={disabled}
          className="h-11 bg-purple-600/80 hover:bg-purple-700 text-white border-0"
        >
          <MoveUpLeft className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onCommand('forward')}
          disabled={disabled}
          className="h-11 bg-blue-600/80 hover:bg-blue-700 text-white border-0"
        >
          <ArrowUp className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onCommand('forward-right')}
          disabled={disabled}
          className="h-11 bg-purple-600/80 hover:bg-purple-700 text-white border-0"
        >
          <MoveUpRight className="w-4 h-4" />
        </Button>
        
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onCommand('left')}
          disabled={disabled}
          className="h-11 bg-blue-600/80 hover:bg-blue-700 text-white border-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onCommand('stop')}
          disabled={disabled}
          className="h-11"
        >
          <Square className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onCommand('right')}
          disabled={disabled}
          className="h-11 bg-blue-600/80 hover:bg-blue-700 text-white border-0"
        >
          <ArrowRight className="w-4 h-4" />
        </Button>
        
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onCommand('backward-left')}
          disabled={disabled}
          className="h-11 bg-purple-600/80 hover:bg-purple-700 text-white border-0"
        >
          <MoveDownLeft className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onCommand('backward')}
          disabled={disabled}
          className="h-11 bg-blue-600/80 hover:bg-blue-700 text-white border-0"
        >
          <ArrowDown className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onCommand('backward-right')}
          disabled={disabled}
          className="h-11 bg-purple-600/80 hover:bg-purple-700 text-white border-0"
        >
          <MoveDownRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Rotation Controls */}
      <div className="grid grid-cols-2 gap-1.5">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onCommand('rotate-left')}
          disabled={disabled}
          className="h-8 bg-indigo-600/80 hover:bg-indigo-700 text-white border-0 text-[10px]"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Left
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onCommand('rotate-right')}
          disabled={disabled}
          className="h-8 bg-indigo-600/80 hover:bg-indigo-700 text-white border-0 text-[10px]"
        >
          <RotateCw className="w-3 h-3 mr-1" />
          Right
        </Button>
      </div>
    </div>
  );
}