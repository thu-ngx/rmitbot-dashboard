import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { RobotState, OperationMode } from '../types';
import { useRos } from './useRos'; 

export function useRobot() {
  const { status, isConnected, connect, disconnect } = useRos();

  const [state, setState] = useState<Omit<RobotState, 'isConnected'>>({
    batteryLevel: 78,
    speed: 0,
    signalStrength: 85,
    mode: 'manual',
    isNavigating: false,
  });

  const toggleConnection = () => {
    if (isConnected) {
      disconnect();
      toast.info("Disconnecting from robot...");
    } else {
      connect();
    }
  };

  const setMode = (mode: OperationMode) => {
    if (!isConnected) return toast.error("Robot not connected");
    setState(prev => ({ ...prev, mode, isNavigating: false }));
    toast.info(`Switched to ${mode === 'manual' ? 'Manual' : 'Autonomous'} Mode`);
  };

  const setNavigating = (isNavigating: boolean) => {
    setState(prev => ({ ...prev, isNavigating }));
  };

  useEffect(() => {
    if (status === 'CONNECTED') toast.success("Connected to Robot");
    if (status === 'ERROR') toast.error("Connection Error");
  }, [status]);

  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(() => {
      setState(prev => ({
        ...prev,
        batteryLevel: Math.max(0, prev.batteryLevel - 0.05),
        speed: prev.isNavigating || prev.speed > 0 ? prev.speed + (Math.random() - 0.5) * 0.1 : 0
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [isConnected, state.isNavigating]);

  return {
    ...state,
    isConnected, 
    status,      
    toggleConnection,
    setMode,
    setNavigating,
  };
}