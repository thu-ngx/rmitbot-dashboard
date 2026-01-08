import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import type { RobotState, OperationMode, SpeedMode } from "../types";
import { useRos } from "./useRos";
import { rosService } from "../services/ros2Connection";

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
  const cmdVelRef = useRef({ x: 0, y: 0, z: 0 });
  const lastInputRef = useRef({ x: 0, y: 0, z: 0 });
  const speedModeRef = useRef<SpeedMode>("normal");

  // --- HELPERS ---
  const getSpeedMultiplier = () => {
    switch (speedModeRef.current) {
      case "eco":
        return 0.3;
      case "normal":
        return 0.6;
      case "fast":
        return 1.0;
      default:
        return 0.6;
    }
  };

  // --- ACTIONS ---

  const toggleConnection = () => (isConnected ? disconnect() : connect());

  const setMode = (mode: OperationMode) => {
    if (!isConnected) return toast.error("Robot not connected");
    setState((prev) => ({ ...prev, mode }));

    cmdVelRef.current = { x: 0, y: 0, z: 0 };
    lastInputRef.current = { x: 0, y: 0, z: 0 };
  };

  const setNavigating = (isNavigating: boolean) =>
    setState((prev) => ({ ...prev, isNavigating }));

  // Set speed mode (Eco/Normal/Fast)
  const setSpeedMode = (mode: SpeedMode) => {
    speedModeRef.current = mode;

    // Immediate update if we are moving
    if (state.mode === "manual") {
      const multiplier = getSpeedMultiplier();
      const { x, y, z } = lastInputRef.current;

      cmdVelRef.current = {
        x: x * multiplier,
        y: y * multiplier,
        z: z * multiplier,
      };

      const currentSpeed = Math.sqrt(
        Math.pow(x * multiplier, 2) + Math.pow(y * multiplier, 2)
      );
      setState((prev) => ({ ...prev, speed: currentSpeed }));
    }
  };

  // --- THE MOVE FUNCTION ---
  // x (forward), y (strafe), z (turn)
  const move = useCallback(
    (x: number, y: number, z: number) => {
      if (state.mode === "autonomous") return;

      lastInputRef.current = { x, y, z };
      const multiplier = getSpeedMultiplier();

      cmdVelRef.current = {
        x: x * multiplier,
        y: y * multiplier,
        z: z * multiplier,
      };

      const currentSpeed = Math.sqrt(
        Math.pow(x * multiplier, 2) + Math.pow(y * multiplier, 2)
      );
      setState((prev) => ({ ...prev, speed: currentSpeed }));
    },
    [state.mode]
  );

  // --- LOOPS ---

  // 10Hz Control Loop
  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(() => {
      rosService.publishVelocity(
        cmdVelRef.current.x,
        cmdVelRef.current.y,
        cmdVelRef.current.z
      );
    }, 100);
    return () => clearInterval(interval);
  }, [isConnected]);

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
