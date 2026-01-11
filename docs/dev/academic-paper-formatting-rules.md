# 学术论文写作检查规则开发计划

> **版本**: v1.0  
> **创建日期**: 2024-12-XX  
> **状态**: 📋 规划中  
> **关联**: `lib/formatter/` 规则系统

---

## 一、产品定位

### 核心需求

基于现有的 Markdown Formatter 规则系统，扩展一套**学术论文格式检查规则组**，帮助用户在投稿前发现并修复常见的格式问题。

**目标场景**：
- ✅ **投稿前检查** — 发现常见的格式错误，避免因格式问题被退稿
- ✅ **期刊规范** — 支持不同期刊/会议的格式要求（IEEE、ACM、APA 等）
- ✅ **格式一致性** — 确保标题编号、引用格式、图表标题等保持一致

### 功能定位

| 功能 | 外部展示 | 内部实现 |
|------|----------|----------|
| 规则分类 | Academic Formatting | `academic` 分类 |
| 检查模式 | Formatting & Submission Readiness | Lint Rules |
| 预设配置 | Journal Presets | `academicPresets` |

---

## 二、可行性评估

### ✅ 优势（好做的部分）

1. **规则系统已就绪**
   - `FormatRule` 接口完善，支持 `fix` 和 `lint` 两种模式
   - 规则分类与注册机制可直接扩展
   - 预设配置系统（`presets`）可复用

2. **基础设施可复用**
   - 行级处理模式（正则 + 代码块保护）适合格式检查
   - `mdast` 解析器可用于结构化检查（引用、图表等）
   - Diff 可视化可直接展示问题位置

3. **需求可抽象为规则**
   - 标题编号格式 → `heading-numbering` 规则
   - 图表标题格式 → `figure-caption-format` 规则
   - 引用格式 → `citation-format` 规则
   - 段落结构 → 复用 `long-paragraph` 规则

### ⚠️ 挑战（需要额外工作）

1. **Token 解析深度**
   - 现有规则以行级正则为主
   - 学术格式需要更细粒度检查（引用、图表引用）
   - 需要更深入使用 `mdast` AST 或自定义解析

2. **规则复杂度**
   - 不同期刊/会议格式差异大（IEEE vs ACM vs APA）
   - 需要可配置的格式模板（类似预设）
   - 部分规则需要上下文检查（如"Figure 1"需先定义）

3. **规则类型混合**
   - 部分可自动修复（如标题编号格式）
   - 部分仅检测（如引用格式需人工确认）
   - 需要合理设计 `fix` 和 `lint` 的边界

---

## 三、技术方案

### 3.1 规则分类扩展

```typescript
// lib/formatter/engine.ts
export type RuleCategory = 
  | 'whitespace' 
  | 'heading' 
  | 'list' 
  | 'blockquote' 
  | 'code' 
  | 'writing'
  | 'academic'  // 🆕 新增学术格式分类
```

### 3.2 规则实现模式

#### 模式 1：行级正则检查（简单规则）

适用于：标题编号、图表标题格式等

```typescript
// 示例：标题编号检查
lint: (content: string) => {
  const lines = content.split('\n')
  // 检查标题编号格式：1. Introduction, 1.1 Background
  // 使用正则匹配 + 状态追踪
}
```

#### 模式 2：AST 结构化检查（复杂规则）

适用于：引用格式、图表引用关系等

```typescript
// 示例：引用格式检查
lint: (content: string) => {
  const blocks = parseMarkdownToBlocks(content)
  // 使用 mdast 解析，检查引用块格式
  // 检查图表引用是否在定义之后
}
```

#### 模式 3：混合模式（修复 + 检测）

适用于：可安全修复的格式问题

```typescript
// 示例：标题编号规范化
fix: (content: string) => {
  // 自动修复编号格式
}
lint: (content: string) => {
  // 检测编号不一致问题
}
```

### 3.3 格式预设配置

```typescript
// lib/formatter/rules/index.ts
export const academicPresets = {
  ieee: {
    enabledRules: [
      'heading-numbering',
      'figure-caption-format',
      'citation-format',
      'reference-list-format',
    ],
    citationStyle: 'ieee',        // [1]
    figureFormat: 'Figure 1:',    // 冒号格式
    tableFormat: 'Table 1:',      // 冒号格式
  },
  acm: {
    enabledRules: [...],
    citationStyle: 'acm',
    figureFormat: 'Figure 1.',    // 点号格式
    tableFormat: 'Table 1.',      // 点号格式
  },
  apa: {
    enabledRules: [...],
    citationStyle: 'apa',         // (Author, 2020)
    figureFormat: 'Figure 1',     // 无标点
  },
}
```

