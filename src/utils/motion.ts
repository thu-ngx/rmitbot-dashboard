import { ROS_CONFIG } from "@/config";
import { SPEED_MULTIPLIERS } from "@/constants/ros";
import type { SpeedMode } from "@/types";

export function getSpeedMultiplier(mode: SpeedMode): number {
  return SPEED_MULTIPLIERS[mode] ?? 1.0;
}

export function calculateVelocity(
  direction: { x: number; y: number; z: number },
  speedMode: SpeedMode,
): { x: number; y: number; z: number } {
  const multiplier = getSpeedMultiplier(speedMode);
  return {
    x: direction.x * ROS_CONFIG.SPEED * multiplier,
    y: direction.y * ROS_CONFIG.SPEED * multiplier,
    z: direction.z * ROS_CONFIG.TURN * multiplier,
  };
}
