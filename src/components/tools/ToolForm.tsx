import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilePickerInput } from "@/components/common/FilePickerInput";
import { ToolDefinition, ToolInput } from "@/lib/toolRegistry";
import { useDeviceStore } from "@/stores/deviceStore";
import { useTerminalStore } from "@/stores/terminalStore";
import { useEnvironmentCheck } from "@/hooks/useEnvironmentCheck";
import { executeScript, runAdbCommand } from "@/hooks/useShellExecution";
import { Play, AlertTriangle } from "lucide-react";

interface ToolFormProps {
  tool: ToolDefinition;
  prefill?: Record<string, string> | null;
}

export function ToolForm({ tool, prefill }: ToolFormProps) {
  const [formValues, setFormValues] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    tool.inputs.forEach((input) => {
      if (input.type === "confirm") {
        defaults[input.id] = prefill?.[input.id] || input.defaultValue || "n";
      } else if (input.type === "select" && input.options?.length) {
        defaults[input.id] = prefill?.[input.id] || input.defaultValue || input.options[0].value;
      } else {
        defaults[input.id] = prefill?.[input.id] || input.defaultValue || "";
      }
    });
    return defaults;
  });

  const { selectedDeviceId, devices } = useDeviceStore();
  const { status: envStatus } = useEnvironmentCheck();
  const { isRunning } = useTerminalStore();
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const updateField = useCallback((id: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [id]: value }));
  }, []);

  const missingEnvs = tool.requiredEnv.filter(
    (env) => envStatus && !envStatus[env as keyof typeof envStatus]
  );
  const needsDevice = tool.requiresDevice && devices.length === 0;

  const canExecute =
    !isRunning &&
    missingEnvs.length === 0 &&
    !needsDevice &&
    tool.inputs
      .filter((i) => i.required && i.type !== "confirm" && i.type !== "select")
      .every((i) => formValues[i.id]?.trim());

  const handleExecute = async () => {
    const inputLabels = tool.inputs
      .filter((input) => input.type !== "confirm" || formValues[input.id] === "y")
      .map((input) => {
        if (input.type === "confirm") {
          return { label: input.label, value: formValues[input.id] === "y" ? "是" : "否" };
        }
        if (input.type === "select") {
          const opt = input.options?.find((o) => o.value === formValues[input.id]);
          return { label: input.label, value: opt?.label || formValues[input.id] };
        }
        return { label: input.label, value: formValues[input.id] || "" };
      });

    if (tool.adbDirect && selectedDeviceId) {
      const adbArgs = tool.adbDirect(formValues);
      if (adbArgs) {
        await runAdbCommand({
          deviceId: selectedDeviceId,
          args: adbArgs,
          toolName: tool.description,
          inputLabels,
        });
        return;
      }
    }

    const stdinInputs: string[] = [];

    if (tool.requiresDevice && devices.length > 1 && selectedDeviceId) {
      const idx = devices.findIndex((d) => d.id === selectedDeviceId);
      if (idx >= 0) stdinInputs.push(String(idx + 1));
    }

    tool.inputs.forEach((input) => {
      stdinInputs.push(formValues[input.id] || "");
    });

    const scriptFullPath = `AndroidCmdTools/${tool.scriptPath}`;
    await executeScript({
      scriptPath: scriptFullPath,
      stdinInputs,
      postInputs: tool.postInputs,
      postDelayMs: tool.postDelayMs,
      toolName: tool.description,
      inputLabels,
    });
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== "Enter") return;
      e.preventDefault();

      const textInputs = tool.inputs.filter(
        (i) => i.required && !["confirm", "select", "file", "directory"].includes(i.type)
      );
      const firstEmpty = textInputs.find((i) => !formValues[i.id]?.trim());
      if (firstEmpty) {
        inputRefs.current[firstEmpty.id]?.focus();
        return;
      }

      if (canExecute) {
        handleExecute();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [formValues, canExecute, tool.inputs],
  );

  const renderInput = (input: ToolInput) => {
    switch (input.type) {
      case "file":
      case "directory":
        return (
          <FilePickerInput
            value={formValues[input.id] || ""}
            onChange={(v) => updateField(input.id, v)}
            type={input.type}
            label={input.label}
            fileFilters={input.fileFilters}
            placeholder={input.placeholder}
          />
        );

      case "select":
        return (
          <Select
            value={formValues[input.id]}
            onValueChange={(v) => updateField(input.id, v)}
          >
            <SelectTrigger className="text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {input.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "confirm":
        return (
          <div className="flex items-center gap-3">
            <Switch
              checked={formValues[input.id] === "y"}
              onCheckedChange={(checked) => updateField(input.id, checked ? "y" : "n")}
            />
            <span className="text-xs text-muted-foreground">
              {formValues[input.id] === "y" ? "是" : "否"}
            </span>
          </div>
        );

      case "password":
        return (
          <Input
            ref={(el) => { inputRefs.current[input.id] = el; }}
            type="password"
            value={formValues[input.id] || ""}
            onChange={(e) => updateField(input.id, e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={input.placeholder}
            className="text-xs h-8"
            autoComplete="off"
          />
        );

      default:
        return (
          <Input
            ref={(el) => { inputRefs.current[input.id] = el; }}
            type={input.type === "number" ? "number" : input.type === "url" ? "url" : "text"}
            value={formValues[input.id] || ""}
            onChange={(e) => updateField(input.id, e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={input.placeholder}
            className="text-xs h-8"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{tool.name}</h2>
        <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
        <div className="flex gap-1.5 mt-2">
          {tool.requiredEnv.map((env) => (
            <Badge key={env} variant="secondary" className="text-xs">
              {env}
            </Badge>
          ))}
          {tool.requiresDevice && (
            <Badge variant="outline" className="text-xs">
              需要设备
            </Badge>
          )}
        </div>
      </div>

      {tool.inputs.length > 0 && (
        <div className="space-y-4">
          {tool.inputs.map((input) => (
            <div key={input.id} className="space-y-1.5">
              <Label className="text-xs font-medium">
                {input.label}
                {input.required && input.type !== "confirm" && input.type !== "select" && (
                  <span className="text-red-400 ml-0.5">*</span>
                )}
              </Label>
              {renderInput(input)}
            </div>
          ))}
        </div>
      )}

      {(missingEnvs.length > 0 || needsDevice) && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-yellow-500/10 border border-yellow-500/20">
          <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
          <div className="text-xs text-yellow-200 space-y-1">
            {missingEnvs.length > 0 && (
              <p>缺少环境依赖：{missingEnvs.join(", ")}</p>
            )}
            {needsDevice && <p>请连接 Android 设备</p>}
          </div>
        </div>
      )}

      <Button
        onClick={handleExecute}
        disabled={!canExecute}
        className="w-full"
        size="sm"
      >
        <Play className="h-3.5 w-3.5 mr-1.5" />
        {isRunning ? "执行中..." : "执行"}
      </Button>
    </div>
  );
}
