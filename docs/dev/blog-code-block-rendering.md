# Blog 代码块显示逻辑文档

**最后更新**: 2025-01-27  
**维护者**: 开发团队  
**分类**: 开发文档

---

## 📋 概述

本文档详细说明 blog 详情页中代码块的渲染逻辑、配置和样式实现。

---

## 🏗️ 架构概览

### 组件层级

```
app/[locale]/blog/[slug]/page.tsx
  └── components/markdown-preview.tsx
      └── Streamdown (第三方库)
```

### 核心组件

#### 1. Blog 详情页 (`app/[locale]/blog/[slug]/page.tsx`)

```122:124:app/[locale]/blog/[slug]/page.tsx
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <MarkdownPreview content={post.content} />
            </div>
```

- 使用 `prose` 类提供基础 Markdown 样式
- 通过 `dark:prose-invert` 支持暗色模式
- 将文章内容传递给 `MarkdownPreview` 组件

#### 2. Markdown 预览组件 (`components/markdown-preview.tsx`)

```9:17:components/markdown-preview.tsx
export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <div className="px-8 py-6 leading-relaxed">
      <Streamdown parseIncompleteMarkdown={true} shikiTheme={["monokai", "monokai"]} controls={true}>
        {content}
      </Streamdown>
    </div>
  )
}
```

**配置说明：**

| 属性 | 值 | 说明 |
|------|-----|------|
| `parseIncompleteMarkdown` | `true` | 允许解析不完整的 Markdown（容错处理） |
| `shikiTheme` | `["monokai", "monokai"]` | 代码高亮主题配置，格式为 `[lightTheme, darkTheme]` |
| `controls` | `true` | 显示代码块控制按钮（如复制代码） |

---

## 🎨 样式配置

### CSS 样式位置

所有代码块相关的样式定义在 `app/globals.css` 中。

#### 1. 基础代码块样式

```177:187:app/globals.css
.prose pre {
  margin-top: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  overflow-x: auto;
  border-radius: 0.5rem;
}

.prose code {
  font-family: var(--font-mono);
}
```

#### 2. Shiki 代码高亮样式

```195:207:app/globals.css
/* Added styles to ensure code blocks have proper dark background in both themes */
/* Override streamdown code block backgrounds */
.shiki,
.shiki span {
  color: var(--shiki-light) !important;
  background-color: var(--shiki-light-bg) !important;
}

.dark .shiki,
.dark .shiki span {
  color: var(--shiki-dark) !important;
  background-color: var(--shiki-dark-bg) !important;
}
```

**注意：** 这些样式使用了 CSS 变量（`--shiki-light`, `--shiki-light-bg`, `--shiki-dark`, `--shiki-dark-bg`），这些变量应该由 Streamdown/Shiki 自动设置。

#### 3. 强制背景色覆盖

```209:213:app/globals.css
/* Ensure code blocks have dark monokai background in both modes */
pre[class*="language-"],
pre.shiki {
  background-color: #272822 !important;
}
```

**⚠️ 潜在问题：**

- 此规则强制所有代码块使用 `#272822`（Monokai 深色背景），即使在浅色模式下也是如此
- 这可能导致浅色模式下代码块背景过暗，与整体设计不协调
- 建议：根据主题动态设置背景色

#### 4. 行内代码样式

```215:225:app/globals.css
/* Inline code styling */
:not(pre) > code {
  background-color: oklch(0.95 0 0);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
}

.dark :not(pre) > code {
  background-color: oklch(0.25 0 0);
}
```

---

## 🔧 技术栈

### 依赖库

| 库名 | 版本 | 用途 |
|------|------|------|
| `streamdown` | `^1.1.2` | Markdown 渲染引擎 |
| `shiki` | `3.15.0` (间接依赖) | 代码语法高亮 |

### Streamdown 特性

- 基于 Shiki 的语法高亮
- 支持多种 Markdown 扩展语法
- 内置代码块控制功能（复制、展开等）
- 支持自定义主题

---

## ⚠️ 已知问题与建议

### 1. 主题配置不一致

**问题：**
- `shikiTheme` 配置为 `["monokai", "monokai"]`，明暗主题都使用 Monokai
- CSS 中强制使用深色背景 `#272822`，在浅色模式下不协调

**建议：**
- 为浅色模式选择更合适的主题（如 `github-light` 或 `min-light`）
- 修改配置为：`shikiTheme={["github-light", "monokai"]}`

### 2. CSS 变量可能未正确设置

**问题：**
- CSS 中引用了 `--shiki-light`、`--shiki-dark` 等变量
- 这些变量需要由 Shiki 在运行时设置，可能存在时序问题

**建议：**
- 检查 Streamdown 是否正确设置了这些 CSS 变量
- 如果变量未设置，考虑使用固定的颜色值或移除对这些变量的依赖

### 3. 强制背景色覆盖

**问题：**
- `!important` 规则可能覆盖主题设置
- 在浅色模式下强制使用深色背景不美观

**建议：**
- 移除或修改强制背景色规则
- 让 Streamdown/Shiki 的主题系统自动处理背景色

---

## 🚀 优化建议

### 1. 改进主题配置

```typescript
// components/markdown-preview.tsx
<Streamdown 
  parseIncompleteMarkdown={true} 
  shikiTheme={["github-light", "monokai"]}  // 浅色模式使用 github-light
  controls={true}
>
  {content}
</Streamdown>
```

### 2. 优化 CSS 样式

```css
/* 移除强制背景色，让主题系统处理 */
pre[class*="language-"],
pre.shiki {
  /* 移除 background-color: #272822 !important; */
  /* 或者根据主题动态设置 */
}

/* 确保 CSS 变量有回退值 */
.shiki {
  color: var(--shiki-light, #333);
  background-color: var(--shiki-light-bg, #f5f5f5);
}

.dark .shiki {
  color: var(--shiki-dark, #f8f8f2);
  background-color: var(--shiki-dark-bg, #272822);
}
```

### 3. 添加代码块功能增强

- 行号显示
- 语言标签显示
- 代码折叠
- 多文件代码块支持

---

## 📚 相关文档

- [Blog 产品文档](../product/blog-product.md) - Blog 功能需求说明
- [Streamdown 官方文档](https://streamdown.ai/) - Streamdown 使用指南
- [Shiki 文档](https://shiki.matsu.io/) - Shiki 语法高亮库文档

---

## 🔍 调试技巧

### 检查代码块渲染

1. **浏览器开发者工具**
   - 检查 `<pre>` 和 `<code>` 元素的类名
   - 查看应用的 CSS 样式
   - 检查 CSS 变量是否被正确设置

2. **检查 Streamdown 输出**
   - 查看生成的 HTML 结构
   - 确认 Shiki 主题类是否正确应用

3. **测试不同主题**
   - 临时修改 `shikiTheme` 配置
   - 测试明暗模式切换效果

---

## 📝 更新日志

### 2025-01-27
- ✅ 创建代码块显示逻辑文档
- ✅ 分析当前实现和潜在问题
- ✅ 提供优化建议

---

**维护者**: 开发团队  
**最后更新**: 2025-01-27

