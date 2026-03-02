import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  TerminalSquare,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { useTerminalStore } from "@/stores/terminalStore";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface TerminalPanelProps {
  expanded: boolean;
  onToggle: () => void;
  height?: number;
}

export function TerminalPanel({ expanded, onToggle, height = 200 }: TerminalPanelProps) {
  const { lines, isRunning, clear } = useTerminalStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const handleCopy = async () => {
    const text = lines.map((l) => l.text).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
          {lines.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleCopy}
              title="复制全部输出"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={clear}
            disabled={isRunning}
            title="清除"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onToggle}
            title={expanded ? "折叠" : "展开"}
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
        <ScrollArea className="bg-background" style={{ height }}>
          <div className="p-3 font-mono text-xs space-y-0.5 select-text cursor-text">
            {lines.length === 0 ? (
              <p className="text-muted-foreground select-none">
                准备就绪，选择工具并执行...
              </p>
            ) : (
              lines.map((line, i) => (
                <div
                  key={i}
                  className={cn(
                    "whitespace-pre-wrap break-all",
                    line.stream === "stderr"
                      ? "text-red-400"
                      : "text-foreground"
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
