import { create } from "zustand";

export interface HistoryEntry {
  toolId: string;
  toolName: string;
  params: Record<string, string>;
  timestamp: number;
  success: boolean;
}

interface HistoryStore {
  entries: HistoryEntry[];
  addEntry: (entry: HistoryEntry) => void;
  clearHistory: () => void;
}

const STORAGE_KEY = "tool-execution-history";
const MAX_ENTRIES = 50;

function loadFromStorage(): HistoryEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveToStorage(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  entries: loadFromStorage(),
  addEntry: (entry) => {
    const entries = [entry, ...get().entries].slice(0, MAX_ENTRIES);
    saveToStorage(entries);
    set({ entries });
  },
  clearHistory: () => {
    saveToStorage([]);
    set({ entries: [] });
  },
}));
