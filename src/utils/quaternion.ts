interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export function quaternionToYaw(q: Quaternion): number {
  const siny_cosp = 2 * (q.w * q.z + q.x * q.y);
  const cosy_cosp = 1 - 2 * (q.y * q.y + q.z * q.z);
  return Math.atan2(siny_cosp, cosy_cosp);
}

export function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}
