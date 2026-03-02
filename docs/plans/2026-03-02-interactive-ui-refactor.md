# 脚本交互图形化改造计划

## 一、背景

当前客户端通过 stdin 管道向 Shell 脚本发送输入，但很多脚本包含多步交互（选择菜单、y/n 确认、文本输入、按回车继续），这些交互无法在当前架构下良好支持：
- 用户看不到选择选项，客户端只能盲猜默认值
- 脚本内的 `while true` + `read` 循环在 stdin EOF 时会无限循环
- 交互时序依赖复杂（如 `read -r -t 2` 超时）

**改造目标**：把所有脚本中的用户交互前置到客户端 UI，用户在图形界面完成所有选择后，一次性传入脚本执行。

---

## 二、交互类型分类

| 类型 | UI 组件 | 数量 | 说明 |
|------|---------|------|------|
| **input** | `Input` 文本框 | 52 | 已有支持，部分需补充 |
| **y/n** | `Switch` 开关 / `Checkbox` | 28 | 新增，默认值根据脚本语义设定 |
| **select** | `Select` 下拉 / `RadioGroup` | 24 | 新增 |
| **enter** | 自动发送 | 3 | 不需要 UI，客户端自动处理 |

---

## 三、架构改造

### 3.1 ToolDefinition 扩展

```typescript
interface ToolInput {
  id: string;
  type: "text" | "number" | "url" | "file" | "directory" 
      | "select" | "confirm" | "password";  // 新增 select/confirm/password
  label: string;
  required: boolean;
  defaultValue?: string;
  placeholder?: string;
  
  // select 类型专用
  options?: { value: string; label: string }[];
  
  // confirm 类型专用（映射为 y/n）
  confirmLabel?: string;  // 如 "保留应用数据"
  
  // file 类型专用
  fileFilters?: { name: string; extensions: string[] }[];
}
```

### 3.2 执行流程

```
用户填写表单 → 生成 stdinInputs 数组 → 一次性传入脚本
```

- `select` → 发送选项编号（"1" / "2"）
- `confirm` → 发送 "y" 或 "n"
- `input` → 发送用户输入文本
- `enter` → 发送空字符串 ""
- 非必填空值 → 发送空字符串 ""

### 3.3 ToolForm 渲染改造

根据 `input.type` 渲染不同组件：
- `text/number/url` → `<Input />`（已有）
- `file/directory` → `<FilePickerInput />`（已有）
- `select` → `<Select />` 或 `<RadioGroup />`
- `confirm` → `<Switch />` 带文字说明
- `password` → `<Input type="password" />`

---

## 四、需改造的工具清单

### 4.1 设备工具（device-tools）—— 26 个交互点

| 工具 | 当前 inputs | 需新增的交互 UI |
|------|------------|----------------|
| **截图保存** | 保存目录 | ① select: 复制到剪贴板 / 保存到电脑 |
| **录屏保存** | 保存目录 | （enter 自动处理即可） |
| **输入文本** | 输入内容 | ① enter: 自动 ② confirm: 安装 ADBKeyBoard ③ confirm: 焦点已获取 |
| **卸载应用** | 包名 | ① confirm: 保留应用数据 |
| **设置全局代理** | 代理主机, 端口 | （已有 input，需确认默认值处理） |
| **关机** | 无 | ① confirm: 确认关机 |
| **重启** | 无 | ① confirm: 确认重启 |
| **重启到 Recovery** | 无 | ① confirm: 确认操作 |
| **重启到 Fastboot** | 无 | ① confirm: 确认操作 |
| **加载临时 Recovery** | 镜像路径 | ① confirm: 确认危险操作 |
| **刷入 Recovery** | 镜像路径 | ① confirm: 确认危险操作 |
| **重启 ADB** | 无 | ① confirm: 确认操作 |
| **杀死 ADB** | 无 | ① confirm: 确认操作 |
| **导出 APK** | 包名, 导出目录 | ① confirm: 导出系统应用 |
| **MonkeyTest** | 包名, 时长 | （enter 自动处理） |
| **ConnectWirelessAdb** | 端口 | （IP 自动获取失败时的备选输入，可用 placeholder 提示） |
| **ManageFile** | - | 🔴 **复杂交互式文件管理器，建议暂不改造或单独处理** |

