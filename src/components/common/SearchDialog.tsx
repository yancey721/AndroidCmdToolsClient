import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { searchTools, toolCategories, ToolDefinition } from "@/lib/toolRegistry";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTool: (id: string) => void;
}

const categoryNameMap: Record<string, string> = {};
toolCategories.forEach((c) => {
  categoryNameMap[c.id] = c.name;
});

export function SearchDialog({ open, onOpenChange, onSelectTool }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ToolDefinition[]>([]);

  useEffect(() => {
    if (query.trim()) {
      setResults(searchTools(query));
    } else {
      setResults([]);
    }
  }, [query]);

  const handleSelect = (toolId: string) => {
    onSelectTool(toolId);
    onOpenChange(false);
    setQuery("");
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="搜索工具..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>未找到匹配的工具</CommandEmpty>
        {results.length > 0 && (
          <CommandGroup heading="工具">
            {results.map((tool) => (
              <CommandItem
                key={tool.id}
                value={tool.id}
                onSelect={() => handleSelect(tool.id)}
                className="flex items-center justify-between"
              >
                <div className="flex flex-col">
                  <span className="text-sm">{tool.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {tool.description}
                  </span>
                </div>
                <Badge variant="secondary" className="text-xs shrink-0 ml-2">
                  {categoryNameMap[tool.category] || tool.category}
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
