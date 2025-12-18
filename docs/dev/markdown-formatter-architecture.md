# Markdown Formatter 页面架构文档

> **路由**: `/[locale]/formatter`  
> **定位**: 安全、可审阅的 Markdown 格式化工具，P2/P3 逐步增强 Lint 检测能力

---

## 一、产品定位

### 核心价值主张

用户进来：  
👉 **粘贴 markdown → 点 Format → 看 Diff → 应用 → 复制结果**

与竞品的差异点：
- ✅ **Diff 可视化** — 用户能清楚看到"改了什么"
- ✅ **最小修改原则** — 只改该改的，不破坏原有结构
- ✅ **安全修复** — 只执行 100% 确定性的规则

### 命名策略

| 概念 | 外部展示 | 内部实现 |
|------|----------|----------|
| 页面名称 | Markdown Formatter | `formatter` 路由 |
| 核心功能 | Format / 格式化 | Lint + Safe Fix |
| 高级功能 | Quality Check (P2) | Lint Rules |

> **注**: 搜索量 Formatter > Lint，因此对外统一使用 Formatter 命名

---

## 二、技术架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                     Formatter Page                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Editor    │  │   Preview   │  │       Diff View         │  │
│  │ (CodeMirror)│  │ (Streamdown)│  │    (react-diff-view)    │  │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘  │
│         │                │                      │                │
│         └────────────────┴──────────┬───────────┘                │
│                                     │                            │
│  ┌──────────────────────────────────▼───────────────────────────┐│
│  │                    Format Engine (Web Worker)                 ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   ││
│  │  │ Rule Runner │  │ Diff Builder│  │  Snapshot Manager   │   ││
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘   ││
│  └───────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 模块职责

| 模块 | 职责 | 复用情况 |
|------|------|----------|
| `CodeEditor` | Markdown 输入编辑器 | ✅ 100% 复用 `components/code-editor.tsx` |
| `MarkdownPreview` | 格式化结果预览 | ✅ 100% 复用 `components/markdown-preview.tsx` |
| `DiffView` | Before/After 差异展示 | ✅ 90% 复用 `markdown-diff.tsx` 逻辑 |
| `FormatEngine` | 规则执行 + Diff 生成 | 🆕 新建，复用 `markdown-blocks.ts` |
| `SnapshotManager` | Undo/Redo 快照管理 | 🆕 新建，借鉴 `diff-history.ts` |

### 2.3 文件结构

```
app/[locale]/formatter/
├── page.tsx                    # 页面入口（Server Component）
└── metadata.ts                 # SEO 元数据

components/
├── markdown-formatter.tsx      # 🆕 主组件（Client Component）
├── formatter-diff-view.tsx     # 🆕 Diff 展示组件（复用 diff 逻辑）
└── formatter-actions.tsx       # 🆕 操作按钮组（Format/Apply/Undo）

lib/
├── formatter/
│   ├── engine.ts               # 🆕 格式化引擎核心
│   ├── rules/
│   │   ├── index.ts            # 🆕 规则注册表
│   │   ├── whitespace.ts       # 🆕 空白字符规则
│   │   ├── heading.ts          # 🆕 标题规则
│   │   ├── list.ts             # 🆕 列表规则
│   │   ├── blockquote.ts       # 🆕 引用规则
│   │   └── code-block.ts       # 🆕 代码块规则
│   └── snapshot.ts             # 🆕 快照管理

hooks/
└── use-formatter.ts            # 🆕 格式化 Hook

messages/
└── *.json                      # 新增 formatter 相关翻译
```

---

## 三、P1 任务清单

### 🎯 P1 目标

> **一个"可靠、安全、可审阅"的 Markdown Formatter**

P1 成功标准：**用户敢点 Format，并且愿意用第二次。**

---

### 📋 P1 任务列表

#### Sprint 1: 核心引擎（预估 1.5 天）

