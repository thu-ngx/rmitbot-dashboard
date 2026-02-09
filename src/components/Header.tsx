import { Wifi } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROBOT_OPTIONS } from "@/config";

interface HeaderProps {
  isConnected: boolean;
  currentIp: string;
  onSwitchRobot: (ip: string) => void;
  onToggleConnection: () => void;
}

export function Header({
  isConnected,
  currentIp,
  onSwitchRobot,
  onToggleConnection,
}: HeaderProps) {
  const statusColor = isConnected ? "text-green-400" : "text-slate-600";
  const statusText = isConnected ? "ONLINE" : "OFFLINE";

  return (
    <header className="border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 max-w-7xl flex items-center justify-between">
        {/* Left: Title and Robot Selector */}
        <div className="flex items-center gap-2 md:gap-3">
          <h1 className="text-sm md:text-lg font-bold text-white">
            Robot Control Panel
          </h1>
          <Select value={currentIp} onValueChange={onSwitchRobot}>
            <SelectTrigger className="w-[140px] md:w-[180px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROBOT_OPTIONS.map((option) => (
                <SelectItem key={option.ip} value={option.ip}>
                  {option.name} ({option.ip.split(".").pop()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Right: Connection Status and Toggle */}
        <div className="flex items-center gap-2">
          <Wifi className={`w-3 h-3 md:w-4 md:h-4 ${statusColor}`} />
          <span className={`text-[10px] md:text-xs font-bold ${statusColor}`}>
            {statusText}
          </span>
          <Switch checked={isConnected} onCheckedChange={onToggleConnection} />
        </div>
      </div>
    </header>
  );
}
