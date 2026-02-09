import * as ROSLIB from "roslib";
import {
  ROS_SERVICES,
  ROS_SERVICE_TYPES,
  SERVICE_TIMEOUT_MS,
  ROS_TOPICS,
  ROS_MESSAGE_TYPES,
} from "@/constants/ros";
import type { SavedPosition } from "@/types";

interface SavePositionResponse {
  success: boolean;
  message: string;
  position?: SavedPosition;
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
  /**
   * Generic service call wrapper with timeout
   */
  callService<TRequest, TResponse>(
    ros: ROSLIB.Ros,
    serviceName: string,
    serviceType: string,
    request: TRequest,
    timeoutMs = SERVICE_TIMEOUT_MS,
  ): Promise<TResponse> {
    return new Promise((resolve, reject) => {
      const service = new ROSLIB.Service({
        ros, // Use passed ros instance
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
    ros: ROSLIB.Ros,
    name: string,
  ): Promise<{ success: boolean; message: string; position?: SavedPosition }> {
    console.log(`[savePosition] Saving: ${name}`);

    try {
      const response = await this.callService<
        { name: string },
        SavePositionResponse
      >(ros, ROS_SERVICES.SAVE_POSITION, ROS_SERVICE_TYPES.SAVE_POSITION, {
        name,
      });

      console.log("[savePosition] Response:", response);

      if (response.success) {
        try {
          const positions = await this.getPositions(ros);
          const savedPosition = positions.find((p) => p.name === name);
          return {
            success: true,
            message: response.message || "Position saved",
            position: savedPosition,
          };
        } catch (err) {
          console.error("[savePosition] Failed to fetch saved position:", err);
        }
      }

      return {
        success: response.success,
        message: response.message || "Unknown response",
      };
    } catch (error) {
      console.error("[savePosition] Error:", error);
      throw error;
    }
  }

  /**
   * Get all saved positions
   */
  async getPositions(ros: ROSLIB.Ros): Promise<SavedPosition[]> {
    console.log("[getPositions] Fetching positions...");

    try {
      const response = await this.callService<
        Record<string, never>,
        GetPositionsResponse
      >(ros, ROS_SERVICES.GET_POSITIONS, ROS_SERVICE_TYPES.GET_POSITIONS, {});

      console.log("[getPositions] Response:", response);

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
    } catch (error) {
      console.error("[getPositions] Error:", error);
      throw error;
    }
  }

  /**
   * Delete a position by name
   */
  async deletePosition(ros: ROSLIB.Ros, name: string): Promise<boolean> {
    console.log(`[deletePosition] Deleting: ${name}`);

    try {
      const response = await this.callService<
        { name: string },
        DeletePositionResponse
      >(ros, ROS_SERVICES.DELETE_POSITION, ROS_SERVICE_TYPES.DELETE_POSITION, {
        name,
      });

      console.log("[deletePosition] Response:", response);
      return response.success;
    } catch (error) {
      console.error("[deletePosition] Error:", error);
      throw error;
    }
  }

  /**
   * Navigate through multiple positions
   */
  async navigateThroughPositions(
    ros: ROSLIB.Ros,
    names: string[],
    onFeedback?: (status: string) => void,
  ): Promise<{
    success: boolean;
    message: string;
    positions_reached?: number;
  }> {
    return new Promise((resolve, reject) => {
      console.log(`[navigateThroughPositions] Starting: ${names.join(", ")}`);

      // Setup feedback listener
      const feedbackTopic = new ROSLIB.Topic({
        ros,
        name: ROS_TOPICS.NAVIGATION_STATUS,
        messageType: ROS_MESSAGE_TYPES.STRING,
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
          console.error(
            "[navigateThroughPositions] Error in navigation:",
            data,
          );
        }
      };

      feedbackTopic.subscribe(feedbackHandler);

      // Call the service to start navigation
      this.callService<{ names: string[] }, NavigateMultiResponse>(
        ros,
        ROS_SERVICES.NAVIGATE_MULTI,
        ROS_SERVICE_TYPES.NAVIGATE_MULTI,
        { names },
      )
        .then((response) => {
          if (!response.success) {
            cleanup();
            resolve({ success: false, message: response.message });
          } else {
            console.log("[navigateThroughPositions] Background task started");
          }
        })
        .catch((error) => {
          console.error(
            "[navigateThroughPositions] Service call failed:",
            error,
          );
          cleanup();
          reject(error);
        });
    });
  }

  /**
   * Cancel ongoing navigation
   */
  cancelNavigation(ros: ROSLIB.Ros): void {
    console.log("[cancelNavigation] Cancelling...");
    const service = new ROSLIB.Service({
      ros,
      name: "/cancel_navigation",
      serviceType: "std_srvs/Trigger",
    });
    service.callService(
      {},
      (res) => {
        console.log("[cancelNavigation] Cancelled:", res);
      },
      (err) => console.error("[cancelNavigation] Error:", err),
    );
  }
}

export const positionService = new PositionService();
