import { ROS_CONFIG } from "@/config";

export const ROS_TOPICS = {
  CMD_VEL: "/cmd_vel_keyboard",
  ODOM: "/odom_ekf",
  NAVIGATION_STATUS: "/navigation_web_status",
} as const;

export const ROS_SERVICES = {
  SAVE_POSITION: "/save_position",
  GET_POSITIONS: "/get_positions",
  DELETE_POSITION: "/delete_position",
  NAVIGATE_MULTI: "/start_multi_navigation_web",
} as const;

export const ROS_MESSAGE_TYPES = {
  TWIST_STAMPED: "geometry_msgs/TwistStamped",
  ODOMETRY: "nav_msgs/Odometry",
  STRING: "std_msgs/String",
} as const;

export const ROS_SERVICE_TYPES = {
  SAVE_POSITION: "position_manager_msgs/srv/SavePosition",
  GET_POSITIONS: "position_manager_msgs/srv/GetPositions",
  DELETE_POSITION: "position_manager_msgs/srv/DeletePosition",
  NAVIGATE_MULTI: "position_manager_msgs/srv/NavigateMulti",
} as const;

export const SERVICE_TIMEOUT_MS = 10_000;

// Movement vectors: [linearX, linearY, angularZ]
export const MOVEMENT_COMMANDS: Record<string, [number, number, number]> = {
  forward: [1.0, 0, 0],
  backward: [-1.0, 0, 0],
  left: [0, 1.0, 0],
  right: [0, -1.0, 0],
  stop: [0, 0, 0],
  "forward-left": [0.707, 0.707, 0],
  "forward-right": [0.707, -0.707, 0],
  "backward-left": [-0.707, 0.707, 0],
  "backward-right": [-0.707, -0.707, 0],
  "rotate-left": [0, 0, 1.0],
  "rotate-right": [0, 0, -1.0],
} as const;

const SPEED_MULTIPLIERS = {
  eco: 0.6,
  normal: 1.0,
  fast: 1.6,
} as const;


export const SPEED_PROFILES = {
  eco: {
    linear: ROS_CONFIG.SPEED * SPEED_MULTIPLIERS.eco,
    angular: ROS_CONFIG.TURN * SPEED_MULTIPLIERS.eco,
  },
  normal: {
    linear: ROS_CONFIG.SPEED * SPEED_MULTIPLIERS.normal,
    angular: ROS_CONFIG.TURN * SPEED_MULTIPLIERS.normal,
  },
  fast: {
    linear: ROS_CONFIG.SPEED * SPEED_MULTIPLIERS.fast,
    angular: ROS_CONFIG.TURN * SPEED_MULTIPLIERS.fast,
  },
} as const;
