import { useState } from "react";
import { TitleBar } from "./TitleBar";
import { Sidebar } from "./Sidebar";
import { Workspace } from "./Workspace";
import { TerminalPanel } from "./TerminalPanel";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { useShellExecution } from "@/hooks/useShellExecution";

export function AppLayout() {
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [terminalExpanded, setTerminalExpanded] = useState(true);

  useDeviceDetection();
  useShellExecution();

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar selectedToolId={selectedToolId} onSelectTool={setSelectedToolId} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Workspace selectedToolId={selectedToolId} />
          <TerminalPanel
            expanded={terminalExpanded}
            onToggle={() => setTerminalExpanded(!terminalExpanded)}
          />
        </div>
      </div>
    </div>
  );
}
