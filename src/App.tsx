import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";

import { Header } from "@/components/Header";
import { PositionManager } from "@/components/position";
import { ControlButtons, SpeedControl } from "@/components/control";
import { StatusDisplay } from "@/components/StatusDisplay";
import { QuickStartCard } from "@/components/QuickStartCard";
import { Card } from "@/components/ui/card";

import { useRobot } from "@/hooks/useRobot";
import { MOVEMENT_COMMANDS } from "@/constants/ros";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const robot = useRobot();

  const handleCommand = (cmd: string) => {
    if (!robot.isConnected) {
      toast.error("Robot Offline");
      return;
    }

    const velocity = MOVEMENT_COMMANDS[cmd];
    if (velocity) {
      robot.move(...velocity);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <Toaster theme="dark" />

      <Header
        status={robot.status}
        currentIp={robot.currentIp}
        isConnected={robot.isConnected}
        onSwitchRobot={robot.switchRobot}
        onToggleConnection={robot.toggleConnection}
      />

      <main className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[calc(100vh-120px)]">
          {/* Left Column: Position Manager */}
          <div className="lg:col-span-8">
            <PositionManager isConnected={robot.isConnected} />
          </div>

          {/* Right Column: Status + Controls */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <StatusDisplay isConnected={robot.isConnected} />

            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm p-4">
              <h2 className="text-sm font-semibold mb-3 text-white">
                Speed Control
              </h2>
              <SpeedControl
                selectedMode={robot.speedMode}
                onModeChange={robot.setSpeedMode}
                disabled={false}
              />

              <div className="mt-4">
                <h2 className="text-sm font-semibold mb-3 text-white">
                  Movement Controls
                </h2>
                <ControlButtons
                  onCommand={handleCommand}
                  disabled={!robot.isConnected}
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
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
