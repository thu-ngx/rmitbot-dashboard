export type DeploymentTarget = "ubuntu" | "rpi";

const ROSBRIDGE_PORT = 9090;
const FOXGLOVE_PORT = 8765;

const UBUNTU_IP = "100.68.218.48";
// const UBUNTU_IP = "100.91.20.95"; // trustmebro

const UBUNTU_ROS_WS = `ws://${UBUNTU_IP}:${ROSBRIDGE_PORT}`;

const RPI_IP = "100.114.14.30";
const RPI_ROS_WS = `ws://${RPI_IP}:${ROSBRIDGE_PORT}`;

// Switch between targets
const ACTIVE_TARGET: DeploymentTarget = "ubuntu";

const getConfig = (target: DeploymentTarget) => {
  switch (target) {
    case "ubuntu":
      return { target: "ubuntu", ip: UBUNTU_IP, rosWsUrl: UBUNTU_ROS_WS };
    case "rpi":
      return { target: "rpi", ip: RPI_IP, rosWsUrl: RPI_ROS_WS };
  }
};

const currentConfig = getConfig(ACTIVE_TARGET);

export const ROS_CONFIG = {
  TARGET: ACTIVE_TARGET,
  IP: currentConfig.ip,
  ROSBRIDGE_PORT,
  FOXGLOVE_PORT,
  ROS_WS_URL: currentConfig.rosWsUrl,
  RECONNECT_INTERVAL: 3000,
};