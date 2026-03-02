import { Terminal } from "lucide-react";
import { getToolById } from "@/lib/toolRegistry";
import { ToolForm } from "@/components/tools/ToolForm";

interface WorkspaceProps {
  selectedToolId: string | null;
}

export function Workspace({ selectedToolId }: WorkspaceProps) {
  if (!selectedToolId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Terminal className="h-16 w-16 text-muted-foreground/20 mx-auto" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              AndroidCmdTools
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              从左侧选择一个工具开始使用，或按{" "}
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">
                Ctrl+K
              </kbd>{" "}
              搜索
            </p>
          </div>
        </div>
      </div>
    );
  }

  const tool = getToolById(selectedToolId);
  if (!tool) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">工具未找到: {selectedToolId}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-lg">
        <ToolForm key={tool.id} tool={tool} />
      </div>
    </div>
  );
}
