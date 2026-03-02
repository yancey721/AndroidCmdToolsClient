import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Trash2, TerminalSquare } from "lucide-react";

interface TerminalPanelProps {
  expanded: boolean;
  onToggle: () => void;
}

export function TerminalPanel({ expanded, onToggle }: TerminalPanelProps) {
  return (
    <div className="border-t border-border">
      <div className="h-9 flex items-center justify-between px-3 bg-muted/30">
        <div className="flex items-center gap-2">
          <TerminalSquare className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            终端
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onToggle}
          >
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
          <div className="p-3 font-mono text-xs text-muted-foreground">
            <p>准备就绪，选择工具并执行...</p>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
