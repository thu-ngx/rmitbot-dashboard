export type OperationMode = "manual" | "autonomous";
export type SpeedMode = "eco" | "normal" | "fast";
export type NavigationStatus = "idle" | "navigating" | "completed" | "failed";

export interface SavedPosition {
  id: string;
  name: string;
  x: number;
  y: number;
  theta: number;
  timestamp: number;
}

export interface RobotPose {
  x: number;
  y: number;
  theta: number;
}

export interface RobotState {
  batteryLevel: number;
  speed: number;
  currentPose: RobotPose;
  mode: OperationMode;
  navigationStatus: NavigationStatus;
}

export interface TwistMessage {
  linear: { x: number; y: number; z: number };
  angular: { x: number; y: number; z: number };
}

export interface OdometryMessage {
  pose: {
    pose: {
      position: { x: number; y: number; z: number };
      orientation: { x: number; y: number; z: number; w: number };
    };
  };
  twist: {
    twist: {
      linear: { x: number; y: number; z: number };
    };
  };
}