import { useEffect, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Battery, Gauge, MapPin } from "lucide-react";
import { rosService } from "@/services/ros2Connection";
import type { RobotPose, OdometryMessage } from "@/types";

interface StatusDisplayProps {
  isConnected: boolean;
}

export function StatusDisplay({ isConnected }: StatusDisplayProps) {
  const [currentPose, setCurrentPose] = useState<RobotPose>({ x: 0, y: 0, theta: 0 });
  const [speed, setSpeed] = useState(0);
  const [batteryLevel, setBatteryLevel] = useState(85);

  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to odometry updates
    rosService.setOdomCallback((data: OdometryMessage) => {
      const position = data.pose.pose.position;
      const orientation = data.pose.pose.orientation;

      // Convert quaternion to yaw
      const siny_cosp = 2 * (orientation.w * orientation.z + orientation.x * orientation.y);
      const cosy_cosp = 1 - 2 * (orientation.y * orientation.y + orientation.z * orientation.z);
      const theta = Math.atan2(siny_cosp, cosy_cosp);

      setCurrentPose({
        x: position.x,
        y: position.y,
        theta: theta,
      });

      // Calculate speed from linear velocity
      const linearVel = data.twist.twist.linear;
      const currentSpeed = Math.sqrt(
        linearVel.x * linearVel.x + linearVel.y * linearVel.y
      );
      setSpeed(currentSpeed);
    });

    // Simulate battery drain
    const batteryInterval = setInterval(() => {
      setBatteryLevel((prev) => Math.max(0, prev - 0.01));
    }, 1000);

    return () => {
      clearInterval(batteryInterval);
    };
  }, [isConnected]);

  return (
    <Card className="bg-slate-800/30 border-slate-700/50">
      <CardContent className="p-3">
        <div className="grid grid-cols-3 gap-3">
          {/* Position */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <MapPin className="w-3 h-3 text-blue-400" />
              <span className="text-[9px] text-slate-400 uppercase">Position</span>
            </div>
            <div className="text-xs font-mono text-white">
              x: {currentPose.x.toFixed(2)}
            </div>
            <div className="text-xs font-mono text-white">
              y: {currentPose.y.toFixed(2)}
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              θ: {(currentPose.theta * 180 / Math.PI).toFixed(1)}°
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

          {/* Battery */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Battery className="w-3 h-3 text-yellow-400" />
              <span className="text-[9px] text-slate-400 uppercase">Battery</span>
            </div>
            <div
              className={`text-xl font-bold ${
                batteryLevel < 20 ? "text-red-500" : "text-yellow-400"
              }`}
            >
              {batteryLevel.toFixed(0)}%
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1 mt-1">
              <div
                className={`h-1 rounded-full transition-all ${
                  batteryLevel < 20 ? "bg-red-500" : "bg-yellow-400"
                }`}
                style={{ width: `${batteryLevel}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}