import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Smartphone,
  Code,
  Package,
  GitBranch,
  KeyRound,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  toolCategories,
  getToolsByCategory,
  getToolsBySubcategory,
  ToolDefinition,
} from "@/lib/toolRegistry";

interface SidebarProps {
  selectedToolId: string | null;
  onSelectTool: (id: string) => void;
  width?: number;
}

const iconMap: Record<string, React.ReactNode> = {
  Smartphone: <Smartphone className="h-4 w-4" />,
  Code: <Code className="h-4 w-4" />,
  Package: <Package className="h-4 w-4" />,
  GitBranch: <GitBranch className="h-4 w-4" />,
  Key: <KeyRound className="h-4 w-4" />,
};

export function Sidebar({ selectedToolId, onSelectTool, width }: SidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(toolCategories.map((c) => c.id))
  );
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set());

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSub = (id: string) => {
    setExpandedSubs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderToolItem = (tool: ToolDefinition) => (
    <button
      key={tool.id}
      onClick={() => onSelectTool(tool.id)}
      className={cn(
        "w-full text-left px-3 py-1 text-xs rounded-md transition-colors truncate",
        selectedToolId === tool.id
          ? "bg-accent text-accent-foreground font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
      )}
      title={tool.description}
    >
      {tool.name}
    </button>
  );

  return (
    <div
      className="border-r border-border bg-muted/30 flex flex-col shrink-0 overflow-hidden"
      style={{ width: width ?? 240 }}
    >
      <div className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider shrink-0">
        工具分类
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-2 pb-4">
          {toolCategories.map((category) => {
            const isExpanded = expandedCategories.has(category.id);
            return (
              <div key={category.id} className="mb-1">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent/50 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                  {iconMap[category.icon]}
                  <span className="font-medium">{category.name}</span>
                </button>
                {isExpanded && (
                  <div className="ml-3 mt-0.5">
                    {category.subcategories ? (
                      category.subcategories.map((sub) => {
                        const subExpanded = expandedSubs.has(sub.id);
                        const tools = getToolsBySubcategory(sub.id);
                        return (
                          <div key={sub.id} className="mb-0.5">
                            <button
                              onClick={() => toggleSub(sub.id)}
                              className="w-full flex items-center gap-1.5 px-2 py-1 text-xs rounded-md hover:bg-accent/50 transition-colors text-muted-foreground"
                            >
                              {subExpanded ? (
                                <ChevronDown className="h-3 w-3 shrink-0" />
                              ) : (
                                <ChevronRight className="h-3 w-3 shrink-0" />
                              )}
                              <span>{sub.name}</span>
                              <span className="ml-auto text-muted-foreground/50">
                                {tools.length}
                              </span>
                            </button>
                            {subExpanded && (
                              <div className="ml-3 mt-0.5 space-y-0.5">
                                {tools.map(renderToolItem)}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="ml-1 space-y-0.5">
                        {getToolsByCategory(category.id).map(renderToolItem)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <div className="px-4 py-2 border-t border-border shrink-0">
        <span className="text-[10px] text-muted-foreground/40">by Yancey</span>
      </div>
    </div>
  );
}
