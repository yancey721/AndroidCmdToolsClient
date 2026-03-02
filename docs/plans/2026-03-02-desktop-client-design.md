# AndroidCmdTools 桌面客户端设计文档

> 日期：2026-03-02
> 状态：已确认

## 概述

为 [AndroidCmdTools](https://github.com/getActivity/AndroidCmdTools) 构建跨平台桌面 GUI 客户端，优先支持 Windows 和 macOS，面向测试和研发人员日常使用。

## 技术选型

| 层 | 技术 | 说明 |
|---|------|------|
| 桌面框架 | Tauri v2 | 轻量（~10-20MB）、原生集成、安全沙箱 |
| 前端框架 | React 19 + TypeScript | 成熟生态、类型安全 |
| UI 组件库 | shadcn/ui + Tailwind CSS | 可定制、暗色主题友好 |
| 状态管理 | Zustand | 轻量、简洁 |
| 后端语言 | Rust | Tauri 原生、进程管理性能优 |
| 构建工具 | Vite | 快速 HMR |
| 脚本执行 | 直接调用原有 Shell 脚本 | 复用已有逻辑，零维护成本 |

## UI 设计

### 风格

现代深色主题，参考 VS Code / Android Studio 风格。

### 布局

```
┌──────────────────────────────────────────────────────────┐
│  🤖 AndroidCmdTools       [设备选择 ▾]  [adb✓ java✓ git✓] │  ← 标题栏
├───────────┬──────────────────────────────────────────────┤
│           │                                              │
│  侧边栏    │              工作区                           │
│  (分类树)  │         (工具表单/参数配置)                    │
│           │                                              │
├───────────┴──────────────────────────────────────────────┤
│              终端面板 (实时流式输出)                         │
└──────────────────────────────────────────────────────────┘
```

### 侧边栏分类

- 📱 设备工具（子分类：基础、模拟、环境、硬件、跳转、刷机）
- 🔧 逆向工具（apktool、jadx、jd-gui、格式转换）
- 📦 包体工具（签名、androidx 转换、包体比较）
- 🔀 Git 工具（仓库、配置、提交、推送）
- 🔑 密钥工具（SSH 密钥管理）

## 架构

### 整体架构

```
┌─────────────────────────────────────────┐
│         Frontend (React + TS)           │
│     shadcn/ui + Tailwind + Zustand      │
└──────────────────┬──────────────────────┘
                   │ Tauri IPC
┌──────────────────┴──────────────────────┐
│           Backend (Rust)                │
│  • Shell 执行引擎 (spawn + stdin pipe)   │
│  • 设备检测轮询 (adb devices)            │
│  • 环境检查 (adb/java/git/fastboot)     │
└──────────────────┬──────────────────────┘
                   │
          AndroidCmdTools (Shell)
```

### 数据模型

```typescript
interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: 'device' | 'reverse' | 'package' | 'git' | 'ssh-key';
  subcategory?: string;
  scriptPath: string;        // "shell/device-tools/InstallApk.sh"
  icon: string;
  inputs: ToolInput[];
  requiresDevice: boolean;
  deviceMode: 'adb' | 'fastboot' | 'none';
  requiredEnv: ('adb' | 'java' | 'git' | 'fastboot')[];
}

interface ToolInput {
  id: string;
  type: 'file' | 'directory' | 'text' | 'url' | 'select';
  label: string;
  placeholder?: string;
  fileFilters?: { name: string; extensions: string[] }[];
  required: boolean;
}

interface DeviceInfo {
  id: string;
  brand: string;
  model: string;
  androidVersion: string;
  apiLevel: number;
  connectionType: 'usb' | 'tcp';
  mode: 'adb' | 'fastboot';
}
```

### 执行流程

1. 用户选择工具 → UI 展示参数表单
2. 用户填写参数 → 点击「执行」
3. 前端调用 Tauri Command: `execute_tool(tool_id, params, device_id)`
4. Rust 后端：检查环境 → 定位脚本 → spawn bash → stdin 写入参数 → Event 流式输出
5. 前端 Terminal Panel 实时渲染

### 设备自动检测

- Rust 后端每 3 秒轮询 `adb devices`
- 解析设备品牌、型号、Android 版本
- 通过 Tauri Event 推送到前端
- 单设备自动选中，多设备下拉选择

### 环境检查

启动时检测 adb/java/git/fastboot 是否可用，状态栏显示指示灯，缺失时给出配置引导。

## 目录结构

```
AndroidCmdToolsClient/
├── AndroidCmdTools/              # Shell 脚本子项目
├── docs/plans/
├── src-tauri/                    # Rust 后端
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── src/
│       ├── main.rs
│       ├── lib.rs
│       ├── commands/             # shell_exec, device, environment
│       ├── models/               # device, tool
│       └── utils/                # platform
├── src/                          # React 前端
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── components/
│   │   ├── layout/               # AppLayout, TitleBar, Sidebar, Workspace, TerminalPanel
│   │   ├── device/               # DeviceSelector, DeviceStatusBadge
│   │   ├── tools/                # ToolCard, ToolForm, ToolGrid
│   │   └── common/               # FilePickerInput, EnvIndicator, SearchBar
│   ├── hooks/                    # useDeviceDetection, useShellExecution, useEnvironmentCheck
│   ├── stores/                   # deviceStore, terminalStore, settingsStore
│   └── lib/                      # toolRegistry, toolCategories, tauriCommands
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
└── README.md
```

## 关键特性

| 特性 | 说明 |
|------|------|
| 设备自动检测 | 3 秒轮询，实时状态 |
| 环境检查 | 启动检测，状态指示灯 |
| 工具搜索 | Ctrl+K 模糊搜索 |
| 拖拽支持 | APK 文件拖拽安装 |
| 执行历史 | 记录最近操作，一键重复 |
| 终端面板 | 可折叠，ANSI 颜色，复制 |
| 原生窗口 | macOS 红绿灯适配 |

## 分阶段实施

| 阶段 | 内容 | 预估 |
|------|------|------|
| P0 基础框架 | Tauri 初始化、布局、暗色主题、设备检测、环境检查 | 2-3 天 |
| P1 核心工具 | 设备工具（高频功能）、终端面板 | 3-4 天 |
| P2 完整工具 | 逆向、包体、Git、密钥工具全接入 | 2-3 天 |
| P3 体验优化 | 搜索、拖拽、历史、打包分发 | 2-3 天 |

## 语言

仅中文。

## 打包分发

- macOS: DMG
- Windows: MSI / NSIS
- Linux: AppImage（低优先级）
