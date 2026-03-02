import { Terminal } from "lucide-react";

export function TitleBar() {
  return (
    <div
      className="h-12 flex items-center justify-between px-4 bg-background border-b border-border select-none"
      data-tauri-drag-region
    >
      <div className="flex items-center gap-2" data-tauri-drag-region>
        <Terminal className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm">AndroidCmdTools</span>
      </div>
      <div className="flex items-center gap-3">
        <div id="device-selector" />
        <div id="env-indicators" />
      </div>
    </div>
  );
}