---

## 四、规则清单

### 4.1 P1 核心规则（必须实现）

| 规则 ID | 类型 | 难度 | 说明 | 优先级 |
|---------|------|------|------|--------|
| `heading-numbering` | lint | 中 | 检查标题编号一致性（1.1, 1.2...） | P0 |
| `figure-caption-format` | lint | 易 | 检查图表标题格式（Figure 1: vs Fig. 1） | P0 |
| `table-caption-format` | lint | 易 | 检查表格标题格式（Table 1: vs Table 1.） | P0 |
| `section-depth` | lint | 易 | 检查章节层级深度（复用 heading-depth） | P1 |
| `paragraph-length` | lint | 易 | 检查段落长度（复用 long-paragraph） | P1 |

### 4.2 P2 增强规则（推荐实现）

| 规则 ID | 类型 | 难度 | 说明 | 优先级 |
|---------|------|------|------|--------|
| `citation-format` | lint | 中 | 检查引用格式（需要配置风格） | P1 |
| `reference-list-format` | lint | 中 | 检查参考文献列表格式 | P1 |
| `figure-reference` | lint | 中 | 检查图表引用是否在定义之后 | P2 |
| `abstract-format` | lint | 易 | 检查摘要部分格式 | P2 |
| `keywords-format` | lint | 易 | 检查关键词格式 | P2 |

### 4.3 P3 高级规则（可选实现）

| 规则 ID | 类型 | 难度 | 说明 | 优先级 |
|---------|------|------|------|--------|
| `equation-numbering` | lint | 高 | 检查公式编号格式 | P3 |
| `cross-reference` | lint | 高 | 检查交叉引用完整性 | P3 |
| `author-info-format` | lint | 中 | 检查作者信息格式 | P3 |

---

## 五、实现计划

### 5.1 P1 阶段：核心格式检查（预估 2-3 天）

#### Sprint 1: 规则框架扩展（0.5 天）

| 任务 | 文件 | 说明 |
|------|------|------|
| 扩展 `RuleCategory` 类型 | `lib/formatter/engine.ts` | 新增 `'academic'` 分类 |
| 创建学术规则文件 | `lib/formatter/rules/academic.ts` | 新建规则文件 |
| 注册学术规则 | `lib/formatter/rules/index.ts` | 导入并注册规则 |

#### Sprint 2: 核心规则实现（1.5 天）

| 规则 | 实现方式 | 预估时间 |
|------|----------|----------|
| `heading-numbering` | 行级正则 + 状态追踪 | 2h |
| `figure-caption-format` | 行级正则匹配 | 1h |
| `table-caption-format` | 行级正则匹配 | 1h |
| `section-depth` | 复用 `heading-depth` | 0.5h |
| `paragraph-length` | 复用 `long-paragraph` | 0.5h |

#### Sprint 3: 预设配置（0.5 天）

| 任务 | 文件 | 说明 |
|------|------|------|
| 添加学术预设 | `lib/formatter/rules/index.ts` | IEEE、ACM、APA 预设 |
| 更新 UI 选择器 | `components/markdown-formatter.tsx` | 添加预设选择 |

#### Sprint 4: i18n 翻译（0.5 天）

| 任务 | 文件 | 说明 |
|------|------|------|
| 添加规则翻译 | `messages/*.json` | 5 语言翻译 |
| 添加预设翻译 | `messages/*.json` | 预设名称翻译 |

### 5.2 P2 阶段：增强检查能力（预估 2-3 天）

#### Sprint 1: 引用格式检查（1.5 天）

| 任务 | 说明 | 预估时间 |
|------|------|----------|
| `citation-format` 规则 | 支持 IEEE/ACM/APA 格式 | 2h |
| `reference-list-format` 规则 | 检查参考文献列表 | 2h |
| 增强 AST 解析 | 使用 `mdast` 解析引用块 | 1h |

#### Sprint 2: 上下文检查（1 天）

| 任务 | 说明 | 预估时间 |
|------|------|----------|
| `figure-reference` 规则 | 检查图表引用关系 | 2h |
| `abstract-format` 规则 | 检查摘要格式 | 1h |
| `keywords-format` 规则 | 检查关键词格式 | 1h |

#### Sprint 3: UI 增强（0.5 天）

| 任务 | 说明 |
|------|------|
| 规则分组展示 | 按分类展示学术规则 |
| 格式预设选择器 | 快速切换期刊格式 |

