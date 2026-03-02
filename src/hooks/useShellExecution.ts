import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useTerminalStore } from "@/stores/terminalStore";

interface ShellOutput {
  line: string;
  stream: string;
}

interface ShellExit {
  code: number;
  success: boolean;
}

const ANSI_REGEX = /\x1b\[[0-9;]*[A-Za-z]|\x1b\].*?(?:\x07|\x1b\\)|\x1b[()][AB012]|\x1b\[[\?]?[0-9;]*[hl]/g;

function stripAnsi(text: string): string {
  return text.replace(ANSI_REGEX, "").replace(/\r/g, "");
}

const NOISE_PATTERNS = [
  /^当前系统[：:]/,
  /^Current OS[：:]/i,
];

function isNoiseLine(text: string): boolean {
  return NOISE_PATTERNS.some((p) => p.test(text.trim()));
}

let initialized = false;

export function initShellListeners() {
  if (initialized) return;
  initialized = true;

  listen<ShellOutput>("shell-output", (event) => {
    const cleaned = stripAnsi(event.payload.line);
    if (!cleaned.trim() || isNoiseLine(cleaned)) return;

    useTerminalStore.getState().addLine({
      text: cleaned,
      stream: event.payload.stream as "stdout" | "stderr",
      timestamp: Date.now(),
    });
  });

  listen<ShellExit>("shell-exit", (event) => {
    const { code, success } = event.payload;
    useTerminalStore.getState().addLine({
      text: success
        ? `✅ 执行完成 (exit code: ${code})`
        : `❌ 执行失败 (exit code: ${code})`,
      stream: success ? "stdout" : "stderr",
      timestamp: Date.now(),
    });
    useTerminalStore.getState().setRunning(false);
  });
}

interface ExecuteOptions {
  scriptPath: string;
  stdinInputs: string[];
  workingDir?: string;
  toolName?: string;
  inputLabels?: { label: string; value: string }[];
}

export async function executeScript(opts: ExecuteOptions) {
  const { scriptPath, stdinInputs, workingDir, toolName, inputLabels } = opts;
  const store = useTerminalStore.getState();

  store.setRunning(true);

  if (store.lines.length > 0) {
    store.addLine({
      text: "---divider---",
      stream: "stdout",
      timestamp: Date.now(),
    });
  }

  const now = Date.now();
  store.addLine({
    text: `▶ ${toolName || scriptPath}`,
    stream: "stdout",
    timestamp: now,
  });

  if (inputLabels && inputLabels.length > 0) {
    for (const item of inputLabels) {
      if (item.value.trim()) {
        store.addLine({
          text: `  ${item.label}: ${item.value}`,
          stream: "stdout",
          timestamp: now,
        });
      }
    }
  }

  try {
    await invoke("execute_script", {
      scriptPath,
      stdinInputs,
      workingDir: workingDir,
    });
  } catch (err) {
    store.addLine({
      text: `❌ 调用失败: ${err}`,
      stream: "stderr",
      timestamp: Date.now(),
    });
    store.setRunning(false);
  }
}
