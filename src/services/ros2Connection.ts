import * as ROSLIB from "roslib";

class RosService {
  private static instance: RosService;
  ros: ROSLIB.Ros;
  isConnected: boolean = false;
  url: string = "ws://100.68.218.48:9090";
  reconnectInterval: number = 3000;
  private isIntentionalDisconnect: boolean = false;
  private constructor() {
    this.ros = new ROSLIB.Ros({
      url: this.url,
    });

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
      console.log("Connected to WebSocket!");
      this.isConnected = true;
      this.isIntentionalDisconnect = false;
    });

    this.ros.on("error", (error) => {
      console.error("WebSocket Error:", error);
    });

    this.ros.on("close", () => {
      console.log("WebSocket Connection closed.");
      this.isConnected = false;

      // Only reconnect if we didn't mean to disconnect
      if (!this.isIntentionalDisconnect) {
        setTimeout(() => {
          console.log("Reconnecting to WebSocket...");
          this.connect();
        }, this.reconnectInterval);
      }
    });
  }

  connect() {
    this.isIntentionalDisconnect = false;
    if (this.isConnected) return;

    console.log("Attempting to connect to ROS Bridge...");
    try {
      this.ros.connect(this.url);
    } catch (error) {
      console.error("WebSocket connection error:", error);
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
