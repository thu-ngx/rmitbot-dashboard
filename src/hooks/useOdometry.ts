import { useEffect, useState } from "react";
import { rosService } from "@/services/ros2Connection";
import { quaternionToYaw } from "@/utils/quaternion";
import type { RobotPose, OdometryMessage } from "@/types";

const DEFAULT_POSE: RobotPose = { x: 0, y: 0, theta: 0 };

export function useOdometry(isConnected: boolean) {
  const [pose, setPose] = useState<RobotPose>(DEFAULT_POSE);
  const [speed, setSpeed] = useState(0);

  useEffect(() => {
    if (!isConnected) {
      // Clear the callback when disconnected
      rosService.setOdomCallback(() => {});
      return;
    }

    rosService.setOdomCallback((data: OdometryMessage) => {
      const position = data?.pose?.pose?.position;
      const orientation = data?.pose?.pose?.orientation;

      if (!position || !orientation) return;

      try {
        const theta = quaternionToYaw(orientation);
        setPose({ x: position.x, y: position.y, theta });

        const linear = data.twist?.twist?.linear;
        if (linear) {
          setSpeed(Math.hypot(linear.x, linear.y));
        }
      } catch (error) {
        console.error("Error processing odometry:", error);
      }
    });

    // Cleanup on unmount or when isConnected changes
    return () => {
      rosService.setOdomCallback(() => {});
    };
  }, [isConnected]);

  // Reset values when disconnected (outside useEffect)
  const displayPose = isConnected ? pose : DEFAULT_POSE;
  const displaySpeed = isConnected ? speed : 0;

  return { pose: displayPose, speed: displaySpeed };
}
