import { useState, useEffect, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import { matchToolByFilePath } from "@/lib/toolRegistry";

interface DragDropPayload {
  paths: string[];
  position: { x: number; y: number };
}

interface DragDropResult {
  toolId: string;
  inputId: string;
  filePath: string;
}

export function useDragDrop(onMatch: (result: DragDropResult) => void) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (paths: string[]) => {
      if (paths.length === 0) return;
      const filePath = paths[0];
      const match = matchToolByFilePath(filePath);
      if (match) {
        onMatch({ ...match, filePath });
      }
    },
    [onMatch],
  );

  useEffect(() => {
    const unlisteners: (() => void)[] = [];

    listen<DragDropPayload>("tauri://drag-enter", () => {
      setIsDragging(true);
    }).then((fn) => unlisteners.push(fn));

    listen("tauri://drag-leave", () => {
      setIsDragging(false);
    }).then((fn) => unlisteners.push(fn));

    listen<DragDropPayload>("tauri://drag-drop", (event) => {
      setIsDragging(false);
      handleDrop(event.payload.paths);
    }).then((fn) => unlisteners.push(fn));

    return () => {
      unlisteners.forEach((fn) => fn());
    };
  }, [handleDrop]);

  return { isDragging };
}
