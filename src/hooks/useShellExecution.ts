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
  const addLine = useTerminalStore((s) => s.addLine);
  const setRunning = useTerminalStore((s) => s.setRunning);
  const clearTerminal = useTerminalStore((s) => s.clear);
  const unlistenRefs = useRef<UnlistenFn[]>([]);
  const setupDone = useRef(false);

  useEffect(() => {
    if (setupDone.current) return;
    setupDone.current = true;

    const setup = async () => {
      const unlistenOutput = await listen<ShellOutput>("shell-output", (event) => {
        useTerminalStore.getState().addLine({
          text: event.payload.line,
          stream: event.payload.stream as "stdout" | "stderr",
          timestamp: Date.now(),
        });
      });

      const unlistenExit = await listen<ShellExit>("shell-exit", (event) => {
        const { code, success } = event.payload;
        useTerminalStore.getState().addLine({
          text: success
            ? `\n✅ 执行完成 (exit code: ${code})`
            : `\n❌ 执行失败 (exit code: ${code})`,
          stream: success ? "stdout" : "stderr",
          timestamp: Date.now(),
        });
        useTerminalStore.getState().setRunning(false);
      });

      unlistenRefs.current = [unlistenOutput, unlistenExit];
    };

    setup();

    return () => {
      unlistenRefs.current.forEach((fn) => fn());
      setupDone.current = false;
    };
  }, []);

  const execute = useCallback(
    async (scriptPath: string, stdinInputs: string[], workingDir?: string) => {
      clearTerminal();
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
    [addLine, clearTerminal, setRunning]
  );

  return { execute };
}
