import { useState, useRef } from 'react';
import { MapPin, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import type { Position } from '../types'; 

interface MapViewProps {
  positions: Position[];
  onAddPosition: (position: Omit<Position, 'id'>) => void;
  onRemovePosition: (id: string) => void;
  disabled?: boolean;
}

export function MapView({ positions, onAddPosition, onRemovePosition, disabled = false }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [hoveredPosition, setHoveredPosition] = useState<string | null>(null);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const name = `Position ${positions.length + 1}`;
    onAddPosition({ x, y, name });
  };

  return (
    <div className="h-full flex flex-col">
      <div
        ref={mapRef}
        className={`relative w-full flex-1 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded border border-slate-700/30 overflow-hidden ${
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-crosshair'
        }`}
        onClick={handleMapClick}
      >
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-15">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-600" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Positions */}
        {positions.map((pos, index) => (
          <div
            key={pos.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            onMouseEnter={() => setHoveredPosition(pos.id)}
            onMouseLeave={() => setHoveredPosition(null)}
          >
            {/* Position marker */}
            <div className="relative">
              <MapPin className="w-5 h-5 text-blue-500 fill-blue-500/20 drop-shadow-lg" />
              <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-purple-600 rounded-full border border-slate-900 flex items-center justify-center text-[9px]">
                {index + 1}
              </div>
            </div>

            {/* Label and delete button */}
            {(hoveredPosition === pos.id) && (
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-0.5 z-10">
                <div className="bg-slate-900/90 border border-slate-700/50 px-1.5 py-0.5 rounded text-[9px] whitespace-nowrap">
                  {pos.name}
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-4 px-1 text-[9px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemovePosition(pos.id);
                  }}
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </Button>
              </div>
            )}
          </div>
        ))}

        {/* Path lines */}
        {positions.length > 1 && (
          <svg className="absolute inset-0 pointer-events-none">
            {positions.map((pos, index) => {
              if (index === positions.length - 1) return null;
              const nextPos = positions[index + 1];
              return (
                <line
                  key={`${pos.id}-${nextPos.id}`}
                  x1={`${pos.x}%`}
                  y1={`${pos.y}%`}
                  x2={`${nextPos.x}%`}
                  y2={`${nextPos.y}%`}
                  stroke="rgba(147, 51, 234, 0.4)"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}