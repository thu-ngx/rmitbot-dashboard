import * as ROSLIB from "roslib";
import { ROS_CONFIG } from "@/config";
import type { TwistMessage, OdometryMessage } from "@/types";

class RosService {
  private static instance: RosService;
  ros: ROSLIB.Ros;
  isConnected: boolean = false;
  url: string = ROS_CONFIG.ROS_WS_URL;
  reconnectInterval: number = ROS_CONFIG.RECONNECT_INTERVAL;
  private isIntentionalDisconnect: boolean = false;

  private cmdVelPublisher: ROSLIB.Topic | null = null;
  private odomSubscriber: ROSLIB.Topic | null = null;
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
      this.initPublishers();
      this.initSubscribers();
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
    // Publisher for manual control
    this.cmdVelPublisher = new ROSLIB.Topic({
      ros: this.ros,
      name: "/cmd_vel",
      messageType: "geometry_msgs/Twist",
    });
  }

  private initSubscribers() {
    // Subscribe to odometry for robot state
    this.odomSubscriber = new ROSLIB.Topic({
      ros: this.ros,
      name: "/odom",
      messageType: "nav_msgs/Odometry",
    });

    this.odomSubscriber.subscribe((message: any) => {
      if (this.odomCallback) {
        this.odomCallback(message as OdometryMessage);
      }
    });
  }

  public setOdomCallback(callback: (data: OdometryMessage) => void) {
    this.odomCallback = callback;
  }

  public publishVelocity(linear_x: number, linear_y: number, angular_z: number) {
    if (!this.isConnected || !this.cmdVelPublisher) return;

    const twist: TwistMessage = {
      linear: { x: linear_x, y: linear_y, z: 0 },
      angular: { x: 0, y: 0, z: angular_z },
    };

    this.cmdVelPublisher.publish(twist);
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