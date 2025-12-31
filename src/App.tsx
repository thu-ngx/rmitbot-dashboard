import { useState, useEffect } from "react";
import { VideoFeed } from "./components/VideoFeed";
import { StatusPanel } from "./components/StatusPanel";
import { ControlButtons } from "./components/ControlButtons";
import { DeliveryPanel } from "./components/DeliveryPanel";
import { SpeedSlider } from "./components/SpeedSlider.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Switch } from "./components/ui/switch";
import { Label } from "./components/ui/label";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";
import { Cpu } from "lucide-react";

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(78);
  const [speed, setSpeed] = useState(56);
  const [speedSetting, setSpeedSetting] = useState(50);
  const [signalStrength, setSignalStrength] = useState(85);
  const [autonomousMode, setAutonomousMode] = useState(false);

  // Simulate battery drain and autonomous movement
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        setBatteryLevel((prev) => Math.max(0, prev - Math.random() * 0.5));
        setSignalStrength((prev) =>
          Math.max(60, Math.min(100, prev + (Math.random() - 0.5) * 10))
        );

        // In autonomous mode, simulate random speed changes
        if (autonomousMode) {
          setSpeed((prev) =>
            Math.max(20, Math.min(80, prev + (Math.random() - 0.5) * 20))
          );
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isConnected, autonomousMode]);

  const handleCommand = (command: string) => {
    if (!isConnected) {
      toast.error("Robot not connected", {
        description: "Please connect to the robot first",
      });
      return;
    }
    if (autonomousMode) {
      toast.warning("Autonomous mode active", {
        description: "Switch to manual mode to control the robot",
      });
      return;
    }

    if (command === "stop") {
      setSpeed(0);
    } else {
      setSpeed(speedSetting);
    }
    toast.success(`Command: ${command}`, {
      description: "Command sent to robot",
    });
  };

  const toggleConnection = () => {
    setIsConnected(!isConnected);
    if (!isConnected) {
      toast.success("Connected to ESP32 Robot", {
        description: "Real-time control is now active",
      });
      setBatteryLevel(78);
      setSignalStrength(85);
      setSpeed(0);
    } else {
      toast.info("Disconnected from robot", {
        description: "Robot control is offline",
      });
      setSpeed(0);
      setAutonomousMode(false);
    }
  };

  const toggleControlMode = () => {
    if (!isConnected) {
      toast.error("Robot not connected", {
        description: "Connect to robot before changing mode",
      });
      return;
    }
    const newMode = !autonomousMode;
    setAutonomousMode(newMode);
    toast.info(`Switched to ${newMode ? "autonomous" : "manual"} mode`, {
      description: newMode
        ? "Robot will navigate automatically"
        : "You can now control the robot manually",
    });
    setSpeed(newMode ? 45 : 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <Toaster />
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-slate-100">Robot Control</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time wireless motor control
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="mode-toggle"
                  className="text-xs text-slate-300 flex items-center gap-1.5"
                >
                  <Cpu className="w-3.5 h-3.5" /> Autonomous
                </Label>
                <Switch
                  id="mode-toggle"
                  checked={autonomousMode}
                  onCheckedChange={toggleControlMode}
                  disabled={!isConnected}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="connection-toggle"
                  className="text-xs text-slate-300"
                >
                  {isConnected ? "Connected" : "Disconnected"}
                </Label>
                <Switch
                  id="connection-toggle"
                  checked={isConnected}
                  onCheckedChange={toggleConnection}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="hidden lg:grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">
                  Live Video Feed
                </CardTitle>
                <CardDescription>Robot Camera Stream</CardDescription>
              </CardHeader>
              <CardContent>
                <VideoFeed isConnected={isConnected} />
              </CardContent>
            </Card>
            <StatusPanel
              isConnected={isConnected}
              batteryLevel={batteryLevel}
              speed={speed}
              signalStrength={signalStrength}
            />
            <DeliveryPanel isConnected={isConnected} />
          </div>

          <div className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">
                  Movement Control
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ControlButtons
                  onCommand={handleCommand}
                  disabled={!isConnected || autonomousMode}
                />
              </CardContent>
            </Card>

            {/* Speed Control */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">Speed Control</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-end text-sm">
                    <span className="text-slate-300">
                      {speedSetting.toFixed(2)} m/s
                    </span>
                  </div>
                  <SpeedSlider
                    value={speedSetting}
                    onChange={setSpeedSetting}
                    disabled={!isConnected || autonomousMode}
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>0 m/s</span>
                    <span>50 m/s</span>
                    <span>100 m/s</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden space-y-3">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="p-3">
              <VideoFeed isConnected={isConnected} />
            </CardContent>
          </Card>
          {!autonomousMode && (
            <>
              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-3">
                  <ControlButtons
                    onCommand={handleCommand}
                    disabled={!isConnected}
                  />
                </CardContent>
              </Card>
              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-3">
                  <SpeedSlider
                    value={speedSetting}
                    onChange={setSpeedSetting}
                    disabled={!isConnected}
                  />
                </CardContent>
              </Card>
            </>
          )}
          <StatusPanel
            isConnected={isConnected}
            batteryLevel={batteryLevel}
            speed={speed}
            signalStrength={signalStrength}
          />
          <DeliveryPanel isConnected={isConnected} />
        </div>
      </div>
    </div>
  );
}
