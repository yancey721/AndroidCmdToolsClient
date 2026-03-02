import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { useCallback, useEffect, useRef } from "react";
import { useTerminalStore } from "@/stores/terminalStore";

interface ShellOutput {
  line: string;
  stream: string;
}

interface ShellExit {
  code: number;
  success: boolean;
}

export function useShellExecution() {
  const { addLine, setRunning, clear } = useTerminalStore();
  const unlistenRefs = useRef<UnlistenFn[]>([]);

  useEffect(() => {
    const setup = async () => {
      const unlistenOutput = await listen<ShellOutput>("shell-output", (event) => {
        addLine({
          text: event.payload.line,
          stream: event.payload.stream as "stdout" | "stderr",
          timestamp: Date.now(),
        });
      });

      const unlistenExit = await listen<ShellExit>("shell-exit", (event) => {
        const { code, success } = event.payload;
        addLine({
          text: success
            ? `\n✅ 执行完成 (exit code: ${code})`
            : `\n❌ 执行失败 (exit code: ${code})`,
          stream: success ? "stdout" : "stderr",
          timestamp: Date.now(),
        });
        setRunning(false);
      });

      unlistenRefs.current = [unlistenOutput, unlistenExit];
    };

    setup();

    return () => {
      unlistenRefs.current.forEach((fn) => fn());
    };
  }, [addLine, setRunning]);

  const execute = useCallback(
    async (scriptPath: string, stdinInputs: string[], workingDir?: string) => {
      clear();
      setRunning(true);
      addLine({
        text: `$ 执行: ${scriptPath}`,
        stream: "stdout",
        timestamp: Date.now(),
      });

      try {
        await invoke("execute_script", {
          scriptPath,
          stdinInputs,
          workingDir,
        });
      } catch (err) {
        addLine({
          text: `❌ 调用失败: ${err}`,
          stream: "stderr",
          timestamp: Date.now(),
        });
        setRunning(false);
      }
    },
    [addLine, clear, setRunning]
  );

  return { execute };
}
