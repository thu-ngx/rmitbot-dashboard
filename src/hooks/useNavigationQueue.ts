import { useState } from "react";

export function useNavigationQueue() {
  const [selectedPositions, setSelectedPositions] = useState<Set<string>>(
    new Set(),
  );
  const [selectedOrder, setSelectedOrder] = useState<string[]>([]);

  const toggleSelection = (name: string) => {
    setSelectedPositions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(name)) {
        newSet.delete(name);
      } else {
        newSet.add(name);
      }
      return newSet;
    });

    setSelectedOrder((prev) => {
      if (prev.includes(name)) {
        return prev.filter((n) => n !== name);
      } else {
        return [...prev, name];
      }
    });
  };

  const clearSelection = () => {
    setSelectedPositions(new Set());
    setSelectedOrder([]);
  };

  const removeFromSelection = (name: string) => {
    setSelectedPositions((prev) => {
      const newSet = new Set(prev);
      newSet.delete(name);
      return newSet;
    });
    setSelectedOrder((prev) => prev.filter((n) => n !== name));
  };

  return {
    selectedPositions,
    selectedOrder,
    toggleSelection,
    clearSelection,
    removeFromSelection,
  };
}
