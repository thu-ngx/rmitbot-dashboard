import { useRef, useEffect } from "react";
import * as ROSLIB from "roslib";
import { useRosConnection } from "@/hooks/useRosConnection";
import { calculateVelocity } from "@/utils/motion";
import { ROS_CONFIG } from "@/config";
import { ROS_TOPICS, ROS_MESSAGE_TYPES } from "@/constants/ros";
import type { SpeedMode, TwistStampedMessage } from "@/types";

export function useRobotControl(speedMode: SpeedMode) {
  const { ros, isConnected } = useRosConnection();

  const cmdVelTopicRef = useRef<ROSLIB.Topic<TwistStampedMessage> | null>(null);
  const publishIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const currentVelocityRef = useRef({ x: 0, y: 0, z: 0 });

  // Get or create topic
  const getCmdVelTopic = () => {
    if (!cmdVelTopicRef.current && isConnected) {
      cmdVelTopicRef.current = new ROSLIB.Topic({
        ros,
        name: ROS_TOPICS.CMD_VEL,
        messageType: ROS_MESSAGE_TYPES.TWIST_STAMPED,
      });
    }
    return cmdVelTopicRef.current;
  };

  // Cleanup topic when disconnected
  useEffect(() => {
    if (!isConnected) {
      cmdVelTopicRef.current = null;
      if (publishIntervalRef.current) {
        clearInterval(publishIntervalRef.current);
        publishIntervalRef.current = null;
      }
    }
  }, [isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (publishIntervalRef.current) {
        clearInterval(publishIntervalRef.current);
      }
      const topic = cmdVelTopicRef.current;
      if (topic) {
        topic.publish({
          header: {
            stamp: { sec: 0, nanosec: 0 },
            frame_id: "base_footprint",
          },
          twist: {
            linear: { x: 0, y: 0, z: 0 },
            angular: { x: 0, y: 0, z: 0 },
          },
        });
      }
    };
  }, []);

  const stopPublishing = () => {
    if (publishIntervalRef.current) {
      clearInterval(publishIntervalRef.current);
      publishIntervalRef.current = null;
    }
    currentVelocityRef.current = { x: 0, y: 0, z: 0 };

    const topic = getCmdVelTopic();
    if (topic) {
      topic.publish({
        header: {
          stamp: { sec: 0, nanosec: 0 },
          frame_id: "base_footprint",
        },
        twist: {
          linear: { x: 0, y: 0, z: 0 },
          angular: { x: 0, y: 0, z: 0 },
        },
      });
    }
  };

  const move = (x: number, y: number, z: number) => {
    if (!isConnected) {
      console.warn("[useRobotControl] Cannot move - not connected");
      stopPublishing();
      return;
    }

    // Stop command
    if (x === 0 && y === 0 && z === 0) {
      stopPublishing();
      return;
    }

    const velocity = calculateVelocity({ x, y, z }, speedMode);
    currentVelocityRef.current = velocity;

    // Start continuous publishing if not already
    if (!publishIntervalRef.current) {
      const intervalMs = 1000 / ROS_CONFIG.PUBLISH_RATE;
      publishIntervalRef.current = setInterval(() => {
        const { x, y, z } = currentVelocityRef.current;
        const topic = getCmdVelTopic();
        if (topic) {
          topic.publish({
            header: {
              stamp: { sec: 0, nanosec: 0 },
              frame_id: "base_footprint",
            },
            twist: {
              linear: { x, y, z: 0 },
              angular: { x: 0, y: 0, z },
            },
          });
        }
      }, intervalMs);

      // Publish immediately
      const topic = getCmdVelTopic();
      if (topic) {
        topic.publish({
          header: {
            stamp: { sec: 0, nanosec: 0 },
            frame_id: "base_footprint",
          },
          twist: {
            linear: { x: velocity.x, y: velocity.y, z: 0 },
            angular: { x: 0, y: 0, z: velocity.z },
          },
        });
      }
    }
  };

  return { move, isConnected };
}
