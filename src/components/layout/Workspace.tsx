import { Terminal } from "lucide-react";

interface WorkspaceProps {
  selectedToolId: string | null;
}

export function Workspace({ selectedToolId }: WorkspaceProps) {
  if (!selectedToolId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Terminal className="h-16 w-16 text-muted-foreground/30 mx-auto" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              AndroidCmdTools
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              从左侧选择一个工具开始使用，或按 Ctrl+K 搜索
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-2xl">
        <h2 className="text-lg font-semibold mb-4">工具: {selectedToolId}</h2>
        <p className="text-muted-foreground text-sm">工具表单将在后续实现</p>
      </div>
    </div>
  );
}