### 4.2 逆向工具（reverse-tools）—— 15 个交互点

| 工具 | 当前 inputs | 需新增的交互 UI |
|------|------------|----------------|
| **APKTool 反编译** | APK 路径 | ② input: 输出目录 ④ input: apktool jar 路径 ⑤ input: framework-res 目录 |
| **APKTool 回编译** | 源目录 | ② input: 输出路径 ④ input: apktool jar 路径 ⑤ confirm: 是否签名 |
| **Jadx 查看** | 文件路径 | （已有） |
| **JD-GUI 查看** | 文件路径 | （已有，select 为自动处理的 dex 选择） |
| 各格式转换 | 文件路径 | （已有） |

### 4.3 包体工具（package-tools）—— 18 个交互点

| 工具 | 当前 inputs | 需新增的交互 UI |
|------|------------|----------------|
| **APK 签名** | APK 路径 | ① confirm: 使用默认签名 → 条件显示: ② input: apksigner 路径 ③ file: 密钥库 ④ password: storePassword ⑤ input: keyAlias ⑥ password: keyPassword ⑦ confirm: 覆盖原文件 ⑧ confirm: 指定签名方案 → 条件显示: v1/v2/v3/v4 开关 |
| **获取签名信息** | APK 路径 | ② input: apksigner 路径 |
| **包体对比** | 旧文件, 新文件 | （已有） |
| **Support ↔ AndroidX** | 文件路径 | （已有） |

### 4.4 Git 工具（git-tools）—— 32 个交互点

| 工具 | 当前 inputs | 需新增的交互 UI |
|------|------------|----------------|
| **强制推送分支** | 无 | ① select: 安全强推/暴力强推 ② confirm: 确认操作 |
| **强制推送标签** | 无 | ① confirm×3: 三重确认 |
| **设置用户名邮箱** | 无 | ① select: 局部/全局 ② input: 用户名 ③ input: 邮箱 |
| **设置最佳配置** | 无 | ① select: 局部/全局 ② confirm: 确认执行 |
| **设置换行符** | 无 | ① select: 局部/全局 ② select: 转换方式 ③ select: 校验模式 |
| **设置文件权限** | 无 | ① select: 局部/全局 ② select: 跟踪/忽略 |
| **设置编码** | 无 | ① select: 局部/全局 ② select: 显示方式 ③ input: 编码格式 |
| **打开配置文件** | 无 | ① select: 仓库/全局 |
| **克隆仓库** | URL | ③ input: 分支名 ④ input: 目标目录 |
| **回退提交** | 提交哈希 | （复杂多步交互，需单独设计） |
| **撤销提交** | 提交哈希 | ② confirm: 确认操作 |
| **修改提交消息** | 新消息 | （已有） |
| **修改提交时间** | 无 | ① ~ ⑥ input: 年月日时分秒 |
| **修改提交用户** | 无 | ① input: 新用户名 ② input: 新邮箱 |
| **改写提交历史** | 无 | ① ~ ④ input: 旧/新用户名邮箱 ⑤ confirm: 确认改写 |

### 4.5 SSH 工具（ssh-key-tools）—— 8 个交互点

| 工具 | 当前 inputs | 需新增的交互 UI |
|------|------------|----------------|
| **查看公钥** | 无 | （输出展示型，无需表单交互） |
| **创建密钥** | 无 | ① select: ed25519/RSA ② input: 注释 ③ input: 文件名 ④ password: 保护密码 |
| **删除密钥** | 无 | （需要先列出再选择，特殊处理） |

---

## 五、实施优先级

### P0 - 高频使用，改造简单（先做）
1. 截图保存 — 补 select
2. 卸载应用 — 补 confirm
3. 关机/重启/重启到 Recovery/Fastboot — 补 confirm
4. 重启 ADB / 杀死 ADB — 补 confirm
5. 导出 APK — 补 confirm + input
6. 加载/刷入 Recovery — 补 confirm
7. 强制推送分支/标签 — 补 select + confirm

