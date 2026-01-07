import * as ROSLIB from "roslib";
import { ROS_CONFIG } from "@/config";
import type { TwistStampedMessage, OdometryMessage } from "@/types";

class RosService {
  private static instance: RosService;
  ros: ROSLIB.Ros;
  isConnected: boolean = false;
  url: string = ROS_CONFIG.ROS_WS_URL;
  reconnectInterval: number = ROS_CONFIG.RECONNECT_INTERVAL;
  private isIntentionalDisconnect: boolean = false;

  private cmdVelPublisher: ROSLIB.Topic<TwistStampedMessage> | null = null;
  private odomSubscriber: ROSLIB.Topic<OdometryMessage> | null = null;
  private odomCallback: ((data: OdometryMessage) => void) | null = null;

  private constructor() {
    this.ros = new ROSLIB.Ros({ url: this.url });
    this.setupListeners();
  }

  public static getInstance(): RosService {
    if (!RosService.instance) {
      RosService.instance = new RosService();
    }
    return RosService.instance;
  }

  private setupListeners() {
    this.ros.on("connection", () => {
      console.log("✅ Connected to ROS WebSocket!");
      this.isConnected = true;
      this.isIntentionalDisconnect = false;

      // Add a small delay to ensure WebSocket is fully ready to send data
      setTimeout(() => {
        this.initPublishers();
        this.initSubscribers();
      }, 500);
    });

    this.ros.on("close", () => {
      console.log("❌ Disconnected from ROS WebSocket");
      this.isConnected = false;
      this.cmdVelPublisher = null;
      this.odomSubscriber = null;

      if (!this.isIntentionalDisconnect) {
        console.log("🔄 Attempting to reconnect...");
        setTimeout(() => this.connect(), this.reconnectInterval);
      }
    });

    this.ros.on("error", (error) => {
      console.error("⚠️ ROS WebSocket Error:", error);
    });
  }

  private initPublishers() {
    this.cmdVelPublisher = new ROSLIB.Topic({
      ros: this.ros,
      name: "/cmd_vel_joystick",
      messageType: "geometry_msgs/TwistStamped",
    });
  }

  private initSubscribers() {
    this.odomSubscriber = new ROSLIB.Topic({
      ros: this.ros,
      name: "/odom",
      messageType: "nav_msgs/Odometry",
    });

    try {
      this.odomSubscriber.subscribe((message: any) => {
        if (this.odomCallback) {
          this.odomCallback(message as OdometryMessage);
        }
      });
    } catch (error) {
      console.warn(
        "Subscriber init failed (socket not ready), will retry on next connection",
        error
      );
    }
  }

  public setOdomCallback(callback: (data: OdometryMessage) => void) {
    this.odomCallback = callback;
  }

  public publishVelocity(
    linear_x: number,
    linear_y: number,
    angular_z: number
  ) {
    if (!this.isConnected || !this.cmdVelPublisher) {
      console.warn(
        "⚠️ Cannot publish: connected=",
        this.isConnected,
        "publisher=",
        !!this.cmdVelPublisher
      );
      return;
    }

    const stamp = {
      sec: 0,
      nanosec: 0,
    };

    const twistStamped: TwistStampedMessage = {
      header: {
        stamp: stamp,
        frame_id: "base_footprint",
      },
      twist: {
        linear: { x: linear_x, y: linear_y, z: 0 },
        angular: { x: 0, y: 0, z: angular_z },
      },
    };

    try {
      this.cmdVelPublisher.publish(twistStamped);
      if (linear_x !== 0 || linear_y !== 0 || angular_z !== 0) {
        console.log(
          "✅ Published TwistStamped to /cmd_vel_joystick:",
          twistStamped
        );
      }
    } catch (error) {
      console.error("❌ Publish failed:", error);
    }
  }

  connect() {
    this.isIntentionalDisconnect = false;
    if (this.isConnected) return;
    try {
      this.ros.connect(this.url);
    } catch (e) {
      console.error("Connection failed:", e);
    }
  }

  disconnect() {
    this.isIntentionalDisconnect = true;
    this.ros.close();
  }

  getROS() {
    return this.ros;
  }
}

export const rosService = RosService.getInstance();
