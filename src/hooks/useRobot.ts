import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { RobotState, OperationMode } from '../types';

export function useRobot() {
  // State
  const [state, setState] = useState<RobotState>({
    isConnected: false,
    batteryLevel: 78,
    speed: 0,
    signalStrength: 85,
    mode: 'manual',
    isNavigating: false,
  });

  // Actions
  const toggleConnection = () => {
    setState(prev => {
      const newState = !prev.isConnected;
      if (newState) toast.success("Connected to Robot");
      else toast.info("Disconnected from robot");
      return { ...prev, isConnected: newState, speed: 0, isNavigating: false };
    });
  };

  const setMode = (mode: OperationMode) => {
    if (!state.isConnected) return toast.error("Robot not connected");
    setState(prev => ({ ...prev, mode, isNavigating: false }));
    toast.info(`Switched to ${mode === 'manual' ? 'Manual' : 'Autonomous'} Mode`);
  };

  const setNavigating = (isNavigating: boolean) => {
    setState(prev => ({ ...prev, isNavigating }));
  };

  // Simulation Effects (Replace this with roslib listeners later)
  useEffect(() => {
    if (!state.isConnected) return;

    const interval = setInterval(() => {
      setState(prev => ({
        ...prev,
        batteryLevel: Math.max(0, prev.batteryLevel - 0.05),
        signalStrength: Math.max(60, Math.min(100, prev.signalStrength + (Math.random() - 0.5) * 5)),
        // Simulate speed jitter if moving
        speed: prev.isNavigating || prev.speed > 0 ? prev.speed + (Math.random() - 0.5) * 0.1 : 0
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isConnected, state.isNavigating]);

  return {
    ...state,
    toggleConnection,
    setMode,
    setNavigating,
    setState 
  };
}