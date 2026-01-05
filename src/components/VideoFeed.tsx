import { ROS_CONFIG } from "../config";

interface VideoFeedProps {
  isConnected: boolean;
}

export function VideoFeed({ isConnected }: VideoFeedProps) {
  const foxgloveUrl = `${ROS_CONFIG.FOXGLOVE_STUDIO_URL}/?ds=foxglove-websocket&ds.url=${encodeURIComponent(ROS_CONFIG.FOXGLOVE_WS_URL)}&layoutUrl=${encodeURIComponent(ROS_CONFIG.LAYOUT_CAMERA_VIEW)}`;
  
  if (!isConnected) {
    return (
      <div className="w-full h-full min-h-[200px] bg-slate-950 flex items-center justify-center text-slate-500 rounded-lg border border-slate-800">
        <div className="text-center">
          <p className="mb-2">Camera Offline</p>
          <p className="text-xs opacity-50">Connect to Robot to view feed</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full min-h-[200px] bg-black rounded-lg overflow-hidden border border-slate-800 relative group">
      <iframe
        src={foxgloveUrl}
        className="w-full h-full border-0"
        title="Foxglove Camera Feed"
        allow="clipboard-read; clipboard-write"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
      
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-[10px] px-2 py-1 rounded pointer-events-none">
        Camera Feed
      </div>
    </div>
  );
}