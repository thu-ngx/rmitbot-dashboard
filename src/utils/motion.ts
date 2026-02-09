import { SPEED_PROFILES } from "@/constants/ros";
import type { SpeedMode } from "@/types";

export function calculateVelocity(
  direction: { x: number; y: number; z: number },
  speedMode: SpeedMode
): { x: number; y: number; z: number } {
  const profile = SPEED_PROFILES[speedMode];

  return {
    x: direction.x * profile.linear,
    y: direction.y * profile.linear,
    z: direction.z * profile.angular,
  };
}
