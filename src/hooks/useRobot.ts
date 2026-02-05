import { useState, useEffect, useRef, useCallback } from "react";
import { rosService } from "@/services/ros2Connection";
import { useConnectionStore } from "@/stores/connectionStore";
import { ROS_CONFIG } from "@/config";
import { calculateVelocity } from "@/utils/motion";
import type { SpeedMode } from "@/types";

export function useRobot() {
  // Connection state
  const status = useConnectionStore((state) => state.status);
  const currentIp = useConnectionStore((state) => state.currentIp);
  const setStatus = useConnectionStore((state) => state.setStatus);

  const isConnected = status === "CONNECTED";

  // Movement state
  const [speedMode, setSpeedMode] = useState<SpeedMode>("normal");

  // Refs for continuous publishing
  const publishIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const currentVelocityRef = useRef({ x: 0, y: 0, z: 0 });

  // Connection actions
  const connect = useCallback(() => {
    setStatus("CONNECTING");
    rosService.connect();
  }, [setStatus]);

  const disconnect = useCallback(() => {
    rosService.disconnect();
  }, []);

  const switchRobot = useCallback(
    (newIp: string) => {
      if (newIp === currentIp) return;
      setStatus("CONNECTING");
      rosService.switchRobot(newIp);
    },
    [currentIp, setStatus]
  );

  const toggleConnection = useCallback(() => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  }, [isConnected, connect, disconnect]);

  // Movement actions
  const stopPublishing = useCallback(() => {
    if (publishIntervalRef.current) {
      clearInterval(publishIntervalRef.current);
      publishIntervalRef.current = null;
    }
    currentVelocityRef.current = { x: 0, y: 0, z: 0 };
    rosService.publishVelocity(0, 0, 0);
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
    [isConnected, speedMode, stopPublishing]
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

  return {
    // Connection
    status,
    isConnected,
    currentIp,
    toggleConnection,
    switchRobot,
    // Movement
    move,
    speedMode,
    setSpeedMode,
  };
}
