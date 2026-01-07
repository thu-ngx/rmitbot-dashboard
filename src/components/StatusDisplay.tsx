import { useEffect, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Gauge, MapPin } from "lucide-react";
import { rosService } from "@/services/ros2Connection";
import type { RobotPose, OdometryMessage } from "@/types";

interface StatusDisplayProps {
  isConnected: boolean;
}

export function StatusDisplay({ isConnected }: StatusDisplayProps) {
  const [currentPose, setCurrentPose] = useState<RobotPose>({
    x: 0,
    y: 0,
    theta: 0,
  });
  const [speed, setSpeed] = useState(0);
  // const [batteryLevel, setBatteryLevel] = useState(85);

  useEffect(() => {
    if (!isConnected) return;

    console.log("📡 Subscribing to /odom topic...");

    // Subscribe to odometry updates from ROS2
    rosService.setOdomCallback((data: OdometryMessage) => {
      console.log("✅ Odometry data received:", data);

      if (!data) {
        console.warn("⚠️ Received null odometry message");
        return;
      }

      if (!data.pose || !data.pose.pose) {
        console.warn("⚠️ Odometry missing pose structure");
        return;
      }

      const position = data.pose?.pose?.position;
      const orientation = data.pose?.pose?.orientation;

      if (!position || !orientation) {
        console.warn("⚠️ Odometry missing position or orientation");
        return;
      }

      // Convert quaternion to yaw angle
      try {
        const siny_cosp =
          2 * (orientation.w * orientation.z + orientation.x * orientation.y);
        const cosy_cosp =
          1 - 2 * (orientation.y * orientation.y + orientation.z * orientation.z);
        const theta = Math.atan2(siny_cosp, cosy_cosp);

        // Update pose state
        setCurrentPose({
          x: position.x,
          y: position.y,
          theta: theta,
        });

        console.log("✅ Updated pose:", { x: position.x, y: position.y, theta });

        // Calculate speed from linear velocity
        if (data.twist?.twist?.linear) {
          const linearVel = data.twist.twist.linear;
          const speed = Math.sqrt(linearVel.x ** 2 + linearVel.y ** 2);
          setSpeed(speed);
          console.log("✅ Updated speed:", speed);
        }
      } catch (error) {
        console.error("❌ Error processing odometry:", error);
      }
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
              x: {currentPose?.x?.toFixed(2) ?? "N/A"}
            </div>
            <div className="text-xs font-mono text-slate-200">
              y: {currentPose?.y?.toFixed(2) ?? "N/A"}
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              θ: {currentPose?.theta ? ((currentPose.theta * 180) / Math.PI).toFixed(1) : "N/A"}°
            </div>
          </div>

          {/* Speed */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Gauge className="w-3 h-3 text-green-400" />
              <span className="text-[9px] text-slate-400 uppercase">Speed</span>
            </div>
            <div className="text-xl font-bold text-green-400">
              {speed?.toFixed(2) ?? "0.00"}
            </div>
            <div className="text-[10px] text-slate-400">m/s</div>
          </div>

          {/* Battery */}
          {/* <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Battery className="w-3 h-3 text-yellow-400" />
              <span className="text-[9px] text-slate-400 uppercase">
                Battery
              </span>
            </div>
            <div
              className={`text-xl font-bold ${
                batteryLevel < 20 ? "text-red-500" : "text-yellow-400"
              }`}
            >
              {batteryLevel?.toFixed(0) ?? "0"}%
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1 mt-1">
              <div
                className={`h-1 rounded-full transition-all ${
                  batteryLevel < 20 ? "bg-red-500" : "bg-yellow-400"
                }`}
                style={{ width: `${batteryLevel}%` }}
              />
            </div>
          </div> */}
        </div>
      </CardContent>
    </Card>
  );
}