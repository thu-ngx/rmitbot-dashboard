import * as ROSLIB from "roslib";
import { rosService } from "./ros2Connection";
import type { SavedPosition } from "@/types";
import { ROS_SERVICES, ROS_SERVICE_TYPES, SERVICE_TIMEOUT_MS } from "@/constants/ros";

// Response types
interface SavePositionResponse {
  success: boolean;
  message: string;
}

interface GetPositionsResponse {
  names: string[];
  x_coords: number[];
  y_coords: number[];
  theta_coords: number[];
}

interface DeletePositionResponse {
  success: boolean;
  message: string;
}

interface NavigateMultiResponse {
  success: boolean;
  message: string;
}

class PositionService {
  private static instance: PositionService;

  private constructor() {}

  public static getInstance(): PositionService {
    if (!PositionService.instance) {
      PositionService.instance = new PositionService();
    }
    return PositionService.instance;
  }

  /**
   * Generic service call wrapper with timeout
   */
  private callService<TRequest, TResponse>(
    serviceName: string,
    serviceType: string,
    request: TRequest,
    timeoutMs = SERVICE_TIMEOUT_MS,
  ): Promise<TResponse> {
    return new Promise((resolve, reject) => {
      const ros = rosService.getROS();

      if (!rosService.isConnected) {
        reject(new Error("ROS not connected"));
        return;
      }

      const service = new ROSLIB.Service({
        ros,
        name: serviceName,
        serviceType,
      });

      let responded = false;
      const timeout = setTimeout(() => {
        if (!responded) {
          reject(new Error(`Service timeout: ${serviceName}`));
        }
      }, timeoutMs);

      service.callService(
        request,
        (response: unknown) => {
          responded = true;
          clearTimeout(timeout);
          resolve(response as TResponse);
        },
        (error: string) => {
          responded = true;
          clearTimeout(timeout);
          reject(new Error(error));
        },
      );
    });
  }

  /**
   * Save current robot position with a name
   */
  async savePosition(
    name: string,
  ): Promise<{ success: boolean; message: string }> {
    console.log(`Saving position: ${name}`);

    const response = await this.callService<
      { name: string },
      SavePositionResponse
    >(ROS_SERVICES.SAVE_POSITION, ROS_SERVICE_TYPES.SAVE_POSITION, { name });

    console.log("Save response:", response);
    return {
      success: response.success,
      message: response.message || "Unknown response",
    };
  }

  /**
   * Get all saved positions
   */
  async getPositions(): Promise<SavedPosition[]> {
    console.log("Getting positions...");

    const response = await this.callService<
      Record<string, never>,
      GetPositionsResponse
    >(ROS_SERVICES.GET_POSITIONS, ROS_SERVICE_TYPES.GET_POSITIONS, {});

    console.log("Get positions response:", response);

    const names = response.names || [];
    const xCoords = response.x_coords || [];
    const yCoords = response.y_coords || [];
    const thetaCoords = response.theta_coords || [];

    return names.map((name, index) => ({
      id: `pos-${index}`,
      name,
      x: xCoords[index] || 0,
      y: yCoords[index] || 0,
      theta: thetaCoords[index] || 0,
      timestamp: Date.now(),
    }));
  }

  /**
   * Delete a position by name
   */
  async deletePosition(name: string): Promise<boolean> {
    console.log(`Deleting position: ${name}`);

    const response = await this.callService<
      { name: string },
      DeletePositionResponse
    >(ROS_SERVICES.DELETE_POSITION, ROS_SERVICE_TYPES.DELETE_POSITION, {
      name,
    });

    console.log("Delete response:", response);
    return response.success;
  }

  /**
   * Navigate through multiple positions
   */
  async navigateThroughPositions(
    names: string[],
    onFeedback?: (status: string) => void,
  ): Promise<{
    success: boolean;
    message: string;
    positions_reached?: number;
  }> {
    return new Promise((resolve, reject) => {
      const ros = rosService.getROS();

      if (!rosService.isConnected) {
        reject(new Error("ROS not connected"));
        return;
      }

      console.log(`Starting multi-navigation: ${names.join(", ")}`);

      // Setup feedback listener
      const feedbackTopic = new ROSLIB.Topic({
        ros,
        name: "/navigation_web_status",
        messageType: "std_msgs/String",
      });

      const cleanup = () => {
        feedbackTopic.unsubscribe(feedbackHandler);
      };

      const feedbackHandler = (msg: unknown) => {
        const data = (msg as { data?: string }).data;
        if (!data) return;

        if (onFeedback) onFeedback(data);

        if (data.includes("Multi-navigation complete")) {
          cleanup();
          resolve({ success: true, message: data });
        } else if (
          data.includes("Error:") ||
          data.includes("Navigation failed")
        ) {
          console.log("Error during multi-navigation");
        }
      };

      feedbackTopic.subscribe(feedbackHandler);

      // Call the service to start navigation
      this.callService<{ names: string[] }, NavigateMultiResponse>(
        ROS_SERVICES.NAVIGATE_MULTI,
        ROS_SERVICE_TYPES.NAVIGATE_MULTI,
        { names },
      )
        .then((response) => {
          if (!response.success) {
            cleanup();
            resolve({ success: false, message: response.message });
          } else {
            console.log("Multi-navigation background task started...");
          }
        })
        .catch((error) => {
          cleanup();
          reject(error);
        });
    });
  }

  /**
   * Cancel ongoing navigation
   */
  cancelNavigation(): void {
    console.log("Cancelling navigation...");
    const ros = rosService.getROS();
    if (rosService.isConnected) {
      const service = new ROSLIB.Service({
        ros,
        name: "/cancel_navigation",
        serviceType: "std_srvs/Trigger",
      });
      service.callService(
        {},
        (res) => {
          console.log("Cancelled", res);
        },
        (err) => console.error(err),
      );
    }
  }
}

export const positionService = PositionService.getInstance();
