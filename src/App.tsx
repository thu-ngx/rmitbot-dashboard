import { useState } from "react";
import { Toaster, toast } from "sonner";
import { Gamepad2, Navigation2, Activity, Wifi, Save, AlertOctagon } from "lucide-react";

// Components
import { VideoFeed } from "./components/VideoFeed";
import { ControlButtons } from "./components/ControlButtons";
import { SpeedControl } from "./components/SpeedControl";
import { MapView } from "./components/MapView";
import { PathQueue } from "./components/PathQueue";
import { DataVisualization } from "./components/DataVisualization";

// UI
import { Card } from "./components/ui/card";
import { Switch } from "./components/ui/switch";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";

// Logic & Types
import { useRobot } from "./hooks/useRobot";
import type { Position, SpeedMode } from "./types";

export default function App() {
  // 1. Core Robot State 
  const robot = useRobot();
  
  // 2. Local App State (UI preferences)
  const [speedMode, setSpeedMode] = useState<SpeedMode>("normal");
  const [viewTab, setViewTab] = useState<"control" | "visualization">("control");
  
  // 3. Navigation Data
  const [positions, setPositions] = useState<Position[]>([]);
  const [currentPosIndex, setCurrentPosIndex] = useState(0);

  // --- Handlers ---
  
  const handleCommand = (cmd: string) => {
    if (!robot.isConnected) return toast.error("Robot not connected");
    toast.success(`Sending: ${cmd}`);
    // TODO: Add roslib publisher here later
  };

  const handleAddPosition = (pos: Omit<Position, "id">) => {
    const newPos = { ...pos, id: `pos-${Date.now()}` };
    setPositions([...positions, newPos]);
    toast.success("Waypoint added");
  };

  const navigationControl = {
    start: () => {
      if (positions.length === 0) return toast.error("Queue empty");
      robot.setNavigating(true);
      setCurrentPosIndex(0);
      toast.success("Navigation Started");
    },
    stop: () => {
      robot.setNavigating(false);
      toast.warning("Navigation Stopped");
    },
    skip: () => {
      const next = currentPosIndex + 1;
      if (next >= positions.length) {
        robot.setNavigating(false);
        toast.success("All destinations reached!");
      } else {
        setCurrentPosIndex(next);
        toast.info(`Moving to waypoint ${next + 1}`);
      }
    },
    goTo: (index: number) => {
       if (robot.mode !== 'autonomous') return toast.error("Switch to Autonomous mode first");
       setCurrentPosIndex(index);
       robot.setNavigating(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <Toaster theme="dark" />

      {/* --- HEADER --- */}
      <div className="border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-3 py-2 max-w-[1800px] flex items-center justify-between">
          <h1 className="text-sm font-semibold w-64">RMIT Robot Control</h1>
          
          {/* Center Mode Switcher */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-2">
              <Button size="sm" variant={robot.mode === "manual" ? "default" : "outline"} 
                onClick={() => robot.setMode("manual")}
                className="h-7 px-3 text-xs bg-purple-600 hover:bg-purple-700 border-0">
                <Gamepad2 className="w-3 h-3 mr-1.5" /> Manual
              </Button>
              <Button size="sm" variant={robot.mode === "autonomous" ? "default" : "outline"}
                onClick={() => robot.setMode("autonomous")}
                className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 border-0">
                <Navigation2 className="w-3 h-3 mr-1.5" /> Autonomous
              </Button>
            </div>
            <span className={`text-[10px] font-medium ${robot.isNavigating ? "text-green-500" : "text-slate-500"}`}>
              {robot.isNavigating ? "• NAVIGATION ACTIVE •" : robot.isConnected ? "STANDBY" : "OFFLINE"}
            </span>
          </div>

          {/* Right Connection Status */}
          <div className="w-64 flex justify-end items-center gap-3">
            <Button size="sm" variant="ghost" onClick={() => setViewTab(viewTab === "control" ? "visualization" : "control")}
              className={`h-7 px-2 ${viewTab === "visualization" ? "bg-slate-800 text-blue-400" : ""}`}>
              <Activity className="w-3 h-3 mr-1" /> Data
            </Button>
            <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
               <Wifi className={`w-3 h-3 ${robot.isConnected ? "text-green-400" : "text-slate-600"}`} />
               <Switch checked={robot.isConnected} onCheckedChange={robot.toggleConnection} />
            </div>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="container mx-auto px-3 py-2 max-w-[1800px]">
        {viewTab === "control" ? (
          <div className="grid grid-cols-12 gap-2 h-[calc(100vh-80px)]">
            
            {/* LEFT: Camera & Manual Controls (3 cols) */}
            <div className="col-span-3 flex flex-col gap-2">
              <Card className="bg-slate-800/30 border-slate-700/50 p-2"><VideoFeed isConnected={robot.isConnected} /></Card>
              <Card className="bg-slate-800/30 border-slate-700/50 flex-1 p-2 space-y-3">
                <div className="text-center">
                   <div className="text-xl font-bold text-blue-400">{robot.speed.toFixed(2)} m/s</div>
                   <SpeedControl selectedMode={speedMode} onModeChange={setSpeedMode} disabled={robot.mode === 'autonomous'} />
                </div>
                <ControlButtons onCommand={handleCommand} disabled={!robot.isConnected || robot.mode === 'autonomous'} />
              </Card>
            </div>

            {/* CENTER: Map (5 cols) */}
            <div className="col-span-5 flex flex-col">
              <Card className="bg-slate-800/30 border-slate-700/50 flex-1 flex flex-col p-1">
                <div className="p-2 flex justify-between items-center">
                  <Button size="sm" onClick={() => handleAddPosition({x: 50, y: 50, name: `Point ${positions.length+1}`})} 
                    disabled={!robot.isConnected} className="h-6 text-[10px] bg-blue-600">
                    <Save className="w-3 h-3 mr-1"/> Add Point
                  </Button>
                  <Badge variant="outline">{positions.length} Waypoints</Badge>
                </div>
                <div className="flex-1 border rounded border-slate-700/50 overflow-hidden relative">
                   <MapView positions={positions} onAddPosition={handleAddPosition} onRemovePosition={(id) => setPositions(p => p.filter(x => x.id !== id))} disabled={!robot.isConnected} />
                </div>
              </Card>
            </div>

            {/* RIGHT: Status & Queue (4 cols) */}
            <div className="col-span-4 flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                 <div className="bg-slate-800/50 rounded p-2 text-center border border-slate-700">
                    <div className="text-[10px] text-slate-400">BATTERY</div>
                    <div className={`font-bold ${robot.batteryLevel < 20 ? 'text-red-500' : 'text-green-400'}`}>{robot.batteryLevel.toFixed(0)}%</div>
                 </div>
                 <div className="bg-slate-800/50 rounded p-2 text-center border border-slate-700">
                    <div className="text-[10px] text-slate-400">SIGNAL</div>
                    <div className="text-blue-400 font-bold">{robot.signalStrength.toFixed(0)}%</div>
                 </div>
              </div>

              <PathQueue 
                positions={positions} 
                isNavigating={robot.isNavigating} 
                currentPositionIndex={currentPosIndex}
                onStart={navigationControl.start}
                onStop={navigationControl.stop}
                onSkip={navigationControl.skip}
                onGoTo={navigationControl.goTo}
                onRemove={(id) => setPositions(p => p.filter(x => x.id !== id))}
                onClear={() => setPositions([])}
                disabled={!robot.isConnected || robot.mode === 'manual'}
              />

              <div className="mt-auto pt-2">
                 <Button className="w-full bg-red-600 hover:bg-red-700 font-bold" onClick={() => { robot.setNavigating(false); toast.error("EMERGENCY STOP"); }}>
                   <AlertOctagon className="w-4 h-4 mr-2" /> EMERGENCY STOP
                 </Button>
              </div>
            </div>

          </div>
        ) : (
          <DataVisualization isConnected={robot.isConnected} isActive={true} />
        )}
      </div>
    </div>
  );
}