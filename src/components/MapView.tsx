import type { Position } from '@/types';
import { ROS_CONFIG } from '../config';

interface MapViewProps {
  positions: Position[];
  onAddPosition: (position: Position) => void;
  onRemovePosition: (id: string) => void;
  disabled?: boolean;
}

export function MapView({ disabled = false }: MapViewProps) {
  const foxgloveUrl = `${ROS_CONFIG.FOXGLOVE_STUDIO_URL}/?ds=foxglove-websocket&ds.url=${encodeURIComponent(ROS_CONFIG.FOXGLOVE_WS_URL)}&layoutUrl=${encodeURIComponent(ROS_CONFIG.LAYOUT_3D_VIEW)}`;
  
  return (
    <div className="h-full flex flex-col bg-slate-950 rounded-lg border border-slate-800 overflow-hidden relative group">
      <iframe
        src={foxgloveUrl}
        className={`w-full h-full border-0 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        title="Foxglove 3D Map"
        allowFullScreen
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
      
      <div className="absolute top-2 right-2 bg-black/70 backdrop-blur text-white text-[10px] px-2 py-1 rounded border border-white/10 pointer-events-none">
        <span className="font-bold text-blue-400">3D LIVE VIEW</span>
      </div>
      
      <div className="absolute bottom-2 left-2 right-2 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <span className="bg-black/80 text-slate-300 text-[9px] px-2 py-1 rounded">
          3D visualization of robot and environment
        </span>
      </div>
    </div>
  );
}