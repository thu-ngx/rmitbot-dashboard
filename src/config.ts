export type DeploymentTarget = "ubuntu" | "rpi";

const ROSBRIDGE_PORT = 9090;
const UBUNTU_IP = "100.68.218.48"; // lesson 6
const RPI_IP = "100.75.184.66";
// const UBUNTU_IP = "100.114.20.41"; // Triet
// const UBUNTU_IP = "100.75.217.119"; // Hoa

const ACTIVE_TARGET: DeploymentTarget = "ubuntu";

const getConfig = (target: DeploymentTarget) => {
  const ip = target === "ubuntu" ? UBUNTU_IP : RPI_IP;
  return {
    target,
    ip,
    rosWsUrl: `ws://${ip}:${ROSBRIDGE_PORT}`,
  };
};

const currentConfig = getConfig(ACTIVE_TARGET);

export const ROS_CONFIG = {
  TARGET: ACTIVE_TARGET,
  IP: currentConfig.ip,
  ROSBRIDGE_PORT,
  ROS_WS_URL: currentConfig.rosWsUrl,
  RECONNECT_INTERVAL: 3000,
  // Teleop keyboard style parameters (matching default ROS teleop_twist_keyboard)
  SPEED: 0.5, // default linear speed (m/s)
  TURN: 1.0, // default angular speed (rad/s)
  REPEAT_RATE: 0.0, // 0 = no repeat, publish only on button press
  KEY_TIMEOUT: 0.5, // duration to publish velocity after button press (seconds)
};
