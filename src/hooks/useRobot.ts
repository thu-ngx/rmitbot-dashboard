import { useState, useEffect, useRef, useCallback } from "react";
import { useRos } from "./useRos";
import { rosService } from "@/services/ros2Connection";
import { ROS_CONFIG } from "@/config";
import { calculateVelocity } from "@/utils/motion";
import type { SpeedMode } from "@/types";

export function useRobot() {
  const { status, isConnected, connect, disconnect, switchRobot, currentIp } =
    useRos();

  const [speedMode, setSpeedMode] = useState<SpeedMode>("normal");
  const [speed, setSpeed] = useState(0);

  const publishIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const currentVelocityRef = useRef({ x: 0, y: 0, z: 0 });

  const stopPublishing = useCallback(() => {
    if (publishIntervalRef.current) {
      clearInterval(publishIntervalRef.current);
      publishIntervalRef.current = null;
    }
    currentVelocityRef.current = { x: 0, y: 0, z: 0 };
    rosService.publishVelocity(0, 0, 0);
    setSpeed(0);
  }, []);

  const move = useCallback(
    (x: number, y: number, z: number) => {
      if (!isConnected) {
        console.warn("Cannot move - not connected");
        stopPublishing();
        return;
      }

      // Stop command
      if (x === 0 && y === 0 && z === 0) {
        stopPublishing();
        return;
      }

      const velocity = calculateVelocity({ x, y, z }, speedMode);
      currentVelocityRef.current = velocity;
      setSpeed(Math.hypot(velocity.x, velocity.y));

      // Start continuous publishing if not already
      if (!publishIntervalRef.current) {
        const intervalMs = 1000 / ROS_CONFIG.PUBLISH_RATE;
        publishIntervalRef.current = setInterval(() => {
          const { x, y, z } = currentVelocityRef.current;
          rosService.publishVelocity(x, y, z);
        }, intervalMs);

        // Publish immediately
        rosService.publishVelocity(velocity.x, velocity.y, velocity.z);
      }
    },
    [isConnected, speedMode, stopPublishing],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (publishIntervalRef.current) {
        clearInterval(publishIntervalRef.current);
      }
      rosService.publishVelocity(0, 0, 0);
    };
  }, []);

  const toggleConnection = useCallback(() => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  }, [isConnected, connect, disconnect]);

  return {
    status,
    isConnected,
    currentIp,
    speed,
    toggleConnection,
    move,
    speedMode,
    setSpeedMode,
    switchRobot,
  };
}
