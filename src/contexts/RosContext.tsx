import {
  createContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import * as ROSLIB from "roslib";
import { ROS_CONFIG } from "@/config";

interface RosContextValue {
  ros: ROSLIB.Ros;
  isConnected: boolean;
  currentIp: string;
  connect: () => void;
  disconnect: () => void;
  switchRobot: (ip: string) => void;
}

export const RosContext = createContext<RosContextValue | null>(null);

export function RosProvider({ children }: { children: ReactNode }) {
  const [currentIp, setCurrentIp] = useState<string>(ROS_CONFIG.DEFAULT_IP);
  const [isConnected, setIsConnected] = useState(false);
  const [ros, setRos] = useState<ROSLIB.Ros>(() => {
    return new ROSLIB.Ros({
      url: `ws://${ROS_CONFIG.DEFAULT_IP}:${ROS_CONFIG.ROSBRIDGE_PORT}`,
    });
  });

  useEffect(() => {
    let isIntentionalDisconnect = false;

    const handleConnection = () => {
      console.log("Connected to ROS");
      setIsConnected(true);
      isIntentionalDisconnect = false;
    };

    const handleClose = () => {
      console.log("Disconnected from ROS");
      setIsConnected(false);

      // Auto-reconnect if not intentional
      if (!isIntentionalDisconnect) {
        console.log("[ROS] Attempting reconnection in 3s...");
        setTimeout(() => {
          if (!isIntentionalDisconnect) {
            ros.connect(`ws://${currentIp}:${ROS_CONFIG.ROSBRIDGE_PORT}`);
          }
        }, ROS_CONFIG.RECONNECT_INTERVAL);
      }
    };

    const handleError = (error: unknown) => {
      console.error("[ROS Error]", error);
      setIsConnected(false);

      // Try to reconnect after 3 seconds
      setTimeout(() => {
        if (!isIntentionalDisconnect) {
          console.log("[ROS] Attempting reconnection after error...");
          ros.connect(`ws://${currentIp}:${ROS_CONFIG.ROSBRIDGE_PORT}`);
        }
      }, 3000);
    };

    ros.on("connection", handleConnection);
    ros.on("close", handleClose);
    ros.on("error", handleError);

    return () => {
      isIntentionalDisconnect = true;
      ros.off("connection", handleConnection);
      ros.off("close", handleClose);
      ros.off("error", handleError);
      ros.close();
    };
  }, [ros, currentIp]);

  const connect = useCallback(() => {
    if (!isConnected) {
      ros.connect(`ws://${currentIp}:${ROS_CONFIG.ROSBRIDGE_PORT}`);
    }
  }, [ros, isConnected, currentIp]);

  const disconnect = useCallback(() => {
    ros.close();
  }, [ros]);

  const switchRobot = useCallback(
    (newIp: string) => {
      if (newIp === currentIp) return;

      ros.close();

      const newRos = new ROSLIB.Ros({
        url: `ws://${newIp}:${ROS_CONFIG.ROSBRIDGE_PORT}`,
      });

      setRos(newRos);
      setCurrentIp(newIp);
      setIsConnected(false);
    },
    [ros, currentIp],
  );

  return (
    <RosContext.Provider
      value={{ ros, isConnected, currentIp, connect, disconnect, switchRobot }}
    >
      {children}
    </RosContext.Provider>
  );
}
