import path from "path"
import { promises as fs } from "fs"
import { Metadata } from "next"

import { Hero } from "@/components/hero"
import { MarkdownEditorClient } from "@/components/markdown-editor-client"
import { WhatIsMarkdown } from "@/components/what-is-markdown"
import { WhyUseMarkdownEditor } from "@/components/why-use-markdown-editor"
import { KeyFeatures } from "@/components/key-features"
import { CommonUseCases } from "@/components/common-use-cases"
import { MarkdownDiffSection } from "@/components/markdown-diff-section"
import { MarkdownQuickStart } from "@/components/markdown-quickstart"
import { Faq } from "@/components/faq"
import { RelatedTools } from "@/components/related-tools"
import { locales } from "@/i18n"

// 强制静态生成，避免运行时在 Cloudflare Worker 中读取本地文件导致 404
export const dynamic = "force-static"

const TEMPLATE_FILES: Record<string, string> = {
  ja: "public/templates/default-ja.md",
  en: "public/templates/default-en.md",
  zh: "public/templates/default-zh.md",
}

async function loadTemplate(locale: string) {
  const fileName = TEMPLATE_FILES[locale] || TEMPLATE_FILES.en
  try {
    return await fs.readFile(path.join(process.cwd(), fileName), "utf-8")
  } catch (error) {
    console.error("Failed to load template for locale", locale, error)
    return ""
  }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://markdownpreview.org'
  const currentUrl = `${baseUrl}/${locale}`

  const titles: Record<string, string> = {
    en: "Markdown Preview Online – Free Markdown Editor with Live Preview & Examples",
    ja: "Markdown Preview Online – ライブプレビュー付き無料Markdownエディターとサンプル",
    zh: "Markdown Preview Online – 免费 Markdown 编辑器，支持实时预览和示例",
  }

  const descriptions: Record<string, string> = {
    en: "Free online Markdown editor with live preview and interactive examples. Write Markdown, try quick-start snippets, and see formatted output instantly. Auto-saves your work locally in browser - your content persists across sessions. No sign-up required.",
    ja: "ライブプレビューとインタラクティブなサンプル付きの無料オンラインMarkdownエディター。Markdownを記述し、クイックスタートスニペットを試して、フォーマットされた出力を即座に確認できます。ブラウザに自動保存され、セッション間でコンテンツが保持されます。登録不要。",
    zh: "免费的在线 Markdown 编辑器，支持实时预览和交互式示例。编写 Markdown，尝试快速入门片段，即时查看格式化输出。自动在浏览器本地保存您的工作内容，刷新页面后内容自动恢复。无需注册。",
  }

  const title = titles[locale] || titles.en
  const description = descriptions[locale] || descriptions.en

  const localeMap: Record<string, string> = {
    en: 'en_US',
    ja: 'ja_JP',
    zh: 'zh_CN',
  }

  return {
    title,
    description,
    alternates: {
      canonical: currentUrl,
    },
    openGraph: {
      title,
      description,
      url: currentUrl,
      siteName: 'MarkdownPreview.org',
      locale: localeMap[locale] || 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function MarkdownEditorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params
  const locale = locales.includes(rawLocale as any) ? rawLocale : "en"
  const initialMarkdown = await loadTemplate(locale)

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://markdownpreview.org'
  const currentUrl = `${baseUrl}/${locale}`

  // JSON-LD 结构化数据
  const names: Record<string, string> = {
    en: "Markdown Preview Dojo",
    ja: "Markdown Preview 道場",
    zh: "Markdown Preview 演练场",
  }

  const descriptions: Record<string, string> = {
    en: "Free online Markdown editor with live preview and interactive examples. Write Markdown, try quick-start snippets, and see formatted output instantly. Auto-saves your work locally in browser - your content persists across sessions. No sign-up required.",
    ja: "ライブプレビューとインタラクティブなサンプル付きの無料オンラインMarkdownエディター。Markdownを記述し、クイックスタートスニペットを試して、フォーマットされた出力を即座に確認できます。ブラウザに自動保存され、セッション間でコンテンツが保持されます。登録不要。",
    zh: "免费的在线 Markdown 编辑器，支持实时预览和交互式示例。编写 Markdown，尝试快速入门片段，即时查看格式化输出。自动在浏览器本地保存您的工作内容，刷新页面后内容自动恢复。无需注册。",
  }

  // Quick Start 案例数据
  const quickStartSteps: Record<string, Array<{ name: string; description: string; snippet: string }>> = {
    en: [
      {
        name: 'Basic Syntax',
        description: 'Headings, emphasis, and links keep content readable without leaving plain text.',
        snippet: '# Title\n\nPlain text paragraph with **bold**, *italic*, and a [link](https://example.com).',
      },
      {
        name: 'Paragraphs & line breaks',
        description: 'Control spacing with blank lines and soft breaks for tighter layout.',
        snippet: 'First line of text\ncontinues with a soft break\n\nNew paragraph after a blank line  \nForced line break with two spaces.',
      },
      {
        name: 'Tables',
        description: 'Use pipes and dashes; colons align columns in GitHub Flavored Markdown.',
        snippet: '| Feature | Support |\n| :-- | :--: |\n| Alignment | Yes |\n| Header row | Required |',
      },
      {
        name: 'Code blocks',
        description: 'Backticks wrap inline code; triple backticks fence blocks with language hints.',
        snippet: 'Use `code` for inline.\n\n```js\nconst hello = (name) => \'Hi, \' + name + \'!\'\n```',
      },
      {
        name: 'Math & formulas',
        description: 'Wrap LaTeX inline with \\( ... \\) or display mode with $$ ... $$ when supported.',
        snippet: 'Inline: \\(a^2 + b^2 = c^2\\)\n\nDisplay:\n$$\nE = mc^2\n$$',
      },
      {
        name: 'Lists',
        description: 'Mix ordered, unordered, and task lists to structure steps and ideas.',
        snippet: '- Bullet item\n- Nested items\n  - Indent two spaces\n1. Ordered list\n2. Next step\n- [ ] Task to start\n- [x] Task done',
      },
      {
        name: 'Images',
        description: 'Use exclamation mark and square brackets to insert images, with path in parentheses.',
        snippet: `![Image description](${baseUrl}/markdownpreview-dojo.png)`,
      },
      {
        name: 'Links',
        description: 'Use square brackets and parentheses to create hyperlinks, supporting relative paths and absolute URLs.',
        snippet: '[MarkdownPreview.org](https://markdownpreview.org)',
      },
    ],
    zh: [
      {
        name: '基础语法',
        description: '标题、强调、链接都保持纯文本的可读性。',
        snippet: '# 标题\n\n普通段落包含 **加粗**、*斜体*，以及一个 [链接](https://example.com)。',
      },
      {
        name: '段落与换行',
        description: '用空行分段，软换行保持紧凑布局。',
        snippet: '第一行文字\n软换行延续这一行\n\n空一行开始新段落  \n在行尾加两个空格实现强制换行。',
      },
      {
        name: '表格',
        description: '使用竖线和横线，冒号控制对齐（GFM 支持）。',
        snippet: '| 功能 | 支持 |\n| :-- | :--: |\n| 对齐 | 可以 |\n| 表头 | 必需 |',
      },
      {
        name: '代码块',
        description: '反引号包裹行内代码，三反引号围栏并可写语言标识。',
        snippet: '使用 `code` 标记行内代码。\n\n```js\nconst hello = (name) => \'你好，\' + name + \'!\'\n```',
      },
      {
        name: '公式',
        description: '用 \\( ... \\) 写行内公式，$$ ... $$ 写独立公式（需渲染支持）。',
        snippet: '行内：\\(a^2 + b^2 = c^2\\)\n\n块级：\n$$\nE = mc^2\n$$',
      },
      {
        name: '列表',
        description: '混合无序、有序、任务列表来组织步骤和思路。',
        snippet: '- 列表项目\n- 二级项目\n  - 缩进两个空格\n1. 有序列表\n2. 下一步\n- [ ] 待办\n- [x] 已完成',
      },
      {
        name: '图片',
        description: '使用感叹号和方括号插入图片，圆括号内是图片路径。',
        snippet: `![图片描述](${baseUrl}/markdownpreview-dojo.png)`,
      },
      {
        name: '链接',
        description: '使用方括号和圆括号创建超链接，支持相对路径和绝对 URL。',
        snippet: '[MarkdownPreview.org](https://markdownpreview.org)',
      },
    ],
    ja: [
      {
        name: '基本構文',
        description: '見出し・強調・リンクなど、プレーンテキストのまま読みやすさを保ちます。',
        snippet: '# タイトル\n\n**太字**、*斜体*、[リンク](https://example.com) を含む通常の段落。',
      },
      {
        name: '段落と改行',
        description: '空行で段落分け、ソフト改行でコンパクトに。',
        snippet: '1 行目の文章\nソフト改行で続けます\n\n空行を入れると新しい段落  \n末尾に半角スペース 2 つで強制改行。',
      },
      {
        name: '表',
        description: '縦線とハイフンで作成し、コロンで列の揃えを指定（GFM）。',
        snippet: '| 項目 | 対応 |\n| :-- | :--: |\n| 揃え | 可能 |\n| ヘッダー | 必須 |',
      },
      {
        name: 'コードブロック',
        description: 'バッククォートで行内コード、三連バッククォートでブロック＋言語指定。',
        snippet: '行内は `code` を使用。\n\n```js\nconst hello = (name) => \'こんにちは、\' + name + \'!\'\n```',
      },
      {
        name: '数式',
        description: '\\( ... \\) でインライン、$$ ... $$ でディスプレイ（レンダラー対応時）。',
        snippet: 'インライン：\\(a^2 + b^2 = c^2\\)\n\nブロック：\n$$\nE = mc^2\n$$',
      },
      {
        name: 'リスト',
        description: '箇条書き・番号付き・タスクリストを組み合わせて構造化。',
        snippet: '- 箇条書き\n- 入れ子\n  - 2 文字分インデント\n1. 番号付き\n2. 次のステップ\n- [ ] 未完了\n- [x] 完了',
      },
      {
        name: '画像',
        description: '感嘆符と角括弧で画像を挿入。括弧内に画像パスを記述。',
        snippet: `![画像の説明](${baseUrl}/markdownpreview-dojo.png)`,
      },
      {
        name: 'リンク',
        description: '角括弧と丸括弧でハイパーリンクを作成。相対パスと絶対URLに対応。',
        snippet: '[MarkdownPreview.org](https://markdownpreview.org)',
      },
    ],
  }

  const howToTitles: Record<string, string> = {
    en: 'How to Use Markdown Syntax',
    zh: '如何使用 Markdown 语法',
    ja: 'Markdown 構文の使い方',
  }

  const steps = quickStartSteps[locale] || quickStartSteps.en
  const howToTitle = howToTitles[locale] || howToTitles.en

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': `${currentUrl}#webapp`,
        name: names[locale] || names.en,
        description: descriptions[locale] || descriptions.en,
        url: currentUrl,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript. Requires HTML5.',
        softwareVersion: '1.0',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        featureList: [
          'Live Markdown Preview',
          'Syntax Highlighting',
          'Markdown Diff Tool',
          'Markdown Formatter',
          'Interactive Examples',
          'No Registration Required',
        ],
        inLanguage: locale,
      },
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}#website`,
        url: baseUrl,
        name: 'MarkdownPreview.org',
        description: descriptions[locale] || descriptions.en,
        inLanguage: locale,
        publisher: {
          '@type': 'Organization',
          name: 'MarkdownPreview.org',
          logo: {
            '@type': 'ImageObject',
            url: `${baseUrl}/android-chrome-512x512.png`,
            width: 512,
            height: 512,
          },
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${baseUrl}/${locale}/blog?search={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
        alternateName: [
          'Markdown Preview Dojo',
          'Markdown Preview 道場',
          'Markdown Preview 演练场',
        ],
      },
      {
        '@type': 'HowTo',
        '@id': `${currentUrl}#howto-markdown`,
        name: howToTitle,
        description: descriptions[locale] || descriptions.en,
        url: `${currentUrl}#quickstart-section`,
        inLanguage: locale,
        step: steps.map((step, index) => ({
          '@type': 'HowToStep',
          position: index + 1,
          name: step.name,
          text: step.description,
          itemListElement: [
            {
              '@type': 'HowToDirection',
              text: step.snippet,
            },
          ],
        })),
      },
    ],
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <MarkdownEditorClient initialValue={initialMarkdown} />
      <MarkdownQuickStart />
      <WhatIsMarkdown />
      <WhyUseMarkdownEditor />
      <KeyFeatures />
      <CommonUseCases />
      <MarkdownDiffSection />
      <Faq />
      <RelatedTools />
    </div>
  )
}
