import { Leaf, Gauge, Zap } from 'lucide-react';
import { Button } from './ui/button';

export type SpeedMode = 'eco' | 'normal' | 'fast';

interface SpeedControlProps {
  selectedMode: SpeedMode;
  onModeChange: (mode: SpeedMode) => void;
  disabled?: boolean;
}

const speedModes = [
  { mode: 'eco' as SpeedMode, label: 'Eco', icon: Leaf, speed: '0.3', color: 'from-green-600 to-green-700' },
  { mode: 'normal' as SpeedMode, label: 'Normal', icon: Gauge, speed: '0.6', color: 'from-blue-600 to-blue-700' },
  { mode: 'fast' as SpeedMode, label: 'Fast', icon: Zap, speed: '1.0', color: 'from-purple-600 to-purple-700' },
];

export function SpeedControl({ selectedMode, onModeChange, disabled = false }: SpeedControlProps) {
  return (
    <div className="grid grid-cols-3 gap-1">
      {speedModes.map(({ mode, label, icon: Icon, speed, color }) => {
        const isSelected = selectedMode === mode;
        return (
          <Button
            key={mode}
            onClick={() => onModeChange(mode)}
            disabled={disabled}
            variant={isSelected ? 'default' : 'outline'}
            className={`flex items-center justify-center gap-1 h-7 px-1 ${
              isSelected
                ? `bg-gradient-to-br ${color} border-0 hover:opacity-90`
                : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-700/30'
            }`}
          >
            <Icon className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
            <span className={`text-[9px] ${isSelected ? 'text-white' : 'text-slate-400'}`}>
              {speed}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
