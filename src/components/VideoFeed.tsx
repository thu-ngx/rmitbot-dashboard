import { useState } from 'react';
import { Camera, CameraOff } from 'lucide-react';

interface VideoFeedProps {
  isConnected: boolean;
}

export function VideoFeed({ isConnected }: VideoFeedProps) {
  const [streamError] = useState(false);

  return (
    <div className="relative w-full aspect-video bg-slate-900 rounded-lg overflow-hidden border-2 border-slate-700">
      {isConnected && !streamError ? (
        <>
          <div className="w-full h-full bg-slate-800" />
          
          {/* Recording indicator */}
          <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 bg-red-500/90 backdrop-blur-sm rounded-full z-10">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-xs">LIVE</span>
          </div>

          {/* Stream info overlay */}
          <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded text-xs text-white z-10">
            ESP32-CAM • 640x480 • 15fps
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          {isConnected ? (
            <>
              <CameraOff className="w-12 h-12 text-slate-600" />
              <div className="text-slate-500 text-center">
                <div>Camera Stream Unavailable</div>
                <div className="text-xs text-slate-600 mt-1">Check camera connection</div>
              </div>
            </>
          ) : (
            <>
              <Camera className="w-12 h-12 text-slate-700" />
              <div className="text-slate-600 text-center">
                <div>No Video Feed</div>
                <div className="text-xs text-slate-700 mt-1">Connect to robot to view stream</div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}