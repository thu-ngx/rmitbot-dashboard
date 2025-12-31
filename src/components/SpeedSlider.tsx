import * as React from "react";

interface SpeedSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function SpeedSlider({
  value,
  onChange,
  disabled = false,
}: SpeedSliderProps) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    const newValue = Math.max(0, Math.min(100, Math.round(percentage)));
    onChange(newValue);
  };

  const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    const newValue = Math.max(0, Math.min(100, Math.round(percentage)));
    onChange(newValue);
  };

  return (
    <div
      className={`relative h-2 rounded-full ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      }`}
      onClick={handleClick}
      onMouseMove={(e) => e.buttons === 1 && handleDrag(e)}
    >
      {/* Background track - black */}
      <div className="absolute inset-0 bg-slate-950 border border-slate-700 rounded-full" />

      {/* Filled portion - white, grows from left */}
      <div
        className="absolute left-0 top-0 h-full bg-white transition-all duration-150 rounded-full"
        style={{ width: `${value}%` }}
      />

      {/* Handle - white circle, positioned absolutely */}
      <div
        className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full border-2 border-slate-950 shadow-lg transition-all duration-150 z-10"
        style={{ left: `calc(${value}% - 10px)` }}
      />
    </div>
  );
}
