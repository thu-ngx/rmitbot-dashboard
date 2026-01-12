const ROSBRIDGE_PORT = 9090;
const ROBOT_IP = "100.122.233.111"; // RPI
// const ROBOT_IP = "100.68.218.48"; // Ubuntu lesson 6
// const ROBOT_IP = "100.114.20.41"; // Triet
// const ROBOT_IP = "100.75.217.119"; // Hoa
// const ROBOT_IP = "100.91.20.95" // Loc

export const ROS_CONFIG = {
  IP: ROBOT_IP,
  ROSBRIDGE_PORT,
  ROS_WS_URL: `ws://${ROBOT_IP}:${ROSBRIDGE_PORT}`,
  RECONNECT_INTERVAL: 3000,
  // Velocity control parameters
  SPEED: 0.5, // default linear speed (m/s)
  TURN: 1.0, // default angular speed (rad/s)
  PUBLISH_RATE: 10, 
};
