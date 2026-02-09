import { useState, useEffect } from "react";
import * as ROSLIB from "roslib";
import { useRosConnection } from "@/hooks/useRosConnection";
import { quaternionToYaw } from "@/utils/quaternion";
import { ROS_TOPICS, ROS_MESSAGE_TYPES } from "@/constants/ros";
import type { RobotPose, OdometryMessage } from "@/types";

const DEFAULT_POSE: RobotPose = { x: 0, y: 0, theta: 0 };

export function useOdometry() {
  const { ros, isConnected } = useRosConnection();
  const [pose, setPose] = useState<RobotPose>(DEFAULT_POSE);
  const [speed, setSpeed] = useState(0);

  useEffect(() => {
    if (!isConnected) {
      setPose(DEFAULT_POSE);
      setSpeed(0);
      return;
    }

    const odomTopic = new ROSLIB.Topic({
      ros,
      name: ROS_TOPICS.ODOM,
      messageType: ROS_MESSAGE_TYPES.ODOMETRY,
    });

    const handleMessage = (message: unknown) => {
      const data = message as OdometryMessage;
      const position = data?.pose?.pose?.position;
      const orientation = data?.pose?.pose?.orientation;

      if (!position || !orientation) return;

      try {
        const theta = quaternionToYaw(orientation);
        setPose({ x: position.x, y: position.y, theta });

        const linear = data.twist?.twist?.linear;
        if (linear) {
          setSpeed(Math.hypot(linear.x, linear.y));
        }
      } catch (error) {
        console.error("[useOdometry] Error processing odometry:", error);
      }
    };

    odomTopic.subscribe(handleMessage);

    return () => {
      odomTopic.unsubscribe(handleMessage);
    };
  }, [ros, isConnected]);

  return { pose, speed };
}