| # | 任务 | 优先级 | 预估 | 依赖 |
|---|------|--------|------|------|
| 1.1 | 创建 `lib/formatter/engine.ts` 规则引擎框架 | P0 | 2h | - |
| 1.2 | 实现规则接口 `FormatRule` 类型定义 | P0 | 0.5h | 1.1 |
| 1.3 | 实现空白字符规则 `whitespace.ts` | P0 | 1h | 1.2 |
| 1.4 | 实现标题规则 `heading.ts` | P0 | 1h | 1.2 |
| 1.5 | 实现列表规则 `list.ts` | P0 | 1h | 1.2 |
| 1.6 | 实现引用规则 `blockquote.ts` | P0 | 0.5h | 1.2 |
| 1.7 | 实现代码块规则 `code-block.ts` | P0 | 1h | 1.2 |
| 1.8 | 创建规则注册表 `rules/index.ts` | P0 | 0.5h | 1.3-1.7 |

**规则清单（P1 必须实现）**：

```typescript
// 空白字符规则
- trailing-spaces     // 移除行尾空格
- eof-newline         // 文件末尾保留一个空行
- consecutive-blanks  // 多余空行压缩（段落间最多 N 行）

// 标题规则
- heading-space       // # 后必须有空格
- heading-blank-lines // 标题前后空行一致

// 列表规则
- list-marker-style   // 统一列表符号（默认 -）
- list-indent         // 列表缩进统一（2 或 4 spaces）

// 引用规则
- blockquote-space    // > 后空格规范

// 代码块规则
- code-fence-style    // fence 统一（```）
- code-fence-spacing  // fence 前后空行
```

#### Sprint 2: 页面 UI（预估 1 天）

| # | 任务 | 优先级 | 预估 | 依赖 |
|---|------|--------|------|------|
| 2.1 | 创建 `app/[locale]/formatter/page.tsx` 页面 | P0 | 0.5h | - |
| 2.2 | 创建 `components/markdown-formatter.tsx` 主组件 | P0 | 2h | Sprint 1 |
| 2.3 | 集成 CodeEditor 组件 | P0 | 0.5h | 2.2 |
| 2.4 | 集成 Diff 视图（复用 markdown-diff 逻辑） | P0 | 1h | 2.2 |
| 2.5 | 实现 Format 按钮 + Loading 状态 | P0 | 0.5h | 2.2 |
| 2.6 | 创建 `metadata.ts` SEO 配置 | P1 | 0.5h | 2.1 |

#### Sprint 3: Apply/Undo + Preview（预估 0.5 天）

| # | 任务 | 优先级 | 预估 | 依赖 |
|---|------|--------|------|------|
| 3.1 | 创建 `lib/formatter/snapshot.ts` 快照管理 | P0 | 1h | - |
| 3.2 | 实现 Apply 功能（应用格式化结果） | P0 | 0.5h | 3.1 |
| 3.3 | 实现 Undo 功能（回退到上一次状态） | P0 | 0.5h | 3.1 |
| 3.4 | 集成 Preview 组件 | P1 | 0.5h | 2.2 |
| 3.5 | Preview 变更段高亮样式 | P1 | 0.5h | 3.4 |

#### Sprint 4: i18n + 收尾（预估 0.5 天）

| # | 任务 | 优先级 | 预估 | 依赖 |
|---|------|--------|------|------|
| 4.1 | 添加 5 语言翻译（en/zh/ja/es/fr） | P0 | 1h | - |
| 4.2 | 添加导航入口 `navigation.ts` | P0 | 0.5h | - |
| 4.3 | 安全提示文案："只执行安全格式化，不改变内容语义" | P0 | 0.5h | 4.1 |
| 4.4 | 响应式布局调整 | P1 | 0.5h | 2.2 |

---

### 📊 P1 里程碑

| 里程碑 | 完成标准 | 预估完成 |
|--------|----------|----------|
| M1: Engine Ready | 规则引擎 + 全部 P1 规则可运行 | Day 1.5 |
| M2: UI Complete | 页面可访问，Format + Diff 可用 | Day 2.5 |
| M3: P1 Release | Apply/Undo/Preview/i18n 完成 | Day 3.5 |

---

## 四、核心接口设计

### 4.1 规则接口

```typescript
// lib/formatter/engine.ts

export type FormatRuleId = 
  | 'trailing-spaces'
  | 'eof-newline'
  | 'consecutive-blanks'
  | 'heading-space'
  | 'heading-blank-lines'
  | 'list-marker-style'
  | 'list-indent'
  | 'blockquote-space'
  | 'code-fence-style'
  | 'code-fence-spacing'

