import { create } from "zustand";

interface SelectionState {
  selectedPositions: Set<string>;
  selectedOrder: string[];
  toggleSelection: (name: string) => void;
  clearSelection: () => void;
  removeFromSelection: (name: string) => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedPositions: new Set(),
  selectedOrder: [],

  toggleSelection: (name) =>
    set((state) => {
      const newSelected = new Set(state.selectedPositions);
      let newOrder = [...state.selectedOrder];

      if (newSelected.has(name)) {
        newSelected.delete(name);
        newOrder = newOrder.filter((n) => n !== name);
      } else {
        newSelected.add(name);
        newOrder.push(name);
      }

      return {
        selectedPositions: newSelected,
        selectedOrder: newOrder,
      };
    }),

  clearSelection: () =>
    set({
      selectedPositions: new Set(),
      selectedOrder: [],
    }),

  removeFromSelection: (name) =>
    set((state) => {
      const newSelected = new Set(state.selectedPositions);
      newSelected.delete(name);
      return {
        selectedPositions: newSelected,
        selectedOrder: state.selectedOrder.filter((n) => n !== name),
      };
    }),
}));
