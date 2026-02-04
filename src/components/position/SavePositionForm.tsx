import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, RefreshCw } from "lucide-react";

interface SavePositionFormProps {
  disabled: boolean;
  isSaving: boolean;
  onSave: (name: string) => void;
}

export function SavePositionForm({
  disabled,
  isSaving,
  onSave,
}: SavePositionFormProps) {
  const [name, setName] = useState("");

  const handleSave = () => {
    const trimmedName = name.trim();
    if (trimmedName) {
      onSave(trimmedName);
      setName("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Position name..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={disabled || isSaving}
        className="h-8 text-xs bg-slate-800/50 border-slate-700 text-slate-200 placeholder:text-slate-500"
        onKeyDown={handleKeyDown}
      />
      <Button
        size="sm"
        onClick={handleSave}
        disabled={disabled || isSaving || !name.trim()}
        className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white border-0 whitespace-nowrap"
      >
        {isSaving ? (
          <RefreshCw className="w-3 h-3 animate-spin" />
        ) : (
          <>
            <Save className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">Save</span>
          </>
        )}
      </Button>
    </div>
  );
}
