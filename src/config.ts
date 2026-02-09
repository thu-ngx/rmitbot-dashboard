export const ROSBRIDGE_PORT = 9090;

export const ROBOT_OPTIONS = [
  { ip: "100.118.27.83", name: "RPI" },
  { ip: "100.68.218.48", name: "Ubuntu Lesson 6" },
  { ip: "100.114.20.41", name: "Triet" },
  { ip: "100.75.217.119", name: "Hoa" },
  { ip: "100.91.20.95", name: "Loc" },
] as const;

export const ROS_CONFIG = {
  DEFAULT_IP: ROBOT_OPTIONS[0].ip,
  ROSBRIDGE_PORT,
  RECONNECT_INTERVAL: 3000, // ms between reconnection attempts
  SPEED: 0.5, // Base linear speed (m/s)
  TURN: 1.0, // Base angular speed (rad/s)
  PUBLISH_RATE: 10, // Velocity publish rate (Hz)
};
