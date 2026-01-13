import * as ROSLIB from "roslib";
import { rosService } from "./ros2Connection";
import type {
  SavedPosition,
  RobotPose,
  NavigateToPositionGoal,
  NavigateToPositionFeedback,
  NavigateToPositionResult,
  NavigateThroughPositionsGoal,
  NavigateThroughPositionsFeedback,
  NavigateThroughPositionsResult,
} from "@/types";

class PositionService {
  private static instance: PositionService;
  private currentSingleGoal: ROSLIB.Goal<
    NavigateToPositionGoal,
    NavigateToPositionFeedback,
    NavigateToPositionResult
  > | null = null;
  private currentMultiGoal: ROSLIB.Goal<
    NavigateThroughPositionsGoal,
    NavigateThroughPositionsFeedback,
    NavigateThroughPositionsResult
  > | null = null;

  private constructor() {}

  public static getInstance(): PositionService {
    if (!PositionService.instance) {
      PositionService.instance = new PositionService();
    }
    return PositionService.instance;
  }

  public cancelNavigation(): void {
    console.log("Cancelling navigation...");
    try {
      if (this.currentSingleGoal) {
        console.log("Cancelling single goal");
        this.currentSingleGoal.cancel();
      }
      if (this.currentMultiGoal) {
        console.log("Cancelling multi goal");
        this.currentMultiGoal.cancel();
      }
    } catch (e) {
      console.warn("Failed to cancel navigation:", e);
    } finally {
      this.currentSingleGoal = null;
      this.currentMultiGoal = null;
    }
  }

