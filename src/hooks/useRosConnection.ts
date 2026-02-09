import { useContext } from "react";
import { RosContext } from "@/contexts/RosContext";

export function useRosConnection() {
  const context = useContext(RosContext);
  if (!context) {
    throw new Error("useRosConnection must be used within RosProvider");
  }
  return context;
}