export interface FormatRule {
  id: FormatRuleId
  name: string                    // 显示名称（i18n key）
  description: string             // 规则描述（i18n key）
  category: 'whitespace' | 'heading' | 'list' | 'blockquote' | 'code'
  
  // P1: 只有 fix，无 lint
  fix: (content: string, options?: RuleOptions) => string
  
  // P2: 增加 lint 检测
  // lint?: (content: string) => LintResult[]
}

export interface RuleOptions {
  // 空行压缩的最大行数
  maxConsecutiveBlankLines?: number  // 默认 1
  // 列表缩进空格数
  listIndentSize?: number            // 默认 2
  // 列表符号
  listMarker?: '-' | '*' | '+'       // 默认 '-'
}

export interface FormatResult {
  original: string
  formatted: string
  appliedRules: FormatRuleId[]
  hasChanges: boolean
}
```

### 4.2 快照管理接口

```typescript
// lib/formatter/snapshot.ts

export interface Snapshot {
  content: string
  timestamp: number
  appliedRules?: FormatRuleId[]
}

export interface SnapshotManager {
  save(content: string, rules?: FormatRuleId[]): void
  undo(): Snapshot | null
  canUndo(): boolean
  clear(): void
}
```

### 4.3 组件 Props 接口

```typescript
// components/markdown-formatter.tsx

export interface MarkdownFormatterProps {
  initialValue?: string
}

// 内部状态
interface FormatterState {
  source: string              // 原始输入
  formatted: string | null    // 格式化结果
  isFormatting: boolean       // 格式化中
  showDiff: boolean           // 显示 Diff
  appliedRules: FormatRuleId[]
}
```

---

## 五、UI 布局设计

### 5.1 桌面端布局

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]  Markdown Formatter                    [Format Button]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐   │
│  │       Input Editor      │  │      Diff View / Preview    │   │
│  │                         │  │                             │   │
│  │  (CodeMirror)           │  │  [Diff] [Preview] tabs      │   │
│  │                         │  │                             │   │
│  │                         │  │                             │   │
│  └─────────────────────────┘  └─────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  [Apply Changes]  [Undo]     Stats: +3 -2 ~5      [Copy Result] │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 移动端布局

```
┌─────────────────────────┐
│  Markdown Formatter     │
├─────────────────────────┤
│  [Input] [Diff] [Preview│
├─────────────────────────┤
│                         │
│   (Active Tab Content)  │
│                         │
│                         │
├─────────────────────────┤
│  [Format]   [Apply]     │
└─────────────────────────┘
```

---

## 六、P2/P3 规划预览

### P2: Quality Mode（Lint 增强）

- 新增 Advanced/Quality 模式切换
- 显示规则列表 + 开关
- Lint Results 面板（按规则/严重级别分组）
- Fix All / Fix Selected 功能
- 内置 Preset（Standard / GitHub-style / Writing-friendly）

### P3: 工程级能力

- Diff-aware Lint（只检查变更行）
- 写作质量规则（段落过长、连续标题、中英文混排）
- 配置导入导出（`.markdownlint.json`）
- 报告导出（JSON / Markdown / SARIF）

---

## 七、技术风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 规则误修改用户内容 | 高 | P1 只实现 100% 安全规则；加 Undo |
| 大文件性能问题 | 中 | Web Worker 执行；增量 Diff |
| 规则冲突 | 低 | 规则执行顺序固定；测试覆盖 |

---

## 八、验收标准

### P1 功能验收

- [ ] 用户可输入 Markdown 文本
- [ ] 点击 Format 后显示 Diff 视图
- [ ] Diff 视图正确高亮增删改
- [ ] Apply 后编辑器内容更新
- [ ] Undo 可回退到上一状态
- [ ] Preview 正确渲染格式化结果
- [ ] 5 语言翻译完整
- [ ] 响应式布局正常

### P1 规则验收

- [ ] 移除行尾空格
- [ ] 文件末尾保留一个空行
- [ ] 多余空行压缩
- [ ] `#` 后必须有空格
- [ ] 标题前后空行一致
- [ ] 统一列表符号
- [ ] 列表缩进统一
- [ ] `>` 后空格规范
- [ ] fence 统一为 \`\`\`
- [ ] fence 前后空行

---

## 更新日志

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| 2024-12-18 | v1.0 | 初始架构文档，P1 任务清单 |

