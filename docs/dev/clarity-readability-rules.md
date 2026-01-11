# Clarity & Readability（清晰度/可读性）规则开发计划

> **版本**: v1.0  
> **创建日期**: 2024-12-XX  
> **状态**: 📋 规划中  
> **关联**: `lib/formatter/` 规则系统

---

## 一、产品定位

### 核心需求

基于现有的 Markdown Formatter 规则系统，扩展一套**清晰度与可读性检查规则组**，帮助用户提升文档的可读性和清晰度。

**目标场景**：
- ✅ **问题标注** — 自动标出可读性问题（句子过长、段落不流畅等）
- ✅ **修改建议** — 提供具体的修改建议和优化方案
- ✅ **前后对比** — 展示修改前后的对比效果
- ✅ **质量提升** — 帮助用户写出更清晰、易读的文档

### 功能定位

| 功能 | 外部展示 | 内部实现 |
|------|----------|----------|
| 规则分类 | Clarity & Readability | `readability` 分类 |
| 检查模式 | Quality Check + Suggestions | Lint Rules + Suggestions |
| 展示方式 | 问题标注 + 建议 + Diff 对比 | `LintResult` 扩展 |

---

## 二、可行性评估

### ✅ 优势（好做的部分）

1. **Lint 机制已就绪**
   - `LintResult` 接口完善，支持问题标注
   - 按严重级别分组显示
   - 支持跳转到对应行

2. **Diff 视图已实现**
   - 支持 word/block 级别对比
   - 前后对比展示能力完备
   - 可直接复用 `react-diff-view`

3. **Markdown 解析能力**
   - 使用 `mdast` 解析结构
   - 支持表格、段落、标题等解析
   - `parseMarkdownToBlocks` 可直接使用

### ⚠️ 挑战（需要额外工作）

1. **接口扩展**
   - 需要扩展 `LintResult` 接口，添加建议字段
   - 需要设计建议展示 UI

2. **语义理解**
   - 段落流畅度判断需要一定语义理解
   - 句子边界识别（中英文标点）

3. **建议生成**
   - 需要设计合理的建议规则
   - 部分规则无法自动修复，只能提供建议

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
  | 'academic'
  | 'readability'  // 🆕 新增可读性分类
```

### 3.2 LintResult 接口扩展

```typescript
// lib/formatter/engine.ts
export interface LintResult {
  /** 唯一标识 */
  id: string
  /** 关联的规则 ID */
  ruleId: FormatRuleId
  /** 严重级别 */
  severity: LintSeverity
  /** 展示文案（已本地化或可直接显示） */
  message: string
  /** i18n key（可选） */
  messageKey?: string
  /** 首行位置（1-based） */
  line?: number
  /** 涉及的行列表（仅针对变更行） */
  lines?: number[]
  // 🆕 新增建议相关字段
  /** 修改建议文本 */
  suggestion?: string
  /** 建议的修复后文本（完整版本，用于 Diff 展示） */
  suggestedFix?: string
  /** 问题文本片段（用于展示） */
  beforeText?: string
  /** 建议修改后的文本片段（用于展示） */
  afterText?: string
}
```

### 3.3 前后对比展示方案

#### 方案 1：复用现有 Diff 视图（推荐）

当用户点击 lint 结果中的"查看建议"时，使用现有的 `react-diff-view` 展示对比：

```typescript
// 在 UI 组件中
const showSuggestion = (lint: LintResult) => {
  if (lint.suggestedFix) {
    // 使用现有 diff 组件展示
    setDiffSource(content)
    setDiffTarget(lint.suggestedFix)
    setViewMode('split')
  }
}
```

#### 方案 2：行内建议展示（增强）

在 lint 结果面板中直接展示 before/after 对比：

```typescript
// UI 组件
<div className="suggestion-preview">
  <div className="before">
    <span className="label">当前:</span>
    <code>{lint.beforeText}</code>
  </div>
  <div className="after">
    <span className="label">建议:</span>
    <code>{lint.afterText}</code>
  </div>
