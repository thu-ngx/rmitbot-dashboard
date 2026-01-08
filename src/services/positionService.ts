import * as ROSLIB from "roslib";
import { rosService } from "./ros2Connection";
import type { 
  SavedPosition, 
  RobotPose,
  NavigateThroughPositionsFeedback,
  NavigateThroughPositionsResult
} from "@/types";

class PositionService {
  private static instance: PositionService;
  private currentSingleGoal: ROSLIB.Goal | null = null;
  private currentMultiGoal: ROSLIB.Goal | null = null;

  private constructor() {}

  public static getInstance(): PositionService {
    if (!PositionService.instance) {
      PositionService.instance = new PositionService();
    }
    return PositionService.instance;
  }



  public cancelNavigation(): void {
    try {
      if (this.currentSingleGoal) {
        this.currentSingleGoal.cancel();
      }
      if (this.currentMultiGoal) {
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

      const actionClient = new ROSLIB.ActionClient({
        ros,
        serverName: "/navigate_to_position",
        actionName: "position_manager_msgs/action/NavigateToPosition",
      });

      let finished = false;
      let gotAnyResponse = false;

      const goal = new ROSLIB.Goal({
        actionClient,
        goalMessage: { position_name: name },
      });

      // Store for Stop/cancel
      this.currentSingleGoal = goal;

      const cleanup = () => {
        if (finished) return;
        finished = true;
        this.currentSingleGoal = null;
        try {
          actionClient.dispose();
        } catch {}
      };

      // "server not responding" guard
      const serverResponseTimeout = setTimeout(() => {
        if (finished) return;
        if (!gotAnyResponse) {
          try { goal.cancel(); } catch {}
          cleanup();
          reject(new Error("Action server not responding (no feedback/status within 5s)"));
        }
      }, 5000);

      // Overall navigation timeout
      const navigationTimeout = setTimeout(() => {
        if (finished) return;
        try { goal.cancel(); } catch {}
        cleanup();
        reject(new Error("Navigation timeout after 6 minutes"));
      }, 360000);

      goal.on("feedback", (feedback: any) => {
        gotAnyResponse = true;
        if (onFeedback && feedback?.current_position_name) {
          onFeedback(`Navigating to ${feedback.current_position_name}...`);
        }
      });

      goal.on("status", () => {
        gotAnyResponse = true;
      });

      goal.on("result", (result: any) => {
        gotAnyResponse = true;
        clearTimeout(serverResponseTimeout);
        clearTimeout(navigationTimeout);

        const success = !!result?.success;
        cleanup();
        resolve({
          success,
          message:
            result?.message || (success ? `Arrived at ${name}` : "Navigation failed"),
        });
      });

      goal.on("cancel", () => {
        clearTimeout(serverResponseTimeout);
        clearTimeout(navigationTimeout);
        cleanup();
        reject(new Error("Navigation cancelled"));
      });

      goal.send();
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

    const actionClient = new ROSLIB.ActionClient({
      ros,
      serverName: "/navigate_positions",
      actionName: "position_manager_msgs/action/NavigatePositions",
    });

    let finished = false;
    let gotAnyResponse = false;

    const goal = new ROSLIB.Goal({
      actionClient,
      goalMessage: { position_names: names },
    });

    // Store for Stop/cancel
    this.currentMultiGoal = goal;

    const cleanup = () => {
      if (finished) return;
      finished = true;
      this.currentMultiGoal = null;
      try {
        actionClient.dispose();
      } catch {}
    };

    const serverResponseTimeout = setTimeout(() => {
      if (finished) return;
      if (!gotAnyResponse) {
        try { goal.cancel(); } catch {}
        cleanup();
        reject(new Error("Action server not responding (no feedback/status within 5s)"));
      }
    }, 5000);

    goal.on("feedback", (feedback: any) => {
      gotAnyResponse = true;
      if (onFeedback) onFeedback(feedback);
    });

    goal.on("status", () => {
      gotAnyResponse = true;
    });

    goal.on("result", (result: any) => {
      gotAnyResponse = true;
      clearTimeout(serverResponseTimeout);
      cleanup();
      resolve({
        success: !!result?.success,
        message: result?.message ?? "",
        positions_reached: result?.positions_reached ?? 0,
      });
    });

    goal.on("cancel", () => {
      clearTimeout(serverResponseTimeout);
      cleanup();
      reject(new Error("Multi-navigation cancelled"));
    });

    // Send immediately
    goal.send();
  });
}


  // Get current robot pose from /odom
  async getCurrentPose(): Promise<RobotPose> {
    return new Promise((resolve, reject) => {
      const ros = rosService.getROS();

      if (!rosService.isConnected) {
        reject(new Error("ROS not connected"));
        return;
      }

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