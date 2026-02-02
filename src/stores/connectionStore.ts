import { create } from "zustand";
import type { ConnectionStatus } from "@/types";
import { ROS_CONFIG } from "@/config";

interface ConnectionState {
  status: ConnectionStatus;
  currentIp: string;
  setStatus: (status: ConnectionStatus) => void;
  setCurrentIp: (ip: string) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  status: "DISCONNECTED",
  currentIp: ROS_CONFIG.DEFAULT_IP,
  setStatus: (status) => set({ status }),
  setCurrentIp: (ip) => set({ currentIp: ip }),
}));