</div>
```

---

## 四、规则清单

### 4.1 P1 核心规则（必须实现）

| 规则 ID | 类型 | 难度 | 说明 | 优先级 |
|---------|------|------|------|--------|
| `sentence-length` | lint | 低-中 | 检查句子长度（超过 25 个词） | P0 |
| `heading-misuse` | lint | 低-中 | 检查标题误用（层级跳跃、长度问题） | P0 |
| `table-readability` | lint | 中 | 检查表格可读性（列数、单元格长度、表头） | P0 |

### 4.2 P2 增强规则（推荐实现）

| 规则 ID | 类型 | 难度 | 说明 | 优先级 |
|---------|------|------|------|--------|
| `paragraph-flow` | lint | 中-高 | 检查段落流畅度（长度一致性、过渡词） | P1 |

### 4.3 P3 高级规则（可选实现）

| 规则 ID | 类型 | 难度 | 说明 | 优先级 |
|---------|------|------|------|--------|
| `paragraph-coherence` | lint | 高 | 检查段落连贯性（需要 NLP） | P3 |
| `word-choice` | lint | 高 | 检查词汇选择（冗余词、复杂词） | P3 |

---

## 五、实现计划

### 5.1 P1 阶段：核心功能（预估 2-3 天）

#### Sprint 1: 接口扩展（0.5 天）

| 任务 | 文件 | 说明 |
|------|------|------|
| 扩展 `LintResult` 接口 | `lib/formatter/engine.ts` | 添加建议相关字段 |
| 扩展 `RuleCategory` 类型 | `lib/formatter/engine.ts` | 新增 `'readability'` 分类 |
| 更新类型定义 | `lib/formatter/engine.ts` | 更新 `FormatRuleId` 类型 |

#### Sprint 2: 核心规则实现（1.5 天）

| 规则 | 实现方式 | 预估时间 |
|------|----------|----------|
| `sentence-length` | 正则分割句子 + 词数统计 | 2h |
| `heading-misuse` | AST 解析 + 层级追踪 | 3h |
| `table-readability` | 表格结构解析 + 规则检查 | 3h |

#### Sprint 3: 建议展示 UI（1 天）

| 任务 | 文件 | 说明 |
|------|------|------|
| 扩展 Lint 结果面板 | `components/markdown-formatter.tsx` | 添加建议展示区域 |
| 实现 Diff 对比功能 | `components/markdown-formatter.tsx` | 复用现有 diff 组件 |
| 添加"查看建议"按钮 | `components/markdown-formatter.tsx` | 触发建议对比 |

#### Sprint 4: i18n 翻译（0.5 天）

| 任务 | 文件 | 说明 |
|------|------|------|
| 添加规则翻译 | `messages/*.json` | 5 语言翻译 |
| 添加建议文案翻译 | `messages/*.json` | 建议提示文案 |

### 5.2 P2 阶段：增强功能（预估 1-2 天）

#### Sprint 1: 段落流畅度检查（1 天）

| 任务 | 说明 | 预估时间 |
|------|------|----------|
| `paragraph-flow` 规则 | 检查段落长度一致性 | 2h |
| 过渡词检测 | 检测段落过渡词 | 2h |
| 建议生成 | 生成段落优化建议 | 2h |

#### Sprint 2: UI 增强（0.5 天）

| 任务 | 说明 |
|------|------|
| 行内建议预览 | 在 lint 面板中直接展示 before/after |
| 建议应用功能 | 允许用户一键应用建议 |

### 5.3 P3 阶段：高级功能（可选，预估 2-3 天）

- 段落连贯性检查（需要 NLP 库）
- 词汇选择优化建议
- 更多可读性规则

---

## 六、技术实现细节

### 6.1 句子长度检查规则

**规则 ID**: `sentence-length`

**检查内容**：
- 句子词数超过阈值（默认 25 个词）
- 识别中英文句子边界

**实现思路**：
```typescript
lint: (content: string, options?: RuleOptions): LintResult[] => {
  const maxWords = options?.maxSentenceWords ?? 25
  const results: LintResult[] = []
  
  // 分割句子（支持中英文标点）
  const sentences = content.split(/[.!?。！？]\s+/)
  
  sentences.forEach((sentence, index) => {
    // 统计词数（英文按空格，中文按字符）
    const words = sentence.trim().split(/\s+/)
    const wordCount = words.reduce((count, word) => {
      // 中文字符每个算一个词
      const chineseChars = (word.match(/[\u4e00-\u9fa5]/g) || []).length
      const englishWords = word.replace(/[\u4e00-\u9fa5]/g, '').trim()
      return count + chineseChars + (englishWords ? 1 : 0)
    }, 0)
    
    if (wordCount > maxWords) {
      const lineNumber = findLineNumber(sentence, content)
      results.push({
        id: `sentence-length-${index}`,
        ruleId: 'sentence-length',
        message: `Sentence is too long (${wordCount} words, recommended: ≤${maxWords})`,
        suggestion: 'Consider breaking this sentence into shorter sentences for better readability.',
        beforeText: sentence.substring(0, 100) + (sentence.length > 100 ? '...' : ''),
        line: lineNumber,
      })
    }
  })
  
  return results
}
```

### 6.2 标题误用检查规则

**规则 ID**: `heading-misuse`

**检查内容**：
- 标题层级跳跃（如 H1 直接到 H3）
- 标题长度问题（过短或过长）
- 标题格式不规范

**实现思路**：
```typescript
lint: (content: string): LintResult[] => {
  const blocks = parseMarkdownToBlocks(content)
  const results: LintResult[] = []
  let prevHeading: { depth: number; text: string; line: number } | null = null
  
  blocks.forEach((block, index) => {
    if (block.type !== 'heading' || !block.depth) return
    
    const lineNumber = findLineNumber(block.text, content)
    
    // 检查标题层级跳跃
    if (prevHeading && block.depth > prevHeading.depth + 1) {
      results.push({
        id: `heading-misuse-jump-${index}`,
        ruleId: 'heading-misuse',
        message: `Heading level jumps from H${prevHeading.depth} to H${block.depth}`,
        suggestion: `Consider using H${prevHeading.depth + 1} instead to maintain hierarchy.`,
        beforeText: block.text,
        afterText: block.text,  // 可以自动修复
        line: lineNumber,
      })
    }
    
    // 检查标题长度
    if (block.text.length < 3) {
      results.push({
        id: `heading-too-short-${index}`,
        ruleId: 'heading-misuse',
        message: 'Heading is too short',
        suggestion: 'Headings should be descriptive and informative (at least 3 characters).',
        beforeText: block.text,
        line: lineNumber,
      })
    } else if (block.text.length > 100) {
      results.push({
        id: `heading-too-long-${index}`,
        ruleId: 'heading-misuse',
        message: 'Heading is too long',
        suggestion: 'Consider shortening the heading or breaking it into multiple parts.',
        beforeText: block.text.substring(0, 100) + '...',
        line: lineNumber,
      })
    }
    
    prevHeading = { depth: block.depth, text: block.text, line: lineNumber }
  })
  
  return results
}
```

### 6.3 表格可读性检查规则

**规则 ID**: `table-readability`

**检查内容**：
- 列数过多（超过 6 列）
- 单元格内容过长（超过 100 字符）
- 表头缺失或格式不规范

**实现思路**：
```typescript
lint: (content: string): LintResult[] => {
  const blocks = parseMarkdownToBlocks(content)
  const results: LintResult[] = []
  
  blocks.forEach((block, blockIndex) => {
    if (block.type !== 'table' || !block.cells) return
    
    // 检查列数
    const maxCols = Math.max(...block.cells.map(row => row.length))
    if (maxCols > 6) {
      results.push({
        id: `table-too-wide-${blockIndex}`,
        ruleId: 'table-readability',
        message: `Table has ${maxCols} columns, which may be hard to read`,
        suggestion: 'Consider splitting into multiple tables or using a different format (e.g., list).',
        beforeText: block.text.substring(0, 200),
        line: findLineNumber(block.text, content),
      })
    }
    
    // 检查单元格内容长度
    block.cells.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell.length > 100) {
          results.push({
            id: `table-cell-too-long-${blockIndex}-${rowIndex}-${colIndex}`,
            ruleId: 'table-readability',
            message: `Cell content is too long (${cell.length} characters)`,
            suggestion: 'Consider breaking into multiple lines or simplifying the content.',
            beforeText: cell.substring(0, 100) + '...',
            line: findLineNumber(block.text, content),
          })
        }
      })
    })
    
    // 检查表头
    if (block.cells.length > 0) {
      const firstRow = block.cells[0]
      const hasHeader = firstRow.some(cell => 
        cell.trim().length > 0 && /^[A-Z\u4e00-\u9fa5]/.test(cell.trim())
      )
      if (!hasHeader) {
        results.push({
          id: `table-no-header-${blockIndex}`,
          ruleId: 'table-readability',
          message: 'Table appears to be missing a header row',
          suggestion: 'Add a header row to improve readability and structure.',
          beforeText: block.text.substring(0, 200),
          line: findLineNumber(block.text, content),
        })
      }
    }
  })
  
  return results
}
```

### 6.4 段落流畅度检查规则

**规则 ID**: `paragraph-flow`

**检查内容**：
- 段落长度一致性
- 段落过渡词检测
- 段落结构合理性

**实现思路**：
```typescript
lint: (content: string): LintResult[] => {
  const blocks = parseMarkdownToBlocks(content)
  const results: LintResult[] = []
  const transitionWords = [
    'however', 'therefore', 'furthermore', 'moreover', 'additionally',
    'consequently', 'nevertheless', 'meanwhile', 'subsequently',
    '但是', '因此', '此外', '而且', '然而', '同时', '随后'
  ]
  
  blocks.forEach((block, index) => {
    if (block.type !== 'paragraph') return
    
    const prevBlock = blocks[index - 1]
    if (prevBlock && prevBlock.type === 'paragraph') {
      // 检查段落长度比例
      const lengthRatio = block.text.length / prevBlock.text.length
      if (lengthRatio > 3 || lengthRatio < 0.33) {
        results.push({
          id: `paragraph-flow-length-${index}`,
          ruleId: 'paragraph-flow',
          message: 'Paragraph length varies significantly from previous paragraph',
          suggestion: 'Consider balancing paragraph lengths for better flow and readability.',
          beforeText: block.text.substring(0, 100),
          line: findLineNumber(block.text, content),
        })
      }
    }
    
    // 检查过渡词
    const hasTransition = transitionWords.some(word => 
      block.text.toLowerCase().includes(word.toLowerCase())
    )
    if (!hasTransition && index > 0 && blocks[index - 1]?.type === 'paragraph') {
      // 可选：提示添加过渡词（较主观，可配置）
    }
  })
  
  return results
}
```

---

## 七、文件结构

```
lib/formatter/
├── engine.ts                    # 扩展 LintResult 接口 + RuleCategory
├── rules/
│   ├── index.ts                 # 注册可读性规则
│   ├── readability.ts           # 🆕 可读性规则实现
│   ├── academic.ts
│   ├── whitespace.ts
│   ├── heading.ts
│   ├── list.ts
│   ├── blockquote.ts
│   ├── code-block.ts
│   └── writing.ts
└── ...

components/
└── markdown-formatter.tsx       # 扩展建议展示 UI

messages/
└── *.json                       # 添加可读性规则翻译
```

---

## 八、技术风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 句子边界识别不准确 | 中 | 使用正则 + 标点符号库，支持中英文 |
| 段落流畅度判断主观 | 中 | 提供配置选项，允许用户调整阈值 |
| 表格质量判断复杂 | 低 | 先实现基础规则，逐步增强 |
| 建议生成质量 | 中 | 提供模板化建议，允许用户自定义 |

---

## 九、验收标准

### P1 功能验收

- [ ] 扩展 `LintResult` 接口，支持建议字段
- [ ] 新增 `readability` 规则分类
- [ ] 实现 3 个核心规则（sentence-length, heading-misuse, table-readability）
- [ ] 实现建议展示 UI（Diff 对比）
- [ ] 5 语言翻译完整
- [ ] Lint 结果正确显示建议信息

### P1 规则验收

- [ ] `sentence-length`: 能检测过长句子并提供建议
- [ ] `heading-misuse`: 能检测标题层级跳跃和长度问题
- [ ] `table-readability`: 能检测表格可读性问题
- [ ] 建议展示：能正确显示 before/after 对比
- [ ] Diff 对比：能使用现有 diff 组件展示建议

---

## 十、后续规划

### P2 增强
- 段落流畅度检查（基础版）
- 行内建议预览
- 建议应用功能

### P3 高级功能
- 段落连贯性检查（NLP）
- 词汇选择优化
- 更多可读性规则

---

## 更新日志

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| 2024-12-XX | v1.0 | 初始开发计划文档 |