  // Save current position (Service)
  async savePosition(
    name: string
  ): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve, reject) => {
      const ros = rosService.getROS();

      if (!rosService.isConnected) {
        console.error("Cannot save position: ROS not connected");
        reject(new Error("ROS not connected"));
        return;
      }

      console.log(`Saving position: ${name}`);

      const savePositionService = new ROSLIB.Service({
        ros: ros,
        name: "/save_position",
        serviceType: "position_manager_msgs/srv/SavePosition",
      });

      const request = { name };

      // Add timeout for service call
      let responded = false;
      const timeout = setTimeout(() => {
        if (!responded) {
          console.error("Save position service timeout");
          reject(new Error("Service call timeout - is the ROS2 node running?"));
        }
      }, 10000);

      savePositionService.callService(
        request,
        (response: any) => {
          responded = true;
          clearTimeout(timeout);
          console.log("Save response:", response);

          resolve({
            success: response.success,
            message: response.message || "Unknown response",
          });
        },
        (error: any) => {
          responded = true;
          clearTimeout(timeout);
          console.error("Save position service error:", error);
          reject(error);
        }
      );
    });
  }

  // Get all positions (Service)
  async getPositions(): Promise<SavedPosition[]> {
    return new Promise((resolve, reject) => {
      const ros = rosService.getROS();

      if (!rosService.isConnected) {
        console.error("Cannot get positions: ROS not connected");
        reject(new Error("ROS not connected"));
        return;
      }

      console.log("Getting positions...");

      const getPositionsService = new ROSLIB.Service({
        ros: ros,
        name: "/get_positions",
        serviceType: "position_manager_msgs/srv/GetPositions",
      });

      const request = {};

      // Add timeout
      let responded = false;
      const timeout = setTimeout(() => {
        if (!responded) {
          console.error("Get positions service timeout");
          reject(new Error("Service call timeout - is the ROS2 node running?"));
        }
      }, 10000);

      getPositionsService.callService(
        request,
        (response: any) => {
          responded = true;
          clearTimeout(timeout);
          console.log("Get positions response:", response);

          // Validate response structure
          if (!response.names || !Array.isArray(response.names)) {
            console.error("Invalid response structure");
            reject(new Error("Invalid response from get_positions service"));
            return;
          }

          const positions: SavedPosition[] = response.names.map(
            (name: string, index: number) => ({
              id: `pos-${index}`,
              name,
              x: response.x_coords[index] || 0,
              y: response.y_coords[index] || 0,
              theta: response.theta_coords[index] || 0,
              timestamp: Date.now(),
            })
          );
          resolve(positions);
        },
        (error: any) => {
          responded = true;
          clearTimeout(timeout);
          console.error("Get positions service error:", error);
          reject(error);
        }
      );
    });
  }

  // Delete position (Service)
  async deletePosition(name: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const ros = rosService.getROS();

      if (!rosService.isConnected) {
        reject(new Error("ROS not connected"));
        return;
      }

      console.log(`Deleting position: ${name}`);

      const deletePositionService = new ROSLIB.Service({
        ros: ros,
        name: "/delete_position",
        serviceType: "position_manager_msgs/srv/DeletePosition",
      });

      const request = { name };

      deletePositionService.callService(
        request,
        (response: any) => {
          console.log("Delete response:", response);
          resolve(response.success);
        },
        (error: any) => {
          console.error("Delete position failed:", error);
          reject(error);
        }
      );
    });
  }

  // Navigate to single position (call Service Wrapper)
  async navigateToPosition(
    name: string,
    onFeedback?: (status: string) => void
  ): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve, reject) => {
      const ros = rosService.getROS();
      if (!rosService.isConnected) return reject(new Error("ROS not connected"));

      // 1. Setup Feedback Listener
      const feedbackTopic = new ROSLIB.Topic({
        ros: ros,
        name: "/navigation_web_status",
        messageType: "std_msgs/String"
      });

      const feedbackHandler = (msg: any) => {
        if (onFeedback) onFeedback(msg.data);
      };
      feedbackTopic.subscribe(feedbackHandler);

      // 2. Call the Service to Start
      // Use the 'SavePosition' service type structure for convenience
      // Request: { name: string }
      // Response: { success: boolean, message: string }
      const navService = new ROSLIB.Service({
        ros: ros,
        name: "/start_navigation_web",
        serviceType: "position_manager_msgs/srv/SavePosition"
      });

      const request = { name: name };

      navService.callService(
        request,
        (response: any) => {
          if (response.success) {
            console.log("Navigation started successfully");
            // Resolve immediately because it's async. 
            // UI will update via the feedback callback.
            resolve({ success: true, message: "Navigation started" });
          } else {
            // Clean up if it failed to start
            feedbackTopic.unsubscribe(feedbackHandler);
            resolve({ success: false, message: response.message });
          }
        },
        (error: any) => {
          feedbackTopic.unsubscribe(feedbackHandler);
          reject(error);
        }
      );
    });
  }

  // Navigate through multiple positions (call Service Wrapper)
  async navigateThroughPositions(
    names: string[],
    onFeedback?: (status: string) => void
  ): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve, reject) => {
      const ros = rosService.getROS();

      if (!rosService.isConnected) {
        reject(new Error("ROS not connected"));
        return;
      }

      console.log(`====== Starting multi-navigation: ${names.join(", ")} ======`);

      // 1. Setup Feedback Listener
      const feedbackTopic = new ROSLIB.Topic({
        ros: ros,
        name: "/navigation_web_status",
        messageType: "std_msgs/String"
      });

      const feedbackHandler = (msg: any) => {
        if (onFeedback) onFeedback(msg.data);
      };
      feedbackTopic.subscribe(feedbackHandler);

      // 2. Call the Service to Start
      const navService = new ROSLIB.Service({
        ros: ros,
        name: "/start_multi_navigation_web",
        serviceType: "position_manager_msgs/srv/NavigateMulti"
      });

      const request = { names: names };

      // Add timeout for service call
      let responded = false;
      const timeout = setTimeout(() => {
        if (!responded) {
          console.error("Multi-navigation service timeout");
          feedbackTopic.unsubscribe(feedbackHandler);
          reject(new Error("Service call timeout - is the ROS2 node running?"));
        }
      }, 10000);

      navService.callService(
        request,
        (response: any) => {
          responded = true;
          clearTimeout(timeout);

          if (response.success) {
            console.log("Multi-navigation started successfully");
            // Resolve immediately because it's async.
            // UI will update via the feedback callback.
            resolve({ success: true, message: response.message });
          } else {
            // Clean up if it failed to start
            feedbackTopic.unsubscribe(feedbackHandler);
            resolve({ success: false, message: response.message });
          }
        },
        (error: any) => {
          responded = true;
          clearTimeout(timeout);
          feedbackTopic.unsubscribe(feedbackHandler);
          console.error("Multi-navigation service error:", error);
          reject(error);
        }
      );
    });
  }

  // Get current robot pose from /odom_ekf
  async getCurrentPose(): Promise<RobotPose> {
    return new Promise((resolve, reject) => {
      const ros = rosService.getROS();

      if (!rosService.isConnected) {
        reject(new Error("ROS not connected"));
        return;
      }

      const odomListener = new ROSLIB.Topic({
        ros: ros,
        name: "/odom_ekf",
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