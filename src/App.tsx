import { useState } from "react";
import { Toaster, toast } from "sonner";
import {
  Gamepad2,
  Wifi,
  AlertOctagon,
  ExternalLink,
} from "lucide-react";

import { ControlButtons } from "./components/ControlButtons";
import { SpeedControl } from "./components/SpeedControl";
import { PositionManager } from "./components/PositionManager";
import { StatusDisplay } from "./components/StatusDisplay";
import { Card } from "./components/ui/card";
import { Switch } from "./components/ui/switch";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";

import { useRobot } from "./hooks/useRobot";
import type { SpeedMode } from "./types";
import { ROS_CONFIG } from "./config";

export default function App() {
  const robot = useRobot();
  const [speedMode, setSpeedMode] = useState<SpeedMode>("normal");

  const handleSpeedChange = (mode: SpeedMode) => {
    setSpeedMode(mode);
    robot.setSpeedMode(mode);
  };

  const handleCommand = (cmd: string) => {
    if (!robot.isConnected) return toast.error("Robot Offline");
    if (robot.mode === "autonomous") return toast.error("Switch to Manual Mode");

    switch (cmd) {
      case "forward":
        robot.move(1.0, 0, 0);
        break;
      case "backward":
        robot.move(-1.0, 0, 0);
        break;
      case "left":
        robot.move(0, 1.0, 0);
        break;
      case "right":
        robot.move(0, -1.0, 0);
        break;
      case "stop":
        robot.move(0, 0, 0);
        break;
      case "forward-left":
        robot.move(0.707, 0.707, 0);
        break;
      case "forward-right":
        robot.move(0.707, -0.707, 0);
        break;
      case "backward-left":
        robot.move(-0.707, 0.707, 0);
        break;
      case "backward-right":
        robot.move(-0.707, -0.707, 0);
        break;
      case "rotate-left":
        robot.move(0, 0, 1.0);
        break;
      case "rotate-right":
        robot.move(0, 0, -1.0);
        break;
      default:
        console.log("Unknown command", cmd);
    }
  };

  const getStatusColor = () => {
    switch (robot.status) {
      case "CONNECTED":
        return "text-green-400";
      case "CONNECTING":
        return "text-yellow-400";
      case "ERROR":
        return "text-red-500";
      default:
        return "text-slate-600";
    }
  };

  const getStatusText = () => {
    switch (robot.status) {
      case "CONNECTED":
        return "ONLINE";
      case "CONNECTING":
        return "CONNECTING...";
      case "ERROR":
        return "ERROR";
      default:
        return "OFFLINE";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <Toaster theme="dark" />

      {/* Header */}
      <div className="border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold">🤖 Robot Control Panel</h1>
            <Badge variant="outline" className="text-xs">
              {ROS_CONFIG.TARGET.toUpperCase()} ({ROS_CONFIG.IP})
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                window.open(`http://${ROS_CONFIG.IP}:${ROS_CONFIG.FOXGLOVE_PORT}`, "_blank")
              }
              className="h-8 text-xs"
            >
              <ExternalLink className="w-3 h-3 mr-2" />
              Open Foxglove
            </Button>

            <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
              <Wifi className={`w-4 h-4 ${getStatusColor()}`} />
              <span className={`text-xs font-bold ${getStatusColor()}`}>
                {getStatusText()}
              </span>
              <Switch
                checked={robot.isConnected}
                onCheckedChange={robot.toggleConnection}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-120px)]">
          {/* Left Column: Manual Control */}
          <div className="col-span-4 flex flex-col gap-4">
            <Card className="bg-slate-800/30 border-slate-700/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4" />
                  Manual Control
                </h2>
                <Badge
                  variant={robot.mode === "manual" ? "default" : "outline"}
                  className="text-xs"
                >
                  {robot.mode === "manual" ? "Active" : "Disabled"}
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-2">
                    {robot.speed.toFixed(2)} m/s
                  </div>
                  <SpeedControl
                    selectedMode={speedMode}
                    onModeChange={handleSpeedChange}
                    disabled={robot.mode === "autonomous"}
                  />
                </div>

                <ControlButtons
                  onCommand={handleCommand}
                  disabled={!robot.isConnected || robot.mode === "autonomous"}
                />
              </div>
            </Card>

            <Button
              className="w-full bg-red-600 hover:bg-red-700 font-bold h-12"
              onClick={() => {
                robot.move(0, 0, 0);
                toast.error("EMERGENCY STOP");
              }}
            >
              <AlertOctagon className="w-5 h-5 mr-2" /> EMERGENCY STOP
            </Button>
          </div>

          {/* Middle Column: Robot Status */}
          <div className="col-span-4 flex flex-col gap-4">
            <StatusDisplay isConnected={robot.isConnected} />

            <Card className="bg-slate-800/30 border-slate-700/50 flex-1 p-4">
              <h2 className="text-sm font-semibold mb-3">📍 Quick Info</h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">ROS Bridge:</span>
                  <span className="font-mono">{ROS_CONFIG.ROS_WS_URL}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Foxglove:</span>
                  <span className="font-mono">:{ROS_CONFIG.FOXGLOVE_PORT}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Control Mode:</span>
                  <Badge variant="outline" className="text-[10px]">
                    {robot.mode}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded text-xs">
                <p className="text-blue-300 font-semibold mb-1">💡 Quick Start:</p>
                <ol className="text-slate-300 space-y-1 list-decimal list-inside text-[11px]">
                  <li>Drive robot to a location</li>
                  <li>Save position with a name</li>
                  <li>Select positions to navigate</li>
                  <li>View visualization in Foxglove</li>
                </ol>
              </div>
            </Card>
          </div>

          {/* Right Column: Position Manager */}
          <div className="col-span-4">
            <PositionManager
              isConnected={robot.isConnected}
              disabled={robot.mode === "autonomous"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}