### P1 - 高频使用，改造中等
8. APK 签名 — 补 confirm + input + password（条件显示）
9. APKTool 反编译/回编译 — 补 input + confirm
10. Git 配置类（6 个）— 补 select
11. 克隆仓库 — 补 input
12. 创建 SSH 密钥 — 补 select + input + password

### P2 - 低频或复杂
13. 修改提交时间 — 补 6 个 input
14. 改写提交历史 — 补 4 个 input + confirm
15. 回退/撤销提交 — 多步条件交互
16. 管理设备文件 — 交互式文件管理器（建议 v2 单独做）

---

## 六、工作量估算

| 阶段 | 内容 | 预估 |
|------|------|------|
| ToolInput 类型扩展 | 新增 select/confirm/password 类型 | 0.5h |
| ToolForm 组件改造 | 渲染 Select/Switch/Password 组件 | 1h |
| P0 工具改造（12 个） | 更新 toolRegistry 定义 | 1.5h |
| P1 工具改造（10 个） | 更新定义 + 条件显示逻辑 | 2h |
| P2 工具改造（4 个） | 复杂交互设计 | 2h |
| postInputs 移除/简化 | 不再需要延迟自动确认 | 0.5h |
| **总计** | | **~7.5h** |

---

## 七、遗留问题（待后续版本解决）

### 7.1 管理设备文件（ManageFile.sh）
- **问题**：这是一个交互式文件管理器，支持 cd/ls/cat/find/pull/push/rm/cut/copy/paste/chmod/mkdir/exit 等命令，需要持续的命令交互循环
- **原因**：当前架构是"填表 → 一次性执行"，无法支持持续交互式会话
- **计划**：v2 版本单独设计一个「设备文件管理器」界面，包含目录树浏览、文件操作按钮、拖拽上传等

### 7.2 回退/撤销提交的冲突处理
- **问题**：`RevertCommit.sh` 和 `ResetToCommit.sh` 存在多步条件分支——执行后可能出现冲突，需要用户选择"解决冲突"还是"放弃操作"
- **原因**：这类交互依赖执行结果的中间状态，无法在执行前预知
- **计划**：本次改造只支持常规流程（无冲突场景），冲突场景的交互处理留待后续版本

### 7.3 克隆仓库的分支动态选择
- **问题**：`CloneRepository.sh` 会先 `git ls-remote` 获取远端分支列表，然后让用户选择。选项内容是动态的，无法预先定义
- **计划**：本次使用文本输入让用户手动填写分支名，后续可改为先查询再展示动态下拉

### 7.4 JD-GUI 的 DEX 条目选择
- **问题**：`JdGuiView.sh` 打开 APK 时，如果包含多个 DEX 文件会列出让用户选择。选项是动态的
- **计划**：本次默认选择第一个 DEX，后续可改为预解析 APK 展示 DEX 列表

### 7.5 SSH 密钥的列表选择
- **问题**：`QuerySshPublicKey.sh` 和 `DeleteSshKey.sh` 需要先列出已有密钥，再让用户选择序号
- **计划**：本次暂不改造这两个工具的选择交互，后续可改为先调用命令获取列表再展示

### 7.6 录屏的"按回车结束"
- **问题**：`SaveScreenRecording.sh` 录屏开始后需要用户按回车才能停止录制
- **原因**：当前 stdin 管道无法在脚本运行中途发送输入
- **计划**：本次自动在超时后发送回车结束录屏，后续可在 UI 加一个"停止录制"按钮，通过进程间通信发送信号

### 7.7 InputText 中文输入延迟
- **问题**：中文输入需走 ADBKeyBoard 路径，脚本有 2 秒 `read -t 2` 超时 + 自动确认延迟，总计约 2.5 秒
- **原因**：脚本设计的多行输入检测机制
- **计划**：本次改造后 confirm/enter 前置到 UI，可消除 postInputs 延迟。但 `read -t 2` 超时仍在脚本内部，长期方案是为中文输入也做 adbDirect 快捷路径（通过 ADBKeyBoard broadcast 直连）
