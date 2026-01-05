// Target Selection: 'ubuntu' or 'rpi'
export type DeploymentTarget = "ubuntu" | "rpi";

const ROSBRIDGE_PORT = 9090;
const FOXGLOVE_PORT = 8765;

// Ubuntu Configuration
const UBUNTU_IP = "100.68.218.48"; // lesson 6
// const UBUNTU_IP = "100.91.20.95"; // trustmebro
const UBUNTU_ROS_WS = `ws://${UBUNTU_IP}:${ROSBRIDGE_PORT}`;
const UBUNTU_FOXGLOVE_WS = `ws://${UBUNTU_IP}:${FOXGLOVE_PORT}`;

// RPi Configuration
const RPI_IP = "100.114.14.30";
const RPI_ROS_WS = `ws://${RPI_IP}:${ROSBRIDGE_PORT}`;
const RPI_FOXGLOVE_WS = `ws://${RPI_IP}:${FOXGLOVE_PORT}`;

// Change this to switch between 'ubuntu' or 'rpi'
const ACTIVE_TARGET: DeploymentTarget = "ubuntu";

const FOXGLOVE_STUDIO_URL = "https://embed.foxglove.dev";

const LAYOUT_3D_VIEW = `${window.location.origin}/layouts/3d-view-layout.json`;
const LAYOUT_CAMERA_VIEW = `${window.location.origin}/layouts/camera-view-layout.json`;

// Select configuration based on target
const getConfig = (target: DeploymentTarget) => {
  switch (target) {
    case "ubuntu":
      return {
        target: "ubuntu",
        ip: UBUNTU_IP,
        rosWsUrl: UBUNTU_ROS_WS,
        foxgloveWsUrl: UBUNTU_FOXGLOVE_WS,
      };
    case "rpi":
      return {
        target: "rpi",
        ip: RPI_IP,
        rosWsUrl: RPI_ROS_WS,
        foxgloveWsUrl: RPI_FOXGLOVE_WS,
      };
  }
};

const currentConfig = getConfig(ACTIVE_TARGET);

export const ROS_CONFIG = {
  TARGET: ACTIVE_TARGET,
  IP: currentConfig.ip,
  ROSBRIDGE_PORT,
  FOXGLOVE_PORT,
  ROS_WS_URL: currentConfig.rosWsUrl,
  FOXGLOVE_WS_URL: currentConfig.foxgloveWsUrl,
  FOXGLOVE_STUDIO_URL,
  LAYOUT_3D_VIEW,
  LAYOUT_CAMERA_VIEW,
  RECONNECT_INTERVAL: 3000,
};
