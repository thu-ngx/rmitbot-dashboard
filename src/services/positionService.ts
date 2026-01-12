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

  // Navigate to single position (ACTION)
  async navigateToPosition(
    name: string,
    onFeedback?: (status: string) => void
  ): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve, reject) => {
      const ros = rosService.getROS();

      if (!rosService.isConnected) {
        reject(new Error("ROS not connected"));
        return;
      }

      console.log(`====== Starting navigation to: ${name} ======`);

      const actionClient = new ROSLIB.ActionClient<
        NavigateToPositionGoal,
        NavigateToPositionFeedback,
        NavigateToPositionResult
      >({
        ros,
        serverName: "/navigate_to_position",
        actionName: "position_manager_msgs/action/NavigateToPosition",
      });

      let finished = false;
      let goalAccepted = false;

      const goal = new ROSLIB.Goal<
        NavigateToPositionGoal,
        NavigateToPositionFeedback,
        NavigateToPositionResult
      >({
        actionClient,
        goalMessage: { position_name: name },
      });

      // Store for Stop/cancel
      this.currentSingleGoal = goal;

      const cleanup = () => {
        if (finished) return;
        finished = true;
        this.currentSingleGoal = null;
        console.log("Cleanup completed");
      };

      // Timeout for initial goal acceptance (longer timeout - 15s)
      const acceptanceTimeout = setTimeout(() => {
        if (finished) return;
        if (!goalAccepted) {
          console.error("Goal not accepted within 15s");
          try {
            goal.cancel();
          } catch (error) {
            console.warn("Failed to cancel goal during timeout:", error);
          }
          cleanup();
          reject(
            new Error(
              "Action server not responding - goal not accepted within 15s"
            )
          );
        }
      }, 15000);

      // Overall navigation timeout (6 minutes)
      const navigationTimeout = setTimeout(() => {
        if (finished) return;
        console.error("Navigation timeout after 6 minutes");
        try {
          goal.cancel();
        } catch (error) {
          console.warn("Failed to cancel goal during navigation timeout:", error);
        }
        cleanup();
        reject(new Error("Navigation timeout after 6 minutes"));
      }, 360000);

      goal.on("feedback", (feedback: any) => {
        console.log("Feedback received:", JSON.stringify(feedback));
        goalAccepted = true; // If we get feedback, goal was accepted
        clearTimeout(acceptanceTimeout);
        if (onFeedback) {
          const status = feedback?.status || `Navigating to ${name}...`;
          onFeedback(status);
        }
      });

      goal.on("status", (status: any) => {
        console.log("Status received:", JSON.stringify(status));
        // roslib sends status updates - check for acceptance
        // Status codes: 1=PENDING, 2=ACTIVE, 3=PREEMPTED, 4=SUCCEEDED, 5=ABORTED, etc.
        const statusCode = status?.status;
        if (
          statusCode === 1 ||
          statusCode === 2 ||
          statusCode === "ACTIVE" ||
          statusCode === "PENDING"
        ) {
          if (!goalAccepted) {
            console.log("Goal accepted!");
            goalAccepted = true;
            clearTimeout(acceptanceTimeout);
          }
        }
      });

      goal.on("result", (result: any) => {
        console.log("Result received:", JSON.stringify(result));
        clearTimeout(acceptanceTimeout);
        clearTimeout(navigationTimeout);

        if (finished) {
          console.log("Already finished, ignoring result");
          return;
        }

        // Handle different result structures from roslib
        // For ROS2 actions via rosbridge, result might be nested under 'result' or 'values'
        let actualResult = result;
        if (result?.result !== undefined) {
          actualResult = result.result;
        } else if (result?.values !== undefined) {
          actualResult = result.values;
        }

        console.log("Actual result:", JSON.stringify(actualResult));

        const success = actualResult?.success === true;
        const message =
          actualResult?.message ||
          (success ? `Arrived at ${name}` : "Navigation failed");

        console.log(`Navigation ${success ? "SUCCEEDED" : "FAILED"}: ${message}`);
        cleanup();
        resolve({ success, message });
      });

      goal.on("timeout", () => {
        console.error("Goal timeout event fired");
        clearTimeout(acceptanceTimeout);
        clearTimeout(navigationTimeout);
        cleanup();
        reject(new Error("Navigation goal timed out"));
      });

      // // Listen for any errors
      // actionClient.on("error", (error: any) => {
      //   console.error("ActionClient error:", error);
      // });

      // Send the goal
      console.log("Sending goal...");
      goal.send();
      console.log("Goal sent!");
      if (onFeedback) onFeedback("Goal sent to robot...");
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

      console.log(`====== Starting multi-navigation: ${names.join(", ")} ======`);

      const actionClient = new ROSLIB.ActionClient<
        NavigateThroughPositionsGoal,
        NavigateThroughPositionsFeedback,
        NavigateThroughPositionsResult
      >({
        ros,
        serverName: "/navigate_positions",
        actionName: "position_manager_msgs/action/NavigatePositions",
      });

      let finished = false;
      let goalAccepted = false;

      const goal = new ROSLIB.Goal<
        NavigateThroughPositionsGoal,
        NavigateThroughPositionsFeedback,
        NavigateThroughPositionsResult
      >({
        actionClient,
        goalMessage: { position_names: names },
      });

      // Store for Stop/cancel
      this.currentMultiGoal = goal;

      const cleanup = () => {
        if (finished) return;
        finished = true;
        this.currentMultiGoal = null;
        console.log("Multi-navigation cleanup completed");
      };

      // Timeout for initial goal acceptance (15s)
      const acceptanceTimeout = setTimeout(() => {
        if (finished) return;
        if (!goalAccepted) {
          console.error("Multi-goal not accepted within 15s");
          try {
            goal.cancel();
          } catch (error) {
            console.warn("Failed to cancel multi-goal during timeout:", error);
          }
          cleanup();
          reject(
            new Error(
              "Action server not responding - goal not accepted within 15s"
            )
          );
        }
      }, 15000);

      goal.on("feedback", (feedback: any) => {
        console.log("Multi-feedback received:", JSON.stringify(feedback));
        goalAccepted = true;
        clearTimeout(acceptanceTimeout);
        if (onFeedback) {
          // Handle nested feedback structure
          const actualFeedback = feedback?.feedback || feedback;
          onFeedback(actualFeedback);
        }
      });

      goal.on("status", (status: any) => {
        console.log("Multi-status received:", JSON.stringify(status));
        const statusCode = status?.status;
        if (
          statusCode === 1 ||
          statusCode === 2 ||
          statusCode === "ACTIVE" ||
          statusCode === "PENDING"
        ) {
          if (!goalAccepted) {
            console.log("Multi-goal accepted!");
            goalAccepted = true;
            clearTimeout(acceptanceTimeout);
          }
        }
      });

      goal.on("result", (result: any) => {
        console.log("Multi-result received:", JSON.stringify(result));
        clearTimeout(acceptanceTimeout);

        if (finished) {
          console.log("Already finished, ignoring multi-result");
          return;
        }

        // Handle nested result structure
        let actualResult = result;
        if (result?.result !== undefined) {
          actualResult = result.result;
        } else if (result?.values !== undefined) {
          actualResult = result.values;
        }

        console.log("Actual multi-result:", JSON.stringify(actualResult));

        cleanup();
        resolve({
          success: actualResult?.success === true,
          message: actualResult?.message ?? "",
          positions_reached: actualResult?.positions_reached ?? 0,
        });
      });

      goal.on("timeout", () => {
        console.error("Multi-goal timeout event");
        clearTimeout(acceptanceTimeout);
        cleanup();
        reject(new Error("Multi-navigation goal timed out"));
      });

      // Send immediately
      console.log("Sending multi-goal...");
      goal.send();
      console.log("Multi-goal sent!");
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
