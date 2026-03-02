import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Trash2, TerminalSquare, Loader2 } from "lucide-react";
import { useTerminalStore } from "@/stores/terminalStore";
import { cn } from "@/lib/utils";

interface TerminalPanelProps {
  expanded: boolean;
  onToggle: () => void;
}

export function TerminalPanel({ expanded, onToggle }: TerminalPanelProps) {
  const { lines, isRunning, clear } = useTerminalStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  return (
    <div className="border-t border-border">
      <div className="h-9 flex items-center justify-between px-3 bg-muted/30">
        <div className="flex items-center gap-2">
          {isRunning ? (
            <Loader2 className="h-3.5 w-3.5 text-blue-400 animate-spin" />
          ) : (
            <TerminalSquare className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className="text-xs font-medium text-muted-foreground">
            终端{isRunning ? " (运行中...)" : ""}
          </span>
          {lines.length > 0 && (
            <span className="text-xs text-muted-foreground/60">
              ({lines.length} 行)
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={clear}
            disabled={isRunning}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onToggle}>
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>
      {expanded && (
        <ScrollArea className="h-[200px] bg-background">
          <div className="p-3 font-mono text-xs space-y-0.5">
            {lines.length === 0 ? (
              <p className="text-muted-foreground">准备就绪，选择工具并执行...</p>
            ) : (
              lines.map((line, i) => (
                <div
                  key={i}
                  className={cn(
                    "whitespace-pre-wrap break-all",
                    line.stream === "stderr" ? "text-red-400" : "text-foreground"
                  )}
                >
                  {line.text}
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
