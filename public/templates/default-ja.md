# Markdown 道場へようこそ

## 見出し (Headings)

### H3 見出し
#### H4 見出し

## テキストスタイル (Text Styles)

**太字のテキスト** と *斜体のテキスト* と ~~取り消し線~~

## リスト (Lists)

### 順序なしリスト
- アイテム 1
- アイテム 2
  - サブアイテム A
  - サブアイテム B

### 順序付きリスト
1. 第一項目
2. 第二項目
3. 第三項目

### タスクリスト
- [x] 完了したタスク
- [ ] 未完了のタスク
- [ ] 別の未完了タスク

## 引用 (Blockquote)

> これは引用です。Markdown でテキストを強調するために使用されます。
> 複数行にわたって続けることができます。

## コード (Code)

インラインコード: `const greeting = "Hello World"`

```javascript
// コードブロック
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
```

## 数学式 (Math / LaTeX)

インライン数式: $E = mc^2$

ブロック数式:

$$
\int_0^\infty f(x) dx = \lim_{n \to \infty} \sum_{i=1}^{n} f(x_i) \Delta x
$$

ピタゴラスの定理: $a^2 + b^2 = c^2$

## 表 (Tables)

| 名前 | 言語 | レベル |
|------|------|--------|
| Alice | JavaScript | 上級 |
| Bob | Python | 中級 |
| Carol | Rust | 初級 |

## リンク (Links)

[Markdown ガイド](https://www.markdownguide.org)

## 脚注 (Footnotes)

ここに脚注の参照があります[^1]。

[^1]: これが脚注の内容です。

---

*このエディターで自由に編集してください！*
