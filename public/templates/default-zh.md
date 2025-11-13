# 欢迎来到 Markdown Preview 演练场

## 标题 (Headings)

### H3 标题
#### H4 标题

## 文本样式 (Text Styles)

**粗体文本** 和 *斜体文本* 和 ~~删除线~~

## 列表 (Lists)

### 无序列表
- 项目 1
- 项目 2
  - 子项目 A
  - 子项目 B

### 有序列表
1. 第一项
2. 第二项
3. 第三项

### 任务列表
- [x] 已完成的任务
- [ ] 未完成的任务
- [ ] 另一个未完成的任务

## 引用 (Blockquote)

> 这是一个引用。在 Markdown 中用于强调文本。
> 可以跨越多行。

## 代码 (Code)

内联代码：`const greeting = "Hello World"`

```javascript
// 代码块
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
```

## 数学公式 (Math / LaTeX)

内联数学公式：$E = mc^2$

块级数学公式：

$$
\int_0^\infty f(x) dx = \lim_{n \to \infty} \sum_{i=1}^{n} f(x_i) \Delta x
$$

勾股定理：$a^2 + b^2 = c^2$

## 表格 (Tables)

| 姓名  | 编程语言   | 等级 |
|-------|------------|------|
| Alice | JavaScript | 高级 |
| Bob   | Python     | 中级 |
| Carol | Rust       | 初级 |

## 链接 (Links)

[Markdown 指南](https://www.markdownguide.org)

## 脚注 (Footnotes)

这里有一个脚注引用[^1]。

[^1]: 这是脚注的内容。

---

*在此编辑器中自由编辑吧！*
