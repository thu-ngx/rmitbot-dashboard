import { useState } from "react";
import { Toaster, toast } from "sonner";

import { RosProvider } from "@/contexts/RosContext";
import { useRosConnection } from "@/hooks/useRosConnection";
import { Header } from "@/components/Header";
import { PositionManager } from "@/components/position/PositionManager";
import { ControlButtons } from "@/components/control/ControlButtons";
import { SpeedControl } from "@/components/control/SpeedControl";
import { StatusDisplay } from "@/components/StatusDisplay";
import { QuickStartCard } from "@/components/QuickStartCard";
import { Card } from "@/components/ui/card";

import { useRobotControl } from "@/hooks/useRobotControl";
import { MOVEMENT_COMMANDS } from "@/constants/ros";
import type { SpeedMode } from "@/types";

function AppContent() {
  const [speedMode, setSpeedMode] = useState<SpeedMode>("normal");

  const { isConnected, currentIp, connect, disconnect, switchRobot } =
    useRosConnection();
  const { move } = useRobotControl(speedMode);

  const handleCommand = (cmd: string) => {
    if (!isConnected) {
      toast.error("Robot Offline");
      return;
    }

    const velocity = MOVEMENT_COMMANDS[cmd];
    if (velocity) {
      move(...velocity);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <Toaster theme="dark" />

      <Header
        isConnected={isConnected}
        currentIp={currentIp}
        onSwitchRobot={switchRobot}
        onToggleConnection={isConnected ? disconnect : connect}
      />

      <main className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[calc(100vh-120px)]">
          <div className="lg:col-span-8">
            <PositionManager isConnected={isConnected} />
          </div>

          <div className="lg:col-span-4 flex flex-col gap-4">
            <StatusDisplay />

            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm p-4">
              <h2 className="text-sm font-semibold mb-3 text-white">
                Speed Control
              </h2>
              <SpeedControl
                selectedMode={speedMode}
                onModeChange={setSpeedMode}
                disabled={!isConnected}
              />

              <div className="mt-4">
                <h2 className="text-sm font-semibold mb-3 text-white">
                  Movement Controls
                </h2>
                <ControlButtons
                  onCommand={handleCommand}
                  disabled={!isConnected}
                />
              </div>
            </Card>

            <QuickStartCard />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <RosProvider>
      <AppContent />
    </RosProvider>
  );
}
