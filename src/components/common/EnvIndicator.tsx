import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface EnvIndicatorProps {
  name: string;
  available: boolean;
  version: string | null;
}

export function EnvIndicator({ name, available, version }: EnvIndicatorProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 cursor-default">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                available ? "bg-emerald-500" : "bg-red-500"
              )}
            />
            <span className="text-xs text-muted-foreground">{name}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">
            {available
              ? version || `${name} 可用`
              : `${name} 未安装或不在 PATH 中`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
