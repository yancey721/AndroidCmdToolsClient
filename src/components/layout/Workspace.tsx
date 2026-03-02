import { Terminal, FileDown } from "lucide-react";
import { getToolById } from "@/lib/toolRegistry";
import { ToolForm } from "@/components/tools/ToolForm";

interface WorkspaceProps {
  selectedToolId: string | null;
  prefill?: Record<string, string> | null;
  isDragging?: boolean;
}

export function Workspace({ selectedToolId, prefill, isDragging }: WorkspaceProps) {
  return (
    <div className="flex-1 relative overflow-auto">
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 border-2 border-dashed border-blue-500 rounded-lg m-2 pointer-events-none">
          <div className="text-center space-y-2">
            <FileDown className="h-12 w-12 text-blue-400 mx-auto animate-bounce" />
            <p className="text-sm font-medium text-blue-400">
              松开以自动匹配工具
            </p>
            <p className="text-xs text-muted-foreground">
              支持 APK、IMG、DEX、JAR、Class 文件
            </p>
          </div>
        </div>
      )}

      {!selectedToolId ? (
        <div className="flex-1 h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <Terminal className="h-16 w-16 text-muted-foreground/20 mx-auto" />
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                AndroidCmdTools
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                从左侧选择工具、按{" "}
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">
                  Ctrl+K
                </kbd>{" "}
                搜索，或拖拽文件到此处
              </p>
            </div>
          </div>
        </div>
      ) : (() => {
        const tool = getToolById(selectedToolId);
        if (!tool) {
          return (
            <div className="flex-1 h-full flex items-center justify-center">
              <p className="text-muted-foreground">工具未找到: {selectedToolId}</p>
            </div>
          );
        }
        return (
          <div className="p-6">
            <div className="max-w-lg">
              <ToolForm key={`${tool.id}-${JSON.stringify(prefill)}`} tool={tool} prefill={prefill} />
            </div>
          </div>
        );
      })()}
    </div>
  );
}
