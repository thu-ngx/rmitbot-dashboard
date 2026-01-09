import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import type { RobotState, OperationMode, SpeedMode } from "../types";
import { useRos } from "./useRos";
import { rosService } from "../services/ros2Connection";
import { ROS_CONFIG } from "../config";

export function useRobot() {
  const { status, isConnected, connect, disconnect } = useRos();

  const [state, setState] = useState<Omit<RobotState, "isConnected">>({
    batteryLevel: 78,
    speed: 0,
    signalStrength: 85,
    mode: "manual",
    isNavigating: false,
  });

  // --- REFS ---
  const speedModeRef = useRef<SpeedMode>("normal");
  const publishIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- HELPERS ---
  // Base speed/turn from config, then multiply by mode
  const getSpeedMultiplier = () => {
    switch (speedModeRef.current) {
      case "eco":
        return 0.6; // 60% of base speed
      case "normal":
        return 1.0; // 100% of base speed
      case "fast":
        return 1.6; // 160% of base speed
      default:
        return 1.0;
    }
  };

  // Helper to stop publishing
  const stopPublishing = useCallback(() => {
    if (publishIntervalRef.current) {
      clearInterval(publishIntervalRef.current);
      publishIntervalRef.current = null;
    }
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
    // Send stop command
    rosService.publishVelocity(0, 0, 0);
    setState((prev) => ({ ...prev, speed: 0 }));
  }, []);

  // --- ACTIONS ---

  const toggleConnection = () => (isConnected ? disconnect() : connect());

  const setMode = (mode: OperationMode) => {
    if (!isConnected) return toast.error("Robot not connected");
    setState((prev) => ({ ...prev, mode }));
    stopPublishing();
  };

  const setNavigating = (isNavigating: boolean) =>
    setState((prev) => ({ ...prev, isNavigating }));

  // Set speed mode (Eco/Normal/Fast)
  const setSpeedMode = (mode: SpeedMode) => {
    speedModeRef.current = mode;
  };

  // --- THE MOVE FUNCTION (Teleop Keyboard Style) ---
  // x (forward), y (strafe), z (turn)
  // Each button press publishes velocity for KEY_TIMEOUT seconds at 10Hz (like teleop keyboard)
  const move = useCallback(
    (x: number, y: number, z: number) => {
      if (state.mode === "autonomous" || !isConnected) return;

      // Clear any existing intervals/timeouts
      if (publishIntervalRef.current) {
        clearInterval(publishIntervalRef.current);
      }
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current);
      }

      // If stop command (0,0,0), just publish once and exit
      if (x === 0 && y === 0 && z === 0) {
        rosService.publishVelocity(0, 0, 0);
        setState((prev) => ({ ...prev, speed: 0 }));
        return;
      }

      const multiplier = getSpeedMultiplier();
      // Apply base speed and turn from config, then multiply by speed mode
      // x, y are linear (use SPEED), z is angular (use TURN)
      const vel_x = x * ROS_CONFIG.SPEED * multiplier;
      const vel_y = y * ROS_CONFIG.SPEED * multiplier;
      const vel_z = z * ROS_CONFIG.TURN * multiplier;

      const currentSpeed = Math.sqrt(
        Math.pow(vel_x, 2) + Math.pow(vel_y, 2)
      );
      setState((prev) => ({ ...prev, speed: currentSpeed }));

      // Publish at 10Hz for KEY_TIMEOUT duration (default 0.5 seconds)
      const keyTimeoutMs = ROS_CONFIG.KEY_TIMEOUT * 1000;
      const publishInterval = 100; // 10Hz = 100ms
      let publishCount = 0;
      const maxPublishes = Math.ceil(keyTimeoutMs / publishInterval);

      publishIntervalRef.current = setInterval(() => {
        rosService.publishVelocity(vel_x, vel_y, vel_z);
        publishCount++;

        if (publishCount >= maxPublishes) {
          stopPublishing();
        }
      }, publishInterval);

      // Safety timeout to ensure we stop
      stopTimeoutRef.current = setTimeout(() => {
        stopPublishing();
      }, keyTimeoutMs);
    },
    [state.mode, isConnected, stopPublishing]
  );

  // --- LOOPS ---
  // No continuous loop needed anymore - publishing is handled in move() function

  // Cleanup on disconnect or unmount
  useEffect(() => {
    if (!isConnected) {
      stopPublishing();
    }
    return () => {
      stopPublishing();
    };
  }, [isConnected, stopPublishing]);

  // Battery Simulation
  useEffect(() => {
    if (!isConnected) return;
    const simInterval = setInterval(() => {
      setState((prev) => ({
        ...prev,
        batteryLevel: Math.max(0, prev.batteryLevel - 0.01),
      }));
    }, 1000);
    return () => clearInterval(simInterval);
  }, [isConnected]);

  return {
    ...state,
    isConnected,
    status,
    toggleConnection,
    setMode,
    setNavigating,
    move,
    setSpeedMode,
  };
}
