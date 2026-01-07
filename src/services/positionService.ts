import * as ROSLIB from "roslib";
import { rosService } from "./ros2Connection";
import type { 
  SavedPosition, 
  RobotPose,
  // NavigatePositionRequest,
  // NavigateThroughPositionsGoal,
  NavigateThroughPositionsFeedback,
  NavigateThroughPositionsResult
} from "@/types";

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

      if (!rosService.isConnected) {
        reject(new Error("ROS not connected"));
        return;
      }

      const savePositionService = new ROSLIB.Service({
        ros: ros,
        name: "/save_position",
        serviceType: "position_manager_msgs/srv/SavePosition",
      });

      const request = { name };

      savePositionService.callService(
        request,
        (response: any) => {
          console.log("✅ Position saved:", response);
          resolve({
            success: response.success,
            message: response.message,
          });
        },
        (error: any) => {
          console.error("❌ Save position failed:", error);
          reject(error);
        }
      );
    });
  }

  // Get all positions
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
          console.log("✅ Positions loaded:", response);
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
          console.error("❌ Get positions failed:", error);
          reject(error);
        }
      );
    });
  }

  // Delete position
  async deletePosition(name: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const ros = rosService.getROS();

      if (!rosService.isConnected) {
        reject(new Error("ROS not connected"));
        return;
      }

      const deletePositionService = new ROSLIB.Service({
        ros: ros,
        name: "/delete_position",
        serviceType: "position_manager_msgs/srv/DeletePosition",
      });

      const request = { name };

      deletePositionService.callService(
        request,
        (response: any) => {
          console.log("✅ Position deleted:", response);
          resolve(response.success);
        },
        (error: any) => {
          console.error("❌ Delete position failed:", error);
          reject(error);
        }
      );
    });
  }

  // Navigate to single position (service)
  async navigateToPosition(name: string): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve, reject) => {
      const ros = rosService.getROS();

      if (!rosService.isConnected) {
        reject(new Error("ROS not connected"));
        return;
      }

      console.log(`📍 Navigating to position: ${name}`);

      const navigateService = new ROSLIB.Service({
        ros: ros,
        name: "/navigate_to_position",
        serviceType: "position_manager_msgs/srv/NavigateToPosition",
      });

      const request = { position_name: name };

      const timeout = setTimeout(() => {
        reject(new Error("Navigation timeout"));
      }, 360000); // 6 minutes

      navigateService.callService(
        request,
        (response: any) => {
          clearTimeout(timeout);
          console.log("✅ Navigation result:", response);
          resolve({
            success: response.success,
            message: response.message,
          });
        },
        (error: any) => {
          clearTimeout(timeout);
          console.error("❌ Navigation failed:", error);
          reject(error);
        }
      );
    });
  }

  // Navigate through multiple positions (ACTION)
  async navigateThroughPositions(
    names: string[],
    onFeedback?: (feedback: NavigateThroughPositionsFeedback) => void
  ): Promise<NavigateThroughPositionsResult> {
    return new Promise((resolve, reject) => {
      const ros = rosService.getROS();

      if (!rosService.isConnected) {
        reject(new Error("ROS not connected"));
        return;
      }

      console.log(`📍 Navigating through ${names.length} positions:`, names);

      const actionClient = new ROSLIB.ActionClient({
        ros: ros,
        serverName: "/navigate_through_positions",
        actionName: "position_manager_msgs/action/NavigatePositions",
      });

      // Wait for action server
      const checkServer = setInterval(() => {
        if (actionClient.isServerReady()) {
          clearInterval(checkServer);
          
          const goal = new ROSLIB.Goal({
            actionClient: actionClient,
            goalMessage: { position_names: names },
          });

          goal.on("feedback", (feedback: any) => {
            console.log("📡 Navigation feedback:", feedback);
            if (onFeedback) {
              onFeedback(feedback);
            }
          });

          goal.on("result", (result: any) => {
            console.log("✅ Navigation complete:", result);
            resolve({
              success: result.success,
              message: result.message,
              positions_reached: result.positions_reached,
            });
          });

          goal.on("cancel", () => {
            console.log("⛔ Navigation cancelled");
            reject(new Error("Navigation cancelled"));
          });

          goal.send();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkServer);
        reject(new Error("Action server not ready"));
      }, 5000);
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

        if (!message.pose || !message.pose.pose) {
          reject(new Error("Invalid odometry message"));
          return;
        }

        const position = message.pose.pose.position;
        const orientation = message.pose.pose.orientation;

        if (!position || !orientation) {
          reject(new Error("Missing position or orientation"));
          return;
        }

        // Convert quaternion to yaw
        const siny_cosp =
          2 * (orientation.w * orientation.z + orientation.x * orientation.y);
        const cosy_cosp =
          1 - 2 * (orientation.y * orientation.y + orientation.z * orientation.z);
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