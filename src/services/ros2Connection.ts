import type { TwistStampedMessage } from "@/types";
import * as ROSLIB from "roslib";
import { ROS_CONFIG } from "@/config";

class RosService {
  private static instance: RosService;
  ros: ROSLIB.Ros;
  isConnected: boolean = false;
  url: string = ROS_CONFIG.ROS_WS_URL;
  reconnectInterval: number = ROS_CONFIG.RECONNECT_INTERVAL;
  private isIntentionalDisconnect: boolean = false;

  private cmdVelPublisher: ROSLIB.Topic<TwistStampedMessage> | null = null;

  private isTransportReady(): boolean {
    const transport = (
      this.ros as unknown as {
        transport?: { isOpen?: () => boolean; isConnecting?: () => boolean };
      }
    ).transport;
    return Boolean(
      transport && typeof transport.isOpen === "function" && transport.isOpen()
    );
  }

  private constructor() {
    this.ros = new ROSLIB.Ros({ url: this.url });
    this.setupListeners();
  }

  public static getInstance(): RosService {
    if (!RosService.instance) RosService.instance = new RosService();
    return RosService.instance;
  }

  private setupListeners() {
    this.ros.on("connection", () => {
      console.log("Connected to WebSocket!");
      this.isConnected = true;
      this.isIntentionalDisconnect = false;

      this.initPublishers();
    });

    this.ros.on("close", () => {
      this.isConnected = false;
      this.cmdVelPublisher = null;
      if (!this.isIntentionalDisconnect) {
        setTimeout(() => this.connect(), this.reconnectInterval);
      }
    });

    this.ros.on("error", (error) => console.error("WebSocket Error:", error));
  }

  private initPublishers() {
    this.cmdVelPublisher = new ROSLIB.Topic<TwistStampedMessage>({
      ros: this.ros,
      name: "/cmd_vel_joystick",
      messageType: "geometry_msgs/TwistStamped",
    });
  }

  public publishVelocity(x: number, y: number, angular: number) {
    if (!this.isTransportReady() || !this.cmdVelPublisher) return;

    const twistStamped = {
      header: {
        stamp: { sec: 0, nanosec: 0 },
        frame_id: "base_footprint",
      },
      twist: {
        linear: { x: x, y: y, z: 0 },
        angular: { x: 0, y: 0, z: angular },
      },
    };

    this.cmdVelPublisher.publish(twistStamped);
  }

  connect() {
    this.isIntentionalDisconnect = false;
    const transport = (
      this.ros as unknown as {
        transport?: { isOpen?: () => boolean; isConnecting?: () => boolean };
      }
    ).transport;
    const alreadyOpen = transport?.isOpen?.();
    const connecting = transport?.isConnecting?.();
    if (this.isConnected || alreadyOpen || connecting) return;
    try {
      this.ros.connect(this.url);
    } catch (e) {
      console.error(e);
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
