# AndroidCmdTools Desktop Client 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 基于 Tauri v2 + React + shadcn/ui 构建跨平台桌面 GUI 客户端，直接调用 AndroidCmdTools 的 Shell 脚本。

**Architecture:** Rust 后端负责 Shell 进程管理、设备检测、环境检查；React 前端负责工具分类导航、动态表单、流式终端输出。通过 Tauri IPC (Commands + Events) 通信。

**Tech Stack:** Tauri v2, React 19, TypeScript, shadcn/ui, Tailwind CSS, Zustand, Vite

---

## Task 1: 初始化 Tauri v2 项目

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.ts`
- Create: `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`, `src-tauri/src/main.rs`, `src-tauri/src/lib.rs`
- Create: `src/main.tsx`, `src/App.tsx`, `src/index.css`

**Step 1: 创建 Tauri v2 + React 项目**

```bash
cd /Users/yancey/Develop/GithubProjects/AndroidCmdToolsClient
npm create tauri-app@latest . -- --template react-ts --manager npm
```

如果目录非空导致冲突，使用临时目录再移动文件：

```bash
cd /tmp && npm create tauri-app@latest tauri-temp -- --template react-ts --manager npm
cp -r /tmp/tauri-temp/* /Users/yancey/Develop/GithubProjects/AndroidCmdToolsClient/
cp -r /tmp/tauri-temp/.* /Users/yancey/Develop/GithubProjects/AndroidCmdToolsClient/ 2>/dev/null || true
rm -rf /tmp/tauri-temp
```

**Step 2: 安装依赖**

```bash
cd /Users/yancey/Develop/GithubProjects/AndroidCmdToolsClient
npm install
```

**Step 3: 验证项目结构**

```bash
ls src-tauri/src/main.rs src/main.tsx src/App.tsx
```

Expected: 文件均存在

**Step 4: 测试启动**

```bash
npm run tauri dev
```

Expected: 窗口弹出，显示 Tauri 默认欢迎页面

**Step 5: Commit**

```bash
git add -A && git commit -m "chore: init Tauri v2 + React + TypeScript project"
```

---

## Task 2: 配置 Tailwind CSS + shadcn/ui + 暗色主题

**Files:**
- Modify: `package.json`
- Modify: `tailwind.config.ts`
- Modify: `src/index.css`
- Create: `components.json`

**Step 1: 安装 Tailwind CSS v4**

```bash
npm install tailwindcss @tailwindcss/vite
```

修改 `vite.config.ts` 添加 Tailwind 插件。

修改 `src/index.css`：

```css
@import "tailwindcss";
```

**Step 2: 初始化 shadcn/ui**

```bash
npx shadcn@latest init
```

选择：
- Style: New York
- Base color: Zinc
- CSS variables: Yes

**Step 3: 安装基础 shadcn 组件**

```bash
npx shadcn@latest add button input scroll-area separator tooltip command dialog badge card tabs
```

**Step 4: 配置暗色主题**

在 `src/index.css` 中设置暗色主题为默认：

```css
:root {
  color-scheme: dark;
}
```

在 `index.html` 的 `<html>` 标签添加 `class="dark"`。

**Step 5: 验证**

```bash
npm run tauri dev
```

Expected: 深色背景正常显示

**Step 6: Commit**

```bash
git add -A && git commit -m "chore: setup Tailwind CSS + shadcn/ui with dark theme"
```

---

## Task 3: 应用布局框架

**Files:**
- Create: `src/components/layout/AppLayout.tsx`
- Create: `src/components/layout/TitleBar.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/Workspace.tsx`
- Create: `src/components/layout/TerminalPanel.tsx`
- Modify: `src/App.tsx`

**Step 1: 创建 AppLayout 布局容器**

`src/components/layout/AppLayout.tsx`:

```tsx
import { useState } from "react";
import { TitleBar } from "./TitleBar";
import { Sidebar } from "./Sidebar";
import { Workspace } from "./Workspace";
import { TerminalPanel } from "./TerminalPanel";

export function AppLayout() {
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [terminalExpanded, setTerminalExpanded] = useState(true);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          selectedToolId={selectedToolId}
          onSelectTool={setSelectedToolId}
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Workspace selectedToolId={selectedToolId} />
          <TerminalPanel
            expanded={terminalExpanded}
            onToggle={() => setTerminalExpanded(!terminalExpanded)}
          />
        </div>
      </div>
    </div>
  );
}
```

**Step 2: 创建 TitleBar**

顶栏：左侧 App 名称，右侧设备选择 + 环境状态指示灯。使用 `data-tauri-drag-region` 支持窗口拖拽。

**Step 3: 创建 Sidebar**

左侧侧边栏，使用 shadcn ScrollArea，展示工具分类树：
- 📱 设备工具（含子分类）
- 🔧 逆向工具
- 📦 包体工具
- 🔀 Git 工具
- 🔑 密钥工具

树结构可折叠/展开，点击叶子节点选中工具。

**Step 4: 创建 Workspace**

右侧工作区，根据 `selectedToolId` 显示对应工具的表单。未选中时显示欢迎页面。

**Step 5: 创建 TerminalPanel**

底部可折叠终端面板，固定高度 200px（可拖拽调整），显示命令输出。

**Step 6: 修改 App.tsx**

```tsx
import { AppLayout } from "./components/layout/AppLayout";

function App() {
  return <AppLayout />;
}

export default App;
```

**Step 7: 验证布局**

```bash
npm run tauri dev
```

Expected: 四区域布局正确显示（标题栏、侧边栏、工作区、终端面板）

**Step 8: Commit**

```bash
git add -A && git commit -m "feat: implement app layout with sidebar, workspace, and terminal panel"
```

---

## Task 4: Tauri 窗口配置

**Files:**
- Modify: `src-tauri/tauri.conf.json`
- Modify: `src-tauri/Cargo.toml`

**Step 1: 配置窗口**

修改 `src-tauri/tauri.conf.json`：

```json
{
  "app": {
    "windows": [
      {
        "title": "AndroidCmdTools",
        "width": 1200,
        "height": 800,
        "minWidth": 900,
        "minHeight": 600,
        "decorations": true,
        "resizable": true,
        "center": true
      }
    ]
  }
}
```

**Step 2: 启用所需 Tauri 插件**

在 `Cargo.toml` 添加：
- `tauri-plugin-dialog`（文件选择对话框）
- `tauri-plugin-shell`（Shell 命令执行）
- `tauri-plugin-fs`（文件系统访问）

```bash
cd src-tauri
cargo add tauri-plugin-dialog tauri-plugin-shell tauri-plugin-fs
cd ..
npm install @tauri-apps/plugin-dialog @tauri-apps/plugin-shell @tauri-apps/plugin-fs
```

**Step 3: 在 lib.rs 中注册插件**

```rust
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Step 4: Commit**

```bash
git add -A && git commit -m "chore: configure Tauri window and plugins"
```

---

## Task 5: Rust 后端 — 环境检查

**Files:**
- Create: `src-tauri/src/commands/mod.rs`
- Create: `src-tauri/src/commands/environment.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1: 创建环境检查命令**

`src-tauri/src/commands/environment.rs`:

```rust
use std::process::Command;
use serde::Serialize;

#[derive(Serialize, Clone)]
pub struct EnvironmentStatus {
    pub adb: bool,
    pub java: bool,
    pub git: bool,
    pub fastboot: bool,
    pub adb_version: Option<String>,
    pub java_version: Option<String>,
    pub git_version: Option<String>,
}

#[tauri::command]
pub fn check_environment() -> EnvironmentStatus {
    EnvironmentStatus {
        adb: command_exists("adb"),
        java: command_exists("java"),
        git: command_exists("git"),
        fastboot: command_exists("fastboot"),
        adb_version: get_command_version("adb", &["version"]),
        java_version: get_java_version(),
        git_version: get_command_version("git", &["--version"]),
    }
}

fn command_exists(cmd: &str) -> bool {
    Command::new(cmd)
        .arg("--version")
        .output()
        .is_ok()
}

fn get_command_version(cmd: &str, args: &[&str]) -> Option<String> {
    Command::new(cmd)
        .args(args)
        .output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| s.lines().next().unwrap_or("").to_string())
}

fn get_java_version() -> Option<String> {
    Command::new("java")
        .arg("-version")
        .output()
        .ok()
        .and_then(|o| String::from_utf8(o.stderr).ok())
        .map(|s| s.lines().next().unwrap_or("").to_string())
}
```

**Step 2: 注册命令到 lib.rs**

```rust
mod commands;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            commands::environment::check_environment,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Step 3: 验证**

```bash
cd src-tauri && cargo check
```

Expected: 编译通过，无错误

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add Rust environment check command"
```

---

## Task 6: Rust 后端 — 设备检测

**Files:**
- Create: `src-tauri/src/commands/device.rs`
- Create: `src-tauri/src/models/mod.rs`
- Create: `src-tauri/src/models/device.rs`
- Modify: `src-tauri/src/commands/mod.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1: 定义设备数据结构**

`src-tauri/src/models/device.rs`:

```rust
use serde::Serialize;

#[derive(Serialize, Clone, Debug)]
pub struct DeviceInfo {
    pub id: String,
    pub brand: String,
    pub model: String,
    pub android_version: String,
    pub api_level: String,
    pub connection_type: String, // "usb" or "tcp"
    pub mode: String,            // "adb" or "fastboot"
}
```

**Step 2: 实现设备检测命令**

`src-tauri/src/commands/device.rs`:

- `detect_devices()` — 运行 `adb devices` 解析设备 ID 列表
- 对每个设备运行 `adb -s <id> shell getprop ro.product.brand/model/version.release/version.sdk`
- 区分 USB 和 TCP 连接（设备 ID 包含 `:` 为 TCP）
- 同时检测 fastboot 设备

**Step 3: 注册命令**

在 `lib.rs` 的 `invoke_handler` 中添加 `commands::device::detect_devices`。

**Step 4: 验证**

连接一台 Android 设备，运行 `npm run tauri dev`，在前端调用 `invoke('detect_devices')` 验证返回设备信息。

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add Rust device detection command"
```

---

## Task 7: Rust 后端 — Shell 脚本执行引擎

**Files:**
- Create: `src-tauri/src/commands/shell_exec.rs`
- Modify: `src-tauri/src/commands/mod.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1: 实现流式执行命令**

`src-tauri/src/commands/shell_exec.rs`:

核心逻辑：
1. 接收参数：`script_path`（Shell 脚本相对路径）、`stdin_inputs`（Vec<String>，依次写入 stdin 的输入）、`device_id`（可选设备 ID）
2. 定位 AndroidCmdTools 目录（相对于 app 资源路径）
3. 组装完整脚本路径
4. spawn `bash` 进程执行脚本
5. 通过 stdin pipe 依次写入用户输入（每个输入后加 `\n`）
6. 通过 Tauri Event (`shell-output`) 流式发送 stdout/stderr
7. 进程结束后发送 `shell-exit` 事件（包含 exit code）

```rust
use std::io::{BufRead, BufReader, Write};
use std::process::{Command, Stdio};
use tauri::{AppHandle, Emitter};
use serde::Serialize;

#[derive(Serialize, Clone)]
pub struct ShellOutput {
    pub line: String,
    pub stream: String, // "stdout" or "stderr"
}

#[derive(Serialize, Clone)]
pub struct ShellExit {
    pub code: i32,
}

#[tauri::command]
pub async fn execute_script(
    app: AppHandle,
    script_path: String,
    stdin_inputs: Vec<String>,
    working_dir: Option<String>,
) -> Result<(), String> {
    // 实现：spawn bash, pipe stdin, stream stdout/stderr via events
    // ...
}
```

**Step 2: 处理 Windows 兼容性**

Windows 上需找到 Git Bash 路径（`C:\Program Files\Git\bin\bash.exe`），用它执行 Shell 脚本。macOS/Linux 直接用 `/bin/bash`。

**Step 3: 处理设备选择的 stdin 注入**

脚本中 `DevicesSelector.sh` 的设备选择逻辑通过 `read` 读取设备编号。当 GUI 已选择设备时，将设备编号/ID 作为 `stdin_inputs` 的第一个元素注入。

对于多设备选择器（`inputMultipleAdbDevice`）：
- 如果用户选了特定设备 → 写入设备编号
- 如果用户选了"所有设备" → 写入空行（回车）

**Step 4: 验证**

测试执行一个简单脚本（如 `GetAdbVersion.sh`），确认 stdout 流式输出到前端。

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add Shell script execution engine with streaming output"
```

---

## Task 8: 前端 — 环境状态 Hook + 组件

**Files:**
- Create: `src/hooks/useEnvironmentCheck.ts`
- Create: `src/components/common/EnvIndicator.tsx`
- Modify: `src/components/layout/TitleBar.tsx`

**Step 1: 创建环境检查 Hook**

```typescript
import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect } from "react";

interface EnvironmentStatus {
  adb: boolean;
  java: boolean;
  git: boolean;
  fastboot: boolean;
  adb_version: string | null;
  java_version: string | null;
  git_version: string | null;
}

export function useEnvironmentCheck() {
  const [status, setStatus] = useState<EnvironmentStatus | null>(null);

  useEffect(() => {
    invoke<EnvironmentStatus>("check_environment").then(setStatus);
  }, []);

  return { status, refresh: () => invoke<EnvironmentStatus>("check_environment").then(setStatus) };
}
```

**Step 2: 创建 EnvIndicator 组件**

小圆点 + 工具名 + tooltip 显示版本。绿色=可用，红色=缺失。

**Step 3: 集成到 TitleBar**

在标题栏右侧显示 `adb` `java` `git` `fastboot` 四个指示灯。

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add environment status indicators in title bar"
```

---

## Task 9: 前端 — 设备检测 Hook + 选择器

**Files:**
- Create: `src/hooks/useDeviceDetection.ts`
- Create: `src/stores/deviceStore.ts`
- Create: `src/components/device/DeviceSelector.tsx`
- Create: `src/components/device/DeviceStatusBadge.tsx`
- Modify: `src/components/layout/TitleBar.tsx`

**Step 1: 创建 Zustand 设备 Store**

```typescript
import { create } from "zustand";

interface DeviceInfo {
  id: string;
  brand: string;
  model: string;
  android_version: string;
  api_level: string;
  connection_type: "usb" | "tcp";
  mode: "adb" | "fastboot";
}

interface DeviceStore {
  devices: DeviceInfo[];
  selectedDeviceId: string | null;
  setDevices: (devices: DeviceInfo[]) => void;
  selectDevice: (id: string | null) => void;
}

export const useDeviceStore = create<DeviceStore>((set) => ({
  devices: [],
  selectedDeviceId: null,
  setDevices: (devices) => set({ devices }),
  selectDevice: (id) => set({ selectedDeviceId: id }),
}));
```

**Step 2: 创建设备检测 Hook**

每 3 秒调用 `detect_devices`，更新 store。单设备时自动选中。

**Step 3: 创建 DeviceSelector 下拉组件**

使用 shadcn Select 组件，显示 "品牌 型号 (Android X)" 格式，无设备时显示"未连接设备"。

**Step 4: 集成到 TitleBar**

在环境指示灯左侧显示设备选择器。

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add device auto-detection and selector"
```

---

## Task 10: 工具注册表

**Files:**
- Create: `src/lib/toolRegistry.ts`
- Create: `src/lib/toolCategories.ts`

**Step 1: 定义分类**

`src/lib/toolCategories.ts`:

```typescript
export interface ToolCategory {
  id: string;
  name: string;
  icon: string; // Lucide icon name
  subcategories?: { id: string; name: string }[];
}

export const toolCategories: ToolCategory[] = [
  {
    id: "device",
    name: "设备工具",
    icon: "Smartphone",
    subcategories: [
      { id: "device-basic", name: "基础" },
      { id: "device-simulation", name: "模拟" },
      { id: "device-env", name: "环境" },
      { id: "device-hardware", name: "硬件" },
      { id: "device-jump", name: "跳转" },
      { id: "device-flash", name: "刷机" },
    ],
  },
  { id: "reverse", name: "逆向工具", icon: "Code" },
  { id: "package", name: "包体工具", icon: "Package" },
  { id: "git", name: "Git 工具", icon: "GitBranch" },
  { id: "ssh-key", name: "密钥工具", icon: "Key" },
];
```

**Step 2: 注册所有工具**

`src/lib/toolRegistry.ts`:

每个 Shell 脚本对应一个 `ToolDefinition`。以下列举核心工具（完整列表约 60 个，按分类组织）：

```typescript
export interface ToolInput {
  id: string;
  type: "file" | "directory" | "text" | "url" | "select" | "confirm" | "number";
  label: string;
  placeholder?: string;
  fileFilters?: { name: string; extensions: string[] }[];
  options?: { value: string; label: string }[];
  required: boolean;
  defaultValue?: string;
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  scriptPath: string;
  icon: string;
  inputs: ToolInput[];
  requiresDevice: boolean;
  deviceMode: "adb" | "fastboot" | "all" | "none";
  multipleDevices: boolean;
  requiredEnv: ("adb" | "java" | "git" | "fastboot")[];
}
```

示例注册（InstallApk）：

```typescript
{
  id: "install-apk",
  name: "安装 APK",
  description: "支持批量安装和多设备并行安装",
  category: "device",
  subcategory: "device-basic",
  scriptPath: "shell/device-tools/InstallApk.sh",
  icon: "Download",
  inputs: [
    {
      id: "sourcePath",
      type: "file",
      label: "APK 文件或目录",
      placeholder: "选择 APK 文件或所在目录",
      fileFilters: [{ name: "APK", extensions: ["apk"] }],
      required: true,
    },
  ],
  requiresDevice: true,
  deviceMode: "adb",
  multipleDevices: true,
  requiredEnv: ["adb"],
}
```

注册全部 60 个工具的元数据。每个工具的 `inputs` 根据 Task 探索阶段整理的 User Inputs 列精确定义。

**Step 3: 创建工具查询函数**

```typescript
export function getToolsByCategory(categoryId: string): ToolDefinition[];
export function getToolsBySubcategory(subcategoryId: string): ToolDefinition[];
export function getToolById(id: string): ToolDefinition | undefined;
export function searchTools(query: string): ToolDefinition[];
```

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add complete tool registry with 60+ tool definitions"
```

---

## Task 11: 前端 — 侧边栏工具树

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`
- Create: `src/components/tools/ToolTreeItem.tsx`

**Step 1: 实现可折叠分类树**

使用 toolCategories 和 toolRegistry 渲染分类树。每个分类可折叠/展开，子分类下列出工具。点击工具名高亮选中。

结构：
```
📱 设备工具
  ├─ 基础
  │  ├ 安装 APK
  │  ├ 卸载应用
  │  └ ...
  ├─ 模拟
  │  ├ 输入文本
  │  └ ...
  ...
🔧 逆向工具
  ├ 反编译 APK
  └ ...
```

每个工具项显示 Lucide 图标 + 工具名称。

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: implement sidebar tool tree navigation"
```

---

## Task 12: 前端 — 动态工具表单

**Files:**
- Create: `src/components/tools/ToolForm.tsx`
- Create: `src/components/common/FilePickerInput.tsx`
- Modify: `src/components/layout/Workspace.tsx`

**Step 1: 创建 FilePickerInput 组件**

使用 `@tauri-apps/plugin-dialog` 的 `open()` API 打开原生文件/目录选择对话框。

```typescript
import { open } from "@tauri-apps/plugin-dialog";

// type="file" → open({ filters: [...] })
// type="directory" → open({ directory: true })
```

**Step 2: 创建 ToolForm 组件**

根据 `ToolDefinition.inputs` 动态生成表单：

| Input Type | 对应组件 |
|------------|---------|
| `file` | FilePickerInput（文件选择按钮 + 路径显示） |
| `directory` | FilePickerInput（目录选择） |
| `text` | shadcn Input |
| `url` | shadcn Input (type=url) |
| `number` | shadcn Input (type=number) |
| `select` | shadcn Select |
| `confirm` | shadcn Switch 或 Checkbox |

表单底部显示：
- 环境依赖提示（若缺失环境显示红色警告）
- 设备选择提示（若需要设备但未连接显示警告）
- 「▶ 执行」按钮

**Step 3: 集成到 Workspace**

选中工具时显示 ToolForm，未选中时显示欢迎页。

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: implement dynamic tool form with file picker"
```

---

## Task 13: 前端 — 终端面板

**Files:**
- Modify: `src/components/layout/TerminalPanel.tsx`
- Create: `src/stores/terminalStore.ts`
- Create: `src/hooks/useShellExecution.ts`

**Step 1: 创建终端 Store**

```typescript
interface TerminalLine {
  text: string;
  stream: "stdout" | "stderr";
  timestamp: number;
}

interface TerminalStore {
  lines: TerminalLine[];
  isRunning: boolean;
  addLine: (line: TerminalLine) => void;
  clear: () => void;
  setRunning: (running: boolean) => void;
}
```

**Step 2: 创建 Shell 执行 Hook**

监听 Tauri events `shell-output` 和 `shell-exit`，更新 terminal store。

```typescript
export function useShellExecution() {
  const addLine = useTerminalStore((s) => s.addLine);
  const setRunning = useTerminalStore((s) => s.setRunning);

  const execute = async (toolId: string, inputs: Record<string, string>) => {
    const tool = getToolById(toolId);
    // 构建 stdin_inputs 数组
    // 调用 invoke("execute_script", { ... })
    // 监听 events
  };

  return { execute };
}
```

**Step 3: 实现 TerminalPanel UI**

- 可折叠/展开（拖拽调整高度）
- 自动滚动到底部
- 支持复制文本
- stderr 行显示红色
- 运行中显示 spinner
- 顶部工具栏：清除按钮、折叠/展开按钮

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: implement streaming terminal panel"
```

---

## Task 14: 端到端执行联调

**Files:**
- Modify: `src/components/tools/ToolForm.tsx`
- Modify: `src/hooks/useShellExecution.ts`

**Step 1: 连接表单 → 执行 → 终端**

在 ToolForm 的「执行」按钮点击时：
1. 收集表单值
2. 根据工具定义构建 `stdin_inputs` 数组（按脚本 `read` 的顺序排列）
3. 如果 `requiresDevice`，将设备选择（编号或空行）作为第一个 stdin input
4. 调用 `execute_script`
5. 终端面板自动展开并显示输出

**Step 2: 测试高频场景**

用真实设备测试：
- `GetAdbVersion.sh`（无输入，无设备）
- `GetTopActivityPackage.sh`（无输入，需设备）
- `InstallApk.sh`（文件输入，需设备）

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: connect tool form execution to terminal output"
```

---

## Task 15: 注册全部设备工具（基础 + 模拟 + 环境 + 硬件 + 跳转 + 刷机）

**Files:**
- Modify: `src/lib/toolRegistry.ts`

**Step 1: 注册设备基础工具（24 个）**

InstallApk, UninstallApp, SetGlobalProxy, ClearGlobalProxy, SaveScreenshot, SaveScreenRecording, ManageFile, ConnectWirelessAdb, DisconnectWirelessAdb, GetTopActivityPackage, GetTopActivityContent, ExportApkFile, ExportAnrFile, ClearAppData, KillAppProcess, DisabledApp, EnabledApp, GrantPermission, RevokePermission, GetScreenInfo, GetSystemProperties, GetDeviceSerialNo, GetDeviceCpuAbi, DisplayLogcat, RunMonkeyTest

**Step 2: 注册模拟工具（7 个）**

InputText, PressBackKey, PressHomeKey, PressMenuKey, PressPowerKey, PressTaskKey, ClickTheScreen

**Step 3: 注册环境工具（4 个）**

RestartAdb, KillAdb, GetAdbVersion, GetFastbootVersion

**Step 4: 注册硬件工具（2 个）**

PowerOffDevice, DeviceRestart

**Step 5: 注册跳转工具（5 个）**

JumpToUrl, JumpToActivity, JumpToDeveloperOptions, JumpToAboutDevice, JumpToWechat

**Step 6: 注册刷机工具（6 个）**

ReadDeviceLock, RestartToFastboot, RestartToRecovery, GetDeviceCode, FlashTempRecovery, FlashRecovery

**Step 7: Commit**

```bash
git add -A && git commit -m "feat: register all device tools (48 tools)"
```

---

## Task 16: 注册逆向 + 包体 + Git + 密钥工具

**Files:**
- Modify: `src/lib/toolRegistry.ts`

**Step 1: 注册逆向工具（8 个）**

DecompileApk, RecompileApk, JadxView, JdGuiView, DexToClass, ClassToDex, DexToSmali, SmaliToDex, JarToDex, DexToJar

**Step 2: 注册包体工具（5 个）**

SignatureApk, GetApkSignature, SupportToAndroidX, AndroidXToSupport, CompareArchives

**Step 3: 注册 Git 工具（15 个）**

CloneRepository, InitRepository, CompareFileDiff, OpenGitConfigFile, SetOptimalConfig, SetUserNameEmailConfig, SetEncodingConfig, SetLinebreakConfig, SetFileModeConfig, AmendLastCommitMessage, AmendLastCommitDate, AmendLastCommitUserEmail, RewriteUserCommitHistory, ResetToCommit, RevertCommit, ForcePushBranch, ForcePushTags

**Step 4: 注册密钥工具（4 个）**

QuerySshPublicKey, CreateSshKey, DeleteSshKey, OpenSshKeyDir

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: register reverse, package, git, and ssh-key tools"
```

---

## Task 17: 工具搜索（Ctrl+K）

**Files:**
- Create: `src/components/common/SearchDialog.tsx`
- Modify: `src/App.tsx`

**Step 1: 实现搜索对话框**

使用 shadcn Command 组件（类 VS Code Command Palette）：
- 快捷键 `Ctrl+K` / `Cmd+K` 触发
- 模糊搜索工具名称和描述
- 显示分类标签
- 回车或点击执行选中工具

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add Ctrl+K tool search command palette"
```

---

## Task 18: 拖拽支持

**Files:**
- Modify: `src/components/layout/Workspace.tsx`
- Modify: `src/components/tools/ToolForm.tsx`

**Step 1: 实现文件拖拽**

监听 Tauri 的 `tauri://drag-drop` 事件：
- 拖拽 `.apk` 文件到窗口 → 自动切换到"安装 APK"工具并填充路径
- 拖拽其他文件 → 根据后缀匹配合适的工具

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add drag and drop file support"
```

---

## Task 19: 执行历史

**Files:**
- Create: `src/stores/historyStore.ts`
- Create: `src/components/tools/HistoryPanel.tsx`
- Modify: `src/components/layout/Sidebar.tsx`

**Step 1: 创建历史 Store**

记录最近 50 次执行：工具 ID、参数、时间、成功/失败状态。持久化到 localStorage。

**Step 2: 创建历史面板**

在侧边栏底部添加"最近使用"区域，显示最近执行的工具列表。点击可一键重复执行。

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add execution history with repeat"
```

---

## Task 20: 打包配置

**Files:**
- Modify: `src-tauri/tauri.conf.json`
- Create: `src-tauri/icons/`（应用图标）

**Step 1: 配置应用图标**

生成各平台所需尺寸的图标文件。

**Step 2: 配置打包**

`tauri.conf.json` bundle 配置：

```json
{
  "bundle": {
    "active": true,
    "targets": ["dmg", "nsis", "appimage"],
    "identifier": "com.androidcmdtools.client",
    "icon": ["icons/32x32.png", "icons/128x128.png", "icons/icon.icns", "icons/icon.ico"],
    "resources": ["AndroidCmdTools/**/*"]
  }
}
```

关键：`resources` 包含完整的 AndroidCmdTools 目录，确保 Shell 脚本打包进应用。

**Step 3: 测试构建**

```bash
npm run tauri build
```

macOS: 生成 `.dmg`
Windows: 生成 `.msi` / `.exe`

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: configure app packaging for macOS and Windows"
```

---

## 总结

| Task | 内容 | 预估 |
|------|------|------|
| 1 | 初始化 Tauri v2 项目 | 15 min |
| 2 | Tailwind + shadcn/ui + 暗色主题 | 20 min |
| 3 | 应用布局框架 | 45 min |
| 4 | Tauri 窗口 + 插件配置 | 15 min |
| 5 | Rust 环境检查 | 30 min |
| 6 | Rust 设备检测 | 45 min |
| 7 | Rust Shell 执行引擎 | 60 min |
| 8 | 前端环境状态 | 20 min |
| 9 | 前端设备选择器 | 30 min |
| 10 | 工具注册表 | 60 min |
| 11 | 侧边栏工具树 | 30 min |
| 12 | 动态工具表单 | 45 min |
| 13 | 终端面板 | 45 min |
| 14 | 端到端联调 | 30 min |
| 15 | 注册全部设备工具 | 45 min |
| 16 | 注册其余工具 | 30 min |
| 17 | 工具搜索 | 30 min |
| 18 | 拖拽支持 | 20 min |
| 19 | 执行历史 | 30 min |
| 20 | 打包配置 | 30 min |
| **总计** | | **~10 小时** |
