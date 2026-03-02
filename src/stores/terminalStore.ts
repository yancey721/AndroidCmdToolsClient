import { create } from "zustand";

export interface TerminalLine {
  text: string;
  stream: "stdout" | "stderr";
  timestamp: number;
}

interface TerminalStore {
  lines: TerminalLine[];
  isRunning: boolean;
  addLine: (line: TerminalLine) => void;
  clear: () => void;
  setRunning: (running: boolean) => void;
}

export const useTerminalStore = create<TerminalStore>((set) => ({
  lines: [],
  isRunning: false,
  addLine: (line) =>
    set((state) => ({ lines: [...state.lines, line] })),
  clear: () => set({ lines: [] }),
  setRunning: (running) => set({ isRunning: running }),
}));
