import { useEffect, useRef, useState } from 'react';

interface JoystickProps {
  onMove: (x: number, y: number) => void;
  disabled?: boolean;
}

export function VirtualJoystick({ onMove, disabled = false }: JoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handleStart = (clientX: number, clientY: number) => {
    if (disabled) return;
    setIsDragging(true);
    updatePosition(clientX, clientY);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging || disabled) return;
    updatePosition(clientX, clientY);
  };

  const handleEnd = () => {
    setIsDragging(false);
    setPosition({ x: 0, y: 0 });
    onMove(0, 0);
  };

  const updatePosition = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let deltaX = clientX - centerX;
    let deltaY = clientY - centerY;

    const maxDistance = rect.width / 2 - 20;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > maxDistance) {
      const angle = Math.atan2(deltaY, deltaX);
      deltaX = Math.cos(angle) * maxDistance;
      deltaY = Math.sin(angle) * maxDistance;
    }

    setPosition({ x: deltaX, y: deltaY });
    
    // Normalize to -1 to 1 range
    const normalizedX = deltaX / maxDistance;
    const normalizedY = -deltaY / maxDistance; // Invert Y axis
    onMove(normalizedX, normalizedY);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, disabled]);

  return (
    <div
      ref={containerRef}
      className={`relative w-48 h-48 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 shadow-inner ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onTouchStart={(e) => {
        if (e.touches.length > 0) {
          handleStart(e.touches[0].clientX, e.touches[0].clientY);
        }
      }}
    >
      {/* Center indicator */}
      <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-slate-600 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
      
      {/* Directional guides */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-slate-500 text-xs">↑</div>
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-slate-500 text-xs">↓</div>
      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-500 text-xs">←</div>
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-500 text-xs">→</div>

      {/* Joystick handle */}
      <div
        className={`absolute top-1/2 left-1/2 w-16 h-16 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all ${
          disabled 
            ? 'bg-slate-700' 
            : 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg'
        }`}
        style={{
          transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
        }}
      >
        <div className="absolute inset-2 rounded-full bg-white/10" />
      </div>
    </div>
  );
}
