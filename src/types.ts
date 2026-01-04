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

export interface TwistStampedMessage {
  header: {
    stamp: { sec: number; nanosec: number };
    frame_id: string;
  };
  twist: {
    linear: { x: number; y: number; z: number };
    angular: { x: number; y: number; z: number };
  };
}