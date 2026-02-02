import { useCallback } from "react";
import { rosService } from "@/services/ros2Connection";
import { useConnectionStore } from "@/stores/connectionStore";

export function useRos() {
  const status = useConnectionStore((state) => state.status);
  const currentIp = useConnectionStore((state) => state.currentIp);
  const setStatus = useConnectionStore((state) => state.setStatus);

  const connect = useCallback(() => {
    setStatus("CONNECTING");
    rosService.connect();
  }, [setStatus]);

  const disconnect = useCallback(() => {
    rosService.disconnect();
  }, []);

  const switchRobot = useCallback(
    (newIp: string) => {
      if (newIp === currentIp) return;
      setStatus("CONNECTING");
      rosService.switchRobot(newIp);
    },
    [currentIp, setStatus],
  );

  return {
    status,
    isConnected: status === "CONNECTED",
    currentIp,
    connect,
    disconnect,
    switchRobot,
  };
}
