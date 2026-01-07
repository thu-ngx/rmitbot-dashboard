import * as ROSLIB from "roslib";
import { rosService } from "./ros2Connection";
import type { SavedPosition, RobotPose } from "@/types";

class PositionService {
  private static instance: PositionService;

  private constructor() {}

  public static getInstance(): PositionService {
    if (!PositionService.instance) {
      PositionService.instance = new PositionService();
    }
    return PositionService.instance;
  }

  // Save current position
  async savePosition(
    name: string
  ): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve, reject) => {
      const ros = rosService.getROS();

      const savePositionService = new ROSLIB.Service({
        ros: ros,
        name: "/save_position",
        serviceType: "position_manager_msgs/srv/SavePosition",
      });

      const request = { name };

      savePositionService.callService(
        request,
        (response: any) => {
          resolve({
            success: response.success,
            message: response.message,
          });
        },
        (error: any) => {
          console.error("Save position failed:", error);
          reject(error);
        }
      );
    });
  }

  async getPositions(): Promise<SavedPosition[]> {
    return new Promise((resolve, reject) => {
      const ros = rosService.getROS();

      if (!rosService.isConnected) {
        reject(new Error("ROS not connected"));
        return;
      }

      const getPositionsService = new ROSLIB.Service({
        ros: ros,
        name: "/get_positions",
        serviceType: "position_manager_msgs/srv/GetPositions",
      });

      const request = {};

      getPositionsService.callService(
        request,
        (response: any) => {
          const positions: SavedPosition[] = response.names.map(
            (name: string, index: number) => ({
              id: `pos-${index}`,
              name,
              x: response.x_coords[index],
              y: response.y_coords[index],
              theta: response.theta_coords[index],
              timestamp: Date.now(),
            })
          );
          resolve(positions);
        },
        (error: any) => {
          console.error("Get positions failed:", error);
          reject(error);
        }
      );
    });
  }

  async deletePosition(name: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const ros = rosService.getROS();

      const deletePositionService = new ROSLIB.Service({
        ros: ros,
        name: "/delete_position",
        serviceType: "position_manager_msgs/srv/DeletePosition",
      });

      const request = { name };

      deletePositionService.callService(
        request,
        (response: any) => {
          resolve(response.success);
        },
        (error: any) => {
          console.error("Delete position failed:", error);
          reject(error);
        }
      );
    });
  }

  // Navigate to single position
  async navigateToPosition(
    name: string,
    onFeedback?: (feedback: any) => void
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const ros = rosService.getROS();

      const navigateToPositionAction = new ROSLIB.ActionClient({
        ros: ros,
        serverName: "/navigate_to_position",
        actionName: "position_manager/srv/NavigateToPosition",
      });

      const goal = new ROSLIB.Goal({
        actionClient: navigateToPositionAction,
        goalMessage: { position_name: name },
      });

      goal.on("feedback", (feedback: any) => {
        if (onFeedback) onFeedback(feedback);
      });

      goal.on("result", (result: any) => {
        resolve(result.success);
      });

      goal.send();
    });
  }

  // Navigate through multiple positions
  async navigateThroughPositions(
    names: string[],
    onFeedback?: (feedback: any) => void
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const ros = rosService.getROS();

      const navigateThroughAction = new ROSLIB.ActionClient({
        ros: ros,
        serverName: "/navigate_through_positions",
        actionName: "position_manager/srv/NavigateThroughPositions",
      });

      const goal = new ROSLIB.Goal({
        actionClient: navigateThroughAction,
        goalMessage: { position_names: names },
      });

      goal.on("feedback", (feedback: any) => {
        if (onFeedback) onFeedback(feedback);
      });

      goal.on("result", (result: any) => {
        resolve(result.success);
      });

      goal.send();
    });
  }

  // Get current robot pose from /odom
  async getCurrentPose(): Promise<RobotPose> {
    return new Promise((resolve, reject) => {
      const ros = rosService.getROS();

      const odomListener = new ROSLIB.Topic({
        ros: ros,
        name: "/odom",
        messageType: "nav_msgs/Odometry",
      });

      const timeout = setTimeout(() => {
        odomListener.unsubscribe();
        reject(new Error("Timeout getting current pose"));
      }, 5000);

      odomListener.subscribe((message: any) => {
        clearTimeout(timeout);
        odomListener.unsubscribe();

        const position = message.pose.pose.position;
        const orientation = message.pose.pose.orientation;

        // Convert quaternion to yaw
        const siny_cosp =
          2 * (orientation.w * orientation.z + orientation.x * orientation.y);
        const cosy_cosp =
          1 -
          2 * (orientation.y * orientation.y + orientation.z * orientation.z);
        const theta = Math.atan2(siny_cosp, cosy_cosp);

        resolve({
          x: position.x,
          y: position.y,
          theta: theta,
        });
      });
    });
  }
}

export const positionService = PositionService.getInstance();
