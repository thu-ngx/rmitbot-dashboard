import { Card, CardContent } from "./ui/card";
import { Gauge, MapPin } from "lucide-react";
import { useOdometry } from "@/hooks/useOdometry";
import { radiansToDegrees } from "@/utils/quaternion";

export function StatusDisplay() {
  const { pose, speed } = useOdometry();

  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
      <CardContent className="p-3">
        <div className="grid grid-cols-2 gap-3">
          {/* Position */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <MapPin className="w-3 h-3 text-blue-400" />
              <span className="text-[9px] text-slate-400 uppercase">
                Position
              </span>
            </div>
            <div className="text-xs font-mono text-slate-200">
              x: {pose.x.toFixed(2)}
            </div>
            <div className="text-xs font-mono text-slate-200">
              y: {pose.y.toFixed(2)}
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              θ: {radiansToDegrees(pose.theta).toFixed(1)}°
            </div>
          </div>

          {/* Speed */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Gauge className="w-3 h-3 text-green-400" />
              <span className="text-[9px] text-slate-400 uppercase">Speed</span>
            </div>
            <div className="text-xl font-bold text-green-400">
              {speed.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-400">m/s</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
