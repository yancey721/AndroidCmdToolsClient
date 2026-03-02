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

interface SidebarProps {
  selectedToolId: string | null;
  onSelectTool: (id: string) => void;
}

interface CategoryItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  tools: { id: string; name: string }[];
}

const categories: CategoryItem[] = [
  {
    id: "device",
    name: "设备工具",
    icon: <Smartphone className="h-4 w-4" />,
    tools: [
      { id: "install-apk", name: "安装 APK" },
      { id: "uninstall-app", name: "卸载应用" },
      { id: "screenshot", name: "截图保存" },
      { id: "screen-record", name: "录屏保存" },
      { id: "wireless-adb", name: "无线调试" },
    ],
  },
  {
    id: "reverse",
    name: "逆向工具",
    icon: <Code className="h-4 w-4" />,
    tools: [
      { id: "decompile-apk", name: "反编译 APK" },
      { id: "recompile-apk", name: "回编译 APK" },
    ],
  },
  {
    id: "package",
    name: "包体工具",
    icon: <Package className="h-4 w-4" />,
    tools: [
      { id: "sign-apk", name: "APK 签名" },
      { id: "get-signature", name: "获取签名" },
    ],
  },
  {
    id: "git",
    name: "Git 工具",
    icon: <GitBranch className="h-4 w-4" />,
    tools: [
      { id: "clone-repo", name: "克隆仓库" },
      { id: "init-repo", name: "初始化仓库" },
    ],
  },
  {
    id: "ssh-key",
    name: "密钥工具",
    icon: <KeyRound className="h-4 w-4" />,
    tools: [
      { id: "create-ssh", name: "创建密钥" },
      { id: "query-ssh", name: "查看公钥" },
    ],
  },
];

export function Sidebar({ selectedToolId, onSelectTool }: SidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categories.map((c) => c.id))
  );

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="w-64 border-r border-border bg-muted/30 flex flex-col">
      <div className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        工具分类
      </div>
      <ScrollArea className="flex-1">
        <div className="px-2 pb-4">
          {categories.map((category) => {
            const isExpanded = expandedCategories.has(category.id);
            return (
              <div key={category.id} className="mb-1">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent/50 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  {category.icon}
                  <span className="font-medium">{category.name}</span>
                </button>
                {isExpanded && (
                  <div className="ml-4 mt-0.5">
                    {category.tools.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => onSelectTool(tool.id)}
                        className={cn(
                          "w-full text-left px-3 py-1 text-sm rounded-md transition-colors",
                          selectedToolId === tool.id
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        )}
                      >
                        {tool.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