### 5.3 P3 阶段：高级功能（可选，预估 2-3 天）

- 公式编号检查
- 交叉引用完整性检查
- 作者信息格式检查
- 自定义格式模板导入

---

## 六、技术实现细节

### 6.1 标题编号检查规则

**规则 ID**: `heading-numbering`

**检查内容**：
- 标题编号格式一致性（1. Introduction, 1.1 Background）
- 编号层级正确性（1.1 必须在 1. 之后）
- 编号连续性（不能跳过 1.2 直接到 1.3）

**实现思路**：
```typescript
lint: (content: string) => {
  const lines = content.split('\n')
  const numberingStack: number[] = []  // 追踪编号层级
  
  lines.forEach((line, index) => {
    // 匹配标题编号：1. Title 或 1.1 Title
    const match = line.match(/^(#{1,6})\s+(\d+(?:\.\d+)*)\.\s+(.+)/)
    if (match) {
      const numbers = match[2].split('.').map(Number)
      // 检查编号层级和连续性
    }
  })
}
```

### 6.2 图表标题格式检查

**规则 ID**: `figure-caption-format`, `table-caption-format`

**检查内容**：
- 格式一致性（Figure 1: Title vs Figure 1. Title）
- 编号连续性
- 标题位置（图表下方）

**实现思路**：
```typescript
lint: (content: string, options?: RuleOptions) => {
  const figureFormat = options?.figureFormat ?? 'Figure 1:'
  const pattern = figureFormat.includes(':') 
    ? /^Figure\s+(\d+):\s+(.+)/i
    : /^Figure\s+(\d+)\.\s+(.+)/i
  
  // 检查所有图表标题格式
}
```

### 6.3 引用格式检查

**规则 ID**: `citation-format`

**检查内容**：
- IEEE: `[1]` 格式
- ACM: `[1]` 格式（类似 IEEE）
- APA: `(Author, 2020)` 格式

**实现思路**：
```typescript
lint: (content: string, options?: RuleOptions) => {
  const citationStyle = options?.citationStyle ?? 'ieee'
  
  if (citationStyle === 'ieee' || citationStyle === 'acm') {
    // 检查 [1] 格式
    const pattern = /\[(\d+)\]/g
  } else if (citationStyle === 'apa') {
    // 检查 (Author, 2020) 格式
    const pattern = /\(([A-Z][a-z]+,\s+\d{4})\)/g
  }
}
```

---

## 七、文件结构

```
lib/formatter/
├── engine.ts                    # 扩展 RuleCategory
├── rules/
│   ├── index.ts                 # 注册学术规则 + 预设
│   ├── academic.ts              # 🆕 学术规则实现
│   ├── whitespace.ts
│   ├── heading.ts
│   ├── list.ts
│   ├── blockquote.ts
│   ├── code-block.ts
│   └── writing.ts
└── ...

components/
└── markdown-formatter.tsx       # 添加预设选择器

messages/
└── *.json                       # 添加学术规则翻译
```

---

## 八、技术风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 不同期刊格式差异大 | 中 | 通过预设配置解决，支持自定义 |
| 引用格式解析复杂 | 中 | P1 先实现简单规则，P2 增强 |
| AST 解析性能问题 | 低 | 使用现有 `mdast` 解析器，已优化 |
| 规则误报率高 | 中 | 规则默认禁用，用户按需启用 |

---

## 九、验收标准

### P1 功能验收

- [ ] 新增 `academic` 规则分类
- [ ] 实现 5 个核心规则（heading-numbering, figure-caption-format 等）
- [ ] 支持 IEEE/ACM/APA 预设配置
- [ ] 规则可在 UI 中启用/禁用
- [ ] 5 语言翻译完整
- [ ] Lint 结果正确显示在 Diff 视图中

### P1 规则验收

- [ ] `heading-numbering`: 能检测标题编号不一致
- [ ] `figure-caption-format`: 能检测图表标题格式问题
- [ ] `table-caption-format`: 能检测表格标题格式问题
- [ ] `section-depth`: 能检测章节层级过深
- [ ] `paragraph-length`: 能检测段落过长

---

## 十、后续规划

### P2 增强
- 引用格式检查（IEEE/ACM/APA）
- 参考文献列表格式检查
- 图表引用关系检查

### P3 高级功能
- 公式编号检查
- 交叉引用完整性
- 自定义格式模板

---

## 更新日志

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| 2024-12-XX | v1.0 | 初始开发计划文档 |
