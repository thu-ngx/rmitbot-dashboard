import { useEffect, useState } from "react";
import { rosService } from "../services/ros2Connection";

export type RosStatus = "CONNECTED" | "DISCONNECTED" | "ERROR" | "CONNECTING";

export function useRos() {
  const [status, setStatus] = useState<RosStatus>("DISCONNECTED");

  useEffect(() => {
    const ros = rosService.getROS();

    const handleConnect = () => setStatus("CONNECTED");
    const handleClose = () => setStatus("DISCONNECTED");
    const handleError = () => setStatus("ERROR");

    ros.on("connection", handleConnect);
    ros.on("close", handleClose);
    ros.on("error", handleError);

    if (ros.isConnected) {
      handleConnect();
    }
  }, []);

  // Wrapper actions
  const connect = () => {
    setStatus("CONNECTING");
    rosService.connect();
  };

  const disconnect = () => {
    rosService.disconnect();
    // Status update handled by 'close' event listener above
  };

  return {
    status,
    isConnected: status === "CONNECTED",
    connect,
    disconnect,
  };
}
