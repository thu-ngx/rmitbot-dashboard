import { Card } from "@/components/ui/card";

const QUICK_START_STEPS = [
  "Drive robot to a location",
  "Save position with a name",
  "Select positions to navigate",
  "View visualization in Foxglove",
] as const;

export function QuickStartCard() {
  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm p-4">
      <h2 className="text-sm font-semibold mb-3 text-white">Quick Start</h2>
      <ol className="text-slate-400 space-y-2 list-decimal list-inside text-xs md:text-sm">
        {QUICK_START_STEPS.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
    </Card>
  );
}
