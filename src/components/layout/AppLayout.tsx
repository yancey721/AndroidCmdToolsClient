import { useState, useEffect, useCallback } from "react";
import { TitleBar } from "./TitleBar";
import { Sidebar } from "./Sidebar";
import { Workspace } from "./Workspace";
import { TerminalPanel } from "./TerminalPanel";
import { SearchDialog } from "@/components/common/SearchDialog";
import { ResizeHandle } from "@/components/common/ResizeHandle";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { useDragDrop } from "@/hooks/useDragDrop";

const SIDEBAR_MIN = 180;
const SIDEBAR_MAX = 400;
const SIDEBAR_DEFAULT = 240;
const TERMINAL_MIN = 100;
const TERMINAL_MAX = 500;
const TERMINAL_DEFAULT = 200;

export function AppLayout() {
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [terminalExpanded, setTerminalExpanded] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
  const [terminalHeight, setTerminalHeight] = useState(TERMINAL_DEFAULT);
  const [prefill, setPrefill] = useState<Record<string, string> | null>(null);

  useDeviceDetection();

  const handleDragMatch = useCallback(
    (result: { toolId: string; inputId: string; filePath: string }) => {
      setPrefill({ [result.inputId]: result.filePath });
      setSelectedToolId(result.toolId);
    },
    [],
  );

  const { isDragging } = useDragDrop(handleDragMatch);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelectTool = useCallback((id: string) => {
    setPrefill(null);
    setSelectedToolId(id);
  }, []);

  const handleSidebarResize = useCallback((delta: number) => {
    setSidebarWidth((prev) =>
      Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, prev + delta))
    );
  }, []);

  const handleTerminalResize = useCallback((delta: number) => {
    setTerminalHeight((prev) =>
      Math.min(TERMINAL_MAX, Math.max(TERMINAL_MIN, prev - delta))
    );
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          selectedToolId={selectedToolId}
          onSelectTool={handleSelectTool}
          width={sidebarWidth}
        />
        <ResizeHandle direction="horizontal" onResize={handleSidebarResize} />
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <Workspace
            selectedToolId={selectedToolId}
            prefill={prefill}
            isDragging={isDragging}
          />
          {terminalExpanded && (
            <ResizeHandle direction="vertical" onResize={handleTerminalResize} />
          )}
          <TerminalPanel
            expanded={terminalExpanded}
            onToggle={() => setTerminalExpanded(!terminalExpanded)}
            height={terminalHeight}
          />
        </div>
      </div>
      <SearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSelectTool={handleSelectTool}
      />
    </div>
  );
}
