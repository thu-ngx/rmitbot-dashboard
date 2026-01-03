export type OperationMode = "manual" | "autonomous";
export type SpeedMode = "eco" | "normal" | "fast";

export interface Position {
  id: string;
  x: number;
  y: number;
  name: string;
}

export interface RobotState {
  isConnected: boolean;
  batteryLevel: number;
  speed: number;
  signalStrength: number;
  mode: OperationMode;
  isNavigating: boolean;
}